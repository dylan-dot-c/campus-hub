import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

// sessions, sign-in/out, signup sign-in, gating, and the Origin check
// against in-memory PGlite (see docs/specs/auth.md)

// the browser's cookie jar, as currentUserId() sees it through next/headers
const jar = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("../../packages/auth/node_modules/next/headers.js", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "session" && jar.token ? { value: jar.token } : undefined),
  }),
}));

type PrismaClient = import("@project/db").PrismaClient;
let prisma: PrismaClient;
let currentUserId: typeof import("../../packages/auth/src/current-user").currentUserId;
let sessions: typeof import("../../apps/web/app/api/sessions/route");
let students: typeof import("../../apps/web/app/api/students/route");
let posts: typeof import("../../apps/web/app/api/posts/route");
let middleware: typeof import("../../apps/web/middleware").middleware;
let anaId: string;

const EMAIL = "ana@baruch.cuny.edu";
const PASSWORD = "correct-horse";

beforeAll(async () => {
  process.env.PGLITE_DATA_DIR = "memory://";
  delete process.env.DATABASE_URL;
  prisma = (await import("@project/db")).prisma;
  ({ currentUserId } = await import("../../packages/auth/src/current-user"));
  sessions = await import("../../apps/web/app/api/sessions/route");
  students = await import("../../apps/web/app/api/students/route");
  posts = await import("../../apps/web/app/api/posts/route");
  ({ middleware } = await import("../../apps/web/middleware"));
  const { createStudent } = await import("../../packages/domain/src/queries/students");
  anaId = (await createStudent({ email: EMAIL, password: PASSWORD })).id;
}, 30000);

const request = (path: string, method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const tokenFrom = (res: Response) => res.headers.get("set-cookie")?.match(/^session=([^;]*)/)?.[1];
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const signIn = async (email = EMAIL, password = PASSWORD) =>
  sessions.POST(request("/api/sessions", "POST", { email, password }));

// what currentUserId() returns for a browser holding this token
const whoHolds = async (token: string | undefined) => {
  jar.token = token;
  return currentUserId();
};

describe("sign in", () => {
  it("sets an HttpOnly session cookie and stores only the token's hash", async () => {
    const res = await signIn();
    expect(res.status).toBe(200);

    const cookie = res.headers.get("set-cookie")!;
    for (const attr of ["HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=2592000"]) expect(cookie).toContain(attr);

    const token = tokenFrom(res)!;
    expect(token.length).toBeGreaterThanOrEqual(43); // 32 bytes, base64url
    const row = await prisma.session.findUnique({ where: { tokenHash: sha256(token) } });
    expect(row?.studentId).toBe(anaId);
    expect(await prisma.session.count({ where: { tokenHash: token } })).toBe(0);

    const body = await res.json();
    expect(body.student.id).toBe(anaId);
    expect(body.student).not.toHaveProperty("passwordHash");
  });

  it("normalizes the email like signup does", async () => {
    expect((await signIn("  Ana@Baruch.CUNY.edu ")).status).toBe(200);
  });

  it("gives a wrong password and an unknown email the same 401, with no cookie", async () => {
    const wrongPassword = await signIn(EMAIL, "wrong-password");
    const unknownEmail = await signIn("nobody@baruch.cuny.edu", PASSWORD);
    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(res.headers.get("set-cookie")).toBeNull();
    }
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
  });

  it("rejects malformed bodies", async () => {
    expect((await sessions.POST(new Request("http://localhost/api/sessions", { method: "POST", body: "{" }))).status).toBe(400);
    expect((await sessions.POST(request("/api/sessions", "POST", { email: EMAIL }))).status).toBe(400);
  });
});

describe("currentUserId", () => {
  it("resolves a valid token to its student", async () => {
    expect(await whoHolds(tokenFrom(await signIn()))).toBe(anaId);
  });

  it("treats no cookie, a tampered token, and an expired token as nobody", async () => {
    const token = tokenFrom(await signIn())!;
    const tampered = (token[0] === "A" ? "B" : "A") + token.slice(1);
    expect(await whoHolds(undefined)).toBeNull();
    expect(await whoHolds(tampered)).toBeNull();

    await prisma.session.update({ where: { tokenHash: sha256(token) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await whoHolds(token)).toBeNull();
  });
});

describe("sign out", () => {
  it("deletes only this session and clears the cookie; repeating is harmless", async () => {
    const mine = tokenFrom(await signIn())!;
    const otherBrowser = tokenFrom(await signIn())!;

    const res = await sessions.DELETE(request("/api/sessions", "DELETE", undefined, { cookie: `theme=dark; session=${mine}` }));
    expect(res.status).toBe(204);
    expect(res.headers.get("set-cookie")).toMatch(/^session=; .*Max-Age=0/);

    expect(await whoHolds(mine)).toBeNull();
    expect(await whoHolds(otherBrowser)).toBe(anaId);
    expect((await sessions.DELETE(request("/api/sessions", "DELETE", undefined, { cookie: `session=${mine}` }))).status).toBe(204);
  });
});

describe("signup", () => {
  it("signs the new student in", async () => {
    const res = await students.POST(request("/api/students", "POST", { email: "new@qc.cuny.edu", password: "new-password" }));
    expect(res.status).toBe(201);
    const { student } = await res.json();
    expect(await whoHolds(tokenFrom(res))).toBe(student.id);
  });

  it("sets no cookie when signup is rejected", async () => {
    const duplicate = await students.POST(request("/api/students", "POST", { email: EMAIL, password: "another-password" }));
    const invalid = await students.POST(request("/api/students", "POST", { email: "you@gmail.com", password: "another-password" }));
    expect(duplicate.status).toBe(409);
    expect(invalid.status).toBe(400);
    for (const res of [duplicate, invalid]) expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("gated routes", () => {
  it("return 401 when signed out", async () => {
    jar.token = undefined;
    const res = await posts.GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });

  it("show each student only their own data", async () => {
    const bea = await students.POST(request("/api/students", "POST", { email: "bea@lehman.cuny.edu", password: "bea-password" }));
    const anaToken = tokenFrom(await signIn());
    const beaToken = tokenFrom(bea);

    jar.token = anaToken;
    expect((await posts.POST(request("/api/posts", "POST", { title: "Ana's post", content: "hi" }))).status).toBe(201);

    jar.token = beaToken;
    const { post } = await (await posts.GET()).json();
    expect(post).toEqual([]);
  });
});

describe("Origin check", () => {
  const post = (headers: Record<string, string>, method = "POST") =>
    middleware(request("/api/posts", method, method === "GET" ? undefined : {}, { host: "localhost:3000", ...headers }));

  it("rejects a state-changing request from another site", async () => {
    for (const origin of ["https://evil.example", "null"]) {
      const res = post({ origin });
      expect(res?.status).toBe(403);
      expect(await res?.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
    }
  });

  it("lets same-site, proxied, Origin-less, and safe requests through", () => {
    expect(post({ origin: "http://localhost:3000" })).toBeUndefined();
    expect(post({ origin: "https://demo-3000.app.github.dev", "x-forwarded-host": "demo-3000.app.github.dev" })).toBeUndefined();
    expect(post({})).toBeUndefined();
    expect(post({ origin: "https://evil.example" }, "GET")).toBeUndefined();
  });
});

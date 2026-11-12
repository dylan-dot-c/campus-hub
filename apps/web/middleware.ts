// Origin check: a state-changing API request that a browser says came from
// another site is rejected before it reaches a handler. See docs/specs/auth.md.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function middleware(req: Request) {
  if (SAFE_METHODS.has(req.method)) return;

  // browsers always send Origin on these methods; curl and scripts don't,
  // and they carry no browser cookies to abuse
  const origin = req.headers.get("origin");
  if (!origin) return;

  // behind a proxy (Codespaces) the public host arrives as x-forwarded-host
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))
    ?.split(",")[0]
    ?.trim();
  let originHost: string | null = null;
  try {
    originHost = new URL(origin).host;
  } catch {
    // "null" or garbage — never same-site
  }
  if (host && originHost === host) return;

  return Response.json(
    { error: { code: "FORBIDDEN", message: "Cross-site request rejected" } },
    { status: 403 }
  );
}

export const config = { matcher: "/api/:path*" };

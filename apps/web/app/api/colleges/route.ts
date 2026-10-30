import { listColleges } from "@project/domain";

export const dynamic = "force-dynamic";

// public — no identity needed; ?q= filters by name
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  return Response.json({ colleges: await listColleges(q) });
}

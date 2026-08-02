import { ensureDatabase, getD1 } from "@/db";

const RELEASE_KEY = /^(?:agent|pack):[a-z0-9][a-z0-9._-]{1,79}@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  return Response.json(data, { ...init, headers });
}

async function readSmallJson(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > 256) throw new Error("REQUEST_TOO_LARGE");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > 256) throw new Error("REQUEST_TOO_LARGE");
  return JSON.parse(text) as unknown;
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      return json({ error: "Content-Type must be application/json." }, { status: 415 });
    }
    const payload = await readSmallJson(request);
    const releaseKey = typeof payload === "object" && payload !== null && "releaseKey" in payload
      ? (payload as { releaseKey?: unknown }).releaseKey
      : null;
    if (typeof releaseKey !== "string" || releaseKey.length > 128 || !RELEASE_KEY.test(releaseKey)) {
      return json({ error: "A valid catalog release is required." }, { status: 400 });
    }

    await ensureDatabase();
    const db = await getD1();
    const row = await db.prepare(`
      INSERT INTO downloads (release_key, count, updated_at)
      SELECT release_key, 1, unixepoch()
      FROM releases
      WHERE release_key = ?
      ON CONFLICT(release_key) DO UPDATE SET
        count = downloads.count + 1,
        updated_at = unixepoch()
      RETURNING count
    `).bind(releaseKey).first<{ count: number }>();

    if (!row) return json({ error: "Catalog release was not found." }, { status: 404 });
    return json({ releaseKey, downloadCount: Number(row.count) });
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: "Request body must be valid JSON." }, { status: 400 });
    if (error instanceof Error && error.message === "REQUEST_TOO_LARGE") return json({ error: "Request is too large." }, { status: 413 });
    return json({ error: error instanceof Error ? error.message : "Download could not be counted." }, { status: 500 });
  }
}

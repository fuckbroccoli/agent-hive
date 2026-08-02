import { ensureCatalog, getD1 } from "@/db";
import { CATALOG_RELEASES } from "@/lib/catalog-seeds";
import { DownloadRequestError, EphemeralRateLimiter, readSmallJson } from "@/lib/download-guard";

const RELEASE_KEY = /^agent:[a-z0-9][a-z0-9._-]{1,79}@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const CLIENT_WINDOW_SECONDS = 60;
const CLIENT_WINDOW_LIMIT = 6;
const RELEASE_WINDOW_SECONDS = 5 * 60;
const RELEASE_WINDOW_LIMIT = 12;
const CATALOG_RELEASE_KEYS = new Set(CATALOG_RELEASES.map((release) => release.key));
const clientLimiter = new EphemeralRateLimiter(CLIENT_WINDOW_LIMIT, CLIENT_WINDOW_SECONDS * 1_000);

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  return Response.json(data, { ...init, headers });
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      return json({ error: "Content-Type must be application/json." }, { status: 415 });
    }
    const clientKey = request.headers.get("cf-connecting-ip")?.slice(0, 64) || "unknown";
    if (!clientLimiter.consume(clientKey)) {
      return json(
        { error: "Too many download count requests. Try again shortly." },
        { status: 429, headers: { "retry-after": String(CLIENT_WINDOW_SECONDS) } },
      );
    }
    const payload = await readSmallJson(request);
    const releaseKey = typeof payload === "object" && payload !== null && "releaseKey" in payload
      ? (payload as { releaseKey?: unknown }).releaseKey
      : null;
    if (typeof releaseKey !== "string" || releaseKey.length > 128 || !RELEASE_KEY.test(releaseKey)) {
      return json({ error: "A valid catalog release is required." }, { status: 400 });
    }
    if (!CATALOG_RELEASE_KEYS.has(releaseKey)) {
      return json({ error: "Catalog release was not found." }, { status: 404 });
    }

    await ensureCatalog();
    const db = await getD1();
    const row = await db.prepare(`
      UPDATE downloads
      SET
        count = count + 1,
        updated_at = unixepoch(),
        window_count = CASE
          WHEN window_started_at <= unixepoch() - ? THEN 1
          ELSE window_count + 1
        END,
        window_started_at = CASE
          WHEN window_started_at <= unixepoch() - ? THEN unixepoch()
          ELSE window_started_at
        END
      WHERE release_key = ?
        AND (
          window_started_at <= unixepoch() - ?
          OR window_count < ?
        )
      RETURNING count
    `).bind(
      RELEASE_WINDOW_SECONDS,
      RELEASE_WINDOW_SECONDS,
      releaseKey,
      RELEASE_WINDOW_SECONDS,
      RELEASE_WINDOW_LIMIT,
    ).first<{ count: number }>();

    if (!row) {
      return json(
        { error: "This release has reached its temporary count limit." },
        { status: 429, headers: { "retry-after": String(RELEASE_WINDOW_SECONDS) } },
      );
    }
    return json({ releaseKey, downloadCount: Number(row.count) });
  } catch (error) {
    if (error instanceof DownloadRequestError && error.code === "INVALID_JSON") return json({ error: "Request body must be valid JSON." }, { status: 400 });
    if (error instanceof DownloadRequestError && error.code === "REQUEST_TOO_LARGE") return json({ error: "Request is too large." }, { status: 413 });
    return json({ error: error instanceof Error ? error.message : "Download could not be counted." }, { status: 500 });
  }
}

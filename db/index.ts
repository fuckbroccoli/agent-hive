import { CATALOG_RELEASES } from "@/lib/catalog-seeds";

const CATALOG_SOURCE = CATALOG_RELEASES
  .map((record) => `${record.key}:${JSON.stringify(record.manifest)}:${record.addedAt}`)
  .join("|");
const CATALOG_VERSION = crypto.subtle.digest("SHA-256", new TextEncoder().encode(CATALOG_SOURCE))
  .then((digest) => Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""));

let initialization: Promise<void> | null = null;

export async function getD1() {
  const { env } = await import("cloudflare:workers");
  const bindings = env as unknown as { DB?: D1Database };
  if (!bindings.DB) throw new Error("HiveBuzz database is unavailable.");
  return bindings.DB;
}

export function ensureCatalog() {
  if (initialization) return initialization;
  initialization = synchronizeCatalog().catch((error) => {
    initialization = null;
    throw error;
  });
  return initialization;
}

async function synchronizeCatalog() {
  const db = await getD1();
  const catalogVersion = await CATALOG_VERSION;
  const state = await db.prepare("SELECT value FROM hivebuzz_meta WHERE key = ?")
    .bind("catalog_version")
    .first<{ value: string }>();
  if (state?.value === catalogVersion) return;

  const releaseKeys = CATALOG_RELEASES.map((record) => record.key);
  const placeholders = releaseKeys.map(() => "?").join(", ");
  const seedStatements = CATALOG_RELEASES.map((record) => {
    const { manifest } = record;
    return db.prepare(`
      INSERT INTO releases (
        release_key, release_id, type, name, version, summary,
        artifact_url, artifact_sha256, artifact_size, manifest_json,
        risk_level, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(release_key) DO UPDATE SET
        release_id = excluded.release_id,
        type = excluded.type,
        name = excluded.name,
        version = excluded.version,
        summary = excluded.summary,
        artifact_url = excluded.artifact_url,
        artifact_sha256 = excluded.artifact_sha256,
        artifact_size = excluded.artifact_size,
        manifest_json = excluded.manifest_json,
        risk_level = excluded.risk_level,
        created_at = excluded.created_at
      WHERE releases.manifest_json <> excluded.manifest_json
        OR releases.risk_level <> excluded.risk_level
        OR releases.created_at <> excluded.created_at
    `).bind(
      record.key,
      manifest.release.id,
      manifest.type,
      manifest.release.name,
      manifest.release.version,
      manifest.release.summary,
      manifest.artifact.url,
      manifest.artifact.sha256,
      manifest.artifact.sizeBytes,
      JSON.stringify(manifest),
      record.riskLevel,
      record.addedAt,
    );
  });
  const counterStatements = releaseKeys.map((releaseKey) => db.prepare(`
    INSERT INTO downloads (release_key, count, updated_at, window_started_at, window_count)
    VALUES (?, 0, unixepoch(), 0, 0)
    ON CONFLICT(release_key) DO NOTHING
  `).bind(releaseKey));

  await db.batch([
    db.prepare(`DELETE FROM downloads WHERE release_key NOT IN (${placeholders})`).bind(...releaseKeys),
    db.prepare(`DELETE FROM releases WHERE release_key NOT IN (${placeholders})`).bind(...releaseKeys),
    ...seedStatements,
    ...counterStatements,
    db.prepare(`
      INSERT INTO hivebuzz_meta (key, value, updated_at)
      VALUES (?, ?, unixepoch())
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      WHERE hivebuzz_meta.value <> excluded.value
    `).bind("catalog_version", catalogVersion),
  ]);
}

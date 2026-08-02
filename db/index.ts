import { CATALOG_RELEASES } from "@/lib/catalog-seeds";

let initialization: Promise<void> | null = null;

export async function getD1() {
  const { env } = await import("cloudflare:workers");
  const bindings = env as unknown as { DB?: D1Database };
  if (!bindings.DB) throw new Error("HiveBuzz database is unavailable.");
  return bindings.DB;
}

export function ensureDatabase() {
  if (initialization) return initialization;
  initialization = initialize().catch((error) => {
    initialization = null;
    throw error;
  });
  return initialization;
}

async function initialize() {
  const db = await getD1();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS releases (
        release_key TEXT PRIMARY KEY,
        release_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('agent', 'pack')),
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        summary TEXT NOT NULL,
        artifact_url TEXT NOT NULL,
        artifact_sha256 TEXT NOT NULL,
        artifact_size INTEGER NOT NULL,
        manifest_json TEXT NOT NULL,
        risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'review', 'elevated')),
        created_at INTEGER NOT NULL,
        UNIQUE(release_id, version)
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS downloads (
        release_key TEXT PRIMARY KEY REFERENCES releases(release_key),
        count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_releases_type_created ON releases(type, created_at DESC)"),
  ]);

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
  if (seedStatements.length) await db.batch(seedStatements);
  await db.prepare("PRAGMA optimize").run();
}

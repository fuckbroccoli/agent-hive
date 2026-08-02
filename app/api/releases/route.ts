import { ensureCatalog, getD1 } from "@/db";
import { recordFromManifest, validateManifest, type ReleaseRecord, type RiskLevel } from "@/lib/hive";

interface ReleaseRow {
  release_key: string;
  manifest_json: string;
  risk_level: RiskLevel;
  created_at: number;
  download_count: number;
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  return Response.json(data, { ...init, headers });
}

export async function GET() {
  try {
    await ensureCatalog();
    const db = await getD1();
    const result = await db.prepare(`
      SELECT
        r.release_key,
        r.manifest_json,
        r.risk_level,
        r.created_at,
        COALESCE(d.count, 0) AS download_count
      FROM releases r
      LEFT JOIN downloads d ON d.release_key = r.release_key
      ORDER BY r.created_at DESC
      LIMIT 100
    `).all<ReleaseRow>();

    const releases: ReleaseRecord[] = [];
    for (const row of result.results) {
      const parsed = JSON.parse(row.manifest_json) as unknown;
      const validation = validateManifest(parsed, { allowRelativeArtifact: true });
      if (!validation.ok || !validation.value) continue;
      const record = recordFromManifest(validation.value, Number(row.created_at), Number(row.download_count));
      if (record.key === row.release_key && record.riskLevel === row.risk_level) releases.push(record);
    }
    return json({ releases });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Catalog is unavailable." }, { status: 500 });
  }
}

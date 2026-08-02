import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const releases = sqliteTable(
  "releases",
  {
    releaseKey: text("release_key").primaryKey(),
    releaseId: text("release_id").notNull(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    version: text("version").notNull(),
    summary: text("summary").notNull(),
    artifactUrl: text("artifact_url").notNull(),
    artifactSha256: text("artifact_sha256").notNull(),
    artifactSize: integer("artifact_size").notNull(),
    manifestJson: text("manifest_json").notNull(),
    riskLevel: text("risk_level").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_releases_id_version").on(table.releaseId, table.version),
    index("idx_releases_type_created").on(table.type, table.createdAt),
  ],
);

export const downloads = sqliteTable("downloads", {
  releaseKey: text("release_key").primaryKey().references(() => releases.releaseKey),
  count: integer("count").notNull().default(0),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

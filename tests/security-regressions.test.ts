import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("keeps catalog synchronization versioned instead of rebuilding schema per isolate", async () => {
  const source = await readFile(new URL("../db/index.ts", import.meta.url), "utf8");
  assert.match(source, /catalog_version/);
  assert.doesNotMatch(source, /CREATE TABLE|CREATE INDEX|PRAGMA optimize/);

  const migration = await readFile(new URL("../drizzle/0002_harden_download_counter.sql", import.meta.url), "utf8");
  assert.match(migration, /window_started_at/);
  assert.match(migration, /window_count/);
  assert.match(migration, /hivebuzz_meta/);
});

test("does not ship the unused trusted-header authentication helper", async () => {
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
});

test("keeps migration tooling out of production dependencies", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  assert.equal(packageJson.dependencies?.["drizzle-orm"], undefined);
  assert.match(packageJson.devDependencies?.["drizzle-orm"] ?? "", /0\.45\.2$/);
});

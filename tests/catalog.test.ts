import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CATALOG_RELEASES } from "../lib/catalog-seeds";
import { recordFromManifest, releaseKeyFor, validateManifest } from "../lib/hive";
import { scanAgentSnapshot } from "../lib/snapshot-scan";

test("accepts every bounded catalog release with a stable key", () => {
  assert.equal(CATALOG_RELEASES.length, 5);
  assert.equal(new Set(CATALOG_RELEASES.map((release) => release.key)).size, CATALOG_RELEASES.length);

  for (const release of CATALOG_RELEASES) {
    const validation = validateManifest(release.manifest, { allowRelativeArtifact: true });
    assert.equal(validation.ok, true, validation.errors.join(" "));
    assert.equal(release.key, releaseKeyFor(release.manifest));
    assert.equal(release.downloadCount, 0);
    assert.ok(["research", "development", "design", "operations", "data", "marketing", "security", "personal"].includes(release.manifest.release.category));
    assert.deepEqual(recordFromManifest(release.manifest, release.addedAt), release);
  }
});

test("rejects hidden fields, unsafe Agent capabilities, secrets, and bad artifact suffixes", () => {
  const base = structuredClone(CATALOG_RELEASES.find((release) => release.manifest.type === "agent")!.manifest);

  const hidden = { ...base, hiddenChannel: "arbitrary metadata" };
  assert.match(validateManifest(hidden, { allowRelativeArtifact: true }).errors.join(" "), /unsupported fields/i);

  const executable = structuredClone(base);
  executable.capabilities.commands = ["node unsafe.mjs"];
  assert.match(validateManifest(executable, { allowRelativeArtifact: true }).errors.join(" "), /cannot declare executable/i);

  const secret = structuredClone(base) as typeof base & { apiKey?: string };
  secret.apiKey = "sk-example-secret-value-that-must-never-ship";
  assert.match(validateManifest(secret, { allowRelativeArtifact: true }).errors.join(" "), /secret|unsupported/i);

  const badUrl = structuredClone(base);
  badUrl.artifact.url = "/agents/download";
  assert.match(validateManifest(badUrl, { allowRelativeArtifact: true }).errors.join(" "), /approved local catalog path|must end with/i);

  const badCategory = structuredClone(base) as unknown as { release: { category: string } };
  badCategory.release.category = "uncategorized";
  assert.match(validateManifest(badCategory, { allowRelativeArtifact: true }).errors.join(" "), /category is invalid/i);

  const badHarness = structuredClone(base) as unknown as { release: { recommendedHarness: string } };
  badHarness.release.recommendedHarness = "unknown-runtime";
  assert.match(validateManifest(badHarness, { allowRelativeArtifact: true }).errors.join(" "), /harness is invalid/i);

  const pack = structuredClone(base) as unknown as { type: string };
  pack.type = "pack";
  assert.match(validateManifest(pack, { allowRelativeArtifact: true }).errors.join(" "), /type must be agent/i);
});

test("every bundled catalog artifact passes the exact browser handoff scanner", async () => {
  for (const release of CATALOG_RELEASES) {
    const artifact = release.manifest.artifact;
    const fileName = artifact.url.split("/").pop()!;
    const bytes = await readFile(new URL(`../public${artifact.url}`, import.meta.url));
    const result = await scanAgentSnapshot(bytes, fileName, {
      sha256: artifact.sha256,
      sizeBytes: artifact.sizeBytes,
      mediaType: artifact.mediaType,
    });
    assert.equal(result.ok, true, `${release.key}: ${result.hardErrors.join(" ")}`);
    assert.equal(result.sha256, artifact.sha256);
  }
});

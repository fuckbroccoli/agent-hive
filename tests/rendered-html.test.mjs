import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { unzipSync } from "fflate";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished Agent Hive product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="en">/i);
  assert.match(html, /<title>Agent Hive — Buzz agents, ready to import\.<\/title>/i);
  assert.match(html, /Buzz agents,/);
  assert.match(html, /ready to import\./);
  assert.match(html, /hivebuzz/);
  assert.match(html, /\.xyz · for Buzz/);
  assert.match(html, /Quiet Researcher/);
  assert.match(html, /Release Scout/);
  assert.match(html, /No login/);
  assert.match(html, /0(?:<!-- -->)? downloads/);
  assert.match(html, /Downloads show activity, not safety/);
  assert.match(html, /Submit agent/);
  assert.match(html, /Read the full export and import guide/);
  assert.doesNotMatch(html, /Connect signer|Give Honey|Sign & publish|Recent signed/i);
  assert.match(html, /<meta property="og:image" content="https?:\/\/[^\"]+\/og\.png"\/>/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("server-renders the English Snapshot guide with safety defaults", async () => {
  const response = await render("/guide");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Export safely/);
  assert.equal(html.includes("Agent only + JSON"), true);
  assert.match(html, /Export Agent/);
  assert.match(html, /No login or signing/);
  assert.match(html, /Fresh keypair/);
  assert.match(html, /Clear allowlist/);
  assert.doesNotMatch(html, /Connect signer|Give Honey|Sign & publish/i);
});

test("server-renders the local-first agent registration flow", async () => {
  const response = await render("/contribute");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Register your/);
  assert.match(html, /Agent Hive never receives the file from this page/);
  assert.match(html, /Local scan first/);
  assert.match(html, /Open GitHub request/);
  assert.match(html, /public source review/i);
  assert.doesNotMatch(html, /Nostr sign|Connect wallet|Upload to Agent Hive/i);
});

test("reference Agent Snapshot is public-safe and digest pinned", async () => {
  const snapshotUrl = new URL("../public/agents/quiet-researcher-1.0.0.agent.json", import.meta.url);
  const bytes = await readFile(snapshotUrl);
  assert.equal(bytes.byteLength, 725);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "97d1d095bd27ebf8430ff95b36ae5e8591ebc01fdffed3394598688c32cf166c");
  const snapshot = JSON.parse(bytes.toString("utf8"));
  assert.equal(snapshot.format, "buzz-agent-snapshot");
  assert.equal(snapshot.version, 1);
  assert.deepEqual(snapshot.memory, { level: "none" });
  assert.equal(snapshot.definition.respondToAllowlist, undefined);
  assert.equal(snapshot.profile.avatarUrl, undefined);
  assert.equal(JSON.stringify(snapshot).includes("nsec1"), false);
});

test("removes disposable starter assets and metadata", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(packageJson, /nostr-tools/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/icon.png", import.meta.url));
  await access(new URL("../public/hive-mark.png", import.meta.url));
});

test("reference Persona Packs are immutable, bounded archives", async () => {
  const expected = new Map([
    ["launch-conductor-1.0.0.buzzpack", "4ce3d5e7afae602f967158ca741b4b9314df18cae8682c9aa22ef13449609778"],
    ["release-scout-1.2.0.buzzpack", "ff56801e581d1579699750b9cb77bc72eb19e6cbb3b41907e918dc3ac0b4ec3b"],
    ["source-auditor-0.8.1.buzzpack", "397ee4f2563b71c32b023210ecd5aec8b960ca6b464693bd5a9ada28ea15a8fb"],
  ]);
  const packRoot = new URL("../public/packs/", import.meta.url);
  const names = (await readdir(packRoot)).filter((name) => name.endsWith(".buzzpack")).sort();
  assert.deepEqual(names, [...expected.keys()].sort());

  for (const name of names) {
    const bytes = await readFile(new URL(name, packRoot));
    assert.ok(bytes.byteLength < 25 * 1024 * 1024);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected.get(name));
    const files = unzipSync(bytes);
    const paths = Object.keys(files);
    assert.ok(paths.includes(".plugin/plugin.json"));
    assert.ok(paths.some((path) => /^agents\/[^/]+\.persona\.md$/.test(path)));
    assert.ok(paths.every((path) => !path.startsWith("/") && !path.split("/").includes("..")));
  }
});

import { CATALOG_SCHEMA, type ReleaseManifest, type ReleaseRecord } from "./hive-contract";
import { recordFromManifest } from "./hive";

interface CatalogSeed {
  addedAt: number;
  manifest: ReleaseManifest;
}

const seeds: CatalogSeed[] = [
  {
    addedAt: 1_785_603_441,
    manifest: {
      schema: CATALOG_SCHEMA,
      type: "agent",
      contributorName: "Agent Hive reference",
      release: {
        id: "agent.quiet-researcher",
        name: "Quiet Researcher",
        version: "1.0.0",
        category: "research",
        summary: "A restrained research agent that prefers primary sources and separates facts from inference.",
        description: "Researches one question at a time, prefers primary sources, distinguishes verified facts from inference, and never publishes or changes files without a separate explicit request.",
        license: "Apache-2.0",
        homepage: "https://github.com/block/buzz",
        keywords: ["research", "primary-sources", "read-only"],
        engines: { buzz: ">=0.9.0" },
      },
      artifact: {
        url: "/agents/quiet-researcher-1.0.0.agent.json",
        sha256: "97d1d095bd27ebf8430ff95b36ae5e8591ebc01fdffed3394598688c32cf166c",
        sizeBytes: 725,
        mediaType: "application/vnd.buzz.agent-snapshot+json",
      },
      contents: { agents: 1, skills: 0, mcpServers: 0, hooks: 0 },
      capabilities: { networkHosts: [], filesystem: "none", commands: [], hooks: [], mcpServers: [] },
      snapshot: {
        format: "buzz-agent-snapshot",
        version: 1,
        memoryLevel: "none",
        identityPolicy: "fresh-on-import",
        sourceAllowlist: "cleared-on-import",
      },
    },
  },
  {
    addedAt: 1_785_573_000,
    manifest: {
      schema: CATALOG_SCHEMA,
      type: "pack",
      contributorName: "Agent Hive examples",
      release: {
        id: "dev.agent-hive.release-scout",
        name: "Release Scout",
        version: "1.2.0",
        category: "development",
        summary: "Source-linked release notes from read-only repository activity.",
        description: "Reads merged pull requests and commits, groups user-visible changes, and returns concise release notes with primary-source links.",
        license: "Apache-2.0",
        homepage: "https://github.com/block/buzz",
        keywords: ["github", "release-notes", "read-only"],
        engines: { buzz: ">=0.9.0" },
      },
      artifact: {
        url: "/packs/release-scout-1.2.0.buzzpack",
        sha256: "ff56801e581d1579699750b9cb77bc72eb19e6cbb3b41907e918dc3ac0b4ec3b",
        sizeBytes: 1_829,
        mediaType: "application/vnd.buzz.persona-pack+zip",
      },
      contents: { agents: 1, skills: 1, mcpServers: 1, hooks: 0 },
      capabilities: {
        networkHosts: ["api.github.com"],
        filesystem: "none",
        commands: [],
        hooks: [],
        mcpServers: [{ name: "github-readonly", transport: "stdio", command: "github-mcp-server", access: "read-only" }],
      },
    },
  },
  {
    addedAt: 1_785_560_400,
    manifest: {
      schema: CATALOG_SCHEMA,
      type: "pack",
      contributorName: "Agent Hive examples",
      release: {
        id: "dev.agent-hive.source-auditor",
        name: "Source Auditor",
        version: "0.8.1",
        category: "research",
        summary: "Checks draft claims against first-party sources before publication.",
        description: "Separates verified facts, inferences, and unsupported claims. Produces a compact evidence table without changing or publishing the original draft.",
        license: "MIT",
        homepage: "https://github.com/block/buzz",
        keywords: ["research", "citations", "read-only"],
        engines: { buzz: ">=0.9.0" },
      },
      artifact: {
        url: "/packs/source-auditor-0.8.1.buzzpack",
        sha256: "397ee4f2563b71c32b023210ecd5aec8b960ca6b464693bd5a9ada28ea15a8fb",
        sizeBytes: 1_741,
        mediaType: "application/vnd.buzz.persona-pack+zip",
      },
      contents: { agents: 1, skills: 1, mcpServers: 1, hooks: 0 },
      capabilities: {
        networkHosts: ["contributor-selected HTTPS sources"],
        filesystem: "none",
        commands: [],
        hooks: [],
        mcpServers: [{ name: "web-readonly", transport: "http", access: "read-only" }],
      },
    },
  },
  {
    addedAt: 1_785_546_000,
    manifest: {
      schema: CATALOG_SCHEMA,
      type: "pack",
      contributorName: "Agent Hive examples",
      release: {
        id: "dev.agent-hive.launch-conductor",
        name: "Launch Conductor",
        version: "1.0.0",
        category: "operations",
        summary: "Coordinates launch checklists and writes local handoff artifacts.",
        description: "Builds an owner-reviewed launch plan and writes handoff files inside one selected project directory. Includes one after-run hook.",
        license: "Apache-2.0",
        homepage: "https://github.com/block/buzz",
        keywords: ["launch", "coordination", "write-access"],
        engines: { buzz: ">=0.9.0" },
      },
      artifact: {
        url: "/packs/launch-conductor-1.0.0.buzzpack",
        sha256: "4ce3d5e7afae602f967158ca741b4b9314df18cae8682c9aa22ef13449609778",
        sizeBytes: 1_895,
        mediaType: "application/vnd.buzz.persona-pack+zip",
      },
      contents: { agents: 1, skills: 1, mcpServers: 0, hooks: 1 },
      capabilities: {
        networkHosts: [],
        filesystem: "project-write",
        commands: ["node scripts/write-run-summary.mjs"],
        hooks: [{ phase: "after-run", command: "node scripts/write-run-summary.mjs" }],
        mcpServers: [],
      },
    },
  },
];

export const CATALOG_RELEASES: ReleaseRecord[] = seeds
  .map(({ manifest, addedAt }) => recordFromManifest(manifest, addedAt))
  .sort((a, b) => b.addedAt - a.addedAt);

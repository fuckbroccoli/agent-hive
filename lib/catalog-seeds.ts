import { CATALOG_SCHEMA, type ReleaseManifest, type ReleaseRecord } from "./hive-contract";
import { recordFromManifest } from "./hive";

interface CatalogSeed {
  addedAt: number;
  manifest: ReleaseManifest;
}

const seeds: CatalogSeed[] = [
  {
    addedAt: 1_785_607_200,
    manifest: {
      schema: CATALOG_SCHEMA,
      type: "agent",
      contributorName: "HiveBuzz examples",
      release: {
        id: "xyz.hivebuzz.code-reviewer",
        name: "Code Reviewer",
        version: "1.0.0",
        category: "development",
        summary: "Read-only code review focused on correctness, security, regressions, and missing tests.",
        description: "Reviews only provided code or patches, distinguishes confirmed defects from questions, cites concrete locations, and never edits files or approves a release.",
        license: "Apache-2.0",
        homepage: "https://github.com/promptprobe/hivebuzz",
        keywords: ["code-review", "security", "read-only", "testing"],
        engines: { buzz: ">=0.9.0" },
        recommendedHarness: "codex",
        recommendedModel: "Provider default",
      },
      artifact: {
        url: "/agents/code-reviewer-1.0.0.agent.json",
        sha256: "ca680b820f318f1ee6f2e08ceede7d6f44dc6b2107dfa4d7a349938df41a32be",
        sizeBytes: 828,
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
    addedAt: 1_785_606_900,
    manifest: {
      schema: CATALOG_SCHEMA,
      type: "agent",
      contributorName: "HiveBuzz examples",
      release: {
        id: "xyz.hivebuzz.draft-polisher",
        name: "Draft Polisher",
        version: "1.0.0",
        category: "marketing",
        summary: "Careful editing that preserves facts, flags unsupported claims, and never publishes.",
        description: "Polishes user-provided drafts while preserving names, numbers, links, meaning, and uncertainty. It flags unsupported claims and requires a separate request before anything is published or sent.",
        license: "Apache-2.0",
        homepage: "https://github.com/promptprobe/hivebuzz",
        keywords: ["editing", "writing", "claims", "read-only"],
        engines: { buzz: ">=0.9.0" },
        recommendedHarness: "claude",
        recommendedModel: "Provider default",
      },
      artifact: {
        url: "/agents/draft-polisher-1.0.0.agent.json",
        sha256: "3525f5f72745a916849dd0e02007676dc06b3a9a47816804f0283aced442dbe2",
        sizeBytes: 828,
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
    addedAt: 1_785_606_600,
    manifest: {
      schema: CATALOG_SCHEMA,
      type: "agent",
      contributorName: "HiveBuzz examples",
      release: {
        id: "xyz.hivebuzz.meeting-synthesizer",
        name: "Meeting Synthesizer",
        version: "1.0.0",
        category: "operations",
        summary: "Turns supplied notes into sourced decisions, open questions, risks, and action items.",
        description: "Structures user-provided notes without inventing consensus, owners, or dates. Any external follow-up or task creation remains a separate explicit action.",
        license: "Apache-2.0",
        homepage: "https://github.com/promptprobe/hivebuzz",
        keywords: ["meetings", "decisions", "action-items", "read-only"],
        engines: { buzz: ">=0.9.0" },
        recommendedHarness: "claude",
        recommendedModel: "Provider default",
      },
      artifact: {
        url: "/agents/meeting-synthesizer-1.0.0.agent.json",
        sha256: "886ce8d1147fd8c8f40cf194dc168b467b92c100ce283491a15ecaf93f2ae6b4",
        sizeBytes: 847,
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
    addedAt: 1_785_606_300,
    manifest: {
      schema: CATALOG_SCHEMA,
      type: "agent",
      contributorName: "HiveBuzz examples",
      release: {
        id: "xyz.hivebuzz.data-explainer",
        name: "Data Explainer",
        version: "1.0.0",
        category: "data",
        summary: "Explains supplied metrics after checking units, denominators, scope, and time windows.",
        description: "Separates direct observations from hypotheses, shows simple calculations when useful, and states what the provided data cannot establish.",
        license: "Apache-2.0",
        homepage: "https://github.com/promptprobe/hivebuzz",
        keywords: ["data", "metrics", "analysis", "read-only"],
        engines: { buzz: ">=0.9.0" },
        recommendedHarness: "codex",
        recommendedModel: "Provider default",
      },
      artifact: {
        url: "/agents/data-explainer-1.0.0.agent.json",
        sha256: "46af3840f80ba086ee330ee0bc1e72d75d34095aecb22fb6e2412e82d7303a03",
        sizeBytes: 839,
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
    addedAt: 1_785_603_441,
    manifest: {
      schema: CATALOG_SCHEMA,
      type: "agent",
      contributorName: "HiveBuzz reference",
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
        recommendedHarness: "codex",
        recommendedModel: "Provider default",
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
];

export const CATALOG_RELEASES: ReleaseRecord[] = seeds
  .map(({ manifest, addedAt }) => recordFromManifest(manifest, addedAt))
  .sort((a, b) => b.addedAt - a.addedAt);

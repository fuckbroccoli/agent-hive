export const CATALOG_SCHEMA = "xyz.hivebuzz.catalog/v1";

export type FilesystemAccess = "none" | "read-only" | "project-write";
export type RiskLevel = "low" | "review" | "elevated";
export type ReleaseType = "agent" | "pack";
export const AGENT_CATEGORIES = [
  "research",
  "development",
  "design",
  "operations",
  "data",
  "marketing",
  "security",
  "personal",
] as const;
export type AgentCategory = (typeof AGENT_CATEGORIES)[number];

export interface McpCapability {
  name: string;
  transport: "stdio" | "http";
  command?: string;
  access: "read-only" | "write" | "unknown";
}

export interface HookCapability {
  phase: string;
  command: string;
}

export interface ReleaseMetadata {
  id: string;
  name: string;
  version: string;
  category: AgentCategory;
  summary: string;
  description: string;
  license: string;
  homepage?: string;
  keywords: string[];
  engines: { buzz: string };
}

export interface ReleaseContents {
  agents: number;
  skills: number;
  mcpServers: number;
  hooks: number;
}

export interface ReleaseCapabilities {
  networkHosts: string[];
  filesystem: FilesystemAccess;
  commands: string[];
  hooks: HookCapability[];
  mcpServers: McpCapability[];
}

export interface ReleaseManifest {
  schema: typeof CATALOG_SCHEMA;
  type: ReleaseType;
  contributorName?: string;
  release: ReleaseMetadata;
  artifact: {
    url: string;
    sha256: string;
    sizeBytes: number;
    mediaType:
      | "application/vnd.buzz.agent-snapshot+json"
      | "image/png"
      | "application/vnd.buzz.persona-pack+zip";
  };
  contents: ReleaseContents;
  capabilities: ReleaseCapabilities;
  snapshot?: {
    format: "buzz-agent-snapshot";
    version: 1;
    memoryLevel: "none";
    identityPolicy: "fresh-on-import";
    sourceAllowlist: "cleared-on-import";
  };
}

export interface ReleaseRecord {
  key: string;
  manifest: ReleaseManifest;
  downloadCount: number;
  riskLevel: RiskLevel;
  addedAt: number;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  errors: string[];
}

export function releaseKeyFor(manifest: ReleaseManifest) {
  return `${manifest.type}:${manifest.release.id}@${manifest.release.version}`;
}

import { unzip, type UnzipFileInfo } from "fflate";
import type { FilesystemAccess, HookCapability, McpCapability } from "./hive-contract";

const MAX_COMPRESSED_BYTES = 25 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 100 * 1024 * 1024;
const MAX_SCANNED_TEXT_BYTES = 6 * 1024 * 1024;
const MAX_FILES = 512;
const TEXT_FILE = /(?:\.json|\.md|\.txt|\.ya?ml|\.toml)$/i;
const NESTED_ARCHIVE = /(?:\.zip|\.tar|\.tgz|\.gz|\.7z|\.rar|\.buzzpack)$/i;

interface PluginManifest {
  name?: string;
  version?: string;
  description?: string;
  agents?: string[];
  skills?: string[];
  mcp?: string;
  hooks?: string;
}
export interface ArchiveScanResult {
  ok: boolean;
  sha256: string;
  hardErrors: string[];
  warnings: string[];
  checks: string[];
  fileCount: number;
  expandedBytes: number;
  plugin: {
    name: string;
    version: string;
    description: string;
  } | null;
  contents: {
    agents: number;
    skills: number;
    mcpServers: number;
    hooks: number;
  };
  derivedCapabilities: {
    networkHosts: string[];
    filesystem: FilesystemAccess;
    commands: string[];
    hooks: HookCapability[];
    mcpServers: McpCapability[];
  };
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return hex(await crypto.subtle.digest("SHA-256", copy.buffer));
}

function isUnsafePath(name: string) {
  if (!name || name.includes("\0") || name.includes("\\") || name.startsWith("/") || /^[A-Za-z]:/.test(name)) return true;
  const parts = name.split("/").filter(Boolean);
  return parts.some((part) => part === ".." || part === ".");
}

function decode(bytes?: Uint8Array) {
  return bytes ? new TextDecoder("utf-8", { fatal: false }).decode(bytes) : "";
}

function findSecretFiles(files: Map<string, Uint8Array>) {
  const findings: string[] = [];
  const valuePatterns = [
    /\bnsec1[023456789acdefghjklmnpqrstuvwxyz]{20,}\b/i,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
    /\bAKIA[A-Z0-9]{16}\b/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /["']?(?:api[_-]?key|access[_-]?token|private[_-]?key|auth[_-]?tag|secret)["']?\s*[:=]\s*["'][^$<{][^"']{11,}["']/i,
  ];
  for (const [name, bytes] of files) {
    const text = decode(bytes);
    if (valuePatterns.some((pattern) => pattern.test(text))) findings.push(name);
  }
  return findings;
}

function parseJson<T>(bytes: Uint8Array | undefined): T | null {
  if (!bytes) return null;
  try {
    return JSON.parse(decode(bytes)) as T;
  } catch {
    return null;
  }
}

function extractNetworkHost(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.hostname : null;
  } catch {
    return null;
  }
}

export async function scanBuzzpack(
  input: ArrayBuffer | Uint8Array,
  expected?: { sha256?: string; sizeBytes?: number },
): Promise<ArchiveScanResult> {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const hardErrors: string[] = [];
  const warnings: string[] = [];
  const checks: string[] = [];
  const digest = await sha256(bytes);

  if (bytes.byteLength > MAX_COMPRESSED_BYTES) hardErrors.push("Archive exceeds the 25 MiB compressed-size limit.");
  if (expected?.sizeBytes !== undefined && bytes.byteLength !== expected.sizeBytes) hardErrors.push("Downloaded size does not match the catalog record.");
  if (expected?.sha256 && digest !== expected.sha256.toLowerCase()) hardErrors.push("SHA-256 does not match the catalog record.");
  else checks.push(expected?.sha256 ? "Artifact digest matches the catalog record" : "Artifact SHA-256 generated locally");

  const names = new Set<string>();
  const lowercaseNames = new Set<string>();
  let expandedBytes = 0;
  let scannedTextBytes = 0;
  let fileCount = 0;
  const metadataErrors: string[] = [];

  const files = await new Promise<Map<string, Uint8Array>>((resolve, reject) => {
    try {
      unzip(
        bytes,
        {
          filter(file: UnzipFileInfo) {
            if (file.name.endsWith("/")) return false;
            fileCount += 1;
            expandedBytes += file.originalSize;
            const lower = file.name.toLowerCase();

            if (fileCount > MAX_FILES) metadataErrors.push("Archive contains more than 512 files.");
            if (expandedBytes > MAX_EXPANDED_BYTES) metadataErrors.push("Archive exceeds the 100 MiB expanded-size limit.");
            if (isUnsafePath(file.name)) metadataErrors.push(`Unsafe archive path: ${file.name}`);
            if (names.has(file.name) || lowercaseNames.has(lower)) metadataErrors.push(`Duplicate or case-colliding path: ${file.name}`);
            if (NESTED_ARCHIVE.test(file.name)) metadataErrors.push(`Nested archive is not allowed: ${file.name}`);
            if (/\.agent\.(?:json|png)$/i.test(file.name) || /(?:^|\/)memory(?:\.|\/)/i.test(file.name)) {
              metadataErrors.push(`Identity or memory payload is not allowed: ${file.name}`);
            }
            if (file.originalSize > 1_024 && file.originalSize / Math.max(file.size, 1) > 100) {
              metadataErrors.push(`Suspicious compression ratio: ${file.name}`);
            }
            names.add(file.name);
            lowercaseNames.add(lower);

            const shouldRead = TEXT_FILE.test(file.name) && file.originalSize <= 1024 * 1024;
            if (shouldRead) scannedTextBytes += file.originalSize;
            if (scannedTextBytes > MAX_SCANNED_TEXT_BYTES) {
              metadataErrors.push("Text content exceeds the static-scan limit.");
              return false;
            }
            return shouldRead;
          },
        },
        (error, unzipped) => {
          if (error) reject(error);
          else resolve(new Map(Object.entries(unzipped ?? {})));
        },
      );
    } catch (error) {
      reject(error);
    }
  }).catch((error) => {
    hardErrors.push(error instanceof Error ? `Archive could not be read: ${error.message}` : "Archive could not be read.");
    return new Map<string, Uint8Array>();
  });

  hardErrors.push(...new Set(metadataErrors));
  if (!metadataErrors.length && files.size) checks.push("Archive paths and expansion limits pass");

  const pluginBytes = files.get(".plugin/plugin.json");
  const plugin = parseJson<PluginManifest>(pluginBytes);
  const agents = [...names].filter((name) => /^agents\/[^/]+\.persona\.md$/i.test(name));
  const skills = [...names].filter((name) => /^skills\/[^/]+\/SKILL\.md$/i.test(name));
  const hookFiles = [...names].filter((name) => /(?:^|\/)hooks?\//i.test(name) && !name.endsWith("/"));

  if (!plugin) {
    hardErrors.push(".plugin/plugin.json is missing or invalid.");
  } else {
    if (typeof plugin.name !== "string" || !/^[a-z0-9][a-z0-9._-]{1,79}$/.test(plugin.name)) hardErrors.push("Plugin name is invalid.");
    if (typeof plugin.version !== "string" || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(plugin.version)) hardErrors.push("Plugin version is invalid.");
    if (typeof plugin.description !== "string" || plugin.description.length < 12 || plugin.description.length > 1_200) hardErrors.push("Plugin description is invalid.");

    const references = [
      ...(Array.isArray(plugin.agents) ? plugin.agents : []),
      ...(Array.isArray(plugin.skills) ? plugin.skills : []),
      ...(plugin.mcp ? [plugin.mcp] : []),
      ...(plugin.hooks ? [plugin.hooks] : []),
    ];
    for (const reference of references) {
      if (isUnsafePath(reference) || !names.has(reference)) hardErrors.push(`Manifest reference is missing or unsafe: ${reference}`);
    }
  }
  if (!agents.length) hardErrors.push("Pack must include at least one agents/*.persona.md file.");

  const secretFiles = findSecretFiles(files);
  if (secretFiles.length) hardErrors.push(`Possible secret or private identity material found in: ${secretFiles.join(", ")}`);
  else if (files.size) checks.push("No embedded secret patterns found in scanned text");

  const mcpBytes = plugin?.mcp ? files.get(plugin.mcp) : files.get(".mcp.json");
  const mcpJson = parseJson<{ servers?: Record<string, Record<string, unknown>> }>(mcpBytes);
  const mcpServers: McpCapability[] = [];
  const networkHosts = new Set<string>();
  const commands: string[] = [];

  for (const [name, server] of Object.entries(mcpJson?.servers ?? {})) {
    const transport = server.transport === "stdio" ? "stdio" : server.transport === "http" ? "http" : null;
    if (!transport) {
      hardErrors.push(`Unsupported MCP transport for ${name}.`);
      continue;
    }
    const command = typeof server.command === "string" ? server.command : undefined;
    if (command && /[;|`]|&&|\$\(/.test(command)) hardErrors.push(`Shell composition is not allowed in MCP command: ${name}`);
    if (command) commands.push(command);
    const host = extractNetworkHost(server.url);
    if (host) networkHosts.add(host);
    mcpServers.push({ name, transport, command, access: "unknown" });
  }

  const hooksJson = plugin?.hooks ? parseJson<{ hooks?: Array<Record<string, unknown>> }>(files.get(plugin.hooks)) : null;
  const hooks: HookCapability[] = [];
  for (const hook of hooksJson?.hooks ?? []) {
    const phase = typeof hook.event === "string" ? hook.event : typeof hook.phase === "string" ? hook.phase : "unknown";
    const command = typeof hook.command === "string" ? hook.command : "";
    if (!command) hardErrors.push("Hook command is missing.");
    else if (/[;|`]|&&|\$\(/.test(command)) hardErrors.push("Shell composition is not allowed in hook commands.");
    else commands.push(command);
    hooks.push({ phase, command });
  }

  if (hooks.length || hookFiles.length) warnings.push("Contains hooks. Keep them off until separately approved in Buzz.");
  if (commands.length) warnings.push("Declares local commands. Review every executable before enabling.");
  if (mcpServers.length) warnings.push("Uses MCP tools. Tool access must be reviewed in Buzz.");
  if (!hardErrors.length) checks.push("Persona Pack structure is valid");

  return {
    ok: hardErrors.length === 0,
    sha256: digest,
    hardErrors: [...new Set(hardErrors)],
    warnings: [...new Set(warnings)],
    checks,
    fileCount,
    expandedBytes,
    plugin: plugin && typeof plugin.name === "string" && typeof plugin.version === "string" && typeof plugin.description === "string"
      ? { name: plugin.name, version: plugin.version, description: plugin.description }
      : null,
    contents: {
      agents: agents.length,
      skills: skills.length,
      mcpServers: mcpServers.length,
      hooks: hooks.length || (hookFiles.length ? 1 : 0),
    },
    derivedCapabilities: {
      networkHosts: [...networkHosts],
      filesystem: "none",
      commands: [...new Set(commands)],
      hooks,
      mcpServers,
    },
  };
}

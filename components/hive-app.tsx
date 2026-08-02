"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  BookOpen,
  Check,
  Download,
  ExternalLink,
  FileArchive,
  FolderLock,
  Hash,
  LockKeyhole,
  Network,
  Package,
  PackageCheck,
  Plug,
  Search,
  ShieldCheck,
  TerminalSquare,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { ArchiveScanResult } from "@/lib/archive-scan";
import type { AgentSnapshotScanResult } from "@/lib/snapshot-scan";
import { AGENT_CATEGORIES, type AgentCategory, type ReleaseRecord } from "@/lib/hive-contract";

type Lane = "agent" | "pack" | "all";

interface HiveAppProps {
  initialReleases: ReleaseRecord[];
}

interface NoticeState {
  tone: "success" | "error" | "neutral";
  message: string;
}

interface ScanView {
  ok: boolean;
  sha256: string;
  hardErrors: string[];
  warnings: string[];
  checks: string[];
}

interface DialogProps {
  title: string;
  eyebrow?: string;
  open: boolean;
  onClose(): void;
  children: ReactNode;
  wide?: boolean;
}

const numberFormatter = new Intl.NumberFormat("en-US");
const CATEGORY_LABELS: Record<AgentCategory, string> = {
  research: "Research",
  development: "Development",
  design: "Design",
  operations: "Operations",
  data: "Data",
  marketing: "Marketing",
  security: "Security",
  personal: "Personal",
};

function Dialog({ title, eyebrow, open, onClose, children, wide }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`dialog-panel ${wide ? "dialog-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={panelRef}>
        <div className="dialog-heading">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RiskLabel({ release }: { release: ReleaseRecord }) {
  const labels = {
    low: "Low surface",
    review: "Review tools",
    elevated: "Elevated access",
  };
  return <span className={`risk risk-${release.riskLevel}`}>{labels[release.riskLevel]}</span>;
}

function CountLine({ release }: { release: ReleaseRecord }) {
  if (release.manifest.type === "agent") return <span>Agent snapshot · no memory · no bundled tools</span>;
  const { contents } = release.manifest;
  return (
    <span>
      {contents.agents} {contents.agents === 1 ? "agent" : "agents"} · {contents.skills} {contents.skills === 1 ? "skill" : "skills"} · {contents.mcpServers} MCP · {contents.hooks ? `${contents.hooks} hook` : "No hooks"}
    </span>
  );
}

function CheckRow({ icon, title, detail, tone = "ok" }: { icon: ReactNode; title: string; detail: string; tone?: "ok" | "warn" | "block" }) {
  return (
    <div className={`check-row check-${tone}`}>
      <span className="check-icon" aria-hidden="true">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
    </div>
  );
}

function shortDate(timestamp: number) {
  return new Date(timestamp * 1_000).toISOString().slice(0, 10);
}

function capabilitySummary(release: ReleaseRecord) {
  const { capabilities } = release.manifest;
  if (capabilities.hooks.length) return `${capabilities.hooks.length} hook${capabilities.hooks.length === 1 ? "" : "s"}`;
  if (capabilities.mcpServers.length) return `${capabilities.mcpServers.length} MCP tool${capabilities.mcpServers.length === 1 ? "" : "s"}`;
  if (capabilities.networkHosts.length) return `${capabilities.networkHosts.length} network host${capabilities.networkHosts.length === 1 ? "" : "s"}`;
  return "No executable capabilities";
}

export function HiveApp({ initialReleases }: HiveAppProps) {
  const initialAgent = initialReleases.find((release) => release.manifest.type === "agent");
  const [releases, setReleases] = useState(initialReleases);
  const [selectedKey, setSelectedKey] = useState(initialAgent?.key ?? initialReleases[0]?.key ?? "");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState<Lane>("agent");
  const [category, setCategory] = useState<"all" | AgentCategory>("all");
  const [mobileDetail, setMobileDetail] = useState(false);
  const [installRelease, setInstallRelease] = useState<ReleaseRecord | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/releases", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json() as Promise<{ releases?: ReleaseRecord[] }>)
      .then((data) => {
        if (!data.releases?.length) return;
        setReleases(data.releases);
        setSelectedKey((current) => data.releases?.some((release) => release.key === current)
          ? current
          : data.releases?.find((release) => release.manifest.type === "agent")?.key ?? data.releases?.[0]?.key ?? "");
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const visibleReleases = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return releases
      .filter((release) => {
        if (lane !== "all" && release.manifest.type !== lane) return false;
        if (category !== "all" && release.manifest.release.category !== category) return false;
        if (!normalized) return true;
        const item = release.manifest.release;
        return [item.name, item.summary, CATEGORY_LABELS[item.category], release.manifest.contributorName ?? "", ...item.keywords]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => {
        if (lane === "all" && a.manifest.type !== b.manifest.type) return a.manifest.type === "agent" ? -1 : 1;
        return b.addedAt - a.addedAt;
      });
  }, [category, lane, query, releases]);

  const selected = visibleReleases.find((release) => release.key === selectedKey) ?? visibleReleases[0];
  const totalDownloads = releases.reduce((total, release) => total + release.downloadCount, 0);

  const selectRelease = (release: ReleaseRecord) => {
    setSelectedKey(release.key);
    setMobileDetail(true);
  };

  const updateDownloadCount = (releaseKey: string, downloadCount: number) => {
    setReleases((current) => current.map((release) => release.key === releaseKey
      ? { ...release, downloadCount }
      : release));
  };

  return (
    <div className="site-shell">
      <header className="hero-skin home-skin" id="top">
        <div className="topbar skin-topbar">
          <a className="brand" href="#top" aria-label="HiveBuzz home">
            <span className="brand-mark" aria-hidden="true" />
            <span>hivebuzz</span>
            <small>.xyz · for Buzz</small>
          </a>
          <nav className="topbar-actions" aria-label="Primary navigation">
            <Link className="button button-ghost" href="/guide"><BookOpen size={16} aria-hidden="true" /> Export guide</Link>
            <Link className="button button-dark" href="/contribute"><Upload size={16} aria-hidden="true" /> Submit agent</Link>
          </nav>
        </div>
        <section className="intro">
          <div>
            <p className="eyebrow">Open Buzz agent library</p>
            <h1>Buzz agents,<br />ready to import.</h1>
          </div>
          <div className="intro-copy">
            <p>Browse without an account. Verify exact bytes in your browser. Drag a stopped copy into Buzz Desktop.</p>
            <div className="principles" aria-label="Agent Hive principles">
              <span><LockKeyhole size={15} aria-hidden="true" /> No login</span>
              <span><ShieldCheck size={15} aria-hidden="true" /> Local verification</span>
              <span><PackageCheck size={15} aria-hidden="true" /> No auto-run</span>
            </div>
          </div>
        </section>
      </header>

      <main>
        <section className={`hive-workspace ${mobileDetail ? "show-detail" : "show-list"}`} aria-label="Buzz agent library">
          <aside className="catalog-panel">
            <div className="catalog-tools">
              <div className="lane-switch" aria-label="Release type">
                {([["agent", "Agents"], ["pack", "Packs"], ["all", "All"]] as Array<[Lane, string]>).map(([value, label]) => (
                  <button key={value} type="button" className={lane === value ? "active" : ""} onClick={() => { setLane(value); setCategory("all"); setMobileDetail(false); }} aria-pressed={lane === value}>{label}</button>
                ))}
              </div>
              <div className="category-filter" aria-label="Agent category">
                <button type="button" className={category === "all" ? "active" : ""} onClick={() => setCategory("all")} aria-pressed={category === "all"}>All topics</button>
                {AGENT_CATEGORIES.map((item) => (
                  <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{CATEGORY_LABELS[item]}</button>
                ))}
              </div>
              <label className="search-box">
                <Search size={17} aria-hidden="true" />
                <span className="sr-only">Search agents and packs</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lane === "agent" ? "Search agents" : lane === "pack" ? "Search packs" : "Search library"} />
                {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button> : null}
              </label>
            </div>
            <div className="catalog-count">
              <span>{visibleReleases.length} release{visibleReleases.length === 1 ? "" : "s"}</span>
              <span>{numberFormatter.format(totalDownloads)} downloads</span>
            </div>
            <div className="release-list">
              {visibleReleases.map((release) => {
                const item = release.manifest.release;
                return (
                  <button
                    className={`release-card ${selected?.key === release.key ? "selected" : ""}`}
                    type="button"
                    key={release.key}
                    onClick={() => selectRelease(release)}
                    aria-pressed={selected?.key === release.key}
                  >
                    <span className="release-card-top">
                      <span className="release-name">{item.name}</span>
                      <span className="version">v{item.version}</span>
                    </span>
                    <span className="release-summary">{item.summary}</span>
                    <span className="release-meta"><CountLine release={release} /></span>
                    <span className="release-card-bottom">
                      <span className="card-labels">
                        <span className={`type-pill type-${release.manifest.type}`}>
                          {release.manifest.type === "agent" ? <Bot size={11} /> : <Package size={11} />}{release.manifest.type}
                        </span>
                        <span className="category-pill">{CATEGORY_LABELS[item.category]}</span>
                        <RiskLabel release={release} />
                      </span>
                      <span className="download-count"><Download size={12} aria-hidden="true" /> {numberFormatter.format(release.downloadCount)}</span>
                    </span>
                  </button>
                );
              })}
              {!visibleReleases.length ? (
                <div className="empty-state">
                  <Search size={24} aria-hidden="true" />
                  <strong>No matching releases</strong>
                  <span>Try another topic or a broader search.</span>
                </div>
              ) : null}
            </div>
          </aside>

          <section className="detail-panel" aria-live="polite">
            {selected ? (
              <>
                <button className="mobile-back" type="button" onClick={() => setMobileDetail(false)}>
                  <ArrowLeft size={17} aria-hidden="true" /> Back to library
                </button>
                <div className="detail-scroll">
                  <div className="detail-hero">
                    <div className="detail-title-row">
                      <div>
                        <div className="detail-kicker">
                          <RiskLabel release={selected} />
                          <span className={`type-pill type-${selected.manifest.type}`}>{selected.manifest.type}</span>
                          <span className="category-pill">{CATEGORY_LABELS[selected.manifest.release.category]}</span>
                          <span>v{selected.manifest.release.version}</span>
                          <span>{selected.manifest.release.license}</span>
                        </div>
                        <h2>{selected.manifest.release.name}</h2>
                        <p>{selected.manifest.release.summary}</p>
                      </div>
                      <div className="release-glyph" aria-hidden="true" />
                    </div>
                    <div className="contributor-line">
                      <span>Contributed by {selected.manifest.contributorName ?? "community contributor"}</span>
                      <span>· {shortDate(selected.addedAt)}</span>
                      <span>· <Download size={12} aria-hidden="true" /> {numberFormatter.format(selected.downloadCount)} downloads</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <p className="section-label">What it does</p>
                    <p className="body-copy">{selected.manifest.release.description}</p>
                  </div>

                  <div className="detail-section">
                    <p className="section-label">Capabilities</p>
                    <div className="capability-grid">
                      <div className="capability-card">
                        <Network size={18} aria-hidden="true" />
                        <span><small>Network</small><strong>{selected.manifest.capabilities.networkHosts.length ? selected.manifest.capabilities.networkHosts.join(", ") : "No declared hosts"}</strong></span>
                      </div>
                      <div className="capability-card">
                        <FolderLock size={18} aria-hidden="true" />
                        <span><small>Filesystem</small><strong>{selected.manifest.capabilities.filesystem === "none" ? "No access" : selected.manifest.capabilities.filesystem}</strong></span>
                      </div>
                      <div className="capability-card">
                        <Plug size={18} aria-hidden="true" />
                        <span><small>Tools</small><strong>{selected.manifest.capabilities.mcpServers.length ? `${selected.manifest.capabilities.mcpServers.length} MCP server` : "None"}</strong></span>
                      </div>
                      <div className="capability-card">
                        <TerminalSquare size={18} aria-hidden="true" />
                        <span><small>Executable</small><strong>{capabilitySummary(selected)}</strong></span>
                      </div>
                    </div>
                    {selected.manifest.capabilities.commands.length ? (
                      <div className="command-list">
                        {selected.manifest.capabilities.commands.map((command) => <code key={command}>{command}</code>)}
                      </div>
                    ) : null}
                  </div>

                  <div className="detail-section">
                    <p className="section-label">Before download</p>
                    <div className="checks-list">
                      <CheckRow icon={<ShieldCheck size={18} />} title="Curated catalog record" detail="Public submissions require a GitHub publisher and pinned source commit. Project-owned examples are maintained in this repository." />
                      <CheckRow icon={<Hash size={18} />} title="Exact SHA-256 pinned" detail="A one-byte change blocks the final handoff." />
                      {selected.manifest.type === "agent" ? (
                        <CheckRow icon={<LockKeyhole size={18} />} title="Private state excluded" detail="Memory, source allowlists, remote avatars, credentials, and bundled executable tools are rejected locally." />
                      ) : (
                        <CheckRow icon={<FileArchive size={18} />} title="Archive inspected locally" detail="Paths, expansion size, secrets, commands, MCP tools, and hooks are checked before download." />
                      )}
                      <CheckRow icon={<PackageCheck size={18} />} title="Nothing auto-runs" detail="Agent Hive only hands off verified bytes. Buzz shows the final import review." />
                    </div>
                  </div>

                  <div className="detail-section detail-meta">
                    <div>
                      <p className="section-label">Catalog SHA-256</p>
                      <code>{selected.manifest.artifact.sha256}</code>
                    </div>
                    <div>
                      <p className="section-label">Buzz compatibility</p>
                      <p>{selected.manifest.release.engines.buzz}</p>
                    </div>
                  </div>

                  <div className="usage-note">
                    <Download size={18} aria-hidden="true" />
                    <p><strong>Downloads show activity, not safety.</strong> The count is aggregate only and can be gamed. Always review the local checks and Buzz import preview.</p>
                  </div>
                </div>

                <div className="detail-actions">
                  {selected.manifest.release.homepage ? (
                    <a className="button button-outline" href={selected.manifest.release.homepage} target="_blank" rel="noopener noreferrer">Source <ExternalLink size={14} /></a>
                  ) : null}
                  <button className="button button-dark button-large" type="button" onClick={() => setInstallRelease(selected)}>
                    <Download size={17} aria-hidden="true" /> {selected.manifest.type === "agent" ? "Get agent" : "Review Pack"}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state"><Package size={24} /><strong>Select a release</strong></div>
            )}
          </section>
        </section>

        <section className="how-it-works" aria-labelledby="how-title">
          <div>
            <p className="eyebrow">Built for the Buzz workflow</p>
            <h2 id="how-title">Download first. Trust last.</h2>
            <Link className="guide-link" href="/guide">Read the full export and import guide</Link>
            <Link className="guide-link" href="/contribute">Made an agent? Scan and submit it for review <Upload size={13} /></Link>
          </div>
          <ol>
            <li><span>1</span><div><strong>Choose</strong><p>No account or wallet.</p></div></li>
            <li><span>2</span><div><strong>Verify</strong><p>Exact bytes checked locally.</p></div></li>
            <li><span>3</span><div><strong>Import</strong><p>Review once more in Buzz.</p></div></li>
          </ol>
        </section>
      </main>

      <footer className="site-footer">
        <p>Agent Hive is an independent, login-free catalog for Buzz contributors.</p>
        <a href="https://github.com/fuckbroccoli/buzzhive" target="_blank" rel="noopener noreferrer">Contribute an agent <ExternalLink size={13} /></a>
      </footer>

      <InstallDialog
        key={installRelease?.key ?? "install-closed"}
        release={installRelease}
        onClose={() => setInstallRelease(null)}
        onNotice={setNotice}
        onCounted={updateDownloadCount}
      />

      {notice ? <div className={`notice notice-${notice.tone}`} role="status">{notice.message}</div> : null}
    </div>
  );
}

function toScanView(result: AgentSnapshotScanResult | ArchiveScanResult): ScanView {
  return {
    ok: result.ok,
    sha256: result.sha256,
    hardErrors: result.hardErrors,
    warnings: result.warnings,
    checks: result.checks,
  };
}

function fileNameFromUrl(url: string) {
  try {
    const path = new URL(url, "https://agent-hive.invalid").pathname;
    return decodeURIComponent(path.split("/").pop() ?? "artifact");
  } catch {
    return "artifact";
  }
}

function InstallDialog({
  release,
  onClose,
  onNotice,
  onCounted,
}: {
  release: ReleaseRecord | null;
  onClose(): void;
  onNotice(notice: NoticeState): void;
  onCounted(releaseKey: string, count: number): void;
}) {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [scan, setScan] = useState<ScanView | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [handoffUnderstood, setHandoffUnderstood] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  const inspectBytes = useCallback(async (input: ArrayBuffer, fileName: string) => {
    if (!release) return;
    setBusy(true);
    setBytes(null);
    setScan(null);
    setReviewed(false);
    setHandoffUnderstood(false);
    try {
      const result = release.manifest.type === "agent"
        ? await import("@/lib/snapshot-scan").then(({ scanAgentSnapshot }) => scanAgentSnapshot(input, fileName, {
            sha256: release.manifest.artifact.sha256,
            sizeBytes: release.manifest.artifact.sizeBytes,
            mediaType: release.manifest.artifact.mediaType,
          }))
        : await import("@/lib/archive-scan").then(({ scanBuzzpack }) => scanBuzzpack(input, {
            sha256: release.manifest.artifact.sha256,
            sizeBytes: release.manifest.artifact.sizeBytes,
          }));
      const view = toScanView(result);
      setScan(view);
      if (view.ok) setBytes(new Uint8Array(input.slice(0)));
    } catch (error) {
      setScan({
        ok: false,
        sha256: "",
        hardErrors: [error instanceof Error ? error.message : "Artifact could not be inspected."],
        warnings: [],
        checks: [],
      });
    } finally {
      setBusy(false);
    }
  }, [release]);

  const externalArtifact = Boolean(release && !release.manifest.artifact.url.startsWith("/"));
  const sourceFileName = release ? fileNameFromUrl(release.manifest.artifact.url) : "artifact";

  useEffect(() => {
    if (!release || externalArtifact) return;
    const controller = new AbortController();
    const load = async () => {
      setBusy(true);
      try {
        const response = await fetch(release.manifest.artifact.url, {
          cache: "no-store",
          redirect: "error",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Catalog artifact could not be loaded.");
        const declaredSize = Number(response.headers.get("content-length") ?? 0);
        if (declaredSize && declaredSize !== release.manifest.artifact.sizeBytes) throw new Error("Artifact size does not match the catalog record.");
        const buffer = await response.arrayBuffer();
        await inspectBytes(buffer, sourceFileName);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setScan({
          ok: false,
          sha256: "",
          hardErrors: [error instanceof Error ? error.message : "Catalog artifact could not be loaded."],
          warnings: [],
          checks: [],
        });
        setBusy(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [externalArtifact, inspectBytes, release, sourceFileName]);

  if (!release) return null;
  const type = release.manifest.type;
  const item = release.manifest.release;
  const maxBytes = type === "agent"
    ? release.manifest.artifact.mediaType === "image/png" ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    : 25 * 1024 * 1024;
  const canDownload = Boolean(bytes && scan?.ok && reviewed && handoffUnderstood && !busy);

  const selectFile = async (file?: File) => {
    if (!file) return;
    setSelectedFileName(file.name);
    const lowerName = file.name.toLowerCase();
    const validName = type === "agent"
      ? lowerName.endsWith(".agent.json") || lowerName.endsWith(".agent.png")
      : lowerName.endsWith(".buzzpack");
    if (!validName) {
      setBytes(null);
      setScan({ ok: false, sha256: "", checks: [], warnings: [], hardErrors: [`Choose ${type === "agent" ? "a .agent.json or .agent.png" : "a .buzzpack"} file.`] });
      return;
    }
    if (file.size < 1 || file.size > maxBytes) {
      setBytes(null);
      setScan({ ok: false, sha256: "", checks: [], warnings: [], hardErrors: [`Artifact must be between 1 byte and ${maxBytes / 1024 / 1024} MiB.`] });
      return;
    }
    await inspectBytes(await file.arrayBuffer(), file.name);
  };

  const download = async () => {
    if (!bytes || !scan?.ok) return;
    setBusy(true);
    const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: release.manifest.artifact.mediaType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    const extension = type === "pack" ? ".buzzpack" : release.manifest.artifact.mediaType === "image/png" ? ".agent.png" : ".agent.json";
    link.download = `${item.id}-${item.version}${extension}`.replace(/[^a-zA-Z0-9._-]/g, "-");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    try {
      const response = await fetch("/api/downloads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ releaseKey: release.key }),
      });
      const data = await response.json() as { downloadCount?: number };
      if (response.ok && Number.isFinite(data.downloadCount)) onCounted(release.key, Number(data.downloadCount));
    } catch {
      // The verified file handoff remains useful when the aggregate counter is offline.
    }

    onNotice({
      tone: "success",
      message: type === "agent"
        ? "Verified Agent downloaded. Drag it into Buzz Desktop's Agents page."
        : "Verified Pack downloaded. Agent Hive did not execute it.",
    });
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={Boolean(release)} onClose={onClose} title={type === "agent" ? "Get verified agent" : "Review Pack"} eyebrow={`${item.name} · v${item.version}`} wide>
      <div className="install-layout">
        <div className="install-main">
          <div className="install-principle">
            <ShieldCheck size={21} aria-hidden="true" />
            <div>
              <strong>{type === "agent" ? "Import behavior, not identity" : "Review before enabling"}</strong>
              <p>{type === "agent" ? "Agent Hive verifies the snapshot. Buzz Desktop previews it and creates a fresh private identity on import." : "Agent Hive verifies and hands off exact bytes. Hooks and tools remain a separate Buzz decision."}</p>
            </div>
          </div>

          {externalArtifact || (scan && !scan.ok) ? (
            <div className="external-artifact-step">
              {externalArtifact ? (
                <a className="button button-outline" href={release.manifest.artifact.url} target="_blank" rel="noopener noreferrer">Download source file <ExternalLink size={14} /></a>
              ) : null}
              <label className="file-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void selectFile(event.dataTransfer.files[0]); }}>
                <input type="file" accept={type === "agent" ? ".agent.json,.agent.png,application/json,image/png" : ".buzzpack,application/zip"} onChange={(event) => void selectFile(event.target.files?.[0])} />
                {type === "agent" ? <Bot size={22} aria-hidden="true" /> : <FileArchive size={22} aria-hidden="true" />}
                <span>
                  <strong>{selectedFileName || `Select ${sourceFileName}`}</strong>
                  <small>{externalArtifact ? "External URLs are never fetched automatically." : "Choose the catalog file to retry local verification."}</small>
                </span>
              </label>
            </div>
          ) : null}

          {busy && !scan ? <div className="scan-progress" role="status"><span className="spinner" /> Verifying exact bytes without executing them…</div> : null}

          {scan ? (
            <div className="scan-results">
              {scan.checks.map((check) => <CheckRow key={check} icon={<Check size={17} />} title={check} detail="Computed locally in this browser." />)}
              {scan.warnings.map((warning) => <CheckRow key={warning} icon={<AlertTriangle size={17} />} title="Review required" detail={warning} tone="warn" />)}
              {scan.hardErrors.map((error) => <CheckRow key={error} icon={<X size={17} />} title="Download blocked" detail={error} tone="block" />)}
            </div>
          ) : null}

          {scan?.ok ? (
            <div className="review-confirmations">
              <label>
                <input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />
                <span><strong>{type === "agent" ? "I reviewed the snapshot checks." : "I reviewed every declared capability."}</strong><small>{type === "agent" ? "Static checks reduce risk but cannot prove instructions are benign." : `${capabilitySummary(release)} · filesystem: ${release.manifest.capabilities.filesystem}`}</small></span>
              </label>
              <label>
                <input type="checkbox" checked={handoffUnderstood} onChange={(event) => setHandoffUnderstood(event.target.checked)} />
                <span><strong>{type === "agent" ? "I will review the Buzz import preview." : "I understand download and execution are separate."}</strong><small>{type === "agent" ? "Agents page → drop file → review preview → import." : "Keep hooks and MCP tools off until separately approved in Buzz."}</small></span>
              </label>
            </div>
          ) : null}
        </div>

        <aside className="install-sidebar">
          <p className="section-label">{type === "agent" ? "Snapshot policy" : "This version requests"}</p>
          <dl className="request-list">
            <div><dt>{type === "agent" ? "Memory" : "Network"}</dt><dd>{type === "agent" ? "Excluded" : release.manifest.capabilities.networkHosts.length ? release.manifest.capabilities.networkHosts.join(", ") : "None"}</dd></div>
            <div><dt>{type === "agent" ? "Identity" : "Filesystem"}</dt><dd>{type === "agent" ? "Fresh on import" : release.manifest.capabilities.filesystem}</dd></div>
            <div><dt>{type === "agent" ? "Bundled tools" : "MCP tools"}</dt><dd>{type === "agent" ? "None" : release.manifest.capabilities.mcpServers.length}</dd></div>
            <div><dt>{type === "agent" ? "Source allowlist" : "Hooks"}</dt><dd>{type === "agent" ? "Excluded" : release.manifest.capabilities.hooks.length}</dd></div>
            <div><dt>Auto-run</dt><dd>Off</dd></div>
          </dl>
          <div className="digest-box"><span>Catalog SHA-256</span><code>{release.manifest.artifact.sha256}</code></div>
          {type === "pack" ? <div className="digest-box"><span>Optional CLI review</span><code>buzz pack inspect &lt;file.buzzpack&gt;</code></div> : null}
        </aside>
      </div>
      <div className="dialog-footer dialog-footer-install">
        <p><strong>{type === "agent" ? "Verify → download → drag into Buzz Desktop." : "Verify → download → import stopped."}</strong><br />No account, identity signature, or background install.</p>
        <button className="button button-dark button-large" type="button" disabled={!canDownload} onClick={() => void download()}>
          <Download size={17} aria-hidden="true" /> {busy ? "Finishing…" : `Download verified ${type === "agent" ? "agent" : "Pack"}`}
        </button>
      </div>
    </Dialog>
  );
}

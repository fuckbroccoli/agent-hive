"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Check,
  Download,
  ExternalLink,
  FolderLock,
  Hash,
  LockKeyhole,
  Network,
  PackageCheck,
  Plug,
  Search,
  ShieldCheck,
  TerminalSquare,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { AgentSnapshotScanResult } from "@/lib/snapshot-scan";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { AGENT_CATEGORIES, type AgentCategory, type AgentHarness, type ReleaseRecord } from "@/lib/hive-contract";

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
const GITHUB_REPOSITORY = "https://github.com/promptprobe/hivebuzz";
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
const HARNESS_LABELS: Record<AgentHarness, string> = {
  codex: "Codex",
  claude: "Claude Code",
  goose: "Goose",
  "buzz-agent": "Buzz Agent",
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
  return <span>{release.manifest.contents.agents} agent · no memory · no bundled tools</span>;
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
  const [releases, setReleases] = useState(initialReleases);
  const [selectedKey, setSelectedKey] = useState(initialReleases[0]?.key ?? "");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | AgentCategory>("all");
  const [mobileDetail, setMobileDetail] = useState(false);
  const [installRelease, setInstallRelease] = useState<ReleaseRecord | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [categoryDragging, setCategoryDragging] = useState(false);
  const catalogRef = useRef<HTMLElement>(null);
  const categoryDragRef = useRef({ pointerId: -1, startX: 0, scrollLeft: 0, moved: false, suppressClick: false });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/releases", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json() as Promise<{ releases?: ReleaseRecord[] }>)
      .then((data) => {
        if (!data.releases?.length) return;
        setReleases(data.releases);
        setSelectedKey((current) => data.releases?.some((release) => release.key === current)
          ? current
          : data.releases?.[0]?.key ?? "");
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
        if (category !== "all" && release.manifest.release.category !== category) return false;
        if (!normalized) return true;
        const item = release.manifest.release;
        const capabilities = release.manifest.capabilities;
        return [
          item.name,
          item.summary,
          item.description,
          item.license,
          CATEGORY_LABELS[item.category],
          release.manifest.contributorName ?? "",
          capabilities.filesystem,
          ...item.keywords,
          ...capabilities.networkHosts,
          ...capabilities.commands,
          ...capabilities.mcpServers.flatMap((server) => [server.name, server.transport, server.access]),
          ...capabilities.hooks.flatMap((hook) => [hook.phase, hook.command]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => b.addedAt - a.addedAt);
  }, [category, query, releases]);

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

  const openSearchResults = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCategory("all");
    setMobileDetail(false);
    requestAnimationFrame(() => catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const startCategoryDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    categoryDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      moved: false,
      suppressClick: false,
    };
  };

  const moveCategoryDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = categoryDragRef.current;
    if (event.pointerId !== drag.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      setCategoryDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.scrollLeft - delta;
  };

  const finishCategoryDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = categoryDragRef.current;
    if (event.pointerId !== drag.pointerId) return;
    if (drag.moved) drag.suppressClick = true;
    drag.pointerId = -1;
    setCategoryDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="site-shell">
      <header className="hero-skin home-skin" id="top">
        <SiteNav current="home" />
        <section className="intro">
          <div>
            <p className="eyebrow">Open Buzz agent library</p>
            <h1>Bring better<br />agents to Buzz</h1>
          </div>
          <div className="intro-copy">
            <p>Portable Buzz agents. Verify exact bytes in your browser. Drag a stopped copy into Buzz Desktop</p>
            <div className="principles" aria-label="HiveBuzz principles">
              <span><LockKeyhole size={15} aria-hidden="true" /> No login</span>
              <span><ShieldCheck size={15} aria-hidden="true" /> Local verification</span>
              <span><PackageCheck size={15} aria-hidden="true" /> No auto-run</span>
            </div>
          </div>
          <form className="hero-search" role="search" onSubmit={openSearchResults}>
            <Search size={22} aria-hidden="true" />
            <label className="sr-only" htmlFor="hero-agent-search">Search HiveBuzz agents</label>
            <input
              id="hero-agent-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search agents or capabilities"
              autoComplete="off"
            />
            {query ? <button className="hero-search-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button> : null}
            <button className="hero-search-submit" type="submit">Search</button>
          </form>
        </section>
      </header>

      <main>
        <section ref={catalogRef} className={`hive-workspace ${mobileDetail ? "show-detail" : "show-list"}`} aria-label="Buzz agent library">
          <aside className="catalog-panel">
            <div className="catalog-tools">
              <div className="catalog-heading"><Bot size={16} aria-hidden="true" /><strong>Agents</strong></div>
              <div
                className={`category-filter ${categoryDragging ? "dragging" : ""}`}
                aria-label="Agent category"
                onPointerDown={startCategoryDrag}
                onPointerMove={moveCategoryDrag}
                onPointerUp={finishCategoryDrag}
                onPointerCancel={finishCategoryDrag}
                onClickCapture={(event) => {
                  if (!categoryDragRef.current.suppressClick) return;
                  categoryDragRef.current.suppressClick = false;
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <button type="button" className={category === "all" ? "active" : ""} onClick={() => setCategory("all")} aria-pressed={category === "all"}>All topics</button>
                {AGENT_CATEGORIES.map((item) => (
                  <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{CATEGORY_LABELS[item]}</button>
                ))}
              </div>
              <label className="search-box">
                <Search size={17} aria-hidden="true" />
                <span className="sr-only">Search agents</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search agents" />
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
                    <span className="release-runtime">{HARNESS_LABELS[item.recommendedHarness]} · {item.recommendedModel}</span>
                    <span className="release-meta"><CountLine release={release} /></span>
                    <span className="release-card-bottom">
                      <span className="card-labels">
                        <span className="type-pill type-agent"><Bot size={11} />agent</span>
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
                          <span className="type-pill type-agent">agent</span>
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

                  <div className="detail-section recommended-runtime">
                    <p className="section-label">Recommended runtime</p>
                    <div><span>Agent harness</span><strong>{HARNESS_LABELS[selected.manifest.release.recommendedHarness]}</strong></div>
                    <div><span>Model</span><strong>{selected.manifest.release.recommendedModel}</strong></div>
                    <small>Recommendation only. HiveBuzz does not install a harness, select credentials, or enforce a model.</small>
                  </div>

                  <div className="detail-section">
                    <p className="section-label">Before download</p>
                    <div className="checks-list">
                      <CheckRow icon={<ShieldCheck size={18} />} title="Curated catalog record" detail="Public submissions require a GitHub publisher and pinned source commit. Project-owned examples are maintained in this repository." />
                      <CheckRow icon={<Hash size={18} />} title="Exact SHA-256 pinned" detail="A one-byte change blocks the final handoff." />
                      <CheckRow icon={<LockKeyhole size={18} />} title="Private state excluded" detail="Memory, source allowlists, remote avatars, credentials, and bundled executable tools are rejected locally." />
                      <CheckRow icon={<PackageCheck size={18} />} title="Nothing auto-runs" detail="HiveBuzz only hands off verified bytes. Buzz shows the final import review." />
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
                  <a className="button button-ghost withdraw-link" href={`${GITHUB_REPOSITORY}/issues/new?template=agent-withdrawal.yml&title=${encodeURIComponent(`Withdraw agent: ${selected.manifest.release.name} v${selected.manifest.release.version}`)}`} target="_blank" rel="noopener noreferrer">Withdraw</a>
                  {selected.manifest.release.homepage ? (
                    <a className="button button-outline" href={selected.manifest.release.homepage} target="_blank" rel="noopener noreferrer">Source <ExternalLink size={14} /></a>
                  ) : null}
                  <button className="button button-dark button-large" type="button" onClick={() => setInstallRelease(selected)}>
                    <Download size={17} aria-hidden="true" /> Get agent
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state"><Bot size={24} /><strong>Select an agent</strong></div>
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

      <SiteFooter />

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

function toScanView(result: AgentSnapshotScanResult): ScanView {
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
    const path = new URL(url, "https://hivebuzz.invalid").pathname;
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
      const result = await import("@/lib/snapshot-scan").then(({ scanAgentSnapshot }) => scanAgentSnapshot(input, fileName, {
        sha256: release.manifest.artifact.sha256,
        sizeBytes: release.manifest.artifact.sizeBytes,
        mediaType: release.manifest.artifact.mediaType,
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
  const item = release.manifest.release;
  const maxBytes = release.manifest.artifact.mediaType === "image/png" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  const canDownload = Boolean(bytes && scan?.ok && reviewed && handoffUnderstood && !busy);

  const selectFile = async (file?: File) => {
    if (!file) return;
    setSelectedFileName(file.name);
    const lowerName = file.name.toLowerCase();
    const validName = lowerName.endsWith(".agent.json") || lowerName.endsWith(".agent.png");
    if (!validName) {
      setBytes(null);
      setScan({ ok: false, sha256: "", checks: [], warnings: [], hardErrors: ["Choose a .agent.json or .agent.png file."] });
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
    const extension = release.manifest.artifact.mediaType === "image/png" ? ".agent.png" : ".agent.json";
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
      message: "Verified Agent downloaded. Drag it into Buzz Desktop's Agents page.",
    });
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={Boolean(release)} onClose={onClose} title="Get verified agent" eyebrow={`${item.name} · v${item.version}`} wide>
      <div className="install-layout">
        <div className="install-main">
          <div className="install-principle">
            <ShieldCheck size={21} aria-hidden="true" />
            <div>
              <strong>Import behavior, not identity</strong>
              <p>HiveBuzz verifies the snapshot. Buzz Desktop previews it and creates a fresh private identity on import.</p>
            </div>
          </div>

          {externalArtifact || (scan && !scan.ok) ? (
            <div className="external-artifact-step">
              {externalArtifact ? (
                <a className="button button-outline" href={release.manifest.artifact.url} target="_blank" rel="noopener noreferrer">Download source file <ExternalLink size={14} /></a>
              ) : null}
              <label className="file-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void selectFile(event.dataTransfer.files[0]); }}>
                <input type="file" accept=".agent.json,.agent.png,application/json,image/png" onChange={(event) => void selectFile(event.target.files?.[0])} />
                <Bot size={22} aria-hidden="true" />
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
                <span><strong>I reviewed the snapshot checks.</strong><small>Static checks reduce risk but cannot prove instructions are benign.</small></span>
              </label>
              <label>
                <input type="checkbox" checked={handoffUnderstood} onChange={(event) => setHandoffUnderstood(event.target.checked)} />
                <span><strong>I will review the Buzz import preview.</strong><small>Agents page → drop file → review preview → import.</small></span>
              </label>
            </div>
          ) : null}
        </div>

        <aside className="install-sidebar">
          <p className="section-label">Snapshot policy</p>
          <dl className="request-list">
            <div><dt>Memory</dt><dd>Excluded</dd></div>
            <div><dt>Identity</dt><dd>Fresh on import</dd></div>
            <div><dt>Bundled tools</dt><dd>None</dd></div>
            <div><dt>Source allowlist</dt><dd>Excluded</dd></div>
            <div><dt>Auto-run</dt><dd>Off</dd></div>
          </dl>
          <div className="digest-box"><span>Catalog SHA-256</span><code>{release.manifest.artifact.sha256}</code></div>
        </aside>
      </div>
      <div className="dialog-footer dialog-footer-install">
        <p><strong>Verify → download → drag into Buzz Desktop.</strong><br />No account, identity signature, or background install.</p>
        <button className="button button-dark button-large" type="button" disabled={!canDownload} onClick={() => void download()}>
          <Download size={17} aria-hidden="true" /> {busy ? "Finishing…" : "Download verified agent"}
        </button>
      </div>
    </Dialog>
  );
}

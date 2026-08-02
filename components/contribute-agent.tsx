"use client";

import {
  BookOpen,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileJson,
  GitPullRequest,
  LockKeyhole,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { useState } from "react";
import { AGENT_CATEGORIES, type AgentCategory } from "@/lib/hive-contract";
import type { AgentSnapshotScanResult } from "@/lib/snapshot-scan";

const GITHUB_REPOSITORY = "https://github.com/fuckbroccoli/hivebuzz";
const MAX_SNAPSHOT_BYTES = 10 * 1024 * 1024;

interface SelectedSnapshot {
  name: string;
  size: number;
}

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

function validGithubHandle(value: string) {
  const handle = value.trim().replace(/^@/, "");
  return /^[A-Za-z0-9-]{1,39}$/.test(handle)
    && !handle.startsWith("-")
    && !handle.endsWith("-")
    && !handle.includes("--");
}

function validSourceUrl(value: string) {
  try {
    const url = new URL(value);
    const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    return url.protocol === "https:"
      && url.hostname === "github.com"
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
      && parts.length === 2
      && parts.every((part) => /^[A-Za-z0-9._-]+$/.test(part));
  } catch {
    return false;
  }
}

export function ContributeAgent() {
  const [selected, setSelected] = useState<SelectedSnapshot | null>(null);
  const [scan, setScan] = useState<AgentSnapshotScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState("1.0.0");
  const [license, setLicense] = useState("MIT");
  const [category, setCategory] = useState<AgentCategory>("research");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceCommit, setSourceCommit] = useState("");
  const [publisherGithub, setPublisherGithub] = useState("");

  const fieldsValid = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)
    && validSourceUrl(sourceUrl)
    && /^[a-f0-9]{40}$/i.test(sourceCommit.trim())
    && validGithubHandle(publisherGithub);
  const ready = Boolean(scan?.ok && scan.suggested && fieldsValid);

  const issueUrl = (() => {
    const name = scan?.suggested?.name ?? "Buzz agent";
    const params = new URLSearchParams({
      template: "agent-submission.yml",
      title: `Agent submission: ${name} v${version}`,
    });
    return `${GITHUB_REPOSITORY}/issues/new?${params.toString()}`;
  })();

  const inspect = async (file?: File) => {
    if (!file) return;
    setSelected({ name: file.name, size: file.size });
    setScan(null);
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".agent.json") && !lowerName.endsWith(".agent.png")) {
      setScan({ ok: false, sha256: "", hardErrors: ["Choose a .agent.json or .agent.png file."], warnings: [], checks: [], sourceFormat: null, snapshot: null, suggested: null });
      return;
    }
    if (file.size < 1 || file.size > MAX_SNAPSHOT_BYTES) {
      setScan({ ok: false, sha256: "", hardErrors: ["Snapshot must be between 1 byte and 10 MiB."], warnings: [], checks: [], sourceFormat: null, snapshot: null, suggested: null });
      return;
    }
    setBusy(true);
    try {
      const { scanAgentSnapshot } = await import("@/lib/snapshot-scan");
      setScan(await scanAgentSnapshot(await file.arrayBuffer(), file.name));
    } catch (error) {
      setScan({
        ok: false,
        sha256: "",
        hardErrors: [error instanceof Error ? error.message : "The snapshot could not be inspected."],
        warnings: [],
        checks: [],
        sourceFormat: null,
        snapshot: null,
        suggested: null,
      });
    } finally {
      setBusy(false);
    }
  };

  const downloadReceipt = () => {
    if (!ready || !scan?.suggested || !selected) return;
    const receipt = {
      schema: "agent-hive-submission/v2",
      createdAt: new Date().toISOString(),
      artifact: {
        fileName: selected.name,
        sizeBytes: selected.size,
        sha256: scan.sha256,
        sourceFormat: scan.sourceFormat,
      },
      release: {
        ...scan.suggested,
        version,
        license,
        category,
        sourceUrl,
      },
      publisher: {
        github: publisherGithub.trim().replace(/^@/, ""),
        sourceRepository: sourceUrl,
        sourceCommit: sourceCommit.trim().toLowerCase(),
        verification: "github-issue-author-and-source-commit",
      },
      scan: {
        checks: scan.checks,
        warnings: scan.warnings,
      },
    };
    const blob = new Blob([JSON.stringify(receipt, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${scan.suggested.id.replace(/[^a-zA-Z0-9._-]/g, "-")}-submission.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="site-shell guide-shell">
      <header className="hero-skin submit-skin">
        <div className="topbar skin-topbar">
          <Link className="brand" href="/" aria-label="HiveBuzz home">
            <span className="brand-mark" aria-hidden="true" />
            <span>hivebuzz</span>
          </Link>
          <nav className="topbar-actions" aria-label="Primary navigation">
            <a className="button button-ghost" href="https://buzz.xyz" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Buzz</a>
            <Link className="button button-ghost" href="/guide"><BookOpen size={16} aria-hidden="true" /> Export guide</Link>
          </nav>
        </div>
        <section className="subpage-hero contribute-hero">
          <div>
            <p className="eyebrow">Contribute to Agent Hive</p>
            <h1>Register your<br />Buzz agent.</h1>
          </div>
          <p>Downloads stay account-free. To register, prove control through a public GitHub account and one pinned source commit. Agent Hive never receives the file from this page.</p>
        </section>
      </header>

      <main className="contribute-main">
        <section className="contribution-boundary" aria-label="Submission security boundary">
          <div><LockKeyhole size={20} /><span><strong>Public GitHub identity</strong>The issue author must match the declared publisher. No Nostr or Buzz key is requested.</span></div>
          <div><ShieldCheck size={20} /><span><strong>Local scan first</strong>The selected file never leaves this browser.</span></div>
          <div><GitPullRequest size={20} /><span><strong>Pinned source review</strong>Publication requires a reviewable repository, full commit SHA, and human approval.</span></div>
        </section>

        <div className="contribute-grid">
          <section className="contribute-card" aria-labelledby="scan-title">
            <div className="contribute-card-heading">
              <span>1</span>
              <div><p className="eyebrow">Private to this browser</p><h2 id="scan-title">Scan your snapshot</h2></div>
            </div>
            <label className="contribute-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void inspect(event.dataTransfer.files[0]); }}>
              <input type="file" accept=".agent.json,.agent.png,application/json,image/png" onChange={(event) => void inspect(event.target.files?.[0])} />
              <Upload size={24} aria-hidden="true" />
              <strong>{selected?.name ?? "Choose a Buzz Agent Snapshot"}</strong>
              <span>{selected ? `${selected.size.toLocaleString()} bytes` : ".agent.json recommended · .agent.png supported · 10 MiB max"}</span>
            </label>
            {busy ? <p className="scan-status">Inspecting exact bytes…</p> : null}
            {scan ? (
              <div className={`submission-scan ${scan.ok ? "submission-scan-ok" : "submission-scan-block"}`}>
                <h3>{scan.ok ? <><Check size={17} /> Local checks passed</> : <><X size={17} /> Submission blocked</>}</h3>
                {(scan.ok ? scan.checks : scan.hardErrors).map((message) => <p key={message}>{message}</p>)}
                {scan.sha256 ? <code>{scan.sha256}</code> : null}
              </div>
            ) : null}
          </section>

          <section className="contribute-card" aria-labelledby="details-title">
            <div className="contribute-card-heading">
              <span>2</span>
              <div><p className="eyebrow">Public listing details</p><h2 id="details-title">Describe the release</h2></div>
            </div>
            <div className="contribute-form">
              <label><span>Agent name</span><input value={scan?.suggested?.name ?? ""} readOnly placeholder="Read from a passing snapshot" /></label>
              <div className="form-pair">
                <label><span>Version</span><input value={version} onChange={(event) => setVersion(event.target.value)} inputMode="text" /></label>
                <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as AgentCategory)}>{AGENT_CATEGORIES.map((item) => <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>)}</select></label>
              </div>
              <label><span>License</span><select value={license} onChange={(event) => setLicense(event.target.value)}><option>MIT</option><option>Apache-2.0</option><option>CC0-1.0</option></select></label>
              <label><span>GitHub handle</span><input value={publisherGithub} onChange={(event) => setPublisherGithub(event.target.value)} maxLength={40} autoComplete="username" placeholder="your-github-handle" /></label>
              <label><span>Public source repository</span><input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://github.com/you/your-agent" /></label>
              <label><span>Source commit</span><input value={sourceCommit} onChange={(event) => setSourceCommit(event.target.value)} maxLength={40} spellCheck={false} placeholder="40-character Git commit SHA" /></label>
              <p className="form-note">Open the GitHub request with the declared account. Reviewers verify the exact commit and artifact hash. Organization-owned repositories also need an approving organization maintainer.</p>
            </div>
          </section>
        </div>

        <section className="submission-finish" aria-labelledby="submit-title">
          <div>
            <p className="eyebrow">Step 3 · human review</p>
            <h2 id="submit-title">Open the registration request</h2>
            <p>Download the scan receipt, then open GitHub with the declared publisher account and attach both the original snapshot and receipt. A maintainer verifies the issue author, pinned commit, bytes, license, and listing before publication.</p>
          </div>
          <div className="submission-actions">
            <button className="button button-outline button-large" type="button" onClick={downloadReceipt} disabled={!ready}>
              <Download size={16} /> Download receipt
            </button>
            <a className={`button button-dark button-large ${ready ? "" : "button-disabled"}`} href={ready ? issueUrl : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!ready} onClick={(event) => { if (!ready) event.preventDefault(); }}>
              <ExternalLink size={16} /> Open GitHub request
            </a>
          </div>
        </section>

        <section className="submission-notes">
          <div><FileJson size={19} /><p><strong>Open downloads</strong>Anyone can browse and download. Only publishing needs a public GitHub identity.</p></div>
          <div><ClipboardCheck size={19} /><p><strong>Pull-request path</strong>Technical contributors can follow <a href={`${GITHUB_REPOSITORY}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">CONTRIBUTING.md</a>.</p></div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

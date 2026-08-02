import {
  AlertTriangle,
  Bot,
  Check,
  Download,
  ExternalLink,
  FileJson,
  KeyRound,
  LockKeyhole,
  MonitorDown,
  PackageCheck,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

const exportSteps = [
  ["Open Agents", "In Buzz Desktop, open Agents from the left sidebar."],
  ["Choose Share", "Open the ··· menu on the agent you made, then choose Share."],
  ["Open Export Agent", "Select Export Agent at the bottom. Share to catalog is separate from HiveBuzz and can stay off."],
  ["Choose Agent only", "Set Memories to Agent only. Never publish core memory or all memories."],
  ["Save as JSON", "JSON is the reviewable default. Select Export and save the .agent.json file."],
] as const;

const importSteps = [
  ["Choose an agent", "Select an agent in HiveBuzz and choose Get agent."],
  ["Review the local scan", "Check SHA-256, size, memory, remote-avatar, allowlist, and secret results."],
  ["Download verified bytes", "Confirm both safety acknowledgements, then download the .agent.json or .agent.png file."],
  ["Drop it into Buzz", "Drag the file onto Buzz Desktop's Agents page."],
  ["Review Buzz's preview", "Confirm no memory, a fresh keypair, and a cleared respond-to allowlist before importing."],
  ["Inspect while stopped", "The copy receives a new identity. Review its model and full system prompt before starting it."],
] as const;

function StepList({ steps }: { steps: ReadonlyArray<readonly [string, string]> }) {
  return (
    <ol className="guide-steps">
      {steps.map(([title, detail], index) => (
        <li key={title}>
          <span>{index + 1}</span>
          <div><strong>{title}</strong><p>{detail}</p></div>
        </li>
      ))}
    </ol>
  );
}

export function SnapshotGuide() {
  return (
    <div className="site-shell guide-shell">
      <header className="hero-skin guide-skin">
        <div className="topbar skin-topbar">
          <Link className="brand" href="/" aria-label="HiveBuzz home">
            <span className="brand-mark" aria-hidden="true" />
            <span>hivebuzz</span>
          </Link>
          <nav className="topbar-actions" aria-label="Primary navigation">
            <a className="button button-ghost" href="https://buzz.xyz" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Buzz</a>
            <Link className="button button-ghost" href="/contribute"><Upload size={16} aria-hidden="true" /> Submit</Link>
          </nav>
        </div>
        <section className="subpage-hero guide-hero">
          <div>
            <p className="eyebrow">Buzz Agent Snapshot guide</p>
            <h1>Export safely.<br />Import deliberately.</h1>
          </div>
          <div className="guide-hero-copy">
            <p>Download first. Trust last.</p>
            <span>Get the file, verify it on your device, then make the final decision inside Buzz.</span>
          </div>
        </section>
      </header>

      <main className="guide-main">
        <section className="safety-banner" aria-labelledby="safe-default-title">
          <ShieldCheck size={26} aria-hidden="true" />
          <div>
            <p className="eyebrow">Safe default for public sharing</p>
            <h2 id="safe-default-title">Agent only + JSON</h2>
            <p>A public snapshot should never contain memory. JSON lets you inspect the complete file and compare changes before sharing.</p>
          </div>
          <div className="safety-chips" aria-label="Safe defaults">
            <span><Check size={14} /> No memory</span>
            <span><Check size={14} /> Fresh identity</span>
            <span><Check size={14} /> Clear allowlist</span>
            <span><Check size={14} /> No auto-run</span>
          </div>
        </section>

        <div className="guide-grid">
          <section className="guide-card" aria-labelledby="export-title">
            <div className="guide-card-heading">
              <span className="guide-icon"><Upload size={20} aria-hidden="true" /></span>
              <div><p className="eyebrow">From your Buzz</p><h2 id="export-title">Export an agent</h2></div>
            </div>
            <div className="path-strip" aria-label="Export menu path">
              Agents <span>→</span> ··· <span>→</span> Share <span>→</span> Export Agent
            </div>
            <StepList steps={exportSteps} />
          </section>

          <section className="guide-card" aria-labelledby="import-title">
            <div className="guide-card-heading">
              <span className="guide-icon"><Download size={20} aria-hidden="true" /></span>
              <div><p className="eyebrow">From HiveBuzz to Buzz</p><h2 id="import-title">Import an agent</h2></div>
            </div>
            <div className="path-strip" aria-label="Import path">
              HiveBuzz <span>→</span> Verify <span>→</span> Download <span>→</span> Drop into Agents
            </div>
            <StepList steps={importSteps} />
          </section>
        </div>

        <section className="guide-review" aria-labelledby="review-title">
          <div className="guide-review-heading">
            <p className="eyebrow">Before selecting Import</p>
            <h2 id="review-title">Stop here and check the preview.</h2>
            <p>Static checks reduce risk. They cannot prove that an agent’s instructions are benign.</p>
          </div>
          <div className="review-columns">
            <div className="review-column review-good">
              <h3><Check size={17} /> Expected state</h3>
              <ul>
                <li><strong>No memory included</strong><span>The preview shows zero memory entries.</span></li>
                <li><strong>Fresh keypair</strong><span>The original identity does not move with the file.</span></li>
                <li><strong>Clear allowlist</strong><span>No source-environment response allowlist is retained.</span></li>
                <li><strong>Stopped by default</strong><span>You can inspect the imported copy before it runs.</span></li>
              </ul>
            </div>
            <div className="review-column review-stop">
              <h3><X size={17} /> Cancel signals</h3>
              <ul>
                <li><strong>Memory entries appear</strong><span>The file contains plaintext memory. Do not publish or import it.</span></li>
                <li><strong>Keep allowlist is selected</strong><span>Choose Clear or cancel the import.</span></li>
                <li><strong>Unexpected tools or settings</strong><span>Stop if the prompt, runtime, or model differs from the listing.</span></li>
                <li><strong>The file scan fails</strong><span>Never bypass a hash or size mismatch. Get a clean copy.</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="privacy-section" aria-labelledby="privacy-title">
          <div>
            <p className="eyebrow">HiveBuzz security boundary</p>
            <h2 id="privacy-title">What the site never does</h2>
          </div>
          <div className="privacy-grid">
            <div><LockKeyhole size={20} /><strong>No login or signing</strong><p>No Nostr key, private key, wallet, or HiveBuzz account is required.</p></div>
            <div><MonitorDown size={20} /><strong>No background install</strong><p>The site cannot access your Buzz session or import a file automatically.</p></div>
            <div><PackageCheck size={20} /><strong>No auto-run</strong><p>Verified files remain stopped data. You decide what runs inside Buzz.</p></div>
            <div><KeyRound size={20} /><strong>No personal download log</strong><p>Only an aggregate release count is stored—never a user, key, cookie, device, or per-download event.</p></div>
          </div>
        </section>

        <section className="guide-notes" aria-labelledby="notes-title">
          <div className="guide-note guide-note-warn">
            <AlertTriangle size={20} aria-hidden="true" />
            <div><h2 id="notes-title">Do not use downloads as a trust score.</h2><p>Counts show activity and can be gamed. They never replace hash verification or Buzz’s import preview.</p></div>
          </div>
          <div className="guide-note">
            <FileJson size={20} aria-hidden="true" />
            <div><h2>Can I export from the CLI?</h2><p>The supported Agent Snapshot export path is currently Buzz Desktop. <code>buzz pack inspect</code> reviews Persona Packs; it does not export Agent Snapshots.</p></div>
          </div>
          <div className="guide-note">
            <Bot size={20} aria-hidden="true" />
            <div><h2>Is PNG safe?</h2><p>HiveBuzz restricts PNG metadata to the Buzz snapshot channel and rejects memory-bearing payloads. JSON remains the better public-review format.</p></div>
          </div>
        </section>

        <div className="guide-cta">
          <div><p className="eyebrow">Made an agent?</p><h2>Scan it locally, then submit it for review.</h2></div>
          <Link className="button button-dark button-large" href="/contribute"><Upload size={17} aria-hidden="true" /> Submit an agent</Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

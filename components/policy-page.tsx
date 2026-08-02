import { ArrowLeft, BookOpen, Compass, Upload } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

interface PolicySection {
  title: string;
  content: ReactNode;
}

interface PolicyPageProps {
  eyebrow: string;
  title: string;
  summary: string;
  sections: PolicySection[];
}

export function PolicyPage({ eyebrow, title, summary, sections }: PolicyPageProps) {
  return (
    <div className="site-shell policy-shell">
      <header className="policy-header">
        <div className="topbar">
          <Link className="brand" href="/" aria-label="HiveBuzz home">
            <span className="brand-mark" aria-hidden="true" />
            <span>hivebuzz</span>
            <small>.xyz · for Buzz</small>
          </Link>
          <nav className="topbar-actions" aria-label="Primary navigation">
            <Link className="button button-ghost" href="/#explore"><Compass size={16} aria-hidden="true" /> Explore</Link>
            <Link className="button button-ghost" href="/guide"><BookOpen size={16} aria-hidden="true" /> Export guide</Link>
            <Link className="button button-dark" href="/contribute"><Upload size={16} aria-hidden="true" /> Submit agent</Link>
          </nav>
        </div>
      </header>

      <main className="policy-main">
        <Link className="policy-back" href="/"><ArrowLeft size={15} aria-hidden="true" /> Back to library</Link>
        <div className="policy-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{summary}</p>
          <span>Effective 2026-08-02</span>
        </div>
        <div className="policy-sections">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <div>{section.content}</div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

import { BookOpen, ExternalLink, Upload } from "lucide-react";
import Link from "next/link";

interface SiteNavProps {
  current?: "home" | "guide" | "contribute";
}

export function SiteNav({ current = "home" }: SiteNavProps) {
  return (
    <div className="topbar skin-topbar">
      <Link className="brand" href="/" aria-label="HiveBuzz home" aria-current={current === "home" ? "page" : undefined}>
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">hivebuzz</span>
      </Link>
      <nav className="topbar-actions" aria-label="Primary navigation">
        <a className="button button-ghost" href="https://buzz.xyz" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} aria-hidden="true" />
          <span>Buzz</span>
        </a>
        <Link className="button button-ghost" href="/guide" aria-current={current === "guide" ? "page" : undefined}>
          <BookOpen size={16} aria-hidden="true" />
          <span>Guide</span>
        </Link>
        <Link className="button button-dark" href="/contribute" aria-current={current === "contribute" ? "page" : undefined} aria-label="Submit agent">
          <Upload size={16} aria-hidden="true" />
          <span className="nav-submit-long">Submit</span>
          <span className="nav-submit-short" aria-hidden="true">Sub</span>
        </Link>
      </nav>
    </div>
  );
}

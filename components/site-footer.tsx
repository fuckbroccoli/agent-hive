"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ServiceState = "checking" | "operational" | "degraded";

export function SiteFooter() {
  const [serviceState, setServiceState] = useState<ServiceState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/releases", { cache: "no-store", signal: controller.signal })
      .then((response) => setServiceState(response.ok ? "operational" : "degraded"))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setServiceState("degraded");
      });

    return () => controller.abort();
  }, []);

  const statusLabel = serviceState === "operational"
    ? "System Operational"
    : serviceState === "degraded"
      ? "System Degraded"
      : "Checking System";

  return (
    <footer className="site-footer">
      <div className="footer-identity">
        <span>© 2026 hivebuzz.xyz</span>
        <span className="footer-separator" aria-hidden="true">|</span>
        <span className={`system-status status-${serviceState}`} aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          {statusLabel}
        </span>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <Link href="/privacy">Privacy_Protocol</Link>
        <Link href="/terms">Terms_of_Use</Link>
        <a href="https://github.com/promptprobe/hivebuzz/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" aria-label="Contribute to HiveBuzz on GitHub">Contribute_hivebuzz</a>
        <a href="https://github.com/promptprobe/hivebuzz/issues/new?template=agent-withdrawal.yml" target="_blank" rel="noopener noreferrer">Withdraw_Agent</a>
      </nav>
    </footer>
  );
}

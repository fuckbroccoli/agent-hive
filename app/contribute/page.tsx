import type { Metadata } from "next";
import { ContributeAgent } from "@/components/contribute-agent";

export const metadata: Metadata = {
  title: "Submit a Buzz agent - hivebuzz",
  description: "Scan a Buzz Agent Snapshot without memory locally and register it for public source review.",
};

export default function ContributePage() {
  return <ContributeAgent />;
}

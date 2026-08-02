import type { Metadata } from "next";
import { ContributeAgent } from "@/components/contribute-agent";

export const metadata: Metadata = {
  title: "Submit a Buzz agent - hivebuzz",
  description: "Scan a memory-free Buzz Agent Snapshot locally and submit it for public source review.",
};

export default function ContributePage() {
  return <ContributeAgent />;
}

import type { Metadata } from "next";
import { SnapshotGuide } from "@/components/snapshot-guide";

export const metadata: Metadata = {
  title: "Export and import Buzz agents — Agent Hive",
  description: "Export a memory-free Buzz Agent Snapshot, verify it locally, and import it with a fresh identity.",
};

export default function GuidePage() {
  return <SnapshotGuide />;
}

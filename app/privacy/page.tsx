import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Privacy protocol — HiveBuzz",
  description: "How HiveBuzz handles downloads, local scans, submissions, and operational data.",
};

const sections = [
  {
    title: "Account-free browsing",
    content: <p>You can browse and download without a HiveBuzz account, wallet, Nostr signature, or Buzz identity. HiveBuzz does not create a personal download history.</p>,
  },
  {
    title: "Local file inspection",
    content: <p>Agent Snapshot checks run in your browser. Files selected on the submission page are not uploaded to HiveBuzz. A file leaves your device only when you deliberately attach it to a public GitHub request.</p>,
  },
  {
    title: "Aggregate download counts",
    content: <p>HiveBuzz stores a release-level total after a completed download. The counter is not intended to identify a person and is never presented as a safety or reputation score.</p>,
  },
  {
    title: "Hosting and public requests",
    content: <p>The hosting provider may process ordinary security and delivery logs. Publisher identity, source, category, recommended harness, and recommended model become public when you open a GitHub contribution request. GitHub applies its own privacy terms.</p>,
  },
  {
    title: "Security reports",
    content: <p>Do not include credentials, private keys, memory exports, personal data, or live secrets in an issue. Report sensitive vulnerabilities privately through the repository security policy.</p>,
  },
] as const;

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy protocol"
      title="Minimal data by design."
      summary="HiveBuzz keeps discovery open, scans artifacts locally, and avoids identity collection for downloads."
      sections={[...sections]}
    />
  );
}

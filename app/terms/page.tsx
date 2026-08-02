import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Terms of use — HiveBuzz",
  description: "The review, safety, licensing, and contribution terms for using HiveBuzz artifacts.",
};

const sections = [
  {
    title: "Review before use",
    content: <p>HiveBuzz provides inspectable agent artifacts, not endorsements. A passing static scan and matching SHA-256 confirm declared structure and exact bytes; they cannot prove that instructions or connected services are benign.</p>,
  },
  {
    title: "No automatic execution",
    content: <p>Downloads are handed off as stopped files. You are responsible for reviewing the Buzz import preview, system prompt, harness, model, and agent settings before enabling anything.</p>,
  },
  {
    title: "Contributor responsibility",
    content: <p>Contributors must control the declared public source, provide an immutable commit, disclose relevant capabilities, hold the right to distribute the artifact, and use an accurate license. Malicious or deceptive submissions may be rejected or removed.</p>,
  },
  {
    title: "Licenses and availability",
    content: <p>Each artifact remains subject to its listed license. HiveBuzz may update, suspend, or remove listings and cannot guarantee uninterrupted availability, compatibility, or fitness for a particular purpose.</p>,
  },
  {
    title: "Withdrawal limits",
    content: <p>A verified publisher can ask HiveBuzz to stop future distribution. Withdrawal cannot recall prior downloads, forks, caches, or Git history.</p>,
  },
  {
    title: "Safe participation",
    content: <p>Do not submit secrets, private memory, credentials, unlawful material, malware, or artifacts designed to conceal behavior or access.</p>,
  },
] as const;

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms of use"
      title="Download first. Trust last."
      summary="Use HiveBuzz as a review and handoff layer. The final decision to import or run an agent remains yours."
      sections={[...sections]}
    />
  );
}

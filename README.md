# Agent Hive

**Buzz agents, ready to import.**

Agent Hive is a small, login-free library for portable Buzz agents. Agent
Snapshots (`.agent.json` or `.agent.png`) are the safe default; Persona Packs
(`.buzzpack`) remain an explicit advanced lane.

The product does three things: lists curated releases, verifies the selected
artifact locally, and hands the exact bytes to the user. It does not create an
account, connect a wallet, or install anything in the background.

## Product rules

- Every handoff checks the catalog SHA-256 and byte size in the browser.
- Agent Snapshot checks reject plaintext memory, source-environment allowlists,
  remote avatar beacons, unknown fields, private keys, common secret patterns,
  and bundled executable capabilities.
- Pack checks bound compressed and expanded size, reject unsafe paths and nested
  archives, scan text for secrets, and expose MCP, command, filesystem, network,
  and Hook requests before download.
- External artifact URLs are never fetched automatically. The user downloads
  and selects the file, preventing local-network and redirect probing.
- A verified download is still stopped data. Buzz provides the final import
  preview and activation decision.
- Download counts are aggregate activity only. Agent Hive stores no user,
  public-key, cookie, device, or per-download event record. Counts are not a
  rank, endorsement, or safety score and can be gamed.

## Use with Buzz Desktop

1. Choose an Agent release and select **Get agent**.
2. Wait for the exact file to pass local checks and review the warning.
3. Download the verified `.agent.json` or `.agent.png`.
4. Drag it into Buzz Desktop's Agents page, review Buzz's import preview, and
   confirm. Buzz creates a fresh local identity; private state is not included.

Persona Packs follow the same verify-and-download handoff. For an additional
CLI review, run:

```bash
buzz pack inspect <file.buzzpack>
```

Agent Hive does not emit an unsupported deep link or silently bridge into a
logged-in Desktop or CLI session.

## Contribute a release

Open the site's **Submit agent** page for the no-code path. It scans the file
locally, generates a SHA-256 receipt, and opens a public GitHub review request.
The site never uploads the selected file.

The contribution path is deliberately source-reviewed instead of an anonymous
write API:

1. Export **Agent only** from Buzz Desktop with memory set to **None**.
2. Run the local scanner or the site handoff against the exact artifact.
3. Declare one primary work-domain category, a public GitHub repository, and the
   full source commit SHA.
4. Open the review from the declared GitHub publisher account. Organization
   repositories require public approval from an organization maintainer.
5. Add the immutable artifact and one bounded entry in
   `lib/catalog-seeds.ts`.
6. Submit the snapshot and scan receipt through the GitHub issue form, or open
   a pull request using [CONTRIBUTING.md](CONTRIBUTING.md).

This keeps the public site focused on discovery and safe handoff while avoiding
an Agent Hive account system, Nostr signing risk, anonymous publication, and a
spam-ready write API. Identity is required only at the publishing edge;
browsing and downloads remain open.

## Development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run lint
npm test
npm audit
```

The shared D1 database stores curated release metadata and one aggregate count
per release. The initial historical tables remain untouched in existing
deployments, but the current application neither reads nor writes them.

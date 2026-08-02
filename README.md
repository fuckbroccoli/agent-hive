# hivebuzz

**Open Buzz Agent Library.**

HiveBuzz is a small, login-free library for portable Buzz Agent Snapshots
(`.agent.json` or `.agent.png`). It deliberately has one artifact type and one
job: review exact bytes before handing a stopped agent to Buzz Desktop.

- Live library: [hivebuzz.xyz](https://hivebuzz.xyz)
- Contribute an agent: [CONTRIBUTING.md](CONTRIBUTING.md)
- Upstream Buzz project: [block/buzz](https://github.com/block/buzz)

The product does three things: lists curated releases, verifies the selected
artifact locally, and hands the exact bytes to the user. It does not create an
account, connect a wallet, or install anything in the background.

## Product rules

- Every handoff checks the catalog SHA-256 and byte size in the browser.
- Agent Snapshot checks reject plaintext memory, source-environment allowlists,
  remote avatar beacons, unknown fields, private keys, common secret patterns,
  and bundled executable capabilities.
- External artifact URLs are never fetched automatically. The user downloads
  and selects the file, preventing local-network and redirect probing.
- A verified download is still stopped data. Buzz provides the final import
  preview and activation decision.
- Download counts are aggregate activity only. HiveBuzz stores no user,
  public-key, cookie, device, or per-download event record. Counts are not a
  rank, endorsement, or safety score and can be gamed.

## Use with Buzz Desktop

1. Choose an Agent release and select **Get agent**.
2. Wait for the exact file to pass local checks and review the warning.
3. Download the verified `.agent.json` or `.agent.png`.
4. Drag it into Buzz Desktop's Agents page, review Buzz's import preview, and
   confirm. Buzz creates a fresh local identity; private state is not included.

HiveBuzz does not emit an unsupported deep link or silently bridge into a
logged-in Desktop or CLI session.

## Included examples

The default Agent lane contains five deliberately narrow, memory-free examples:

- **Code Reviewer** — read-only correctness, security, regression, and test review.
- **Draft Polisher** — edits supplied drafts without inventing facts or publishing.
- **Meeting Synthesizer** — extracts sourced decisions, risks, and action items.
- **Data Explainer** — checks units, scope, denominators, and time windows.
- **Quiet Researcher** — separates verified facts from inference.

Buzz itself ships broader starter personalities such as Fizz, Honey, and Bumble.
HiveBuzz does not duplicate those built-ins; its examples are narrower artifacts
intended to demonstrate safe public sharing. See the
[official Buzz persona source](https://github.com/block/buzz/blob/main/desktop/src-tauri/src/managed_agents/personas.rs).

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
a HiveBuzz account system, Nostr signing risk, anonymous publication, and a
spam-ready write API. Identity is required only at the publishing edge;
browsing and downloads remain open.

## Withdraw a published agent

The published GitHub account, or a maintainer of its declared source repository,
can open the [withdrawal form](https://github.com/promptprobe/hivebuzz/issues/new?template=agent-withdrawal.yml).
HiveBuzz verifies that control against the original publisher and pinned source,
then removes the listing and hosted artifact. Vulnerabilities, exposed secrets,
and private data must use a
[private security advisory](https://github.com/promptprobe/hivebuzz/security/advisories/new),
not a public issue.

Withdrawal stops future HiveBuzz distribution. It cannot recall prior downloads,
forks, browser caches, or Git history.

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

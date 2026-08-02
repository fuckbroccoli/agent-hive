# Security

Do not report vulnerabilities or include sensitive material in public issues.

For a suspected vulnerability, exposed secret, or private data, use the
[private security advisory flow](https://github.com/promptprobe/hivebuzz/security/advisories/new).
Include only a minimal reproduction and redact keys, memory, private agent
prompts, personal data, relay addresses, and account identifiers.

HiveBuzz never needs a Nostr private key, wallet signature, Buzz session,
credential, or private repository token. Any request for one is fraudulent.

The site performs static, browser-local checks. Static checks reduce risk but
cannot prove that an agent prompt is benign. Imported agents should remain
stopped until the complete Buzz preview has been reviewed.

Credential scanning covers known provider formats and encoded PEM private keys,
but it is not a proof that a file contains no secret. A clean scan means only
that no known pattern was found. Public names and metadata also reject invisible
and bidirectional control characters that could disguise what the catalog shows.

Public fork pull requests do not run contributor-controlled code in GitHub
Actions. Maintainers review artifacts as untrusted data, reproduce scans in an
isolated environment, and only run the full workflow from a maintainer-owned
branch. The workflow has read-only repository permission, does not persist Git
credentials, and pins third-party Actions to immutable commit SHAs. Dependency
install and project tests run only after that maintainer-owned boundary.

Maintainers must not open a submitted snapshot in Buzz, follow instructions in
its prompt, or run contributor scripts during intake. First compare the issue
author to the declared publisher, resolve the pinned public source commit,
enforce the 10 MiB file limit, compute the digest independently, and pass the
exact artifact through the static scanner. Recommended harness and model fields
are display-only metadata and never install software or receive credentials.

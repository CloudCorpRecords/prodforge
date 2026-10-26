# The Catalog

One registry for the whole fleet: `registry.json`.

Each entry has: name, npm package (or null when GHCR-only), repo, one-line purpose, production phase, MCP availability, and status.

Phases:
- build: get the repo and agent setup right
- secure: the Security Wave plus wall and MCP vetting
- test: prove the change, separate your failures from base failures
- release: prove the release actually shipped
- operate: watch PRs, traces, and inbox after you ship

Validate it anytime:

```bash
npx @reneturcios/prodforge list
# or via MCP: catalog_health
```

Adding a tool: one entry in registry.json, tests enforce org, unique names, valid phase, and required fields. Verify the repo exists via the GitHub API before adding, and only add fleet-pattern tools (npm package, MCP server, factory layout).

## MCP vetting ledger

`mcp-servers.json` carries the vetting status of every MCP server ProdForge knows, under Rene's 2026-10-25 vetting rule: only servers with a real mcpaudit PASS recorded as evidence may be marked `audited` or appear in `default_profile`. Everything else stays `unvetted`, with no verdict claimed, and out of the default profile. To promote a server: run mcpaudit on it, record the real verdict, score, server version, and date as evidence, and only then flip its status — never invent a verdict.

`mcp/mcp.json` is the full fleet config (opt-in, includes unvetted servers). The vetted-only default profile is `mcp-servers.json`'s `default_profile`. Reconciling the full config down to the vetted set is queued for final hardening.

`mcp-servers.json` also carries a `discovery[]` section reconciling the 107-server staging catalog: the 82 staging servers not already in the vetted ledger are listed there, all `unvetted`, with their staging status and verdict preserved verbatim. A staging `audited` label is not a promotion — most of those verdicts say UNREACHABLE, ENV-SKIP, WARN, or ground-truth notes, and the two PASS claims (fetch, time) are unstructured second-hand text held pending a fresh local mcpaudit run. Code (`validateDiscovery`) enforces that no discovery entry can claim audited status or enter the default profile.

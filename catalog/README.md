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

Adding a tool: one entry in registry.json, tests enforce org, unique names, valid phase, and required fields.

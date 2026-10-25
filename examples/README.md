# Worked examples (Wave C)

Two real products built end to end from `prodforge init` scaffolds — each with its own source, tests, and README, and each verified by ProdForge's own test suite (`test/examples.test.ts` runs both example suites plus a `tsc --noEmit` build check):

- **taskboard/** — a SaaS: `prodforge init saas-web taskboard` extended with an in-memory task board API (`GET /health`, `GET /tasks`, `POST /tasks`). Node builtins only.
- **notes/** — an MCP server: `prodforge init mcp-server notes` extended with `ping` plus an in-memory notes store (`add_note`, `list_notes`, `get_note`). CLI + MCP in one bin.

# Example: Ship a SaaS in an afternoon

1. Start from stacks/saas-web
2. `prodforge doctor` - fix env, README, .env.example
3. `prodforge connect --write mcp.json` - your agent now has greenlight, wallcheck, shipcheck, and the whole Security Wave
4. Build your product with your agent. Every tool it needs is already connected.
5. `prodforge checklist` - work the list top to bottom
6. `prodforge ship` - GO means ship it

# Example: Ship an MCP server

1. Start from stacks/mcp-server
2. Build CLI + MCP in one bin
3. mcpaudit + mcpvet on the built server
4. npmpreflight, tag, publish npm, then registry, then GHCR
5. shipcheck GO from the published package

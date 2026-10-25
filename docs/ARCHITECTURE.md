# Architecture

ProdForge is a connector, not another framework.

Layers:

1. Catalog (catalog/registry.json) - the single source of truth for what exists.
2. Connect (src/catalog.ts mcpConfigFor) - turns the catalog into one merged MCP config. No hand wiring.
3. Doctor (src/doctor.ts) - local, deterministic readiness checks with named fixes. No LLM in the core.
4. Checklist / Ship gate - the production checklist is data, not prose. Each item names the tool that runs it, so a human or an agent can execute the same gate.
5. Stacks (stacks/) - opinionated starting points that pick a subset of the catalog per product type.
6. MCP surface (src/mcp.ts) - agents get the same catalog, config, checklist, and doctor a human gets from the CLI. One bin, both audiences, fleet factory pattern.

Design rules (inherited from the fleet):
- Deterministic core, evidence over vibes
- Solve-first: report the fix, not just the finding
- Dogfood everything in this repo first
- One version, everywhere: tag, npm, GHCR, MCP Registry must agree (shipcheck enforces it)

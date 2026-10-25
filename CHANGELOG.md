# Changelog

## 0.4.0 - 2026-10-25 (Wave C)
- Worked examples end to end under examples/: taskboard (saas-web scaffold extended with an in-memory task board API: GET /health, GET /tasks, POST /tasks with validation) and notes (mcp-server scaffold extended with ping plus an in-memory notes store: add_note, list_notes, get_note; CLI + MCP in one bin, SDK imports dynamic so its tests need no install).
- Both examples are real products, not sketches: each ships its own source, tests, and README, and ProdForge's own suite verifies them (new test/examples.test.ts runs each example's suite plus a tsc --noEmit build check).
- Live-verified this run: taskboard serves /health and task create/list over HTTP; notes answers CLI ping and an MCP handshake listing all 4 tools with correct input schemas.
- Tests: 25/25 green (19 prior + 6 new example tests). examples/ added to the published files list.

## 0.3.0 - 2026-10-25 (Wave B)
- `prodforge ship` now executes the release gate instead of printing it: one gate per production-checklist item (20 gates), each running its fleet tool's own documented, read-only, cwd-targeted invocation where one is known (`agentsfile check .`, `envdoc check .`, `mcpvet vet .`, `actionpin audit .`, `flowcheck audit .`, `depguard check .`; `shipcheck check <owner/repo>` derived from the git remote).
- Honest statuses, no faked PASS: PASS = tool ran, exit 0; FAIL = tool ran, non-zero; ABSENT = binary not on PATH; NOT-WIRED = no safe invocation known yet (needs a target, e.g. mcpaudit's server command, wallcheck's URLs) — not executed, not passed. Verdict: NO-GO on any FAIL, NOT-READY on any ABSENT, PARTIAL on any NOT-WIRED, GO only when every gate passes. CLI exits 0 only on GO; `--dry-run` lists gates without executing, `--json` emits the report. New `ship_gate` MCP tool runs the same gate.
- Tests: 19/19 green, including fake-binary suites proving ABSENT is never a PASS and that all-wired-passing still cannot fake a GO while unwired gates remain.

## 0.2.0 - 2026-10-25 (Wave A)
- `prodforge init <stack> <name> [--dir dir]` generates a real scaffold for all 5 stacks (mcp-server, saas-web, api-service, cli-tool, ai-agent): package.json, tsconfig, README, src, and a node:test suite. mcp-server also gets a server.json.
- Scaffolds use only node builtins at runtime, so generated test suites run with tsx and no install step; init refuses to clobber a non-empty directory.
- Tests: 10/10 green, including a generated-project suite that actually runs.

## 0.1.0 - 2026-10-25
- Initial release: catalog of 26 fleet tools, merged MCP connect (25 servers), doctor, production checklist, ship gate report, 5 stacks, 4 playbooks, CLI + MCP server in one bin, tests.

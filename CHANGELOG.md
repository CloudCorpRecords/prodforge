# Changelog

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

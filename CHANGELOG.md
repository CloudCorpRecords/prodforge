# Changelog

## 0.5.0 - 2026-10-25 (Wave D)
- MCP catalog hardening: new catalog/mcp-servers.json vetting ledger covering all 27 registry tools. Vetting rule enforced in code (src/catalog.ts loadMcpServers/validateMcpServers, test/vetting.test.ts): only servers with a real mcpaudit PASS on file may be marked audited or appear in default_profile; everything else stays unvetted with no verdict claimed.
- Real audits run this wave with the local mcpaudit binary against local server builds (no installs, no invented verdicts): greenlight 0.8.1 PASS 100/100 (15 tools), mcpaudit 0.1.1 PASS 100/100 (3 tools), prodforge 0.5.0 PASS 100/100 (6 tools). Default profile is exactly those three. The other 24 servers stay unvetted pending real audits.
- The audit itself found prodforge's two undocumented tool parameters (list_packages.phase, ship_gate.dir); both now carry descriptions, and the re-audit moved prodforge from WARN 94/100 to PASS 100/100.
- Registry expansion, verified not guessed: testdelta added (27 tools) after confirming via the GitHub API that CloudCorpRecords/testdelta exists, ships npm @reneturcios/testdelta with a factory server.json, and serves an MCP server (src/mcp.ts, one tool). Candidates mcp-job-tracker, mcp-directory, and cliqwise were checked and excluded: their root package.json files carry no bin or mcpName, so they are not fleet-pattern tools.
- mcp/mcp.json is unchanged this wave and is now documented as the full fleet config (opt-in, includes unvetted servers); the vetted-only default is catalog/mcp-servers.json default_profile. Reconciling mcp.json to the vetted set is queued for the final hardening wave.
- Staging catalog reconciliation (found after the Wave D build in prodforge-staging/mcp-servers.json, 107 servers): the 82 staging servers not already in the ledger are now in catalog/mcp-servers.json discovery[], all unvetted, with staging status/verdict preserved verbatim — zero promotions. The staging 'audited' label did not survive the vetting rule: only fetch and time even claim PASS, and only as unstructured second-hand text, held pending a fresh local mcpaudit run (their launch is uvx, and uvx was not available in this sandbox); the other 20 staging-'audited' verdicts say UNREACHABLE, ENV-SKIP, WARN, or ground-truth notes. New validateDiscovery() in src/catalog.ts enforces discovery stays unvetted, disjoint from the vetted ledger, and out of default_profile.
- Tests: 31/31 green (29 prior + 2 new discovery tests).

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

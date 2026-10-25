# Roadmap - 5x

Now: v0.1.0 - catalog (26 tools), merged MCP connect, doctor, checklist, ship gate report, 5 stacks, 4 playbooks, CLI + MCP in one bin, tests.

Wave 2 (overnight 2026-10-25):
- Stack templates become real scaffolds: prodforge init --stack <name> generates the project
- Ship gate executes installed tools instead of only reporting them
- Per-stack env templates verified with envdoc

Wave 3:
- prodforge update: one command that bumps every wired MCP server to its latest verified version (shipcheck-gated)
- Production score: one number per phase, with evidence links, stored as production.json in the project
- New stacks: content-pipeline (Clipwise-shaped), marketplace, internal-tool

Wave 4:
- Index flywheel: anonymized, opt-in catalog health data (which tools, which versions, which gates fail most) published as a public index, like the Agent Policy Index for repos
- Stack registry: community stacks in the same catalog format, vetted with mcpvet + mcpaudit before listing

Wave 5:
- Hosted connect (enterprise fleet shape): the same catalog and gates, run for a team, with dashboards. Open core stays MIT.

Kill rule: any wave item that needs a hosted backend to be useful at all, or cannot be dogfooded here within a week, gets cut.

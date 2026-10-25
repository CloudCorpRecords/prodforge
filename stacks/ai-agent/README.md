# Stack: AI Agent

Start here when agents are the product, not just the builder.

Pre-wired:
- MCP client + server both: your agent uses tools and exposes tools
- Trace format + tracewatch from day one, approval gates for irreversible actions
- Injection surface mapped with injectcheck before any public demo

Gates before you tag:
- [ ] injectcheck clean on every agent-facing prompt and content path
- [ ] mcpvet on every external MCP server you connect
- [ ] contextbudget set per task type, with hard stops
- [ ] Human approval gate tested on the destructive tools
- [ ] shipcheck GO

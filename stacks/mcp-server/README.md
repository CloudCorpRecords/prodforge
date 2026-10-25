# Stack: MCP Server

Start here when your product IS an MCP server.

Pre-wired:
- Factory pattern: TypeScript, Node 20+, one bin = CLI + MCP (`mcp` subcommand), zod schemas
- server.json (current MCP Registry schema), Dockerfile with `io.modelcontextprotocol.server.name` label
- Publish pipeline: npm (@reneturcios scope) then MCP Registry then GHCR, in that order

Gates before you tag:
- [ ] mcpaudit passes on your built server (handshake, schemas, error handling)
- [ ] mcpvet fingerprint + probe parity clean
- [ ] npmpreflight clean (files, size, no secret patterns)
- [ ] shipcheck GO: tag = release = npm = registry = GHCR

Env: none required by default. Never ship a server that needs a user secret to start.

Example in the wild: Greenlight, Shipcheck, Clipwise MCP.

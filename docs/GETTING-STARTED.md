# Getting Started

## 60 seconds

```bash
npx @reneturcios/prodforge doctor
npx @reneturcios/prodforge connect --write mcp.json
npx @reneturcios/prodforge checklist
```

## Pick your path

- Building something new: start from a stack in stacks/, closest match wins.
- Shipping something existing: run doctor, then the ship gate in playbooks/release.md.
- Giving your agent the fleet: drop mcp/mcp.json into your client config (Claude Desktop, Cursor, VS Code variants are in mcp/).

## What to do when a gate fails

Every failure names its fix and its tool. Fix that one thing, re-run that one gate. Do not re-run the world.

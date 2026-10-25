# Production Playbook

The short version of going to production with ProdForge. Every item names its tool.

## Build
- [ ] AGENTS.md true (agentsfile)
- [ ] Env documented (envdoc), secrets in a vault, never in the repo
- [ ] Context budget set (contextbudget)
- [ ] Clean-machine env passes (envdoctor)

## Secure
- [ ] MCP servers vetted (mcpvet, mcpaudit)
- [ ] Actions pinned, workflows checked (actionpin, flowcheck)
- [ ] Hooks safe (hookcheck), injection surface checked (injectcheck)
- [ ] Deps guarded (depguard)
- [ ] Public pages probed (wallcheck) - candidate exposures disclosed privately first, never published first

## Test
- [ ] Repro red-first (reprocheck)
- [ ] CI delta honest (cidiff), logs root-caused (logdigest)

## Release
- See playbooks/release.md. Shipcheck GO or do not tag.

## Operate
- [ ] PRs triaged daily (prwatch)
- [ ] Traces watched (tracewatch), inbox watched (inboxwatch)
- [ ] First rollback rehearsed, not just written

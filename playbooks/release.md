# Release Playbook

1. Version bump in package.json only. Everything else single-sources from it.
2. npmpreflight: pack contents, size, secret-pattern scan.
3. Tag. GitHub release from the tag.
4. Publish order matters: npm first, verify latest, then MCP Registry, then GHCR.
5. shipcheck from the published package. GO means tag = release = npm = registry = GHCR.
6. Rollback plan (fill before tagging): previous version, migration reversibility, env changes, feature flags touched.
7. Announce only after step 5 says GO.

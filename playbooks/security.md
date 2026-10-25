# Security Playbook

The Security Wave, in run order:

1. hookcheck - hooks and pre-commit cannot smuggle code in
2. actionpin - every Action pinned to a SHA
3. flowcheck - workflows: least permissions, timeouts, concurrency guards
4. depguard - dependency risk with evidence
5. mcpvet + mcpaudit - every MCP server you run or connect, fingerprinted and probed
6. injectcheck - prompt-injection surface on agent-facing paths
7. wallcheck - what your public pages actually serve to a stranger

Rule: candidate secret exposures are private until disclosed and resolved. Values are never stored in reports: pattern, length, and fingerprint only.

# Observability Playbook

Local-first, no hosted service required to start:

- Logs: structured, one failure = one root-cause section (logdigest format)
- Traces: agent tool calls in a local trace format, watched with tracewatch
- PR and inbox signals: prwatch + inboxwatch are observability too - they watch the human surfaces
- Health: /health on services, doctor on repos, shipcheck on releases
- Rule: if a number has no evidence link, it does not go in a report

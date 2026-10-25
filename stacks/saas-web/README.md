# Stack: SaaS Web

Start here for a web product with users, auth, and billing.

Pre-wired:
- App skeleton choices: Next.js or Vite + API, Postgres, auth, Stripe billing hooks
- Env contract documented with envdoc, .env.example committed, real .env never committed
- Security: flowcheck on CI workflows, actionpin on actions, wallcheck probe on public pages

Gates before you tag:
- [ ] envdoctor passes on a clean machine
- [ ] wallcheck: public pages classified, no CANDIDATE_EXPOSURE findings undisclosed
- [ ] flowcheck + actionpin clean
- [ ] shipcheck GO, rollback plan in playbooks/release.md filled in

Operate: prwatch for PRs, tracewatch if you run agents, inboxwatch for user replies.

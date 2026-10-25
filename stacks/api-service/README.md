# Stack: API Service

Start here for an API, backend service, or integration worker.

Pre-wired:
- Typed request validation, structured logging, /health endpoint, graceful shutdown
- CI with logdigest wired into failure reports
- Dep policy: depguard on every dependency change

Gates before you tag:
- [ ] depguard clean on the lockfile
- [ ] logdigest can root-cause a forced failure in CI
- [ ] envdoc matches real env usage
- [ ] shipcheck GO

# TechGuard v0.2.0-rc.2 Release Notes

## Highlights
- **Operational health**: Added `/api/healthz` and `/api/readyz` endpoints plus Docker health checks to simplify orchestration readiness.
- **Production build**: Regenerated Next.js artifacts in standalone mode to resolve runtime TypeError seen in RC.1 and updated Docker base to Debian slim for Prisma compatibility.
- **Quality gates**: Expanded Vitest coverage across authentication, profile, checkout, and infrastructure helpers with enforced ≥85% coverage thresholds.
- **UI hardening**: Introduced Playwright smoke + accessibility checks and improved landing page contrast to satisfy WCAG 2.1 AA.
- **Developer experience**: New scripts (`test:unit`, `test:integration`, `test:coverage`, `e2e`) and refreshed documentation with architecture snapshot, testing matrix, and CI overview.

## Test Matrix
| Command | Result |
| --- | --- |
| `pnpm lint` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm test:coverage` | ✅ (lines 91.55% · branches 80.15%) |
| `pnpm e2e` | ✅ (HTML report in `e2e-report/`) |
| `SKIP_ENV_VALIDATION=true NEXTAUTH_SECRET=test-secret DATABASE_URL=postgresql://postgres:postgres@localhost:5432/techguard?schema=public pnpm build` | ✅ |

## Deployment Notes
- Copy `.env.example` to `.env.production` (or platform equivalent) and provide real values for database, Stripe, and email credentials.
- Health probes: `/api/healthz` (liveness) and `/api/readyz` (readiness) are available once the server starts.
- Docker Compose now waits for PostgreSQL health before starting the app and surfaces container health via `/api/readyz`.

## Known Issues / Follow-ups
- Admin pixel-perfect layout improvements and additional a11y work (modals, toasts) are deferred to a future sprint.
- Stripe/webhook integration tests still require manual verification against a live Stripe account.

Tag the release with:

```bash
git tag v0.2.0-rc.2
```

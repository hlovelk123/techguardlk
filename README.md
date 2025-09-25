# TechGuard Subscriptions

TechGuard is a production-ready subscription commerce platform with customer self-service, an internal admin console, Stripe-powered billing, and operational tooling in a single Next.js 14 application.

## Quick Start

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm dev
```

Then visit `http://localhost:3000`.

### Prerequisites

- Node.js 22
- pnpm 10+
- PostgreSQL 16+ (local or managed)
- Stripe account (test mode works)
- Optional: Resend account or local SMTP server (Mailpit) for email testing

### Essential Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random string for NextAuth session encryption |
| `NEXT_PUBLIC_APP_URL` | External URL used in transactional emails |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe API + webhook signing keys |
| `RESEND_API_KEY` / `EMAIL_FROM` | Email delivery configuration |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Optional SMTP fallback (e.g., Mailpit) |
| `SKIP_ENV_VALIDATION` | Optional flag to bypass strict env parsing (useful for tooling/tests) |

## Architecture Overview

```
                    +-------------------+
                    |   Next.js 14 App   |
                    |   (App Router)     |
                    +-----+---------+----+
                          |         |
          React Query & shadcn/ui   |  API Routes (REST)
                          |         |
        +-----------------v---------v----------------+
        |                 Server Layer                |
        |  • Auth (NextAuth)                          |
        |  • Stripe checkout + webhook handlers       |
        |  • Email workflows (Resend/Nodemailer)      |
        |  • Rate limiting & audit logging            |
        +-----------------+----------+---------------+
                          |          |
                   Prisma Client     |
                          |          |
                 +--------v--+   +---v-------------------+
                 | PostgreSQL|   | External Integrations |
                 | (TechGuard|   |  • Stripe             |
                 |  schema)  |   |  • Resend / SMTP      |
                 +-----------+   +-----------------------+
```

## Development Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server with hot reload |
| `pnpm build` / `pnpm start` | Create and run a production build |
| `pnpm lint` | ESLint with the project ruleset |
| `pnpm typecheck` | TypeScript strict-mode checking |
| `pnpm test:unit` / `pnpm test:integration` | Targeted Vitest suites |
| `pnpm test:coverage` | Full Vitest run with coverage (≥85% statements/lines/functions, ≥80% branches) |
| `pnpm e2e` | Playwright e2e tests (HTML report saved to `./e2e-report`) |

Health and readiness probes are exposed at `/api/healthz` and `/api/readyz` for container orchestrators and uptime checks.

## Database & Seeding

```bash
pnpm prisma migrate deploy   # apply migrations
pnpm prisma db seed          # optional seed data (admin + demo plans)
```

The Prisma schema lives in `prisma/schema.prisma`; generate the client with `pnpm db:generate` whenever the schema changes.

## Testing & Quality Gates

- **Vitest**: extensive unit and integration coverage for auth flows, profile management, checkout, rate limiting, and supporting utilities.
- **Playwright**: end-to-end smoke tests with axe-core accessibility scans for the marketing and authentication flows. Reports land in `./e2e-report`.
- **Coverage thresholds**: enforced via `pnpm test:coverage` and in CI (85% statements/lines/functions, 80% branches).

## Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request:

1. Install dependencies and generate the Prisma client.
2. Lint (`pnpm lint`) and type-check (`pnpm typecheck`).
3. Execute `pnpm test:coverage` and fail if quality gates drop.
4. Build the production bundle (`pnpm build`).
5. Install Playwright browsers and run `pnpm e2e` with HTML reports.
6. Upload artifacts: coverage report, Playwright report (`e2e-report/`), and the `.next` build output.

## Deployment

### pnpm build & start

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build
pnpm start
```

### Docker Compose

```bash
docker-compose up --build
```

- `app` exposes the production server on `http://localhost:3001` and waits for a healthy Postgres service.
- Health checks hit `/api/readyz`; readiness ensures Postgres connectivity.

### Stripe Webhooks

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Populate `STRIPE_WEBHOOK_SECRET` with the signing secret from `stripe listen` and ensure plans have a `stripePriceId`.

### Email Delivery

- Resend (production): configure `RESEND_API_KEY` and `EMAIL_FROM`.
- Nodemailer fallback: run Mailpit (or any SMTP server) on `localhost:1025` during development and set `SMTP_HOST`, `SMTP_PORT`, and (if required) `SMTP_USER` / `SMTP_PASS`. Leave `SMTP_SECURE=false` for Mailpit.

## Key Directories

- `app/(customer)` – authenticated customer dashboards & pages
- `app/(admin)` – admin-only UI (guarded by middleware + server checks)
- `app/api` – route handlers for public, customer, and admin APIs
- `components/` – shared UI primitives and domain widgets
- `lib/` – Prisma client, auth helpers, Stripe/email/rate-limit utilities
- `prisma/` – database schema, migrations, and seed script
- `tests/` – Vitest unit/integration suites and Playwright e2e specs

---

Questions or improvements? Open an issue or PR—TechGuard is designed to scale with your catalog and operational needs.

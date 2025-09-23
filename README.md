# TechGuard Subscriptions

TechGuard is a full-stack subscription commerce platform for selling and managing seat-based digital plans. It delivers a customer self-service portal, an internal admin suite, Stripe-powered billing, and operational tooling out-of-the-box.

## Features

- **Customer portal**: Browse plans, purchase via Stripe Checkout, manage seats/entitlements, view orders, export data, enable TOTP 2FA, and soft-delete the account.
- **Admin console**: Real-time KPIs, customer lookups, provider & plan CRUD, subscription overrides, payment monitoring, and audit log visibility.
- **Stripe integration**: Checkout + Billing, webhook-driven lifecycle, idempotent processing, and order/subscription reconciliation.
- **Email workflows**: Resend (or Nodemailer fallback) for verification, password resets, and order receipts.
- **Security & compliance**: Role-based access, rate limiting, audit logs, GDPR data export, and soft delete.
- **Tooling**: Prisma + PostgreSQL, NextAuth (credentials + Google), React Query, shadcn/ui, Vitest unit tests, Playwright smoke test, Docker, and GitHub Actions CI.

## Stack

- **Frontend/Server**: Next.js 14 App Router (TypeScript)
- **UI**: Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Auth**: NextAuth.js (credentials + Google OAuth)
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe Checkout & Billing + webhooks
- **Emails**: Resend with Nodemailer fallback
- **Background jobs**: Route handlers (extendable for cron)
- **Testing**: Vitest unit tests, Playwright e2e
- **Tooling**: pnpm, Docker, GitHub Actions CI

## Getting Started

### Prerequisites

- Node.js 22
- pnpm 10+
- PostgreSQL 16+
- Stripe account (test mode is fine)
- Resend account (optional; Nodemailer dev fallback works)

### Environment

Copy `.env.example` to `.env.local` and populate the values:

```bash
cp .env.example .env.local
```

Important variables:

- `DATABASE_URL` – PostgreSQL connection string
- `NEXTAUTH_SECRET` – random string for session encryption
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` – Stripe API + webhook signing keys
- `RESEND_API_KEY` / `EMAIL_FROM` – email sending (optional)
- `NEXT_PUBLIC_APP_URL` – external URL of the app (used in emails)

### Install & Database

```bash
pnpm install
pnpm db:generate
pnpm prisma migrate deploy   # or pnpm db:push for dev
pnpm prisma db seed          # optional data seeding
```

### Run Locally

```bash
pnpm dev
```

Visit `http://localhost:3000`.

### Test & Lint

```bash
pnpm lint
pnpm typecheck
pnpm test         # Vitest unit suite
pnpm e2e          # Playwright smoke (requires app running)
```

### Docker

Build and run using Docker Compose:

```bash
docker-compose up --build
```

This spins up the Next.js app (`http://localhost:3000`) and a PostgreSQL instance.

### GitHub Actions CI

CI runs lint, type-check, Vitest, and Playwright smoke tests against a Postgres service. Workflow file: `.github/workflows/ci.yml`.

## Stripe Webhooks

Expose your local server to Stripe (e.g. using `stripe listen`):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Set the provided signing secret in `STRIPE_WEBHOOK_SECRET` and ensure each active plan references a `stripePriceId`.

## Email Delivery

- Resend (production): set `RESEND_API_KEY` and `EMAIL_FROM`.
- Nodemailer (development): run a local SMTP server (e.g. [Mailpit](https://github.com/axllent/mailpit)) on port 1025.

Emails sent:

- Account verification
- Password reset
- Order receipts

## Data Protection

- **Audit Logs**: all critical admin/customer actions recorded in `AuditLog`.
- **Rate limiting**: applied to signup, reset, and checkout endpoints.
- **GDPR helpers**: `/api/profile/export` for JSON export, `/api/profile/delete` for soft deletion/anonymisation.
- **Two-factor auth**: optional TOTP secret provisioning.

## Project Structure (highlights)

- `app/(customer)` – customer-facing authenticated pages
- `app/(admin)` – admin portal pages
- `app/api` – RESTful handlers (public, customer, admin)
- `components/` – shared UI, admin/customer widgets, auth forms
- `lib/` – Prisma, auth, Stripe utilities, email helpers, rate limiting
- `prisma/` – schema, migrations, seed
- `tests/` – unit + e2e suites

## Deployment

1. Set environment variables in your hosting platform (Vercel, Fly.io, etc.).
2. Ensure `DATABASE_URL` points to a managed Postgres instance.
3. Configure Stripe webhook endpoint (`/api/webhooks/stripe`).
4. Build and run with `pnpm build && pnpm start` (or Docker image).

## Scripts Reference

- `pnpm dev` – local dev server
- `pnpm build` / `pnpm start` – production build & serve
- `pnpm lint` – ESLint
- `pnpm typecheck` – TypeScript compiler check
- `pnpm test` – Vitest unit tests
- `pnpm e2e` – Playwright smoke tests
- `pnpm db:generate` – Prisma client
- `pnpm db:migrate` / `pnpm db:seed` – migrations & seed

---

TechGuard is built to be production-ready out of the gate—extend providers, plans, and automation as your catalog grows.

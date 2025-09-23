# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains Next.js App Router routes, split into public, customer, and admin segments (`(customer)`, `(admin)` folders).
- `app/api/` hosts route handlers for public, customer, and admin APIs.
- `components/` stores reusable UI, auth, admin, and subscription widgets.
- `lib/` holds shared utilities (Prisma client, Stripe helpers, email, rate limiting, formatting).
- `prisma/` tracks the schema, migrations, and seed data; database migrations live under `prisma/migrations/`.
- `tests/` includes unit specs (`tests/unit`) and Playwright smoke tests (`tests/e2e`).

## Build, Test, and Development Commands
- `pnpm dev` — start the Next.js dev server at `http://localhost:3000`.
- `pnpm lint` — run ESLint with Tailwind plugin and project rules.
- `pnpm typecheck` — execute the TypeScript compiler in check-only mode.
- `pnpm test` — run Vitest unit suites in `tests/unit`.
- `pnpm e2e` — launch Playwright tests (requires server running or uses webServer config).
- `pnpm build` / `pnpm start` — create and serve the production build.

## Coding Style & Naming Conventions
- TypeScript, React, and Prisma with strict ESLint + Prettier formatting (`pnpm format`).
- Tailwind utility classes should follow recommended ordering; run `pnpm lint --fix` where needed.
- Favor PascalCase for components, camelCase for functions/variables, and kebab-case for route folders.

## Testing Guidelines
- Unit tests use Vitest (`tests/unit/*.test.ts`); name files after the module under test.
- E2E smoke tests live in `tests/e2e/*.spec.ts` leveraging Playwright.
- Ensure new features include relevant unit coverage; extend Playwright flows when UI behaviour changes.

## Commit & Pull Request Guidelines
- Commits follow concise, typed prefixes (e.g., `feat:`, `fix:`, `chore:`) as seen in history (`feat: customer portal...`).
- Pull requests should link to tickets/issues, describe scope, include testing notes (`pnpm lint`, `pnpm test`, etc.), and attach UI screenshots for front-end changes.

## Environment & Security Tips
- Copy `.env.example` to `.env.local` for local runs; never commit secrets.
- Stripe webhooks require `stripe listen --forward-to localhost:3000/api/webhooks/stripe` during development.
- Resend credentials (`RESEND_API_KEY`, `EMAIL_FROM`) enable production email; Nodemailer fallback is used otherwise.

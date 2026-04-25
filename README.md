# Fitness Management

Monorepo for the fitness member management platform.

## Apps
- `apps/web` — Next.js 15 admin web app

## Packages
- `packages/db` — Drizzle schema + migrations
- `packages/api` — Zod schemas, shared types
- `packages/emails` — React Email templates

## Quick start
1. `pnpm install`
2. `supabase start`
3. `cp packages/db/.env.example packages/db/.env.local` and fill DATABASE_URL
4. `cd packages/db && pnpm dlx dotenv-cli -e .env.local -- pnpm migrate`
5. `cd packages/db && pnpm dlx dotenv-cli -e .env.local -- pnpm seed`
6. `cp apps/web/.env.example apps/web/.env.local` and fill all keys
7. `pnpm --filter @fitness/web dev`

See `docs/runbooks/local-dev.md` for details.
See `docs/superpowers/specs/` for the design spec.
See `docs/superpowers/plans/` for the implementation plan.

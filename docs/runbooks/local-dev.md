# Local development

## Services
- Supabase local stack — `supabase start`
- Stripe CLI listener (when needed) —
  `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Next.js dev — `pnpm --filter @fitness/web dev`

## Common tasks
- Reset DB: `supabase db reset`
- Generate migration: `pnpm --filter @fitness/db generate`
- Apply migration: `pnpm --filter @fitness/db migrate`
- Studio: `pnpm --filter @fitness/db studio`
- Seed demo data: `pnpm --filter @fitness/db seed`
- Run all tests: `pnpm test`

## Test admin user
Create via Supabase Studio (`http://127.0.0.1:54323`):
- Email: `admin@demo.local`
- Password: `password1234`
- App metadata: `{ "tenant_id": "<demo tenant id>" }`

To find the demo tenant id:
```bash
docker exec supabase_db_fitness_management \
  psql -U postgres -d postgres -tAc "select id from tenants where slug='demo'"
```

Or programmatically (using the local service-role key):
```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/admin/users' \
  -H "apikey: <service_role_key>" \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"password1234","email_confirm":true,"app_metadata":{"tenant_id":"<demo-tenant-id>"}}'
```

## Known notes
- `DATABASE_URL` env wraps with dotenv-cli for db package commands: `pnpm dlx dotenv-cli -e packages/db/.env.local -- ...`
- DOCKER_HOST may need to be set for colima users:
  `export DOCKER_HOST=unix:///<home>/.colima/default/docker.sock`
- Supabase analytics container disabled in `supabase/config.toml` for colima compatibility (no impact on app behavior).
- React 19 RC peer warnings during install are expected (Next 15.0.2 paired with the project's pinned RC tag).

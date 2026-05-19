# FitClub VPS deploy — self-hosted Supabase + Docker Compose

End-to-end: a fresh Ubuntu/Debian VPS, your domain, and one `docker compose
up` for the app. Supabase runs on the same host using the upstream
docker-compose bundle.

## 0. VPS prerequisites

| Spec | Minimum |
|------|---------|
| CPU  | 2 vCPU |
| RAM  | 4 GB (Supabase stack is hungry — 8 GB if you can spare it) |
| Disk | 40 GB SSD |
| OS   | Ubuntu 24.04 LTS or Debian 12 |
| DNS  | `A` record for `fitclub.example.com` → VPS public IP. Optionally a second `A` for `supabase.fitclub.example.com`. |

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

Install pnpm + Node (only needed for one-off DB migrate + seed; the runtime
images carry their own toolchain):

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
exec $SHELL -l
pnpm env use --global 20
```

## 1. Clone the repo

```bash
sudo mkdir -p /srv && sudo chown $USER:$USER /srv
cd /srv
git clone https://github.com/slotr/fitclub-os.git
cd fitclub-os
```

## 2. Bring up self-hosted Supabase

The upstream compose bundle lives in the Supabase repo. Either vendor it
or pull on demand.

```bash
cd /srv
git clone --depth 1 https://github.com/supabase/supabase.git
cd supabase/docker

# Generate strong secrets — anon/service-role JWTs, dashboard password,
# Postgres password. The .env.example documents them all.
cp .env.example .env
nano .env   # set POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY,
            # DASHBOARD_USERNAME, DASHBOARD_PASSWORD, SITE_URL, etc.
# JWT keys: https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

docker compose pull
docker compose up -d
```

Verify Kong is up:

```bash
curl -sS http://localhost:8000/auth/v1/health
```

Take note of the generated `ANON_KEY` and `SERVICE_ROLE_KEY` — you will
paste them into the app `.env.production` next.

## 3. Apply schema + RLS policies to the Supabase Postgres

```bash
cd /srv/fitclub-os
pnpm install --frozen-lockfile

# Migrations expect DATABASE_URL on the host network. Supabase exposes
# Postgres on :5432 by default.
export DATABASE_URL="postgres://postgres:$POSTGRES_PASSWORD@localhost:5432/postgres"
pnpm --filter @fitness/db migrate

# Row-level security policies — same loop CI uses.
for f in infra/supabase/policies/*.sql; do
  echo "applying $f"
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U postgres -d postgres -f "$f"
done

# Optional: demo tenant + plans + member.
pnpm --filter @fitness/db seed
```

## 4. Create an admin Auth user

Supabase Studio is exposed on `http://VPS_IP:3000` by default (or behind
your second domain via Caddy — see step 6). Log in with
`DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`.

- **Authentication → Users → Add user** — email + password, tick "Auto
  Confirm User".
- **SQL Editor** — attach the tenant the seed created:

  ```sql
  SELECT id FROM public.tenants WHERE slug = 'demo';
  -- copy the UUID

  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data
      || jsonb_build_object('tenant_id', '<uuid-from-above>')
  WHERE email = 'admin@fitclub.local';
  ```

## 5. Configure the FitClub app env

```bash
cd /srv/fitclub-os/infra/vps
cp .env.production.example .env.production
nano .env.production
```

Fill:

- `DOMAIN` — public hostname for the app.
- `NEXT_PUBLIC_SUPABASE_URL` — `https://supabase.<domain>` (browser-side).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from
  step 2.
- `DATABASE_URL` — inside-the-docker-network reference, e.g.
  `postgres://postgres:<pw>@db:5432/postgres`.
- `NEXT_PUBLIC_APP_URL` — `https://<domain>`.
- `CRYPTO_WEBHOOK_SECRET` — generate with `openssl rand -hex 32`. The
  crypto webhook fails closed in production without this.

## 6. Bring up the app + Caddy

```bash
cd /srv/fitclub-os/infra/vps
docker compose -f docker-compose.app.yml --env-file .env.production up -d --build
docker compose -f docker-compose.app.yml logs -f web
```

Caddy will provision a Let's Encrypt cert for `$DOMAIN` on first request.
Visit `https://<domain>/login`, sign in with the admin you created in
step 4. You should land on `/admin`.

## 7. (Optional) Expose Supabase Studio behind Caddy

Add a second site block to `Caddyfile`:

```
supabase.fitclub.example.com {
    reverse_proxy localhost:3000  # Supabase Studio
    basicauth /* {
        admin <bcrypt-hash>
    }
}
```

Generate the bcrypt hash with `docker run --rm caddy:2 caddy hash-password
--plaintext '<password>'`. Reload Caddy:

```bash
docker compose -f docker-compose.app.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## Upgrades

```bash
cd /srv/fitclub-os
git pull
cd infra/vps
docker compose -f docker-compose.app.yml up -d --build web

# DB schema migrations:
pnpm --filter @fitness/db migrate
```

## Backups (minimum viable)

```bash
# Daily pg_dump to /var/backups
echo '0 3 * * * docker exec supabase-db pg_dump -U postgres postgres \
  | gzip > /var/backups/fitclub-$(date +\%F).sql.gz' | crontab -

# Rotate (keep 14 days):
find /var/backups -name 'fitclub-*.sql.gz' -mtime +14 -delete
```

## Troubleshooting

- **`MIDDLEWARE_INVOCATION_FAILED`** at `/admin`: Supabase env vars missing
  in `.env.production`. Edit, then
  `docker compose -f docker-compose.app.yml up -d --build web`.
- **Crypto webhook returns 503**: `CRYPTO_WEBHOOK_SECRET` is unset.
  Generate one, redeploy.
- **Caddy can't get TLS cert**: confirm DNS resolves to the VPS, and that
  port 80/443 are open in your firewall (`ufw allow 80,443/tcp`).
- **Postgres OOM on small VPS**: Supabase's `analytics` (logflare) container
  is heavy. If you don't need it, set `ENABLE_ANALYTICS=false` in the
  Supabase `.env` and `docker compose down && up -d`.

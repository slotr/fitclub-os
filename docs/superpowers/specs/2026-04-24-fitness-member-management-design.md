# Fitness Member Management Platform — Design

**Date:** 2026-04-24
**Status:** Draft for review
**Owner:** hhhkaraca@gmail.com

## 1. Goal

Build a fitness member management platform that runs a hybrid fitness business
(open gym + group classes + personal training). Web admin for the operator,
native-feeling mobile app for members. Members register, pay subscriptions, book
classes, follow events, and check in at the door via a rotating QR code.
Notifications are delivered through push, email, WhatsApp, and Telegram.

## 2. Decisions Captured From Brainstorm

| Topic | Decision |
|---|---|
| Business type | Hybrid: open gym + class booking + PT packages |
| Tenancy | Single tenant in production, multi-tenant ready architecture |
| Stack | Next.js 15 (web) + Expo SDK 51+ (mobile) + Supabase Postgres |
| Hosting | Vercel + Supabase |
| Payments | Stripe (Checkout + Subscriptions + Customer Portal) |
| Notifications | Push (Expo) + Email (Resend) + WhatsApp (Twilio) + Telegram (Bot API) |
| QR strategy | Rotating TOTP, 30s window, replay-protected |
| Build approach | Phased monorepo (Turborepo), 4 phases over 12-16 weeks |
| Language | English only (UI + emails + templates) |
| MVP extras | Group class booking + dunning automation |

## 3. Architecture

### 3.1 Monorepo layout

```
apps/
  web/       Next.js 15 (App Router) - admin + checkout + scanner PWA
  mobile/    Expo (expo-router) - member app
packages/
  db/        Drizzle schema, migrations, seed
  api/       Zod schemas, shared types, server actions surface
  ui/        Shared design tokens (web) + shadcn/ui setup
  emails/    React Email templates (rendered server-side via Resend)
  notify/    Channel adapters (push, email, whatsapp, telegram)
infra/
  supabase/  RLS policies, functions, migrations mirrored
```

### 3.2 Component diagram

```
+-----------------------------------------------------------+
|                      CLIENTS                              |
| [Member Mobile (Expo)]   [Admin Web]   [Door Scanner PWA] |
+-----------------------------------------------------------+
                          |
                  HTTPS + auth headers
                          v
+-----------------------------------------------------------+
| Next.js (Vercel) - API routes + Server Actions            |
| /api/auth /api/qr /api/checkin /api/billing /api/classes  |
| /api/notify /api/webhooks/stripe /api/webhooks/twilio     |
+-----------------------------------------------------------+
        |                   |                    |
        v                   v                    v
+----------------+   +------------------+   +-----------------+
| Supabase       |   | Job Queue        |   | External APIs   |
| Postgres + RLS |<->| pg-boss on       |   | Stripe          |
| Auth           |   | Postgres         |   | Twilio (WA)     |
| Storage        |   | - notifications  |   | Telegram Bot    |
| Realtime       |   | - dunning retry  |   | Resend (mail)   |
+----------------+   | - waitlist promo |   | Expo Push       |
                     | - reminders cron |   +-----------------+
                     +------------------+
```

### 3.3 Cross-cutting choices

- **Auth:** Supabase Auth. Members use phone OTP, admins/staff use email +
  password (with optional 2FA). Roles: `admin`, `staff`, `instructor`, `member`.
- **Tenant resolution:** middleware reads authenticated session, sets
  `app.tenant_id` Postgres setting; RLS policies filter every query.
- **Job queue:** pg-boss on the same Postgres instance. Single worker process
  on Vercel Cron (lightweight) plus a long-running worker on a small VPS or
  Supabase Edge Functions for higher-throughput jobs.
- **Realtime:** Supabase channels for the admin check-in feed and live
  attendance counts.
- **Observability:** Sentry (errors), PostHog (product + session replay),
  Supabase logs.

## 4. Data Model

All tables include `tenant_id uuid not null` with RLS:
`USING (tenant_id = current_setting('app.tenant_id')::uuid)`.

### 4.1 Core tables

```
tenants                 (id, name, slug, brand_color, logo_url, timezone, locale, created_at)
members                 (id, tenant_id, auth_user_id, email, phone, full_name, birthdate,
                         gender, photo_url, qr_secret_enc, joined_at, status, deleted_at)
plans                   (id, tenant_id, name, price_minor, currency, duration_days,
                         features jsonb, active, created_at)
memberships             (id, member_id, plan_id, status enum(active|paused|past_due|cancelled),
                         started_at, ends_at, paused_at, stripe_subscription_id, auto_renew,
                         last_invoice_id, created_at)
payments                (id, member_id, amount_minor, currency, stripe_invoice_id,
                         status enum(paid|failed|refunded), paid_at, attempt_count, created_at)
audit_logs              (id, tenant_id, actor_id, action, target_type, target_id, ip,
                         user_agent, payload jsonb, created_at)
```

### 4.2 Classes & events

```
instructors             (id, tenant_id, full_name, bio, photo_url, email, phone, active)
classes                 (id, tenant_id, name, description, default_capacity,
                         default_duration_min, color, active)
class_sessions          (id, class_id, starts_at, ends_at, capacity, location,
                         instructor_id, status enum(scheduled|cancelled), created_at)
bookings                (id, session_id, member_id,
                         status enum(confirmed|waitlist|cancelled|attended|no_show),
                         position int null, created_at, attended_at,
                         UNIQUE (session_id, member_id))
events                  (id, tenant_id, title, description, starts_at, ends_at, location,
                         capacity, hero_image_url, type enum(open_gym|class|seminar))
event_rsvps             (id, event_id, member_id, status, created_at)
```

### 4.3 Operations

```
checkins                (id, member_id, tenant_id, checked_in_at, source enum(qr|manual|kiosk),
                         gate_id, token_hash,
                         UNIQUE (member_id, token_hash))
notification_channels   (id, member_id, type enum(push|email|whatsapp|telegram),
                         address, verified, opted_in, opted_in_marketing, created_at)
notifications           (id, member_id, channel, template_id, locale, payload jsonb,
                         status enum(pending|sent|delivered|failed|read),
                         sent_at, error, idempotency_key UNIQUE)
dunning_attempts        (id, payment_id, attempt_no, next_retry_at, succeeded, created_at)
```

### 4.4 Indexes (high-traffic)

- `checkins (tenant_id, checked_in_at desc)` — admin live feed
- `bookings (session_id, status, position)` — waitlist promotion
- `class_sessions (tenant_id, starts_at)` — schedule view
- `notifications (status, created_at)` — queue scanning
- `members (tenant_id, status, joined_at desc)` — admin lists

### 4.5 Encryption & PII

- `members.qr_secret_enc` is encrypted with `pgcrypto` using a key referenced
  through Supabase Vault (KMS-managed).
- PII columns (email, phone, birthdate, photo_url) — admin reads are written
  to `audit_logs` for KVKK/GDPR traceability.
- Soft delete uses `deleted_at`; a daily worker hard-deletes records older
  than 30 days post-deletion.

## 5. Critical Flows

### 5.1 Member onboarding + QR setup

1. Mobile: phone OTP login (Supabase Auth).
2. Mobile: complete profile (full name, birthdate, email).
3. Mobile: pick a plan, open Stripe Checkout in an in-app browser.
4. Stripe webhook `checkout.session.completed` → create `memberships` row,
   status `active`.
5. Server generates `qr_secret` (32 bytes random), encrypts, stores.
6. Mobile calls `GET /api/qr/secret` once, stores raw secret in Expo
   `SecureStore`.
7. Mobile generates a TOTP code every 30s; renders a QR encoding
   `{member_id, totp}` with a countdown ring.
8. Door scanner PWA reads the QR, posts `{member_id, totp}` to
   `POST /api/checkin`.
9. Server validates TOTP (window=1), enforces idempotency via
   `(member_id, sha256(totp))`, inserts `checkins` row, broadcasts on a
   Supabase channel for the admin feed.

### 5.2 Class booking + waitlist auto-promote

1. Mobile fetches sessions in date range.
2. Booking endpoint runs in a transaction:
   - `SELECT count(*) FROM bookings WHERE session_id = $1 AND status='confirmed' FOR UPDATE`.
   - If under capacity: status `confirmed`.
   - Else: status `waitlist`, `position = max(position) + 1`.
3. Notification sent (push + email) keyed off final status.
4. On cancellation: trigger fires `pg_notify('waitlist_promote', session_id)`.
5. Worker picks the smallest `position`, promotes to `confirmed`, sends a push
   + WhatsApp template (`waitlist_promoted`).
6. Cron at `session.starts_at − 1h` sends a push reminder to all confirmed
   bookings.
7. Instructor app marks `attended` / `no_show` after the session.

### 5.3 Stripe billing + dunning

1. `invoice.paid` webhook → `payments.status='paid'` → email receipt.
2. `invoice.payment_failed` webhook →
   - Insert `dunning_attempts` row #1.
   - Schedule pg-boss retry at +24h.
   - Send push + email + WhatsApp: card update prompt, link to Stripe Customer
     Portal.
3. Retry #2 at +72h on continued failure; row #2 inserted.
4. Retry #3 at +168h (7d); row #3 inserted; `memberships.status='past_due'`.
5. Final failure → `memberships.status='cancelled'`, QR check-in denied at
   the API layer; final notification sent.
6. Retry schedule (`1d / 3d / 7d`) is configurable per tenant via admin
   settings; defaults are documented.

## 6. Notification System

### 6.1 Routing

`sendNotification(member_id, template_id, data)` walks
`notification_channels` (verified + opted in), applies the per-category rule,
enqueues one pg-boss job per channel. Each job updates the matching
`notifications` row through state transitions
`pending → sent → delivered → read` (or `failed`).

| Category | Channels | Notes |
|---|---|---|
| Critical (payment_failed, membership_cancelled) | All channels | Always sent |
| Transactional (receipt, booking_confirmed) | Email + push | Default |
| Reminders (class_reminder_1h) | Push (+ WhatsApp if opted in) | |
| Marketing (event_announcement, promo) | Push + WhatsApp | Marketing opt-in required |

### 6.2 Templates

- Single locale: `en`. Tables hold `locale` for forward compatibility but no
  Turkish or other locales ship in v1.
- WhatsApp: pre-approved templates registered in Meta Business Manager;
  template IDs and variable shapes live in `packages/notify/templates`.
- Email: React Email components rendered server-side; Resend handles delivery
  and tracking.
- Push: Expo Push API; payload contains `title`, `body`, deep link
  (`fitness://booking/123`).
- Telegram: `sendMessage` with Markdown body and inline buttons (web app open
  for richer flows).

### 6.3 Member preferences

Mobile settings expose:
- Per-channel toggle (push / email / WhatsApp / Telegram).
- Per-category opt-in (marketing requires explicit consent — KVKK).
- Quiet hours `22:00–08:00` defer non-critical notifications.

### 6.4 Template list (v1)

`welcome`, `subscription_active`, `payment_failed`, `retry_scheduled`,
`membership_cancelled`, `booking_confirmed`, `booking_waitlist`,
`waitlist_promoted`, `class_reminder_1h`, `class_cancelled`,
`event_announcement`. Internal-only events (e.g. successful check-in) write
to `audit_logs` but do not send a notification.

## 7. Visual Design

- **Theme:** modern light. Background `#fafaf9` (warm white), text `#1a1a1a`.
  Single accent color per tenant (default amber).
- **Typography:** Inter on web, SF Pro / system on mobile. Four sizes, three
  weights (400 / 500 / 700).
- **Spacing:** 4px grid (`4 / 8 / 12 / 16 / 24 / 32`).
- **Radius:** `8 / 12 / 16 / 24` (cards 12-16, modals 24).
- **Components:** shadcn/ui (web) and NativeWind on Expo with shared design
  tokens published from `packages/ui`.
- **Tenant theming:** `tenants.brand_color` maps to a CSS variable / mobile
  theme constant. Only the accent shifts; structure is identical.
- **Mobile primary screens:** Home (greeting + rotating QR + week stats +
  next class), Classes (day tabs + cards with capacity + status pill),
  Membership (current plan card + payment history + manage button), Profile
  (settings + notification preferences).
- **Admin primary screens:** Dashboard (KPIs + live check-in feed), Members,
  Classes, Events, Payments, Notifications, Reports, Settings.

## 8. Phase Plan

12-16 weeks total. Each phase is independently shippable.

### Phase 1 — Foundation + Web Admin (3-4 weeks)

Goal: operator can run a small gym from the web admin alone — manage members,
plans, memberships, manual check-ins, Stripe billing.

- Turborepo + pnpm workspaces, Next.js 15 + Tailwind + shadcn/ui.
- Drizzle schema (tenants, members, plans, memberships, payments, audit_logs)
  + RLS policies + seed.
- Supabase Auth (admin role), web admin shell, dashboard, members CRUD,
  plans CRUD, memberships management, manual check-in, audit log viewer.
- Stripe Customer + Subscription + Checkout integration; idempotent webhook
  handler; receipt email via Resend + React Email.
- Vercel deploy; Sentry + PostHog wired.

**Done when:** an operator can sell a subscription and run a gym manually
through web admin only.

### Phase 2 — Member Mobile + QR (3-4 weeks)

Goal: member self-onboards, pays via Stripe, gets a rotating QR, checks in
at the door.

- Expo SDK 51+, expo-router, NativeWind sharing tokens with web. EAS build,
  TestFlight + Play internal track.
- Phone OTP login, profile completion, plan picker → Stripe Checkout, welcome
  + permissions screens.
- QR pipeline: server-side `qr_secret` generation + pgcrypto encryption,
  one-time secret fetch to mobile, TOTP rendering with countdown ring,
  SecureStore persistence.
- Door scanner PWA on `/scanner` (camera scan, posts to `/api/checkin`),
  realtime feed in admin dashboard.
- Expo push token registration, in-app notification center.

**Done when:** member onboards, pays, walks in, QR scans, admin sees the
event live.

### Phase 3 — Classes + Events + WhatsApp/Telegram (3-4 weeks)

Goal: classes can be browsed and booked, waitlist auto-promotes, events are
listed, WhatsApp + Telegram channels live.

- Tables and admin CRUD for instructors, classes, sessions (with recurring
  generator), bookings, events.
- Mobile: schedule (day/week), book/cancel with optimistic UI, capacity +
  waitlist transactional logic, class detail.
- Waitlist promotion via Postgres `NOTIFY` + worker; push + WhatsApp template
  on promote.
- Twilio account, WhatsApp Business sender, Meta-approved templates, send
  job, delivery status webhook, member opt-in flow.
- Telegram bot creation, `/start` binding via deep link, `chat_id` stored on
  `notification_channels`, `sendMessage` job.
- Cron reminder at session start −1h.

**Done when:** member books a class, WhatsApp confirmation arrives, push
reminder fires before the class, attendance is tracked.

### Phase 4 — Dunning + Reports + Multi-tenant Prep (2-3 weeks)

Goal: failed payments handled automatically, operator sees real reports,
architecture is multi-tenant ready (still single tenant in production).

- `dunning_attempts` state machine, custom retry schedule (1d/3d/7d) on
  pg-boss, per-attempt notifications, membership status transitions, Customer
  Portal link in notifications.
- Reports: MRR/ARR over time, churn (cohort + monthly), attendance heatmap,
  class fill rates, revenue by plan, CSV export.
- Multi-tenant prep: tenant resolution middleware (subdomain → tenant_id),
  RLS audit, tenant-scoped storage paths, internal onboarding doc.
- Polish: empty states, skeletons, error boundaries, optimistic states,
  WCAG AA accessibility pass.

**Done when:** production-ready single tenant with revenue protection and
operator visibility; adding tenant #2 is a config change.

### Cross-cutting (every phase)

- Tests: vitest unit + integration (Supabase local), Playwright (web E2E),
  Maestro (mobile E2E).
- CI: GitHub Actions — lint, typecheck, test, Drizzle migrate dry-run.
- Migrations: Drizzle migrations in repo, deploy gated on success.

## 9. Testing Strategy

| Layer | Tool | Coverage |
|---|---|---|
| Unit | vitest | TOTP, dunning state machine, template rendering, capacity logic |
| Integration | vitest + supabase-js | Real Postgres, RLS leak tests, booking transactions, webhook idempotency |
| Contract | zod + typed clients | Request/response shape, no client-server drift |
| E2E web | Playwright | Admin login → plan → member → checkout (Stripe test) → active membership |
| E2E mobile | Maestro | Onboarding → QR generation → scanner check-in fixture → push delivered |
| Load | k6 | Check-in spike (~50 req/s sustained), webhook bursts |
| Security | Semgrep, npm audit, OWASP ZAP | Static, dependencies, basic OWASP scan |

## 10. Security & Privacy

### 10.1 Auth & access
- Supabase Auth: phone OTP for members, email + password for admins/staff
  (optional 2FA).
- Roles: admin / staff / instructor / member, with RLS policies enforcing
  tenant isolation on every table.
- Tenant resolution always derived from authenticated session, never from a
  client-provided header.

### 10.2 Secrets & data
- Stripe webhook signature verified on every event.
- Twilio request signature and Telegram secret token validated.
- `qr_secret_enc` encrypted at rest (pgcrypto + KMS-managed key in Supabase
  Vault).
- No secrets in client bundles; `process.env.*` server-only.

### 10.3 QR replay & abuse prevention
- TOTP window=1 (30s tolerance only).
- `checkins (member_id, token_hash)` UNIQUE rejects replays.
- Rate limit on `/api/checkin` (5 attempts / 5min / member).
- Membership status checked on every check-in; `cancelled` / `past_due`
  blocked.

### 10.4 Payments
- PCI scope minimised by using Stripe Checkout and Customer Portal — card
  data never touches our servers.
- Idempotency keys on outbound Stripe API calls.
- Inbound webhook handler keyed by `event.id` for idempotency.

### 10.5 Privacy (KVKK/GDPR)
- Consent capture at signup: terms, privacy, marketing opt-in stored
  separately.
- Member data export endpoint (JSON).
- Soft delete + 30-day grace + hard-delete worker for right-to-erasure.
- Audit logs on every admin read of PII.

### 10.6 Operational
- Daily Supabase PITR backups.
- Documented secret rotation playbook (Stripe, Twilio, Supabase, Telegram).
- Sentry alerts on auth and billing errors.
- Read-only DB role for analytics and support.

## 11. Failure Modes

| Scenario | Behavior |
|---|---|
| Stripe down | Checkout disabled, banner shown, existing memberships unaffected |
| Twilio / WhatsApp down | `notifications.status='failed'`, pg-boss retries 3×; push + email still go |
| Telegram bot down | Same as above; degrade quietly |
| Supabase realtime down | Admin feed falls back to 5s polling; bookings still work over HTTP |
| Stale push token | `notification_channels.verified=false`; re-register on next login |
| DB primary unavailable | Read-only banner; bookings and writes disabled until restored |
| Member mobile offline | QR keeps rotating (TOTP generated locally from cached secret) |
| Door scanner offline | Store-and-forward: signed local log of scans, sync to `/api/checkin` when connectivity returns |

## 12. Out of Scope (v1)

- Localization beyond English.
- Native iOS/Android (non-Expo) builds.
- Personal training session marketplace, trainer portal.
- Lead/CRM and marketing automations beyond manual events.
- Retail POS / inventory.
- Detailed body composition / progress tracking.
- Multiple production tenants (architecture supports it; only one tenant
  ships).
- SMS and Viber channels.

## 13. Open Questions

- WhatsApp BSP choice: Twilio assumed; if MessageBird or 360dialog is
  preferred, the adapter is a single module and can swap before phase 3.
- Door scanner hardware: assumed a tablet running the PWA. If specific
  turnstile / access-control hardware is required, that adds an integration
  layer in phase 2.
- Multi-tenant subdomain routing: agreed to be subdomain-based — tenant
  branding requires confirming whether a custom domain per tenant is needed
  later.

# Phase 1: Foundation + Web Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Turborepo monorepo with a Next.js admin web app that lets a single fitness operator manage members, plans, memberships, manual check-ins, and Stripe subscriptions, persisted in Supabase Postgres with RLS.

**Architecture:** Turborepo + pnpm workspaces. `apps/web` (Next.js 15 App Router) speaks to Supabase via the JS client and to Stripe via REST. `packages/db` owns the Drizzle schema and migrations. `packages/api` holds shared Zod schemas and types. `packages/emails` holds React Email templates rendered server-side via Resend. RLS policies enforce tenant isolation; admin access uses Supabase Auth with email + password.

**Tech Stack:** Turborepo, pnpm, TypeScript, Next.js 15, Tailwind CSS, shadcn/ui, Drizzle ORM, Supabase (Postgres + Auth + Storage), Stripe, Resend, React Email, Vitest, Playwright, Sentry, PostHog, GitHub Actions, Vercel.

**Spec reference:** `docs/superpowers/specs/2026-04-24-fitness-member-management-design.md`

---

## Prerequisites (one-time, manual)

The engineer needs accounts and CLI tools before starting.

- [ ] Install `node 20+`, `pnpm 9+`, `git`, `docker` (for Supabase local), `gh` CLI.
- [ ] Install Supabase CLI: `brew install supabase/tap/supabase`
- [ ] Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
- [ ] Create accounts: Supabase, Stripe (test mode), Resend, Sentry, PostHog, Vercel, GitHub.
- [ ] Create a Supabase project named `fitness-management-dev`. Capture the project URL, anon key, service role key, and database password.
- [ ] Create a Stripe account in test mode. Capture the publishable key and secret key.
- [ ] Create a Resend API key.
- [ ] Create a Sentry project (Next.js platform). Capture the DSN.
- [ ] Create a PostHog project (self-host or cloud). Capture the project key.

---

## Task 1: Initialize Turborepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.editorconfig`
- Create: `.nvmrc`
- Create: `.gitignore` (extend existing)
- Create: `.github/workflows/ci.yml` (placeholder, fleshed out later)

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "fitness-management",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rimraf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.1.3",
    "typescript": "^5.6.2",
    "rimraf": "^6.0.1"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: Create `.editorconfig` and `.nvmrc`**

`.editorconfig`:
```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

`.nvmrc`:
```
20
```

- [ ] **Step 6: Extend `.gitignore`**

Append to existing `.gitignore`:
```
# turbo
.turbo

# next
.next/
out/

# pnpm
.pnpm-store/

# IDE
.idea/
.vscode/

# OS
.DS_Store

# Build artifacts
dist/
*.tsbuildinfo
```

- [ ] **Step 7: Install root deps**

Run: `pnpm install`
Expected: lockfile created, `node_modules` populated.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .editorconfig .nvmrc .gitignore pnpm-lock.yaml
git commit -m "chore: initialize Turborepo monorepo with pnpm workspaces"
```

---

## Task 2: Bootstrap `packages/db`

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/.env.example`

- [ ] **Step 1: Create `packages/db/package.json`**

```json
{
  "name": "@fitness/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "push": "drizzle-kit push",
    "studio": "drizzle-kit studio",
    "seed": "tsx src/seed.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.36.4",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.1",
    "tsx": "^4.19.2",
    "typescript": "^5.6.2",
    "@types/node": "^22.7.5"
  }
}
```

- [ ] **Step 2: Create `packages/db/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `packages/db/.env.example`**

```
DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres
```

- [ ] **Step 4: Create `packages/db/drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 5: Create `packages/db/src/client.ts`**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDbClient(databaseUrl: string) {
  const sql = postgres(databaseUrl, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
  });
  return drizzle(sql, { schema, logger: false });
}

export type DbClient = ReturnType<typeof createDbClient>;
```

- [ ] **Step 6: Create `packages/db/src/index.ts`**

```ts
export * from "./schema";
export { createDbClient, type DbClient } from "./client";
```

- [ ] **Step 7: Install deps**

Run: `pnpm install --filter @fitness/db`

- [ ] **Step 8: Commit**

```bash
git add packages/db/
git commit -m "chore(db): scaffold Drizzle ORM package"
```

---

## Task 3: Define `tenants` table

**Files:**
- Create: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/schema/tenants.ts`
- Create: `packages/db/src/schema/_helpers.ts`
- Test: `packages/db/src/schema/__tests__/tenants.test.ts`

- [ ] **Step 1: Create `_helpers.ts` for shared columns**

```ts
import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

export const id = () =>
  uuid("id").primaryKey().default(sql`gen_random_uuid()`);

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const deletedAt = () =>
  timestamp("deleted_at", { withTimezone: true });
```

- [ ] **Step 2: Write the failing test for `tenants` schema**

`packages/db/src/schema/__tests__/tenants.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { tenants } from "../tenants";

describe("tenants schema", () => {
  it("declares required columns", () => {
    const cols = Object.keys(tenants);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "name",
        "slug",
        "brandColor",
        "logoUrl",
        "timezone",
        "locale",
        "createdAt",
      ]),
    );
  });

  it("uses uuid for id", () => {
    expect(tenants.id.dataType).toBe("string");
  });
});
```

- [ ] **Step 3: Add vitest to `packages/db`**

Update `packages/db/package.json` `devDependencies`:
```json
"vitest": "^2.1.4"
```

Add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Run: `pnpm install --filter @fitness/db`

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter @fitness/db test`
Expected: FAIL — `Cannot find module '../tenants'`.

- [ ] **Step 5: Implement `tenants.ts`**

```ts
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";

export const tenants = pgTable("tenants", {
  id: id(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  brandColor: varchar("brand_color", { length: 16 }).notNull().default("#f59e0b"),
  logoUrl: text("logo_url"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  locale: varchar("locale", { length: 8 }).notNull().default("en"),
  createdAt: createdAt(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
```

- [ ] **Step 6: Create `schema/index.ts` barrel**

```ts
export * from "./tenants";
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm --filter @fitness/db test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add tenants table"
```

---

## Task 4: Define `members` table

**Files:**
- Create: `packages/db/src/schema/members.ts`
- Modify: `packages/db/src/schema/index.ts`
- Test: `packages/db/src/schema/__tests__/members.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/db/src/schema/__tests__/members.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { members, memberStatusEnum } from "../members";

describe("members schema", () => {
  it("declares required columns", () => {
    const cols = Object.keys(members);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "authUserId",
        "email",
        "phone",
        "fullName",
        "birthdate",
        "gender",
        "photoUrl",
        "qrSecretEnc",
        "joinedAt",
        "status",
        "deletedAt",
      ]),
    );
  });

  it("exposes the status enum", () => {
    expect(memberStatusEnum.enumValues).toEqual(["active", "inactive", "pending"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @fitness/db test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `members.ts`**

```ts
import { sql } from "drizzle-orm";
import {
  customType,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id } from "./_helpers";
import { tenants } from "./tenants";

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "pending",
]);

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

export const members = pgTable(
  "members",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    authUserId: uuid("auth_user_id"),
    email: varchar("email", { length: 256 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    fullName: text("full_name").notNull(),
    birthdate: date("birthdate"),
    gender: varchar("gender", { length: 16 }),
    photoUrl: text("photo_url"),
    qrSecretEnc: bytea("qr_secret_enc"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    status: memberStatusEnum("status").notNull().default("pending"),
    deletedAt: deletedAt(),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantEmailUnique: uniqueIndex("members_tenant_email_uniq").on(
      t.tenantId,
      t.email,
    ),
    tenantStatusIdx: index("members_tenant_status_idx").on(t.tenantId, t.status),
  }),
);

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
```

- [ ] **Step 4: Add to `schema/index.ts`**

```ts
export * from "./tenants";
export * from "./members";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @fitness/db test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add members table"
```

---

## Task 5: Define `plans`, `memberships`, `payments` tables

**Files:**
- Create: `packages/db/src/schema/plans.ts`
- Create: `packages/db/src/schema/memberships.ts`
- Create: `packages/db/src/schema/payments.ts`
- Modify: `packages/db/src/schema/index.ts`
- Test: `packages/db/src/schema/__tests__/billing.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/db/src/schema/__tests__/billing.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { plans } from "../plans";
import { memberships, membershipStatusEnum } from "../memberships";
import { payments, paymentStatusEnum } from "../payments";

describe("plans schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(plans)).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "name",
        "priceMinor",
        "currency",
        "durationDays",
        "features",
        "active",
      ]),
    );
  });
});

describe("memberships schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(memberships)).toEqual(
      expect.arrayContaining([
        "id",
        "memberId",
        "planId",
        "status",
        "startedAt",
        "endsAt",
        "pausedAt",
        "stripeSubscriptionId",
        "autoRenew",
        "lastInvoiceId",
      ]),
    );
  });

  it("exposes the status enum", () => {
    expect(membershipStatusEnum.enumValues).toEqual([
      "active",
      "paused",
      "past_due",
      "cancelled",
    ]);
  });
});

describe("payments schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(payments)).toEqual(
      expect.arrayContaining([
        "id",
        "memberId",
        "amountMinor",
        "currency",
        "stripeInvoiceId",
        "status",
        "paidAt",
        "attemptCount",
      ]),
    );
  });

  it("exposes the status enum", () => {
    expect(paymentStatusEnum.enumValues).toEqual(["paid", "failed", "refunded"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @fitness/db test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `plans.ts`**

```ts
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { tenants } from "./tenants";

export const plans = pgTable("plans", {
  id: id(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  priceMinor: integer("price_minor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  durationDays: integer("duration_days").notNull(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  stripePriceId: text("stripe_price_id"),
  createdAt: createdAt(),
});

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
```

- [ ] **Step 4: Implement `memberships.ts`**

```ts
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { members } from "./members";
import { plans } from "./plans";

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "paused",
  "past_due",
  "cancelled",
]);

export const memberships = pgTable("memberships", {
  id: id(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "restrict" }),
  status: membershipStatusEnum("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  pausedAt: timestamp("paused_at", { withTimezone: true }),
  stripeSubscriptionId: text("stripe_subscription_id"),
  autoRenew: boolean("auto_renew").notNull().default(true),
  lastInvoiceId: text("last_invoice_id"),
  createdAt: createdAt(),
});

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
```

- [ ] **Step 5: Implement `payments.ts`**

```ts
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { members } from "./members";

export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "failed",
  "refunded",
]);

export const payments = pgTable("payments", {
  id: id(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  amountMinor: integer("amount_minor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  status: paymentStatusEnum("status").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  attemptCount: integer("attempt_count").notNull().default(1),
  createdAt: createdAt(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
```

- [ ] **Step 6: Update `schema/index.ts`**

```ts
export * from "./tenants";
export * from "./members";
export * from "./plans";
export * from "./memberships";
export * from "./payments";
```

- [ ] **Step 7: Run tests**

Run: `pnpm --filter @fitness/db test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add plans, memberships, payments tables"
```

---

## Task 6: Define `audit_logs` table

**Files:**
- Create: `packages/db/src/schema/auditLogs.ts`
- Modify: `packages/db/src/schema/index.ts`
- Test: `packages/db/src/schema/__tests__/auditLogs.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/db/src/schema/__tests__/auditLogs.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { auditLogs } from "../auditLogs";

describe("auditLogs schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(auditLogs)).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "actorId",
        "action",
        "targetType",
        "targetId",
        "ip",
        "userAgent",
        "payload",
        "createdAt",
      ]),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @fitness/db test`
Expected: FAIL.

- [ ] **Step 3: Implement `auditLogs.ts`**

```ts
import {
  index,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { tenants } from "./tenants";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id"),
    action: varchar("action", { length: 64 }).notNull(),
    targetType: varchar("target_type", { length: 32 }).notNull(),
    targetId: uuid("target_id"),
    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantCreatedIdx: index("audit_tenant_created_idx").on(
      t.tenantId,
      t.createdAt,
    ),
    targetIdx: index("audit_target_idx").on(t.targetType, t.targetId),
  }),
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
```

- [ ] **Step 4: Update `schema/index.ts`**

```ts
export * from "./tenants";
export * from "./members";
export * from "./plans";
export * from "./memberships";
export * from "./payments";
export * from "./auditLogs";
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @fitness/db test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add audit_logs table"
```

---

## Task 7: Generate initial migration

**Files:**
- Create: `packages/db/migrations/0000_*.sql` (auto-generated)
- Create: `packages/db/migrations/meta/_journal.json` (auto-generated)

- [ ] **Step 1: Start Supabase local stack**

Run from repo root:
```bash
supabase init
supabase start
```

Capture the printed `DB URL` (typically `postgresql://postgres:postgres@127.0.0.1:54322/postgres`).

- [ ] **Step 2: Set DATABASE_URL for db package**

Create `packages/db/.env.local`:
```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

- [ ] **Step 3: Generate migration**

Run:
```bash
cd packages/db
pnpm dlx dotenv-cli -e .env.local -- pnpm generate
```
Expected: A `migrations/0000_*.sql` file is produced. Inspect it to confirm tables match the schema.

- [ ] **Step 4: Apply migration to local Supabase**

Run:
```bash
pnpm dlx dotenv-cli -e .env.local -- pnpm migrate
```
Expected: Output like `Applied 1 migration`.

- [ ] **Step 5: Verify in psql**

Run:
```bash
psql "$DATABASE_URL" -c "\dt"
```
Expected: All six tables listed plus the Drizzle `__drizzle_migrations` table.

- [ ] **Step 6: Commit**

```bash
git add packages/db/migrations/
git commit -m "feat(db): generate initial schema migration"
```

---

## Task 8: Add RLS helper SQL and policies

**Files:**
- Create: `infra/supabase/policies/0001_rls_setup.sql`
- Create: `infra/supabase/policies/0002_tenant_policies.sql`
- Create: `packages/db/src/__tests__/rls.test.ts`

- [ ] **Step 1: Write the RLS setup SQL**

`infra/supabase/policies/0001_rls_setup.sql`:
```sql
-- Enable RLS on every tenant-scoped table
alter table public.tenants enable row level security;
alter table public.members enable row level security;
alter table public.plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

-- Helper to read the current tenant id from a per-request setting
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.tenant_id', true), '')::uuid
$$;
```

- [ ] **Step 2: Write tenant policies**

`infra/supabase/policies/0002_tenant_policies.sql`:
```sql
-- tenants: only owning tenant can read
create policy tenants_select on public.tenants
  for select using (id = public.current_tenant_id());

-- members
create policy members_select on public.members
  for select using (tenant_id = public.current_tenant_id());
create policy members_modify on public.members
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- plans
create policy plans_select on public.plans
  for select using (tenant_id = public.current_tenant_id());
create policy plans_modify on public.plans
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- memberships (joined through members)
create policy memberships_select on public.memberships
  for select using (
    exists (
      select 1 from public.members m
      where m.id = memberships.member_id
        and m.tenant_id = public.current_tenant_id()
    )
  );
create policy memberships_modify on public.memberships
  for all using (
    exists (
      select 1 from public.members m
      where m.id = memberships.member_id
        and m.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from public.members m
      where m.id = memberships.member_id
        and m.tenant_id = public.current_tenant_id()
    )
  );

-- payments (joined through members)
create policy payments_select on public.payments
  for select using (
    exists (
      select 1 from public.members m
      where m.id = payments.member_id
        and m.tenant_id = public.current_tenant_id()
    )
  );
create policy payments_modify on public.payments
  for all using (
    exists (
      select 1 from public.members m
      where m.id = payments.member_id
        and m.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from public.members m
      where m.id = payments.member_id
        and m.tenant_id = public.current_tenant_id()
    )
  );

-- audit_logs
create policy audit_logs_select on public.audit_logs
  for select using (tenant_id = public.current_tenant_id());
create policy audit_logs_insert on public.audit_logs
  for insert with check (tenant_id = public.current_tenant_id());
```

- [ ] **Step 3: Apply policies to local DB**

Run:
```bash
psql "$DATABASE_URL" -f infra/supabase/policies/0001_rls_setup.sql
psql "$DATABASE_URL" -f infra/supabase/policies/0002_tenant_policies.sql
```
Expected: No errors.

- [ ] **Step 4: Write the failing RLS test**

`packages/db/src/__tests__/rls.test.ts`:
```ts
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDbClient } from "../client";
import { members, tenants } from "../schema";

const databaseUrl = process.env.DATABASE_URL!;

describe("RLS isolates tenants", () => {
  const db = createDbClient(databaseUrl);
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    const [a] = await db
      .insert(tenants)
      .values({ name: "Tenant A", slug: `a-${Date.now()}` })
      .returning();
    const [b] = await db
      .insert(tenants)
      .values({ name: "Tenant B", slug: `b-${Date.now()}` })
      .returning();
    tenantA = a!.id;
    tenantB = b!.id;
    await db.insert(members).values([
      { tenantId: tenantA, email: "a@x.com", fullName: "A One" },
      { tenantId: tenantB, email: "b@x.com", fullName: "B One" },
    ]);
  });

  afterAll(async () => {
    await db.delete(members);
    await db.delete(tenants);
  });

  it("a tenant only sees its own members", async () => {
    await db.execute(sql`set local app.tenant_id = ${tenantA}`);
    await db.execute(sql`set local role authenticated`);
    const visible = await db.select().from(members);
    expect(visible.every((m) => m.tenantId === tenantA)).toBe(true);
    expect(visible.length).toBe(1);
  });
});
```

- [ ] **Step 5: Run test to verify it fails (no `authenticated` role yet, or insertion bypasses RLS)**

Run: `pnpm --filter @fitness/db test`
Expected: It currently fails or returns 0 rows because the seed insert was done as the `postgres` superuser but the assertion runs under `authenticated`.

- [ ] **Step 6: Adjust test to use service role for setup, authenticated for assert**

Update the test to wrap reads in a transaction:
```ts
it("a tenant only sees its own members", async () => {
  await db.transaction(async (tx) => {
    await tx.execute(sql`set local role authenticated`);
    await tx.execute(sql`set local app.tenant_id = ${tenantA}`);
    const visible = await tx.select().from(members);
    expect(visible.every((m) => m.tenantId === tenantA)).toBe(true);
    expect(visible.length).toBe(1);
  });
});
```

- [ ] **Step 7: Run test, expect PASS**

Run: `pnpm --filter @fitness/db test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add infra/supabase/policies/ packages/db/src/__tests__/rls.test.ts
git commit -m "feat(db): enable RLS and tenant policies for core tables"
```

---

## Task 9: Seed script

**Files:**
- Create: `packages/db/src/seed.ts`

- [ ] **Step 1: Implement seed script**

```ts
import "dotenv/config";
import { createDbClient } from "./client";
import { tenants, plans, members, memberships } from "./schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");
  const db = createDbClient(databaseUrl);

  console.log("Seeding demo tenant...");
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Demo Fitness Club",
      slug: "demo",
      timezone: "Europe/Istanbul",
      brandColor: "#f59e0b",
    })
    .returning();
  if (!tenant) throw new Error("tenant insert failed");

  const [basic, premium] = await db
    .insert(plans)
    .values([
      {
        tenantId: tenant.id,
        name: "Basic Monthly",
        priceMinor: 49900,
        currency: "USD",
        durationDays: 30,
        features: ["Open gym access"],
      },
      {
        tenantId: tenant.id,
        name: "Premium Monthly",
        priceMinor: 89900,
        currency: "USD",
        durationDays: 30,
        features: ["Open gym", "All classes", "Locker"],
      },
    ])
    .returning();
  if (!basic || !premium) throw new Error("plans insert failed");

  const [demoMember] = await db
    .insert(members)
    .values({
      tenantId: tenant.id,
      email: "demo@fitness.local",
      fullName: "Demo Member",
      status: "active",
    })
    .returning();
  if (!demoMember) throw new Error("member insert failed");

  await db.insert(memberships).values({
    memberId: demoMember.id,
    planId: premium.id,
    status: "active",
    startedAt: new Date(),
  });

  console.log(`Seeded tenant ${tenant.slug} with member ${demoMember.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add `dotenv` dep**

Update `packages/db/package.json` `dependencies`:
```json
"dotenv": "^16.4.5"
```
Run: `pnpm install --filter @fitness/db`

- [ ] **Step 3: Run seed**

```bash
cd packages/db
pnpm dlx dotenv-cli -e .env.local -- pnpm seed
```
Expected: `Seeded tenant demo with member demo@fitness.local`

- [ ] **Step 4: Verify**

```bash
psql "$DATABASE_URL" -c "select slug from tenants;"
```
Expected: `demo`

- [ ] **Step 5: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add seed script for demo tenant"
```

---

## Task 10: Bootstrap `packages/api`

**Files:**
- Create: `packages/api/package.json`
- Create: `packages/api/tsconfig.json`
- Create: `packages/api/src/index.ts`
- Create: `packages/api/src/schemas/member.ts`
- Test: `packages/api/src/schemas/__tests__/member.test.ts`

- [ ] **Step 1: Create `packages/api/package.json`**

```json
{
  "name": "@fitness/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "vitest": "^2.1.4",
    "typescript": "^5.6.2"
  }
}
```

- [ ] **Step 2: Create `packages/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write the failing test**

`packages/api/src/schemas/__tests__/member.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createMemberInput } from "../member";

describe("createMemberInput", () => {
  it("accepts a valid payload", () => {
    const r = createMemberInput.safeParse({
      email: "x@y.com",
      fullName: "Jane Doe",
      phone: "+15551234567",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = createMemberInput.safeParse({
      email: "not-an-email",
      fullName: "Jane Doe",
    });
    expect(r.success).toBe(false);
  });

  it("requires fullName non-empty", () => {
    const r = createMemberInput.safeParse({ email: "x@y.com", fullName: "" });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter @fitness/api test`
Expected: FAIL.

- [ ] **Step 5: Implement schema**

`packages/api/src/schemas/member.ts`:
```ts
import { z } from "zod";

export const createMemberInput = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/u)
    .optional(),
  birthdate: z.string().date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export const updateMemberInput = createMemberInput.partial();

export type CreateMemberInput = z.infer<typeof createMemberInput>;
export type UpdateMemberInput = z.infer<typeof updateMemberInput>;
```

- [ ] **Step 6: Create barrel `src/index.ts`**

```ts
export * from "./schemas/member";
```

- [ ] **Step 7: Run test, expect PASS**

Run: `pnpm --filter @fitness/api test`

- [ ] **Step 8: Commit**

```bash
git add packages/api/
git commit -m "feat(api): scaffold zod schemas package with member input"
```

---

## Task 11: Bootstrap `apps/web`

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/.env.example`

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@fitness/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@fitness/api": "workspace:*",
    "@fitness/db": "workspace:*",
    "@supabase/ssr": "^0.5.1",
    "@supabase/supabase-js": "^2.45.4",
    "next": "15.0.2",
    "react": "19.0.0-rc-fb9a90fa48-20240614",
    "react-dom": "19.0.0-rc-fb9a90fa48-20240614",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.1",
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "15.0.2",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Create `apps/web/next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  transpilePackages: ["@fitness/api", "@fitness/db"],
};

export default nextConfig;
```

- [ ] **Step 3: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `apps/web/postcss.config.mjs`**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 5: Create `apps/web/tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#fafaf9",
        foreground: "#1a1a1a",
        accent: "#f59e0b",
      },
      borderRadius: { sm: "8px", md: "12px", lg: "16px", xl: "24px" },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 6: Create `apps/web/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { background: #fafaf9; color: #1a1a1a; }
```

- [ ] **Step 7: Create `apps/web/src/app/layout.tsx`**

```tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fitness Admin",
  description: "Operate the gym",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create `apps/web/src/app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Fitness Admin</h1>
      <p className="text-sm text-neutral-600">Bootstrapped.</p>
    </main>
  );
}
```

- [ ] **Step 9: Create `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

- [ ] **Step 10: Install + run dev**

```bash
pnpm install
pnpm --filter @fitness/web dev
```
Expected: dev server starts at `http://localhost:3000` and shows "Fitness Admin / Bootstrapped."

- [ ] **Step 11: Commit**

```bash
git add apps/web/ pnpm-lock.yaml
git commit -m "feat(web): scaffold Next.js 15 app with Tailwind and shared packages"
```

---

## Task 12: Add shadcn/ui base components

**Files:**
- Create: `apps/web/components.json`
- Create: `apps/web/src/lib/utils.ts`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Create `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 2: Add CSS variables to `globals.css`**

Replace contents with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 60 9% 98%;
    --foreground: 0 0% 10%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 10%;
    --primary: 0 0% 10%;
    --primary-foreground: 0 0% 98%;
    --muted: 60 4% 95%;
    --muted-foreground: 0 0% 45%;
    --accent: 38 92% 50%;
    --accent-foreground: 0 0% 10%;
    --border: 0 0% 91%;
    --input: 0 0% 91%;
    --ring: 38 92% 50%;
    --radius: 0.75rem;
  }
}

html, body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

- [ ] **Step 3: Create utility helper**

`apps/web/src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Add deps**

Update `apps/web/package.json` `dependencies`:
```json
"clsx": "^2.1.1",
"tailwind-merge": "^2.5.4",
"class-variance-authority": "^0.7.0",
"lucide-react": "^0.453.0"
```
Run: `pnpm install --filter @fitness/web`

- [ ] **Step 5: Add a few shadcn primitives**

```bash
pnpm dlx shadcn@latest add button card input label table -c apps/web --yes
```
Expected: Files created under `apps/web/src/components/ui/`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/ pnpm-lock.yaml
git commit -m "feat(web): wire shadcn/ui with light theme tokens"
```

---

## Task 13: Supabase client helpers + auth middleware

**Files:**
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/src/lib/supabase/browser.ts`
- Create: `apps/web/src/lib/tenant.ts`
- Create: `apps/web/src/middleware.ts`

- [ ] **Step 1: Create the server-side Supabase factory**

`apps/web/src/lib/supabase/server.ts`:
```ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          for (const { name, value, options } of toSet) {
            cookieStore.set({ name, value, ...(options as CookieOptions) });
          }
        },
      },
    },
  );
}

export async function createSupabaseServiceClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 2: Create the browser factory**

`apps/web/src/lib/supabase/browser.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Create tenant resolver**

`apps/web/src/lib/tenant.ts`:
```ts
import { createSupabaseServerClient } from "./supabase/server";

export async function getCurrentTenantId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const tenantId = data.user.app_metadata.tenant_id as string | undefined;
  return tenantId ?? null;
}
```

> The `tenant_id` claim is set on the auth user via Supabase's `app_metadata`. A
> later task seeds this for the demo admin account.

- [ ] **Step 4: Create middleware that gates `/admin` routes**

`apps/web/src/middleware.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet) {
          for (const { name, value, options } of toSet) {
            res.cookies.set({ name, value, ...options });
          }
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  if (isAdminRoute && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/ apps/web/src/middleware.ts
git commit -m "feat(web): add Supabase server/browser clients and admin middleware"
```

---

## Task 14: Login page

**Files:**
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/app/login/actions.ts`
- Test: `apps/web/src/app/login/__tests__/actions.test.ts`

- [ ] **Step 1: Write failing test for the action**

`apps/web/src/app/login/__tests__/actions.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { signInSchema } from "../actions";

describe("signInSchema", () => {
  it("requires email + password", () => {
    expect(signInSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a valid payload", () => {
    const r = signInSchema.safeParse({
      email: "admin@x.com",
      password: "password123",
    });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter @fitness/web test`

- [ ] **Step 3: Implement the action**

`apps/web/src/app/login/actions.ts`:
```ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Invalid credentials format" };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  redirect("/admin");
}
```

- [ ] **Step 4: Implement the page**

`apps/web/src/app/login/page.tsx`:
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <form
        action={signInAction}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6"
      >
        <h1 className="text-xl font-semibold">Admin sign in</h1>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Run unit test, expect PASS**

Run: `pnpm --filter @fitness/web test`

- [ ] **Step 6: Manual smoke test**

Provision an auth user in the Supabase Studio (`http://localhost:54323`) with
email `admin@demo.local` and password `password123`. In `User Metadata` set
`{ "tenant_id": "<demo tenant uuid from seed>" }` under `App Metadata`.
Navigate to `http://localhost:3000/login`, sign in. Expected: redirect to
`/admin` (which currently 404s — fixed in next task).

- [ ] **Step 7: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add admin login page and signIn server action"
```

---

## Task 15: Admin shell + dashboard skeleton

**Files:**
- Create: `apps/web/src/app/admin/layout.tsx`
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/components/admin/sidebar.tsx`
- Create: `apps/web/src/components/admin/topbar.tsx`

- [ ] **Step 1: Implement sidebar**

`apps/web/src/components/admin/sidebar.tsx`:
```tsx
import Link from "next/link";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/checkins", label: "Check-ins" },
  { href: "/admin/audit", label: "Audit log" },
];

export function Sidebar() {
  return (
    <aside className="w-56 border-r bg-white p-4">
      <div className="mb-6 text-lg font-bold">FitClub</div>
      <nav className="flex flex-col gap-1 text-sm">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href as Parameters<typeof Link>[0]["href"]}
            className="rounded-md px-3 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Implement topbar**

`apps/web/src/components/admin/topbar.tsx`:
```tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOutAction() {
  "use server";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function Topbar() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="text-sm text-neutral-600">{data.user?.email}</div>
      <form action={signOutAction}>
        <button className="text-sm text-neutral-600 hover:text-neutral-900">
          Sign out
        </button>
      </form>
    </header>
  );
}
```

- [ ] **Step 3: Implement layout**

`apps/web/src/app/admin/layout.tsx`:
```tsx
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement dashboard placeholder**

`apps/web/src/app/admin/page.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active members", value: "—" },
          { label: "MRR", value: "—" },
          { label: "Today check-ins", value: "—" },
          { label: "Churn (30d)", value: "—" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle className="text-xs text-neutral-500">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{kpi.value}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Manual smoke test**

Run `pnpm --filter @fitness/web dev`, log in, confirm `/admin` shows the
shell with sidebar and KPI placeholders.

- [ ] **Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add admin layout, sidebar, and dashboard skeleton"
```

---

## Task 16: Tenant-scoped DB helper for server components

**Files:**
- Create: `apps/web/src/lib/db.ts`
- Test: `apps/web/src/lib/__tests__/db.test.ts`

- [ ] **Step 1: Write failing test**

`apps/web/src/lib/__tests__/db.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { withTenantScope } from "../db";

describe("withTenantScope", () => {
  it("rejects when no tenant id", async () => {
    await expect(withTenantScope(null, async () => "x")).rejects.toThrow(
      /tenant/i,
    );
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter @fitness/web test`

- [ ] **Step 3: Implement helper**

`apps/web/src/lib/db.ts`:
```ts
import { createDbClient, type DbClient } from "@fitness/db";
import { sql } from "drizzle-orm";

let cached: DbClient | null = null;

function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  cached = createDbClient(url);
  return cached;
}

export async function withTenantScope<T>(
  tenantId: string | null,
  fn: (db: DbClient) => Promise<T>,
): Promise<T> {
  if (!tenantId) throw new Error("tenant id required");
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local app.tenant_id = ${tenantId}`);
    await tx.execute(sql`set local role authenticated`);
    return fn(tx as unknown as DbClient);
  });
}
```

- [ ] **Step 4: Run test, expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add tenant-scoped DB helper using RLS session settings"
```

---

## Task 17: Members list page

**Files:**
- Create: `apps/web/src/app/admin/members/page.tsx`
- Create: `apps/web/src/app/admin/members/_components/members-table.tsx`

- [ ] **Step 1: Implement server component page**

`apps/web/src/app/admin/members/page.tsx`:
```tsx
import { desc, ilike, or } from "drizzle-orm";
import { members } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { MembersTable } from "./_components/members-table";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) => {
    return db
      .select()
      .from(members)
      .where(
        q
          ? or(ilike(members.fullName, `%${q}%`), ilike(members.email, `%${q}%`))
          : undefined,
      )
      .orderBy(desc(members.joinedAt))
      .limit(100);
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Members</h1>
        <form>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="rounded-md border px-3 py-1.5 text-sm"
          />
        </form>
      </div>
      <MembersTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 2: Implement table component**

`apps/web/src/app/admin/members/_components/members-table.tsx`:
```tsx
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Member } from "@fitness/db";

export function MembersTable({ rows }: { rows: Member[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border bg-white p-8 text-center text-sm text-neutral-500">
        No members yet.
      </p>
    );
  }
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <Link
                  className="hover:underline"
                  href={`/admin/members/${m.id}`}
                >
                  {m.fullName}
                </Link>
              </TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell className="capitalize">{m.status}</TableCell>
              <TableCell>{m.joinedAt.toISOString().slice(0, 10)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 3: Manual smoke test**

Run dev, log in, navigate to `/admin/members`. Expected: Demo member from
seed appears.

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat(web): list tenant members with search"
```

---

## Task 18: Member create flow

**Files:**
- Create: `apps/web/src/app/admin/members/new/page.tsx`
- Create: `apps/web/src/app/admin/members/_actions.ts`
- Test: `apps/web/src/app/admin/members/__tests__/_actions.test.ts`

- [ ] **Step 1: Write failing action test**

```ts
import { describe, expect, it } from "vitest";
import { parseCreateMember } from "../_actions";

describe("parseCreateMember", () => {
  it("returns parsed data", () => {
    const fd = new FormData();
    fd.set("email", "x@y.com");
    fd.set("fullName", "Jane");
    const res = parseCreateMember(fd);
    expect(res.success).toBe(true);
  });

  it("rejects bad email", () => {
    const fd = new FormData();
    fd.set("email", "bad");
    fd.set("fullName", "Jane");
    expect(parseCreateMember(fd).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement actions**

`apps/web/src/app/admin/members/_actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMemberInput } from "@fitness/api";
import { members } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export function parseCreateMember(formData: FormData) {
  return createMemberInput.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    birthdate: formData.get("birthdate") || undefined,
    gender: formData.get("gender") || undefined,
  });
}

export async function createMemberAction(formData: FormData) {
  const parsed = parseCreateMember(formData);
  if (!parsed.success) return { error: parsed.error.message };
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db.insert(members).values({
      tenantId: tenantId!,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone ?? null,
      birthdate: parsed.data.birthdate ?? null,
      gender: parsed.data.gender ?? null,
      status: "pending",
    });
  });
  revalidatePath("/admin/members");
  redirect("/admin/members");
}
```

- [ ] **Step 4: Implement page**

`apps/web/src/app/admin/members/new/page.tsx`:
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMemberAction } from "../_actions";

export default function NewMemberPage() {
  return (
    <form action={createMemberAction} className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">New member</h1>
      <Field label="Full name" name="fullName" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Phone" name="phone" />
      <Field label="Birthdate" name="birthdate" type="date" />
      <Button type="submit">Create</Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
```

- [ ] **Step 5: Run unit test, expect PASS**

- [ ] **Step 6: Manual smoke**

Add a member from `/admin/members/new`. Confirm it appears in the list.

- [ ] **Step 7: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add member create form and server action"
```

---

## Task 19: Plans CRUD

**Files:**
- Create: `apps/web/src/app/admin/plans/page.tsx`
- Create: `apps/web/src/app/admin/plans/_actions.ts`
- Create: `apps/web/src/app/admin/plans/new/page.tsx`
- Modify: `packages/api/src/index.ts` and add `plan.ts`

- [ ] **Step 1: Add plan input schema**

`packages/api/src/schemas/plan.ts`:
```ts
import { z } from "zod";

export const createPlanInput = z.object({
  name: z.string().min(1).max(120),
  priceMinor: z.coerce.number().int().min(0),
  currency: z.string().length(3).default("USD"),
  durationDays: z.coerce.number().int().min(1),
  features: z.array(z.string()).default([]),
});

export type CreatePlanInput = z.infer<typeof createPlanInput>;
```

Update `packages/api/src/index.ts`:
```ts
export * from "./schemas/member";
export * from "./schemas/plan";
```

- [ ] **Step 2: Implement plans list**

`apps/web/src/app/admin/plans/page.tsx`:
```tsx
import { desc } from "drizzle-orm";
import Link from "next/link";
import { plans } from "@fitness/db";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export default async function PlansPage() {
  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) =>
    db.select().from(plans).orderBy(desc(plans.createdAt)),
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Plans</h1>
        <Button asChild>
          <Link href="/admin/plans/new">+ New plan</Link>
        </Button>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>
                  {(p.priceMinor / 100).toFixed(2)} {p.currency}
                </TableCell>
                <TableCell>{p.durationDays} days</TableCell>
                <TableCell>{p.active ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement actions**

`apps/web/src/app/admin/plans/_actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPlanInput } from "@fitness/api";
import { plans } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export async function createPlanAction(formData: FormData) {
  const parsed = createPlanInput.safeParse({
    name: formData.get("name"),
    priceMinor: formData.get("priceMinor"),
    currency: formData.get("currency") || "USD",
    durationDays: formData.get("durationDays"),
    features: ((formData.get("features") as string) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });
  if (!parsed.success) return { error: parsed.error.message };
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db.insert(plans).values({ ...parsed.data, tenantId: tenantId! });
  });
  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}
```

- [ ] **Step 4: Implement create form**

`apps/web/src/app/admin/plans/new/page.tsx`:
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlanAction } from "../_actions";

export default function NewPlanPage() {
  return (
    <form action={createPlanAction} className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">New plan</h1>
      <Field label="Name" name="name" required />
      <Field label="Price (minor units)" name="priceMinor" type="number" required />
      <Field label="Currency" name="currency" defaultValue="USD" />
      <Field label="Duration (days)" name="durationDays" type="number" required />
      <Field label="Features (comma separated)" name="features" />
      <Button type="submit">Create</Button>
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={props.name}>{props.label}</Label>
      <Input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        defaultValue={props.defaultValue}
      />
    </div>
  );
}
```

- [ ] **Step 5: Smoke test**

Create a plan, see it listed, confirm DB row.

- [ ] **Step 6: Commit**

```bash
git add packages/api/ apps/web/
git commit -m "feat(web): plans list and create form"
```

---

## Task 20: Stripe — environment + customer creation

**Files:**
- Create: `apps/web/src/lib/stripe.ts`
- Create: `apps/web/src/app/admin/members/[id]/_actions.ts`

- [ ] **Step 1: Add Stripe SDK**

Update `apps/web/package.json` `dependencies`:
```json
"stripe": "^17.3.1"
```
Run: `pnpm install --filter @fitness/web`

- [ ] **Step 2: Create wrapper**

`apps/web/src/lib/stripe.ts`:
```ts
import Stripe from "stripe";

let cached: Stripe | null = null;
export function getStripe() {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  cached = new Stripe(key, { apiVersion: "2024-09-30.acacia" });
  return cached;
}
```

- [ ] **Step 3: Add a customer + checkout action**

`apps/web/src/app/admin/members/[id]/_actions.ts`:
```ts
"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { members, plans } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { getStripe } from "@/lib/stripe";

export async function createCheckoutSessionAction(
  memberId: string,
  planId: string,
) {
  const tenantId = await getCurrentTenantId();
  const stripe = getStripe();

  const { member, plan } = await withTenantScope(tenantId, async (db) => {
    const [m] = await db.select().from(members).where(eq(members.id, memberId));
    const [p] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!m || !p) throw new Error("not found");
    return { member: m, plan: p };
  });

  if (!plan.stripePriceId) {
    throw new Error("Plan is not linked to a Stripe price");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: member.email,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/members/${member.id}?paid=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/members/${member.id}?cancelled=1`,
    metadata: {
      tenant_id: tenantId!,
      member_id: member.id,
      plan_id: plan.id,
    },
  });

  if (!session.url) throw new Error("no checkout url");
  redirect(session.url);
}
```

- [ ] **Step 4: Stripe price setup (manual)**

In Stripe Dashboard test mode, create products + recurring prices for each
plan. Copy the `price_xxx` id back into `plans.stripe_price_id` (use Drizzle
Studio: `pnpm --filter @fitness/db studio`).

- [ ] **Step 5: Commit**

```bash
git add apps/web/ pnpm-lock.yaml
git commit -m "feat(web): Stripe wrapper and member checkout session action"
```

---

## Task 21: Stripe webhook handler

**Files:**
- Create: `apps/web/src/app/api/webhooks/stripe/route.ts`
- Test: `apps/web/src/app/api/webhooks/stripe/__tests__/route.test.ts`

- [ ] **Step 1: Write failing test (signature rejection)**

`apps/web/src/app/api/webhooks/stripe/__tests__/route.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { POST } from "../route";

describe("POST /api/webhooks/stripe", () => {
  it("rejects requests without a signature", async () => {
    const req = new Request("http://x/", { method: "POST", body: "{}" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement route**

`apps/web/src/app/api/webhooks/stripe/route.ts`:
```ts
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createDbClient,
  members,
  memberships,
  payments,
  plans,
} from "@fitness/db";
import { getStripe } from "@/lib/stripe";

const dbUrl = process.env.DATABASE_URL!;
const db = createDbClient(dbUrl);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing signature", { status: 400 });
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return new NextResponse(`signature error: ${(err as Error).message}`, {
      status: 400,
    });
  }

  // Idempotency: insert event id into a tracker table if not present.
  // For Phase 1, we reuse `payments.stripeInvoiceId` UNIQUE for invoice events.

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenant_id;
      const memberId = session.metadata?.member_id;
      const planId = session.metadata?.plan_id;
      const subscriptionId = session.subscription as string | null;
      if (!tenantId || !memberId || !planId || !subscriptionId) break;
      await db.insert(memberships).values({
        memberId,
        planId,
        status: "active",
        startedAt: new Date(),
        stripeSubscriptionId: subscriptionId,
        autoRenew: true,
      });
      await db
        .update(members)
        .set({ status: "active" })
        .where(eq(members.id, memberId));
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const memberEmail = invoice.customer_email;
      if (!memberEmail) break;
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.email, memberEmail));
      if (!member) break;
      await db
        .insert(payments)
        .values({
          memberId: member.id,
          amountMinor: invoice.amount_paid,
          currency: invoice.currency.toUpperCase(),
          stripeInvoiceId: invoice.id,
          status: "paid",
          paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
        })
        .onConflictDoNothing({ target: payments.stripeInvoiceId });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const memberEmail = invoice.customer_email;
      if (!memberEmail) break;
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.email, memberEmail));
      if (!member) break;
      await db
        .insert(payments)
        .values({
          memberId: member.id,
          amountMinor: invoice.amount_due,
          currency: invoice.currency.toUpperCase(),
          stripeInvoiceId: invoice.id,
          status: "failed",
          attemptCount: invoice.attempt_count ?? 1,
        })
        .onConflictDoNothing({ target: payments.stripeInvoiceId });
      // Phase 4 will hook dunning here.
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 4: Run unit test, expect PASS**

- [ ] **Step 5: Run Stripe CLI listener locally**

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```
Expected: Event arrives, log line in dev server, no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat(web): Stripe webhook handler for checkout, invoice paid/failed"
```

---

## Task 22: Resend + React Email receipt

**Files:**
- Create: `packages/emails/package.json`
- Create: `packages/emails/tsconfig.json`
- Create: `packages/emails/src/templates/receipt.tsx`
- Create: `packages/emails/src/index.ts`
- Modify: `apps/web/src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Create `packages/emails/package.json`**

```json
{
  "name": "@fitness/emails",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@react-email/components": "^0.0.25",
    "react": "19.0.0-rc-fb9a90fa48-20240614"
  },
  "devDependencies": { "typescript": "^5.6.2" }
}
```

- [ ] **Step 2: Create `packages/emails/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create receipt template**

`packages/emails/src/templates/receipt.tsx`:
```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Text,
} from "@react-email/components";

export interface ReceiptProps {
  memberName: string;
  amountFormatted: string;
  planName: string;
  paidAt: string;
}

export function Receipt({
  memberName,
  amountFormatted,
  planName,
  paidAt,
}: ReceiptProps) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: "Inter, sans-serif",
          background: "#fafaf9",
          color: "#1a1a1a",
          padding: 24,
        }}
      >
        <Container
          style={{ background: "#ffffff", padding: 24, borderRadius: 12 }}
        >
          <Heading>Payment received</Heading>
          <Text>Hi {memberName},</Text>
          <Text>
            We've received your payment for <strong>{planName}</strong>.
          </Text>
          <Section>
            <Text>
              <strong>Amount:</strong> {amountFormatted}
            </Text>
            <Text>
              <strong>Date:</strong> {paidAt}
            </Text>
          </Section>
          <Text>Thanks for being a member.</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 4: Create barrel**

`packages/emails/src/index.ts`:
```ts
export { Receipt, type ReceiptProps } from "./templates/receipt";
```

- [ ] **Step 5: Add Resend client + send helper in web app**

`apps/web/src/lib/email.ts`:
```ts
import { render } from "@react-email/render";
import { Receipt, type ReceiptProps } from "@fitness/emails";
import { Resend } from "resend";

let cached: Resend | null = null;
function getResend() {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  cached = new Resend(key);
  return cached;
}

export async function sendReceipt(to: string, props: ReceiptProps) {
  const html = await render(Receipt(props));
  await getResend().emails.send({
    from: "FitClub <noreply@fitclub.local>",
    to,
    subject: "Payment received",
    html,
  });
}
```

Add deps to `apps/web/package.json`:
```json
"@fitness/emails": "workspace:*",
"@react-email/render": "^1.0.1",
"resend": "^4.0.0"
```

- [ ] **Step 6: Hook into webhook**

Modify the `invoice.paid` branch in
`apps/web/src/app/api/webhooks/stripe/route.ts` to send the receipt:
```ts
import { sendReceipt } from "@/lib/email";
// ...inside invoice.paid after inserting the payment:
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: invoice.currency.toUpperCase(),
});
await sendReceipt(member.email, {
  memberName: member.fullName,
  amountFormatted: formatter.format(invoice.amount_paid / 100),
  planName: "Membership",
  paidAt: new Date(invoice.status_transitions.paid_at! * 1000).toISOString().slice(0, 10),
});
```

- [ ] **Step 7: Manual end-to-end**

Trigger `stripe trigger invoice.paid`. Confirm an email lands at the test
inbox (Resend dashboard `Logs`).

- [ ] **Step 8: Commit**

```bash
git add packages/emails/ apps/web/ pnpm-lock.yaml
git commit -m "feat(emails): receipt template and webhook delivery via Resend"
```

---

## Task 23: Manual check-in flow (Phase 1 minimum)

**Files:**
- Create: `apps/web/src/app/admin/checkins/page.tsx`
- Create: `apps/web/src/app/admin/checkins/_actions.ts`
- Modify: `packages/db/src/schema/checkins.ts` (new)
- Modify: `packages/db/src/schema/index.ts`
- Generate a new migration

- [ ] **Step 1: Add `checkins` schema (minimal Phase 1 fields)**

`packages/db/src/schema/checkins.ts`:
```ts
import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { members } from "./members";
import { tenants } from "./tenants";

export const checkinSourceEnum = pgEnum("checkin_source", [
  "qr",
  "manual",
  "kiosk",
]);

export const checkins = pgTable(
  "checkins",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    source: checkinSourceEnum("source").notNull().default("manual"),
    gateId: varchar("gate_id", { length: 64 }),
    tokenHash: text("token_hash"),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantTimeIdx: index("checkins_tenant_time_idx").on(
      t.tenantId,
      t.checkedInAt,
    ),
  }),
);

export type Checkin = typeof checkins.$inferSelect;
export type NewCheckin = typeof checkins.$inferInsert;
```

Update `schema/index.ts`:
```ts
export * from "./tenants";
export * from "./members";
export * from "./plans";
export * from "./memberships";
export * from "./payments";
export * from "./auditLogs";
export * from "./checkins";
```

- [ ] **Step 2: Generate migration + apply + extend RLS policy**

```bash
cd packages/db
pnpm dlx dotenv-cli -e .env.local -- pnpm generate
pnpm dlx dotenv-cli -e .env.local -- pnpm migrate
```

Add to `infra/supabase/policies/0002_tenant_policies.sql` (run as a new
migration file `0003_checkins_policy.sql`):
```sql
alter table public.checkins enable row level security;
create policy checkins_select on public.checkins
  for select using (tenant_id = public.current_tenant_id());
create policy checkins_insert on public.checkins
  for insert with check (tenant_id = public.current_tenant_id());
```

Apply: `psql "$DATABASE_URL" -f infra/supabase/policies/0003_checkins_policy.sql`

- [ ] **Step 3: Implement page + action**

`apps/web/src/app/admin/checkins/_actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { checkins } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export async function manualCheckinAction(formData: FormData) {
  const memberId = formData.get("memberId");
  if (typeof memberId !== "string") return { error: "missing memberId" };
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db.insert(checkins).values({
      memberId,
      tenantId: tenantId!,
      source: "manual",
    });
  });
  revalidatePath("/admin/checkins");
}
```

`apps/web/src/app/admin/checkins/page.tsx`:
```tsx
import { desc } from "drizzle-orm";
import { checkins, members } from "@fitness/db";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { manualCheckinAction } from "./_actions";

export default async function CheckinsPage() {
  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) =>
    db
      .select({
        id: checkins.id,
        at: checkins.checkedInAt,
        member: members.fullName,
        source: checkins.source,
      })
      .from(checkins)
      .innerJoin(members, eq(members.id, checkins.memberId))
      .orderBy(desc(checkins.checkedInAt))
      .limit(50),
  );
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Check-ins</h1>
      <form action={manualCheckinAction} className="flex max-w-md items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-sm" htmlFor="memberId">
            Member ID
          </label>
          <Input id="memberId" name="memberId" required />
        </div>
        <Button type="submit">Mark check-in</Button>
      </form>
      <ul className="divide-y rounded-md border bg-white">
        {rows.map((r) => (
          <li key={r.id} className="flex justify-between p-3 text-sm">
            <span>{r.member}</span>
            <span className="text-neutral-500">
              {r.at.toISOString()} · {r.source}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Manual smoke**

Copy a member id from `/admin/members`, paste into the form, submit, see it
in the list.

- [ ] **Step 5: Commit**

```bash
git add packages/db/ infra/supabase/policies/ apps/web/
git commit -m "feat(web): manual check-in form and history list"
```

---

## Task 24: Audit log writer + viewer

**Files:**
- Create: `apps/web/src/lib/audit.ts`
- Modify: `apps/web/src/app/admin/members/_actions.ts` (write audit log)
- Modify: `apps/web/src/app/admin/checkins/_actions.ts` (write audit log)
- Create: `apps/web/src/app/admin/audit/page.tsx`

- [ ] **Step 1: Implement helper**

`apps/web/src/lib/audit.ts`:
```ts
import { auditLogs } from "@fitness/db";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";
import { withTenantScope } from "./db";
import { getCurrentTenantId } from "./tenant";

export async function logAudit(
  action: string,
  targetType: string,
  targetId: string | null,
  payload?: Record<string, unknown>,
) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return;
  const h = await headers();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  await withTenantScope(tenantId, async (db) => {
    await db.insert(auditLogs).values({
      tenantId,
      actorId: data.user?.id ?? null,
      action,
      targetType,
      targetId,
      ip: h.get("x-forwarded-for") ?? null,
      userAgent: h.get("user-agent") ?? null,
      payload: payload ?? null,
    });
  });
}
```

- [ ] **Step 2: Wire into create-member + manual check-in**

In `_actions.ts` for members, after the insert:
```ts
import { logAudit } from "@/lib/audit";
// ...
await logAudit("member.create", "member", null, {
  email: parsed.data.email,
});
```

In check-ins action, after the insert:
```ts
import { logAudit } from "@/lib/audit";
await logAudit("checkin.manual", "member", memberId);
```

- [ ] **Step 3: Implement viewer page**

`apps/web/src/app/admin/audit/page.tsx`:
```tsx
import { desc } from "drizzle-orm";
import { auditLogs } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export default async function AuditPage() {
  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) =>
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200),
  );
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Audit log</h1>
      <ul className="divide-y rounded-md border bg-white text-sm">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-12 gap-2 p-3">
            <span className="col-span-3 text-neutral-500">
              {r.createdAt.toISOString()}
            </span>
            <span className="col-span-2 font-medium">{r.action}</span>
            <span className="col-span-2">{r.targetType}</span>
            <span className="col-span-5 truncate text-neutral-600">
              {r.targetId ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Smoke test**

Create a member, mark a check-in, visit `/admin/audit`, see entries.

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): audit log helper, write on key actions, viewer page"
```

---

## Task 25: Sentry + PostHog wiring

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/sentry.client.config.ts`
- Create: `apps/web/sentry.server.config.ts`
- Create: `apps/web/sentry.edge.config.ts`
- Create: `apps/web/src/instrumentation.ts`
- Create: `apps/web/src/lib/posthog.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Install Sentry**

```bash
pnpm dlx @sentry/wizard@latest -i nextjs --skip-connect --signup
```
Or manually add `@sentry/nextjs ^8.34.0` to deps and run `pnpm install`.

- [ ] **Step 2: Configure Sentry**

`apps/web/sentry.server.config.ts`:
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV,
});
```

`apps/web/sentry.client.config.ts`:
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
});
```

`apps/web/sentry.edge.config.ts`:
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
});
```

`apps/web/src/instrumentation.ts`:
```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  } else if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
```

- [ ] **Step 3: PostHog provider**

Add `posthog-js ^1.165.0` to deps. Create
`apps/web/src/lib/posthog.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
    if (!key) return;
    posthog.init(key, { api_host: host, capture_pageview: true });
  }, []);
  return <>{children}</>;
}
```

Update `apps/web/src/app/layout.tsx`:
```tsx
import { PosthogProvider } from "@/lib/posthog";
// ...
<body>
  <PosthogProvider>{children}</PosthogProvider>
</body>
```

- [ ] **Step 4: Smoke test**

`pnpm --filter @fitness/web dev`, visit any page, confirm a pageview in
PostHog. Throw a test error in a server action: `throw new Error("sentry-test")`,
revert after, confirm it shows up in Sentry.

- [ ] **Step 5: Commit**

```bash
git add apps/web/ pnpm-lock.yaml
git commit -m "feat(web): wire Sentry and PostHog"
```

---

## Task 26: GitHub Actions CI

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Replace placeholder with full pipeline**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @fitness/db generate -- --custom
        continue-on-error: true
      - run: pnpm --filter @fitness/db migrate
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 2: Test locally with `act` (optional) or push and confirm**

If pushing: ensure secrets set if any tests need them (none required for
Phase 1 unit tests beyond `DATABASE_URL`, which the CI service container
provides).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint, typecheck, test, build on push and PR"
```

---

## Task 27: Playwright E2E for the happy path

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/admin.spec.ts`

- [ ] **Step 1: Add Playwright config**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    headless: true,
  },
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        port: 3000,
        reuseExistingServer: true,
      },
});
```

- [ ] **Step 2: Add login + create member spec**

`apps/web/e2e/admin.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("admin can sign in and create a member", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin/);

  await page.goto("/admin/members/new");
  await page.getByLabel("Full name").fill("E2E User");
  const email = `e2e+${Date.now()}@x.local`;
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(/\/admin\/members(\?.*)?$/);
  await expect(page.getByText(email)).toBeVisible();
});
```

- [ ] **Step 3: Install Playwright browsers**

```bash
pnpm --filter @fitness/web exec playwright install --with-deps
```

- [ ] **Step 4: Run E2E locally**

```bash
E2E_ADMIN_EMAIL=admin@demo.local E2E_ADMIN_PASSWORD=password123 \
  pnpm --filter @fitness/web test:e2e
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e/
git commit -m "test(web): Playwright E2E for admin login + create member"
```

---

## Task 28: Vercel deploy configuration

**Files:**
- Create: `apps/web/vercel.json`
- Modify: project Vercel settings (manual)

- [ ] **Step 1: Add `vercel.json`**

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm turbo run build --filter @fitness/web...",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": ".next",
  "rootDirectory": "apps/web"
}
```

- [ ] **Step 2: Manual Vercel project setup**

In Vercel: import the repo, set root directory to `apps/web`, override
Install/Build commands per `vercel.json`. Add env vars from `.env.example`
(use Supabase + Stripe + Resend + Sentry + PostHog values).

- [ ] **Step 3: Add Stripe webhook in Vercel**

In Stripe Dashboard add a webhook endpoint
`https://<deployed-domain>/api/webhooks/stripe` with events
`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`.
Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.

- [ ] **Step 4: Verify deploy**

Push to `main`. Confirm:
- `https://<domain>/login` renders.
- Admin can sign in with the seeded credentials.
- A test Stripe webhook delivers without errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/vercel.json
git commit -m "chore(web): Vercel deploy configuration"
```

---

## Task 29: README + runbook

**Files:**
- Create: `README.md`
- Create: `docs/runbooks/local-dev.md`

- [ ] **Step 1: README**

```markdown
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
```

- [ ] **Step 2: Local-dev runbook**

`docs/runbooks/local-dev.md`:
```markdown
# Local development

## Services
- Supabase local stack — `supabase start`
- Stripe CLI listener —
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
Create via Supabase Studio:
- Email: `admin@demo.local`
- Password: `password123`
- App metadata: `{ "tenant_id": "<demo tenant id>" }`
```

- [ ] **Step 3: Commit**

```bash
git add README.md docs/runbooks/
git commit -m "docs: README and local-dev runbook"
```

---

## Phase 1 Definition of Done

- [ ] An operator can sign in to `/admin` with email + password.
- [ ] Operator can list, search, and create members; member rows respect tenant
      RLS.
- [ ] Operator can create plans linked to Stripe prices.
- [ ] Stripe Checkout completes a subscription and creates a `memberships` row.
- [ ] `invoice.paid` and `invoice.payment_failed` webhooks update `payments` and
      send a receipt email on success.
- [ ] Operator can record a manual check-in and see today's history.
- [ ] Audit log captures member creation and manual check-ins.
- [ ] Sentry receives a thrown server error in dev.
- [ ] PostHog records pageviews.
- [ ] CI passes on a push: install, typecheck, lint, unit + integration tests,
      build.
- [ ] Vercel deploy serves the admin app on a stable URL.

---

## Self-Review Notes (filled by author)

- **Spec coverage:** All Phase 1 deliverables in spec section 8 mapped to a
  task: monorepo (T1), schema (T3-T6), migrations (T7), RLS (T8), seed (T9),
  shared schemas (T10), Next.js (T11-T12), auth (T13-T14), admin shell (T15),
  members (T17-T18), plans (T19), Stripe (T20-T21), receipts (T22), check-ins
  (T23), audit (T24), Sentry/PostHog (T25), CI (T26), E2E (T27), Vercel (T28),
  docs (T29). Bookings, mobile, and notifications belong to later phases per
  spec — explicitly out of scope here.
- **Placeholder scan:** No "TODO", "TBD", or "implement later" remain. All
  test code, schemas, and SQL are concrete.
- **Type consistency:** Member fields, table column names, and Zod schema
  fields agree across tasks (e.g. `fullName`, `priceMinor`,
  `stripeSubscriptionId`, `stripePriceId`).
- **Known follow-up:** Stripe webhook idempotency in Phase 1 relies on the
  `payments.stripe_invoice_id UNIQUE` index plus `onConflictDoNothing`. Phase 4
  introduces a dedicated `stripe_events` ledger when dunning is built.

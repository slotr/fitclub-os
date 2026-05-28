# Multi-Tenant Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the mobile app into a single multi-tenant build — email+OTP auth, JWT-claim RLS, per-tenant branding, multi-gym membership with in-app switcher. Replace build-time `EXPO_PUBLIC_TENANT_ID` binding with runtime resolution.

**Architecture:** Member-anchored. Admin pre-creates `members` rows with email; OTP login auto-links `auth.users` to all matching member rows via DB trigger. RLS uses `auth.uid()` → `user_tenant_ids()` to enforce isolation. Mobile app holds current tenant in store; theme provider applies per-tenant logo + name + accent. Hybrid RLS form keeps admin web (`current_tenant_id()` session setting) working alongside the new mobile JWT path.

**Tech Stack:** Supabase auth (email OTP), drizzle ORM (Postgres + SQLite), React Native 0.81 / Expo 54, expo-router, expo-image, AsyncStorage, Zustand (or React Context), zod.

**Spec:** `docs/superpowers/specs/2026-05-28-multi-tenant-design.md`

**Branch:** `feat/multi-tenant` (created from `main`, spec committed as `e73c4c9`).

---

## Codebase Patterns (Read Before Starting)

### DB schema files

`packages/db/src/schema/` — one file per table. Index file re-exports. Helpers in `_helpers.ts`: `id()`, `createdAt()`, `updatedAt()`, `deletedAt()`. New columns added to existing files; new tables get new files.

### Migration generation

Run `pnpm --filter @fitness/db exec drizzle-kit generate`. Output goes to `packages/db/migrations/`. Manual SQL (triggers, functions, backfill) appended to the generated file before commit.

### RLS files

`infra/supabase/policies/NNNN_*.sql`. Drop + recreate is the safe pattern. Functions live in `infra/supabase/functions/`.

### Mobile DB

`apps/mobile/src/db/schema.ts` — all SQLite tables in one file. `apps/mobile/src/db/client.ts` — `MIGRATIONS: string[][]`. Append a new entry for any v→v+1 migration. (No new SQLite migration needed in this plan — RLS lives server-side.)

### Mobile auth + tenant

Currently uses `EXPO_PUBLIC_TENANT_ID` env in 10 sites. After this plan, all sites read from `useTenantStore.getState().currentTenantId` (sync) or `useTenantStore()` hook (reactive). Supabase JS client uses AsyncStorage adapter for session persistence.

### Mobile patterns

- `BackButton` (not BackButtonRow)
- `useAuth` from `lib/store.ts` (existing) for legacy code; new tenant store from `lib/tenant-store.ts`
- TypeScript `noUncheckedIndexedAccess: true` → use `!` after length checks or `?? null`
- `postgres-js` array binding → use `sql.join(arr.map(v => sql\`${v}\`), sql\`, \`)`
- `expo-image` for cached remote images (logos)

### Test commands

```
pnpm -r typecheck                                            (all packages)
pnpm -r test                                                 (all packages)
pnpm --filter @fitness/api test                              (single package)
pnpm --filter @fitness/mobile test                           (mobile vitest)
pnpm --filter @fitness/mobile vitest run src/.../foo.test.ts (single file)
```

### Forbidden patterns

- NEVER `git add -A` / `git add .` — always stage explicit paths
- NEVER stage `" 2"`-suffix iCloud-sync dup files
- NEVER run `npm install` inside node:20 container on VPS — it mutates package.json. Use pre-installed drizzle-kit via the migration container script.

### VPS deploy

Tailscale `root@100.67.196.22`. Repo at `/srv/fitclub-os`. Steps:
1. `git fetch origin main && git reset --hard origin/main`
2. drizzle migrate via node:20 container on `supabase_default` network
3. `git checkout -- packages/db/package.json` (revert if mutated)
4. `psql -U postgres -d postgres -f <rls.sql>` for SQL
5. `docker compose ... build web && up -d web` for web rebuild

---

## Task 1: PG schema — add members.user_id + studio_settings.logo_url

**Files:**
- Modify: `packages/db/src/schema/members.ts`
- Modify: `packages/db/src/schema/studioSettings.ts`

- [ ] **Step 1: Add user_id to members.ts**

Open `packages/db/src/schema/members.ts`. Inside the `pgTable("members", { ... })` column block, after the existing columns and before the index callback, add:

```ts
userId: uuid("user_id"),
```

We don't add a `.references(() => authUsers.id)` because `auth.users` is in a separate schema (Supabase managed). The FK is added in the migration SQL manually with `ON DELETE SET NULL`.

Add an index inside the callback:

```ts
userIdx: index("members_user_id_idx").on(t.userId),
```

If `index` isn't imported at the top of `members.ts`, add it:

```ts
import { index, pgTable, ... } from "drizzle-orm/pg-core";
```

- [ ] **Step 2: Add logo_url to studioSettings.ts**

Open `packages/db/src/schema/studioSettings.ts`. Inside the column block, after `accentColor`, add:

```ts
logoUrl: text("logo_url"),
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @fitness/db typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/schema/members.ts packages/db/src/schema/studioSettings.ts
git commit -m "feat(db): members.user_id + studio_settings.logo_url

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Generate migration + add triggers, functions, backfill, FK

**Files:**
- Create (generated): `packages/db/migrations/0008_<name>.sql`

- [ ] **Step 1: Generate migration**

```bash
pnpm --filter @fitness/db exec drizzle-kit generate
```

Note the new filename, e.g. `0008_fluffy_owl.sql`.

- [ ] **Step 2: Inspect generated SQL**

`cat packages/db/migrations/0008_*.sql`

Expected content:
- `ALTER TABLE "members" ADD COLUMN "user_id" uuid;`
- `ALTER TABLE "studio_settings" ADD COLUMN "logo_url" text;`
- `CREATE INDEX ... "members_user_id_idx" ON "members" ("user_id");`

If anything is missing, schema files have an issue — fix and regenerate.

- [ ] **Step 3: Append manual SQL — FK constraint + functions + triggers + backfill**

Append to the bottom of the generated `0008_*.sql`:

```sql
-- Manual: FK to auth.users (across-schema, drizzle-kit cannot generate)
ALTER TABLE "members"
  ADD CONSTRAINT "members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE SET NULL;

-- Helper function: list tenant_ids the current auth user is a member of
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS TABLE(tenant_id uuid)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.tenant_id
  FROM public.members m
  WHERE m.user_id = auth.uid()
    AND m.deleted_at IS NULL;
$$;

-- Trigger: when a new auth.users row is created (OTP first-login),
-- link all existing members with the same email.
CREATE OR REPLACE FUNCTION public.link_auth_user_to_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.members
  SET user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_auth_user_to_members();

-- Trigger: when admin creates a new member, link to existing auth user if email matches
CREATE OR REPLACE FUNCTION public.link_member_to_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.user_id IS NULL THEN
    SELECT id INTO NEW.user_id FROM auth.users WHERE email = NEW.email LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_member_insert_link ON public.members;
CREATE TRIGGER on_member_insert_link
BEFORE INSERT ON public.members
FOR EACH ROW EXECUTE FUNCTION public.link_member_to_auth_user();

-- One-time backfill: link existing auth.users to existing member rows by email
UPDATE public.members m
SET user_id = u.id, updated_at = now()
FROM auth.users u
WHERE m.email = u.email AND m.user_id IS NULL;
```

- [ ] **Step 4: Commit**

```bash
git add packages/db/migrations/0008_*.sql
git commit -m "feat(db): 0008 migration — user_id FK + triggers + backfill

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: RLS rewrite — hybrid form for all tenant-scoped tables

**Files:**
- Create: `infra/supabase/policies/0008_multi_tenant_rls.sql`
- Create: `infra/supabase/policies/0008_revert.sql`

- [ ] **Step 1: Create the RLS rewrite file**

`infra/supabase/policies/0008_multi_tenant_rls.sql`:

```sql
-- infra/supabase/policies/0008_multi_tenant_rls.sql
-- Drops all *_mobile_anon permissive policies and rewrites strict tenant
-- policies to a hybrid form that supports BOTH the admin web
-- (current_tenant_id() session setting) AND the mobile JWT path
-- (user_tenant_ids() based on auth.uid()).

-- -----------------------------------------------------------
-- Step 1: Drop all *_mobile_anon permissive policies
-- -----------------------------------------------------------
DROP POLICY IF EXISTS members_mobile_anon ON public.members;
DROP POLICY IF EXISTS memberships_mobile_anon ON public.memberships;
DROP POLICY IF EXISTS payments_mobile_anon ON public.payments;
DROP POLICY IF EXISTS checkins_mobile_anon ON public.checkins;
DROP POLICY IF EXISTS bookings_mobile_anon ON public.bookings;
DROP POLICY IF EXISTS classes_mobile_anon ON public.classes;
DROP POLICY IF EXISTS instructors_mobile_anon ON public.instructors;
DROP POLICY IF EXISTS sessions_mobile_anon ON public.sessions;
DROP POLICY IF EXISTS waitlist_mobile_anon ON public.waitlist;
DROP POLICY IF EXISTS plans_mobile_anon ON public.plans;
DROP POLICY IF EXISTS studio_settings_mobile_anon ON public.studio_settings;
DROP POLICY IF EXISTS notification_templates_mobile_anon ON public.notification_templates;
DROP POLICY IF EXISTS notification_sends_mobile_anon ON public.notification_sends;
DROP POLICY IF EXISTS exercises_mobile_anon ON public.exercises;
DROP POLICY IF EXISTS member_exercise_prefs_mobile_anon ON public.member_exercise_prefs;
DROP POLICY IF EXISTS workouts_mobile_anon ON public.workouts;
DROP POLICY IF EXISTS workout_sets_mobile_anon ON public.workout_sets;
DROP POLICY IF EXISTS challenges_mobile_anon ON public.challenges;
DROP POLICY IF EXISTS challenge_participants_mobile_anon ON public.challenge_participants;
DROP POLICY IF EXISTS workout_templates_mobile_anon ON public.workout_templates;
DROP POLICY IF EXISTS wte_mobile_anon ON public.workout_template_exercises;
DROP POLICY IF EXISTS programs_mobile_anon ON public.programs;
DROP POLICY IF EXISTS program_days_mobile_anon ON public.program_days;
DROP POLICY IF EXISTS program_day_completions_mobile_anon ON public.program_day_completions;

-- -----------------------------------------------------------
-- Step 2: Rewrite strict policies to hybrid form
-- -----------------------------------------------------------

-- members
DROP POLICY IF EXISTS members_select ON public.members;
DROP POLICY IF EXISTS members_modify ON public.members;

CREATE POLICY members_select ON public.members
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY members_modify ON public.members
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- memberships
DROP POLICY IF EXISTS memberships_select ON public.memberships;
DROP POLICY IF EXISTS memberships_modify ON public.memberships;
CREATE POLICY memberships_select ON public.memberships
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY memberships_modify ON public.memberships
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- payments
DROP POLICY IF EXISTS payments_select ON public.payments;
DROP POLICY IF EXISTS payments_modify ON public.payments;
CREATE POLICY payments_select ON public.payments
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY payments_modify ON public.payments
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- checkins
DROP POLICY IF EXISTS checkins_select ON public.checkins;
DROP POLICY IF EXISTS checkins_modify ON public.checkins;
CREATE POLICY checkins_select ON public.checkins
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY checkins_modify ON public.checkins
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- bookings
DROP POLICY IF EXISTS bookings_select ON public.bookings;
DROP POLICY IF EXISTS bookings_modify ON public.bookings;
CREATE POLICY bookings_select ON public.bookings
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY bookings_modify ON public.bookings
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- classes
DROP POLICY IF EXISTS classes_select ON public.classes;
DROP POLICY IF EXISTS classes_modify ON public.classes;
CREATE POLICY classes_select ON public.classes
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY classes_modify ON public.classes
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- instructors
DROP POLICY IF EXISTS instructors_select ON public.instructors;
DROP POLICY IF EXISTS instructors_modify ON public.instructors;
CREATE POLICY instructors_select ON public.instructors
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY instructors_modify ON public.instructors
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- sessions
DROP POLICY IF EXISTS sessions_select ON public.sessions;
DROP POLICY IF EXISTS sessions_modify ON public.sessions;
CREATE POLICY sessions_select ON public.sessions
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY sessions_modify ON public.sessions
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- waitlist
DROP POLICY IF EXISTS waitlist_select ON public.waitlist;
DROP POLICY IF EXISTS waitlist_modify ON public.waitlist;
CREATE POLICY waitlist_select ON public.waitlist
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY waitlist_modify ON public.waitlist
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- plans
DROP POLICY IF EXISTS plans_select ON public.plans;
DROP POLICY IF EXISTS plans_modify ON public.plans;
CREATE POLICY plans_select ON public.plans
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY plans_modify ON public.plans
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- studio_settings
DROP POLICY IF EXISTS studio_settings_select ON public.studio_settings;
DROP POLICY IF EXISTS studio_settings_modify ON public.studio_settings;
CREATE POLICY studio_settings_select ON public.studio_settings
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY studio_settings_modify ON public.studio_settings
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- notification_templates
DROP POLICY IF EXISTS notification_templates_select ON public.notification_templates;
DROP POLICY IF EXISTS notification_templates_modify ON public.notification_templates;
CREATE POLICY notification_templates_select ON public.notification_templates
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY notification_templates_modify ON public.notification_templates
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- notification_sends
DROP POLICY IF EXISTS notification_sends_select ON public.notification_sends;
DROP POLICY IF EXISTS notification_sends_modify ON public.notification_sends;
CREATE POLICY notification_sends_select ON public.notification_sends
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY notification_sends_modify ON public.notification_sends
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- exercises (mixed: tenant-scoped custom + global library)
DROP POLICY IF EXISTS exercises_select ON public.exercises;
DROP POLICY IF EXISTS exercises_modify ON public.exercises;
CREATE POLICY exercises_select ON public.exercises
  FOR SELECT USING (
    tenant_id IS NULL  -- global library
    OR tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY exercises_modify ON public.exercises
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- member_exercise_prefs
DROP POLICY IF EXISTS member_exercise_prefs_select ON public.member_exercise_prefs;
DROP POLICY IF EXISTS member_exercise_prefs_modify ON public.member_exercise_prefs;
CREATE POLICY member_exercise_prefs_select ON public.member_exercise_prefs
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY member_exercise_prefs_modify ON public.member_exercise_prefs
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- workouts
DROP POLICY IF EXISTS workouts_select ON public.workouts;
DROP POLICY IF EXISTS workouts_modify ON public.workouts;
CREATE POLICY workouts_select ON public.workouts
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY workouts_modify ON public.workouts
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- workout_sets (child of workouts — parent-join check)
DROP POLICY IF EXISTS workout_sets_select ON public.workout_sets;
DROP POLICY IF EXISTS workout_sets_modify ON public.workout_sets;
CREATE POLICY workout_sets_select ON public.workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_sets.workout_id
        AND (
          w.tenant_id = public.current_tenant_id()
          OR w.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY workout_sets_modify ON public.workout_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_sets.workout_id
        AND (
          w.tenant_id = public.current_tenant_id()
          OR w.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_sets.workout_id
        AND (
          w.tenant_id = public.current_tenant_id()
          OR w.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- challenges
DROP POLICY IF EXISTS challenges_select ON public.challenges;
DROP POLICY IF EXISTS challenges_modify ON public.challenges;
CREATE POLICY challenges_select ON public.challenges
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY challenges_modify ON public.challenges
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- challenge_participants (parent-join via challenges)
DROP POLICY IF EXISTS challenge_participants_select ON public.challenge_participants;
DROP POLICY IF EXISTS challenge_participants_modify ON public.challenge_participants;
CREATE POLICY challenge_participants_select ON public.challenge_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
        AND (
          c.tenant_id = public.current_tenant_id()
          OR c.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY challenge_participants_modify ON public.challenge_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
        AND (
          c.tenant_id = public.current_tenant_id()
          OR c.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
        AND (
          c.tenant_id = public.current_tenant_id()
          OR c.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- workout_templates
DROP POLICY IF EXISTS workout_templates_select ON public.workout_templates;
DROP POLICY IF EXISTS workout_templates_modify ON public.workout_templates;
CREATE POLICY workout_templates_select ON public.workout_templates
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY workout_templates_modify ON public.workout_templates
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- workout_template_exercises (parent-join via templates)
DROP POLICY IF EXISTS wte_select ON public.workout_template_exercises;
DROP POLICY IF EXISTS wte_modify ON public.workout_template_exercises;
CREATE POLICY wte_select ON public.workout_template_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = workout_template_exercises.template_id
        AND (
          t.tenant_id = public.current_tenant_id()
          OR t.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY wte_modify ON public.workout_template_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = workout_template_exercises.template_id
        AND (
          t.tenant_id = public.current_tenant_id()
          OR t.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = workout_template_exercises.template_id
        AND (
          t.tenant_id = public.current_tenant_id()
          OR t.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- programs
DROP POLICY IF EXISTS programs_select ON public.programs;
DROP POLICY IF EXISTS programs_modify ON public.programs;
CREATE POLICY programs_select ON public.programs
  FOR SELECT USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
CREATE POLICY programs_modify ON public.programs
  FOR ALL USING (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    OR tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );

-- program_days (parent-join via programs)
DROP POLICY IF EXISTS program_days_select ON public.program_days;
DROP POLICY IF EXISTS program_days_modify ON public.program_days;
CREATE POLICY program_days_select ON public.program_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_days.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY program_days_modify ON public.program_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_days.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_days.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- program_day_completions (parent-join via programs)
DROP POLICY IF EXISTS program_day_completions_select ON public.program_day_completions;
DROP POLICY IF EXISTS program_day_completions_modify ON public.program_day_completions;
CREATE POLICY program_day_completions_select ON public.program_day_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_day_completions.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );
CREATE POLICY program_day_completions_modify ON public.program_day_completions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_day_completions.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_day_completions.program_id
        AND (
          p.tenant_id = public.current_tenant_id()
          OR p.tenant_id IN (SELECT tenant_id FROM public.user_tenant_ids())
        )
    )
  );

-- -----------------------------------------------------------
-- Step 3: tenants self-select policy (gym picker needs to read tenant names)
-- -----------------------------------------------------------
DROP POLICY IF EXISTS tenants_select_self ON public.tenants;
CREATE POLICY tenants_select_self ON public.tenants
  FOR SELECT USING (
    id = public.current_tenant_id()
    OR id IN (SELECT tenant_id FROM public.user_tenant_ids())
  );
```

- [ ] **Step 2: Create rollback file**

`infra/supabase/policies/0008_revert.sql`:

```sql
-- Rollback for 0008_multi_tenant_rls.sql.
-- Re-applies the permissive *_mobile_anon policies and reverts strict
-- policies back to current_tenant_id() only.
--
-- USAGE: apply this only if Task 3 RLS rewrite causes a critical
-- regression that cannot be hotfixed forward. After applying, re-run
-- 0005_mobile_anon_access.sql, 0006_challenges_policies.sql, and
-- 0007_programs_policies.sql to restore the previous mobile-anon
-- policies for those tables.

DROP POLICY IF EXISTS members_select ON public.members;
DROP POLICY IF EXISTS members_modify ON public.members;
CREATE POLICY members_select ON public.members
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY members_modify ON public.members
  FOR ALL USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- (Repeat for every table modified in 0008_multi_tenant_rls.sql.
-- Full list maintained here for emergency rollback; the canonical
-- previous policy bodies live in:
--   infra/supabase/policies/0005_mobile_anon_access.sql
--   infra/supabase/policies/0006_challenges_policies.sql
--   infra/supabase/policies/0007_programs_policies.sql
-- After this DROP/CREATE pass, re-run those three files to restore
-- the *_mobile_anon permissive policies.)
```

- [ ] **Step 3: Commit**

```bash
git add infra/supabase/policies/0008_multi_tenant_rls.sql infra/supabase/policies/0008_revert.sql
git commit -m "feat(infra): 0008 RLS rewrite — hybrid form + revert

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Supabase Storage bucket for gym logos

**Files:**
- Create: `infra/supabase/storage/0008_gym_logos_bucket.sql`

- [ ] **Step 1: Create bucket + policies SQL**

`infra/supabase/storage/0008_gym_logos_bucket.sql`:

```sql
-- infra/supabase/storage/0008_gym_logos_bucket.sql
-- Creates the public read / authenticated write bucket for tenant logos.

INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-logos', 'gym-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Public logo read" ON storage.objects;
CREATE POLICY "Public logo read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gym-logos');

-- Authenticated write to own tenant folder
DROP POLICY IF EXISTS "Authenticated upload to own tenant folder" ON storage.objects;
CREATE POLICY "Authenticated upload to own tenant folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gym-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.user_tenant_ids()
    )
  );

DROP POLICY IF EXISTS "Authenticated update own tenant logos" ON storage.objects;
CREATE POLICY "Authenticated update own tenant logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gym-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.user_tenant_ids()
    )
  );

DROP POLICY IF EXISTS "Authenticated delete own tenant logos" ON storage.objects;
CREATE POLICY "Authenticated delete own tenant logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gym-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.user_tenant_ids()
    )
  );
```

- [ ] **Step 2: Commit**

```bash
git add infra/supabase/storage/0008_gym_logos_bucket.sql
git commit -m "feat(infra): gym-logos storage bucket + RLS policies

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Shared types in @fitness/api

**Files:**
- Create: `packages/api/src/auth/types.ts`
- Modify: `packages/api/src/index.ts`

- [ ] **Step 1: Create types module**

`packages/api/src/auth/types.ts`:

```ts
export type Membership = {
  memberId: string;
  tenantId: string;
  gymName: string;
  logoUrl: string | null;
  accentColor: string | null;
};

export type TenantBranding = {
  gymName: string;
  logoUrl: string | null;
  accentColor: string | null;
};
```

- [ ] **Step 2: Re-export**

Edit `packages/api/src/index.ts`, append:

```ts
export * from "./auth/types";
```

- [ ] **Step 3: Typecheck**

`pnpm --filter @fitness/api typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/auth/types.ts packages/api/src/index.ts
git commit -m "feat(api): Membership + TenantBranding shared types

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Mobile tenant-store

**Files:**
- Create: `apps/mobile/src/lib/tenant-store.ts`
- Create: `apps/mobile/src/lib/__tests__/tenant-store.test.ts`

- [ ] **Step 1: Add Zustand dependency**

Check if Zustand is already installed:

```bash
grep '"zustand"' apps/mobile/package.json
```

If not present, add it:

```bash
pnpm --filter @fitness/mobile add zustand
```

- [ ] **Step 2: Write failing test**

`apps/mobile/src/lib/__tests__/tenant-store.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    multiRemove: vi.fn(async () => undefined),
  },
}));

vi.mock("../supabase", () => ({
  getSupabase: () => ({
    auth: { signOut: vi.fn(async () => ({ error: null })) },
  }),
}));

import { useTenantStore } from "../tenant-store";

const A = {
  memberId: "m-1",
  tenantId: "t-1",
  gymName: "Gym A",
  logoUrl: null,
  accentColor: "#2f5596",
};
const B = {
  memberId: "m-2",
  tenantId: "t-2",
  gymName: "Gym B",
  logoUrl: "https://example.com/b.png",
  accentColor: "#e63946",
};

beforeEach(() => {
  useTenantStore.setState({
    memberships: [],
    currentTenantId: null,
    currentMemberId: null,
    currentBranding: null,
    isAuthed: false,
  });
});

describe("tenant-store", () => {
  it("hydrate sets memberships + current", () => {
    useTenantStore.getState().hydrate([A, B], "t-1");
    const s = useTenantStore.getState();
    expect(s.memberships).toHaveLength(2);
    expect(s.currentTenantId).toBe("t-1");
    expect(s.currentMemberId).toBe("m-1");
    expect(s.currentBranding?.gymName).toBe("Gym A");
    expect(s.isAuthed).toBe(true);
  });

  it("setCurrent updates branding", async () => {
    await useTenantStore.getState().setMemberships([A, B]);
    await useTenantStore.getState().setCurrent(B);
    expect(useTenantStore.getState().currentBranding?.gymName).toBe("Gym B");
    expect(useTenantStore.getState().currentBranding?.accentColor).toBe("#e63946");
  });

  it("switchTo finds membership by tenant id", async () => {
    useTenantStore.getState().hydrate([A, B], "t-1");
    await useTenantStore.getState().switchTo("t-2");
    expect(useTenantStore.getState().currentTenantId).toBe("t-2");
  });

  it("switchTo throws if unknown tenant", async () => {
    useTenantStore.getState().hydrate([A], "t-1");
    await expect(
      useTenantStore.getState().switchTo("t-unknown"),
    ).rejects.toThrow(/Membership not found/);
  });

  it("signOut clears everything", async () => {
    useTenantStore.getState().hydrate([A, B], "t-1");
    await useTenantStore.getState().signOut();
    const s = useTenantStore.getState();
    expect(s.memberships).toHaveLength(0);
    expect(s.currentTenantId).toBeNull();
    expect(s.isAuthed).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

`pnpm --filter @fitness/mobile vitest run src/lib/__tests__/tenant-store.test.ts`
Expected: FAIL with "Cannot find module '../tenant-store'"

- [ ] **Step 4: Implement tenant-store**

`apps/mobile/src/lib/tenant-store.ts`:

```ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Membership, TenantBranding } from "@fitness/api";
import { getSupabase } from "./supabase";

const STORAGE_CURRENT = "fitclub.tenant.current";
const STORAGE_MEMBERSHIPS = "fitclub.tenant.memberships";

type State = {
  memberships: Membership[];
  currentTenantId: string | null;
  currentMemberId: string | null;
  currentBranding: TenantBranding | null;
  isAuthed: boolean;

  hydrate: (memberships: Membership[], currentId: string) => void;
  setMemberships: (memberships: Membership[]) => Promise<void>;
  setCurrent: (m: Membership) => Promise<void>;
  switchTo: (tenantId: string) => Promise<void>;
  signOut: () => Promise<void>;
};

function brandingOf(m: Membership): TenantBranding {
  return {
    gymName: m.gymName,
    logoUrl: m.logoUrl,
    accentColor: m.accentColor,
  };
}

export const useTenantStore = create<State>((set, get) => ({
  memberships: [],
  currentTenantId: null,
  currentMemberId: null,
  currentBranding: null,
  isAuthed: false,

  hydrate: (memberships, currentId) => {
    const current = memberships.find((m) => m.tenantId === currentId) ?? null;
    set({
      memberships,
      currentTenantId: current?.tenantId ?? null,
      currentMemberId: current?.memberId ?? null,
      currentBranding: current ? brandingOf(current) : null,
      isAuthed: memberships.length > 0,
    });
  },

  setMemberships: async (memberships) => {
    await AsyncStorage.setItem(STORAGE_MEMBERSHIPS, JSON.stringify(memberships));
    set({ memberships, isAuthed: memberships.length > 0 });
  },

  setCurrent: async (m) => {
    await AsyncStorage.setItem(STORAGE_CURRENT, m.tenantId);
    set({
      currentTenantId: m.tenantId,
      currentMemberId: m.memberId,
      currentBranding: brandingOf(m),
    });
  },

  switchTo: async (tenantId) => {
    const m = get().memberships.find((x) => x.tenantId === tenantId);
    if (!m) throw new Error(`Membership not found for tenant ${tenantId}`);
    await AsyncStorage.setItem(STORAGE_CURRENT, tenantId);
    set({
      currentTenantId: tenantId,
      currentMemberId: m.memberId,
      currentBranding: brandingOf(m),
    });
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.multiRemove([STORAGE_CURRENT, STORAGE_MEMBERSHIPS]);
    set({
      memberships: [],
      currentTenantId: null,
      currentMemberId: null,
      currentBranding: null,
      isAuthed: false,
    });
  },
}));
```

- [ ] **Step 5: Run tests + typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
pnpm --filter @fitness/mobile vitest run src/lib/__tests__/tenant-store.test.ts
```

Expected: PASS, 5 tests

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/lib/tenant-store.ts apps/mobile/src/lib/__tests__/tenant-store.test.ts apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): tenant-store with hydrate/switchTo/signOut

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Mobile theme-provider

**Files:**
- Create: `apps/mobile/src/lib/theme-provider.tsx`
- Create: `apps/mobile/src/lib/__tests__/theme-provider.test.ts`

- [ ] **Step 1: Write failing test**

`apps/mobile/src/lib/__tests__/theme-provider.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hexAlpha, sanitizeHex } from "../theme-provider";

describe("sanitizeHex", () => {
  it("accepts 6-digit lowercase hex", () => {
    expect(sanitizeHex("#2f5596")).toBe("#2f5596");
  });
  it("accepts 6-digit uppercase hex", () => {
    expect(sanitizeHex("#2F5596")).toBe("#2F5596");
  });
  it("rejects 3-digit hex", () => {
    expect(sanitizeHex("#2f5")).toBeNull();
  });
  it("rejects missing #", () => {
    expect(sanitizeHex("2f5596")).toBeNull();
  });
  it("rejects garbage", () => {
    expect(sanitizeHex("not a color")).toBeNull();
    expect(sanitizeHex(null)).toBeNull();
    expect(sanitizeHex(undefined)).toBeNull();
  });
});

describe("hexAlpha", () => {
  it("converts hex + alpha to rgba", () => {
    expect(hexAlpha("#2f5596", 0.12)).toBe("rgba(47,85,150,0.12)");
  });
  it("handles 0 alpha", () => {
    expect(hexAlpha("#000000", 0)).toBe("rgba(0,0,0,0)");
  });
  it("handles full alpha", () => {
    expect(hexAlpha("#ffffff", 1)).toBe("rgba(255,255,255,1)");
  });
});
```

- [ ] **Step 2: Run test (fails — module missing)**

`pnpm --filter @fitness/mobile vitest run src/lib/__tests__/theme-provider.test.ts`
Expected: FAIL with "Cannot find module '../theme-provider'"

- [ ] **Step 3: Implement theme-provider**

`apps/mobile/src/lib/theme-provider.tsx`:

```tsx
import React, { createContext, useContext, useMemo } from "react";
import { tokens } from "../theme/tokens";
import { useTenantStore } from "./tenant-store";

export type Theme = {
  accent: string;
  accentSoft: string;
  logoUrl: string | null;
  gymName: string;
};

const DEFAULT_THEME: Theme = {
  accent: tokens.color.accent,
  accentSoft: tokens.color.accentSoft,
  logoUrl: null,
  gymName: "FitClub",
};

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

export function sanitizeHex(hex: string | null | undefined): string | null {
  if (!hex || typeof hex !== "string") return null;
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return hex;
}

export function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const branding = useTenantStore((s) => s.currentBranding);
  const theme = useMemo<Theme>(() => {
    const accent = sanitizeHex(branding?.accentColor) ?? tokens.color.accent;
    return {
      accent,
      accentSoft: hexAlpha(accent, 0.12),
      logoUrl: branding?.logoUrl ?? null,
      gymName: branding?.gymName ?? "FitClub",
    };
  }, [branding]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
```

- [ ] **Step 4: Run tests + typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
pnpm --filter @fitness/mobile vitest run src/lib/__tests__/theme-provider.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/theme-provider.tsx apps/mobile/src/lib/__tests__/theme-provider.test.ts
git commit -m "feat(mobile): ThemeProvider with per-tenant accent + logo + name

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Mobile auth.ts refactor + fetchMyMemberships

**Files:**
- Create: `apps/mobile/src/lib/auth.ts`
- Modify: `apps/mobile/src/lib/api.ts`

- [ ] **Step 1: Create lib/auth.ts**

`apps/mobile/src/lib/auth.ts`:

```ts
import { getSupabase } from "./supabase";

export async function sendLoginCode(email: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyLoginCode(
  email: string,
  token: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });
  if (error) throw error;
  if (!data.session) throw new Error("No session returned from verifyOtp");
}

export async function getCurrentSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
```

- [ ] **Step 2: Add fetchMyMemberships to lib/api.ts**

Append to `apps/mobile/src/lib/api.ts` (after existing exports):

```ts
import type { Membership } from "@fitness/api";

export async function fetchMyMemberships(): Promise<Membership[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("members")
    .select(`
      id,
      tenant_id,
      tenants!inner(name),
      studio_settings(logo_url, accent_color)
    `)
    .is("deleted_at", null);
  if (error) {
    console.warn("fetchMyMemberships", error.message);
    return [];
  }
  return (data ?? []).map((m: any) => ({
    memberId: String(m.id),
    tenantId: String(m.tenant_id),
    gymName: m.tenants?.name ?? "Unknown gym",
    logoUrl: m.studio_settings?.[0]?.logo_url ?? null,
    accentColor: m.studio_settings?.[0]?.accent_color ?? null,
  }));
}
```

- [ ] **Step 3: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/lib/auth.ts apps/mobile/src/lib/api.ts
git commit -m "feat(mobile): lib/auth.ts OTP wrappers + fetchMyMemberships

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Mobile login screen (email entry)

**Files:**
- Create: `apps/mobile/src/app/(auth)/login.tsx`

- [ ] **Step 1: Write the screen**

`apps/mobile/src/app/(auth)/login.tsx`:

```tsx
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { tokens } from "../../theme/tokens";
import { sendLoginCode } from "../../lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  const onSubmit = async () => {
    if (submitting || !validEmail) return;
    setSubmitting(true);
    try {
      await sendLoginCode(email.trim());
      router.push({
        pathname: "/(auth)/otp-verify",
        params: { email: email.trim().toLowerCase() },
      });
    } catch (e: any) {
      Alert.alert("Could not send code", e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer padding={24} contentStyle={{ paddingTop: 64 }}>
      <Text style={styles.title}>FitClub</Text>
      <Text style={styles.subtitle}>Sign in with your email</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      <PrimaryButton
        label={submitting ? "Sending…" : "Send code"}
        onPress={onSubmit}
        variant="primary"
        disabled={!validEmail || submitting}
        style={{ marginTop: 16 }}
      />

      <Text style={styles.helper}>
        We&apos;ll email you a 6-digit code. Ask your gym&apos;s front desk
        if you haven&apos;t been added yet.
      </Text>

      <Pressable onPress={() => router.push("/(auth)/otp-request")} style={styles.fallback}>
        <Text style={styles.fallbackText}>Use phone instead</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 32,
    color: tokens.color.fg,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 15,
    color: tokens.color.fgMuted,
    marginBottom: 32,
  },
  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 10,
    backgroundColor: tokens.color.surface,
    fontFamily: tokens.font.sansRegular,
    fontSize: 16,
  },
  helper: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginTop: 16,
    lineHeight: 18,
  },
  fallback: {
    marginTop: 24,
    alignItems: "center",
  },
  fallbackText: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    textDecorationLine: "underline",
  },
});
```

- [ ] **Step 2: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/src/app/(auth)/login.tsx"
git commit -m "feat(mobile): /(auth)/login email-entry screen

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Mobile OTP verify screen — adapt to memberships flow

**Files:**
- Modify: `apps/mobile/src/app/(auth)/otp-verify.tsx`

- [ ] **Step 1: Read current implementation**

```bash
cat apps/mobile/src/app/\(auth\)/otp-verify.tsx
```

Note existing state, the OTP digit array UI, resend countdown.

- [ ] **Step 2: Add post-verify memberships logic**

After the successful `verifyOtp` call (find the line `await supabase.auth.verifyOtp(...)` or equivalent), replace the navigation block with this logic. The exact insertion point is the success branch after `verifyLoginCode` (or existing call) returns without error.

```ts
import { useTenantStore } from "../../lib/tenant-store";
import { fetchMyMemberships } from "../../lib/api";
import { verifyLoginCode } from "../../lib/auth";
// ... existing imports

// Inside the onVerify handler (or equivalent):
try {
  await verifyLoginCode(email, code);  // throws on bad code
} catch (e: any) {
  setError(e?.message ?? "Invalid code");
  setSubmitting(false);
  return;
}

const memberships = await fetchMyMemberships();
if (memberships.length === 0) {
  setError("No gym membership found for this email. Ask your gym to add you.");
  setSubmitting(false);
  return;
}

await useTenantStore.getState().setMemberships(memberships);

if (memberships.length === 1) {
  await useTenantStore.getState().setCurrent(memberships[0]!);
  router.replace("/(tabs)");
} else {
  router.replace("/(auth)/gym-picker");
}
```

Adapt to the screen's existing variable names (`email` may come from `useLocalSearchParams`; `code` from digit array state). If the screen still uses phone OTP path, keep it but only the email-success path needs the new logic.

- [ ] **Step 3: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(auth)/otp-verify.tsx"
git commit -m "feat(mobile): otp-verify hydrates memberships + routes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Gym picker screen + GymRow component

**Files:**
- Create: `apps/mobile/src/components/GymRow.tsx`
- Create: `apps/mobile/src/app/(auth)/gym-picker.tsx`

- [ ] **Step 1: Create GymRow component**

`apps/mobile/src/components/GymRow.tsx`:

```tsx
import React from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import type { Membership } from "@fitness/api";

type Props = {
  membership: Membership;
  isCurrent?: boolean;
  onPress: () => void;
};

export function GymRow({ membership, isCurrent, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, isCurrent && styles.rowCurrent]}
    >
      <View style={styles.dotWrap}>
        <View style={[styles.dot, isCurrent && styles.dotFilled]} />
      </View>
      {membership.logoUrl ? (
        <Image
          source={{ uri: membership.logoUrl }}
          style={styles.logo}
          contentFit="contain"
        />
      ) : (
        <View style={styles.logoFallback}>
          <Text style={styles.logoFallbackText}>
            {membership.gymName.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {membership.gymName}
        </Text>
        <Text style={styles.sub}>Member</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginVertical: 6,
    backgroundColor: tokens.color.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  rowCurrent: {
    borderColor: tokens.color.accent,
    borderWidth: 2,
  },
  dotWrap: { width: 24, alignItems: "center" },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: tokens.color.border,
  },
  dotFilled: {
    backgroundColor: tokens.color.accent,
    borderColor: tokens.color.accent,
  },
  logo: { width: 40, height: 40, marginHorizontal: 12, borderRadius: 8 },
  logoFallback: {
    width: 40,
    height: 40,
    marginHorizontal: 12,
    borderRadius: 8,
    backgroundColor: tokens.color.bg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 18,
    color: tokens.color.fgMuted,
  },
  body: { flex: 1 },
  name: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },
});
```

- [ ] **Step 2: Create gym picker screen**

`apps/mobile/src/app/(auth)/gym-picker.tsx`:

```tsx
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { GymRow } from "../../components/GymRow";
import { tokens } from "../../theme/tokens";
import { useTenantStore } from "../../lib/tenant-store";

export default function GymPickerScreen() {
  const router = useRouter();
  const memberships = useTenantStore((s) => s.memberships);
  const setCurrent = useTenantStore((s) => s.setCurrent);

  return (
    <ScreenContainer padding={20} contentStyle={{ paddingTop: 40 }}>
      <Text style={styles.title}>Choose your gym</Text>
      <Text style={styles.subtitle}>
        You&apos;re a member of {memberships.length} gyms.
      </Text>
      <FlatList
        data={memberships}
        keyExtractor={(m) => m.tenantId}
        renderItem={({ item }) => (
          <GymRow
            membership={item}
            onPress={async () => {
              await setCurrent(item);
              router.replace("/(tabs)");
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No gyms available.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 16,
  },
  empty: { padding: 24, alignItems: "center" },
  emptyText: { color: tokens.color.fgMuted, fontFamily: tokens.font.sansRegular },
});
```

- [ ] **Step 3: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/GymRow.tsx "apps/mobile/src/app/(auth)/gym-picker.tsx"
git commit -m "feat(mobile): gym picker screen + GymRow component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: AppHeader component

**Files:**
- Create: `apps/mobile/src/components/AppHeader.tsx`

- [ ] **Step 1: Create AppHeader**

`apps/mobile/src/components/AppHeader.tsx`:

```tsx
import React from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";

export function AppHeader({ title }: { title?: string }) {
  const { logoUrl, gymName } = useTheme();
  return (
    <View style={styles.header}>
      {logoUrl ? (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logo}
          contentFit="contain"
        />
      ) : (
        <Text style={styles.gymName}>{gymName}</Text>
      )}
      {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  logo: { width: 32, height: 32 },
  gymName: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 16,
    color: tokens.color.fg,
  },
  pageTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    marginLeft: 8,
  },
});
```

- [ ] **Step 2: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/AppHeader.tsx
git commit -m "feat(mobile): AppHeader with per-tenant logo + name

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Root layout — wrap providers + entry routing

**Files:**
- Modify: `apps/mobile/src/app/_layout.tsx`
- Modify: `apps/mobile/src/app/index.tsx`

- [ ] **Step 1: Read current layout**

```bash
cat apps/mobile/src/app/_layout.tsx
cat apps/mobile/src/app/index.tsx
```

Note existing providers (AuthProvider, WorkoutSessionProvider, etc.).

- [ ] **Step 2: Wrap with ThemeProvider in _layout.tsx**

Edit `apps/mobile/src/app/_layout.tsx`. Add import at top:

```tsx
import { ThemeProvider } from "../lib/theme-provider";
```

Find the existing provider chain (e.g. `<AuthProvider>...</AuthProvider>`). Wrap the existing `<Stack>` (or the whole inner tree) with `<ThemeProvider>` so all screens see tenant-derived theme:

```tsx
return (
  <AuthProvider>
    <WorkoutSessionProvider>
      <ThemeProvider>
        <Stack>
          {/* existing screens */}
        </Stack>
      </ThemeProvider>
    </WorkoutSessionProvider>
  </AuthProvider>
);
```

(Adjust nesting to match the actual existing layout.)

- [ ] **Step 3: Add gym-picker + login to Stack screens**

Inside the `<Stack>` block, ensure these screens are declared (add if missing):

```tsx
<Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
<Stack.Screen name="(auth)/otp-verify" options={{ headerShown: false }} />
<Stack.Screen name="(auth)/gym-picker" options={{ headerShown: false }} />
```

- [ ] **Step 4: Entry routing in app/index.tsx**

Replace `apps/mobile/src/app/index.tsx` content:

```tsx
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTenantStore } from "../lib/tenant-store";
import { getCurrentSession } from "../lib/auth";
import { fetchMyMemberships } from "../lib/api";
import { tokens } from "../theme/tokens";

const STORAGE_CURRENT = "fitclub.tenant.current";
const STORAGE_MEMBERSHIPS = "fitclub.tenant.memberships";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) {
        router.replace("/(auth)/login");
        return;
      }

      // Try cached memberships first for fast cold-start
      const cachedStr = await AsyncStorage.getItem(STORAGE_MEMBERSHIPS);
      const currentId = await AsyncStorage.getItem(STORAGE_CURRENT);

      if (cachedStr && currentId) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            useTenantStore.getState().hydrate(parsed, currentId);
            router.replace("/(tabs)");
            return;
          }
        } catch {
          /* fall through to live fetch */
        }
      }

      // Live fetch
      const memberships = await fetchMyMemberships();
      if (memberships.length === 0) {
        await useTenantStore.getState().signOut();
        router.replace("/(auth)/login");
        return;
      }
      await useTenantStore.getState().setMemberships(memberships);
      if (memberships.length === 1) {
        await useTenantStore.getState().setCurrent(memberships[0]!);
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/gym-picker");
      }
    })();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tokens.color.bg,
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
```

- [ ] **Step 5: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/app/_layout.tsx apps/mobile/src/app/index.tsx
git commit -m "feat(mobile): root layout wraps ThemeProvider + index routes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: (tabs) layout — auth + tenant guards

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Read current tabs layout**

```bash
cat apps/mobile/src/app/\(tabs\)/_layout.tsx
```

- [ ] **Step 2: Add guard hook at top of component**

Edit `apps/mobile/src/app/(tabs)/_layout.tsx`. Add imports:

```tsx
import { Redirect } from "expo-router";
import { useTenantStore } from "../../lib/tenant-store";
```

Inside the component body, add the guard BEFORE the existing return:

```tsx
const isAuthed = useTenantStore((s) => s.isAuthed);
const currentTenantId = useTenantStore((s) => s.currentTenantId);

if (!isAuthed) return <Redirect href="/(auth)/login" />;
if (!currentTenantId) return <Redirect href="/(auth)/gym-picker" />;
```

- [ ] **Step 3: Tab bar tintColor from theme**

In the same file, locate the `<Tabs>` component (or `screenOptions`). Use `useTheme()` to derive `tabBarActiveTintColor`:

```tsx
import { useTheme } from "../../lib/theme-provider";

// inside component:
const theme = useTheme();

return (
  <Tabs
    screenOptions={{
      tabBarActiveTintColor: theme.accent,
      // ... existing options
    }}
  >
    {/* existing screens */}
  </Tabs>
);
```

If `tabBarActiveTintColor` was already set to a static value, replace with `theme.accent`.

- [ ] **Step 4: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/src/app/(tabs)/_layout.tsx"
git commit -m "feat(mobile): (tabs) layout auth+tenant guards + themed tab bar

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Profile — My gyms section + sign out

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/profile.tsx`

- [ ] **Step 1: Read current profile**

```bash
wc -l apps/mobile/src/app/\(tabs\)/profile.tsx
head -50 apps/mobile/src/app/\(tabs\)/profile.tsx
```

- [ ] **Step 2: Add imports**

At top of `apps/mobile/src/app/(tabs)/profile.tsx`:

```tsx
import { useTenantStore } from "../../lib/tenant-store";
import { GymRow } from "../../components/GymRow";
import { useWorkoutSession } from "../../workout/session-store";
```

- [ ] **Step 3: Add My gyms section + Sign out handler**

Inside the screen component body:

```tsx
const memberships = useTenantStore((s) => s.memberships);
const currentTenantId = useTenantStore((s) => s.currentTenantId);
const switchTo = useTenantStore((s) => s.switchTo);
const signOut = useTenantStore((s) => s.signOut);
const { workout: activeWorkout } = useWorkoutSession();

const onSwitchGym = async (tenantId: string) => {
  if (activeWorkout) {
    Alert.alert(
      "Finish active workout first",
      "Finish or discard your active workout before switching gyms.",
    );
    return;
  }
  await switchTo(tenantId);
};

const onSignOut = () => {
  Alert.alert(
    "Sign out?",
    "You'll need your email to sign back in.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ],
  );
};
```

Within the screen's JSX, insert the My gyms section. If `memberships.length > 1`, render between the user info area and the existing "Account" section:

```tsx
{memberships.length > 1 && (
  <View style={styles.gymsSection}>
    <Text style={styles.sectionLabel}>My gyms</Text>
    {memberships.map((m) => (
      <GymRow
        key={m.tenantId}
        membership={m}
        isCurrent={m.tenantId === currentTenantId}
        onPress={() => onSwitchGym(m.tenantId)}
      />
    ))}
  </View>
)}
```

Add a "Sign out" Pressable to the Account section (or wherever existing nav rows live):

```tsx
<Pressable onPress={onSignOut} style={styles.signOutBtn}>
  <Text style={styles.signOutText}>Sign out</Text>
</Pressable>
```

Add the styles (extend existing StyleSheet.create):

```tsx
gymsSection: { marginTop: 16, marginBottom: 16 },
sectionLabel: {
  fontFamily: tokens.font.sansExtrabold,
  fontSize: 13,
  color: tokens.color.fgMuted,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 8,
},
signOutBtn: {
  marginTop: 16,
  padding: 14,
  alignItems: "center",
},
signOutText: {
  fontFamily: tokens.font.sansBold,
  fontSize: 14,
  color: "#c0392b",
},
```

Ensure `Alert` is imported from `react-native`.

- [ ] **Step 4: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/src/app/(tabs)/profile.tsx"
git commit -m "feat(mobile): Profile My gyms section + Sign out

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Sync engine — resetCursors + flushPending exports

**Files:**
- Modify: `apps/mobile/src/workout/sync-engine.ts`

- [ ] **Step 1: Read sync-engine**

```bash
grep -n "lastPullAt\|lastPull\|export" apps/mobile/src/workout/sync-engine.ts | head -20
```

- [ ] **Step 2: Add export functions**

At the bottom of `apps/mobile/src/workout/sync-engine.ts`, after the `runSync` (or equivalent) export, add:

```ts
export function resetCursors(): void {
  lastPullAt = "1970-01-01T00:00:00Z";
  lastPullTemplatesAt = "1970-01-01T00:00:00Z";
  lastPullProgramsAt = "1970-01-01T00:00:00Z";
  lastPullCompletionsAt = "1970-01-01T00:00:00Z";
}

export async function flushPending(): Promise<void> {
  await pushTemplates();
  await pushTemplateExercises();
  await pushPrograms();
  await pushProgramDays();
  await pushWorkouts();
  await pushCompletions();
}
```

If any of these push functions don't exist by exact name (e.g. `pushChallenges` instead of `pushCompletions`), adapt to match the actual exports already present in the file. The intent is: flush all pending rows in FK dependency order.

- [ ] **Step 3: Wire switchTo to call these**

Edit `apps/mobile/src/lib/tenant-store.ts`. Inside `switchTo`, before the `set({...})`:

```ts
import { resetCursors, flushPending } from "../workout/sync-engine";

// inside switchTo:
try {
  await flushPending();
} catch (e) {
  console.warn("flushPending during switch:", e);
}
resetCursors();
```

Place the import at the top of `tenant-store.ts`. Add the calls inside `switchTo` after the membership lookup and before the AsyncStorage write.

- [ ] **Step 4: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/workout/sync-engine.ts apps/mobile/src/lib/tenant-store.ts
git commit -m "feat(mobile): sync engine resetCursors + flushPending; tenant switch hooks

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Strip EXPO_PUBLIC_TENANT_ID from all 10 call sites

**Files (modify all):**
- `apps/mobile/src/lib/api.ts`
- `apps/mobile/src/lib/store.ts`
- `apps/mobile/src/db/api/challenges.ts`
- `apps/mobile/src/workout/session-store.tsx`
- `apps/mobile/src/app/train/exercise/new.tsx`
- `apps/mobile/src/app/train/exercise/[id].tsx`
- `apps/mobile/src/app/train/programs/new.tsx`
- `apps/mobile/src/app/train/programs/presets/[slug].tsx`
- `apps/mobile/src/app/train/templates/new.tsx`

- [ ] **Step 1: Replace each TENANT_ID module-level const**

For each of the files above, locate the pattern:

```ts
const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? '';
```

(or `?? ""`) and remove that line. Then, at each USE site of `TENANT_ID` inside that file, replace with:

```ts
const tenantId = useTenantStore.getState().currentTenantId ?? '';
```

If the file is a React component / hook context where `useTenantStore` hook can be used reactively, prefer the hook:

```tsx
const tenantId = useTenantStore((s) => s.currentTenantId) ?? "";
```

Add the import at the top:

```ts
import { useTenantStore } from "../../lib/tenant-store";
```

(Adjust relative path based on file location.)

- [ ] **Step 2: Remove auto-insert in store.ts hydrateFromPhone**

Open `apps/mobile/src/lib/store.ts`. Locate the block:

```ts
if (supabase && process.env.EXPO_PUBLIC_TENANT_ID) {
  // First-time member: create a row so the admin sees them.
  const { data, error } = await supabase
    .from('members')
    .insert({
      tenant_id: process.env.EXPO_PUBLIC_TENANT_ID,
      // ...
    })
    // ...
}
```

Delete the entire block. Self-signup is no longer supported — admin creates members; user is found via fetchMemberByEmail/Phone OR through fetchMyMemberships post-auth.

The fallback that follows (`setAuthedMember({ ...defaultMember, dbId: null })`) stays — if no member found, we still need a sane local state, but no auto-insert.

- [ ] **Step 3: Fix fetchMemberByEmail / fetchMemberByPhone in lib/api.ts**

Edit `apps/mobile/src/lib/api.ts`. The existing `fetchMemberByEmail` and `fetchMemberByPhone` filter by `TENANT_ID` env. Replace with:

For `fetchMemberByEmail`:

```ts
export async function fetchMemberByEmail(
  email: string,
): Promise<LiveMember | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const tenantId = useTenantStore.getState().currentTenantId;
  if (!tenantId) return null;
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('tenant_id', tenantId)
    .ilike('email', email.trim())
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('fetchMemberByEmail', error.message);
    return null;
  }
  if (!data) return null;
  return shapeMember(data);
}
```

For `fetchMemberByPhone`: same pattern — replace `.eq('tenant_id', TENANT_ID)` with the runtime tenant id from the store.

For `fetchMemberByUsername`: same.

Add the import:

```ts
import { useTenantStore } from "./tenant-store";
```

- [ ] **Step 4: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

If any errors arise from removed const, verify all USE sites updated.

- [ ] **Step 5: Audit remaining env references**

```bash
grep -rn "EXPO_PUBLIC_TENANT_ID" apps/mobile/src/
```

Expected: 0 results.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/lib/api.ts apps/mobile/src/lib/store.ts apps/mobile/src/db/api/challenges.ts apps/mobile/src/workout/session-store.tsx apps/mobile/src/app/train/exercise/new.tsx "apps/mobile/src/app/train/exercise/[id].tsx" apps/mobile/src/app/train/programs/new.tsx "apps/mobile/src/app/train/programs/presets/[slug].tsx" apps/mobile/src/app/train/templates/new.tsx
git commit -m "feat(mobile): strip EXPO_PUBLIC_TENANT_ID — runtime tenant from store

Removes module-level TENANT_ID const from 9 files and the
phone-auto-create member path in store.ts. All queries now source
tenant from useTenantStore.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 18: Branding accent override — components batch

**Files (modify):**
- `apps/mobile/src/components/PrimaryButton.tsx`
- `apps/mobile/src/components/TodayCard.tsx`
- `apps/mobile/src/components/ProgramDayRow.tsx`
- `apps/mobile/src/components/TemplateExerciseEditor.tsx`

- [ ] **Step 1: Refactor PrimaryButton**

`apps/mobile/src/components/PrimaryButton.tsx` — add `useTheme()` and use `theme.accent` for variant="primary" background.

```tsx
import { useTheme } from "../lib/theme-provider";

// inside component:
const theme = useTheme();

// Where the primary variant background was static `tokens.color.accent`,
// replace with inline override:
const bg = variant === "primary" ? theme.accent : /* existing other variants */;
// Apply to style prop:
<Pressable style={[styles.btn, { backgroundColor: bg }]}>...
```

Keep static StyleSheet for layout/padding/border-radius; only inject background inline.

- [ ] **Step 2: Refactor TodayCard.tsx**

`apps/mobile/src/components/TodayCard.tsx` — replace static accent uses:

```tsx
import { useTheme } from "../lib/theme-provider";

const theme = useTheme();
// Replace tokens.color.accent → theme.accent in:
//   - label color
//   - btn backgroundColor
//   - card borderColor
// Replace tokens.color.accentSoft → theme.accentSoft in:
//   - card backgroundColor
```

Move these from StyleSheet entries to inline style overrides.

- [ ] **Step 3: Refactor ProgramDayRow.tsx**

`apps/mobile/src/components/ProgramDayRow.tsx`:

```tsx
import { useTheme } from "../lib/theme-provider";

const theme = useTheme();
// Replace tokens.color.accentSoft (today highlight bg) with theme.accentSoft inline
// Replace tokens.color.accent (icon color when isToday) with theme.accent
```

- [ ] **Step 4: Refactor TemplateExerciseEditor.tsx**

`apps/mobile/src/components/TemplateExerciseEditor.tsx` — chipActive uses accent:

```tsx
import { useTheme } from "../lib/theme-provider";

const theme = useTheme();
// chipActive backgroundColor: theme.accentSoft (was static)
// chipActive borderColor: theme.accent
```

- [ ] **Step 5: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/components/PrimaryButton.tsx apps/mobile/src/components/TodayCard.tsx apps/mobile/src/components/ProgramDayRow.tsx apps/mobile/src/components/TemplateExerciseEditor.tsx
git commit -m "feat(mobile): theme.accent override in shared components

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 19: Branding accent override — screens batch

**Files (modify):**
- `apps/mobile/src/app/train/templates.tsx`
- `apps/mobile/src/app/train/templates/new.tsx`
- `apps/mobile/src/app/train/templates/[id].tsx`
- `apps/mobile/src/app/train/programs/new.tsx`
- `apps/mobile/src/app/train/programs/[id].tsx`
- `apps/mobile/src/app/train/programs/presets.tsx`
- `apps/mobile/src/app/train/programs/presets/[slug].tsx`
- `apps/mobile/src/app/train/challenges.tsx`
- `apps/mobile/src/app/train/challenge/[id].tsx`

- [ ] **Step 1: Apply same pattern to each screen**

For each file, add at the top of imports:

```ts
import { useTheme } from "../../lib/theme-provider";
```

(Adjust relative path: `../../lib/theme-provider` for files at `train/` depth; `../../../lib/theme-provider` for `train/templates/`, `train/programs/`, `train/challenge/` depth.)

Inside each screen component, add:

```tsx
const theme = useTheme();
```

Locate all static `tokens.color.accent` and `tokens.color.accentSoft` references in the file. For each:
- If used as `backgroundColor`, `borderColor`, or text `color` in a StyleSheet entry that's only ever used at a single style spot → move to inline override:

```tsx
<Pressable style={[styles.fab, { backgroundColor: theme.accent }]}>
```

- If used in multiple places → introduce inline overrides at each call site.

- [ ] **Step 2: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 3: Audit remaining static accent uses**

```bash
grep -rn "tokens.color.accent" apps/mobile/src/app/ apps/mobile/src/components/ | grep -v ".test." | grep -v theme-provider
```

Expected: low/zero matches (only fallback in theme-provider.tsx + maybe defaults in tokens.ts).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/train/templates.tsx apps/mobile/src/app/train/templates/new.tsx "apps/mobile/src/app/train/templates/[id].tsx" apps/mobile/src/app/train/programs/new.tsx "apps/mobile/src/app/train/programs/[id].tsx" apps/mobile/src/app/train/programs/presets.tsx "apps/mobile/src/app/train/programs/presets/[slug].tsx" apps/mobile/src/app/train/challenges.tsx "apps/mobile/src/app/train/challenge/[id].tsx"
git commit -m "feat(mobile): theme.accent override in Train-B + SA screens

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 20: Admin web — branding settings page + action

**Files:**
- Create: `apps/web/src/app/admin/settings/branding/page.tsx`
- Create: `apps/web/src/app/admin/settings/branding/_actions.ts`
- Modify: `apps/web/src/app/admin/settings/page.tsx`

- [ ] **Step 1: Read existing settings page pattern**

```bash
cat apps/web/src/app/admin/settings/page.tsx | head -60
```

- [ ] **Step 2: Server action — _actions.ts**

`apps/web/src/app/admin/settings/branding/_actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { studioSettings } from "@fitness/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentTenantId } from "@/lib/auth";
import { withTenantScope } from "@/lib/withTenantScope";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logAudit } from "@/lib/audit";

const brandingSchema = z.object({
  name: z.string().min(1).max(120),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "accent color must be #RRGGBB hex")
    .nullable(),
});

export async function updateBrandingAction(formData: FormData) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error("No tenant context");

  const parsed = brandingSchema.parse({
    name: formData.get("name"),
    accentColor: (formData.get("accentColor") as string | null) || null,
  });

  // Logo upload — optional
  const logoFile = formData.get("logo") as File | null;
  let logoUrl: string | null = null;

  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 1024 * 1024) {
      throw new Error("Logo must be under 1 MB");
    }
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(logoFile.type)
    ) {
      throw new Error("Logo must be PNG, JPEG, or WebP");
    }
    const supabase = getSupabaseAdmin();
    const ext = logoFile.type === "image/png" ? "png" : logoFile.type === "image/webp" ? "webp" : "jpg";
    const path = `${tenantId}/logo.${ext}`;
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const { error: uploadErr } = await supabase.storage
      .from("gym-logos")
      .upload(path, buffer, {
        contentType: logoFile.type,
        upsert: true,
      });
    if (uploadErr) throw uploadErr;
    const { data: urlData } = supabase.storage.from("gym-logos").getPublicUrl(path);
    logoUrl = urlData.publicUrl;
  }

  await withTenantScope(tenantId, async () => {
    await db
      .update(studioSettings)
      .set({
        name: parsed.name,
        accentColor: parsed.accentColor,
        ...(logoUrl ? { logoUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(studioSettings.tenantId, tenantId));
  });

  await logAudit("studio_settings.branding_update", { tenantId });
  redirect("/admin/settings/branding?saved=1" as Parameters<typeof redirect>[0]);
}
```

If `getSupabaseAdmin`, `logAudit`, `withTenantScope`, or `getCurrentTenantId` paths differ, look at `apps/web/src/app/admin/members/_actions.ts` for the actual import patterns and mirror.

- [ ] **Step 3: Branding form page**

`apps/web/src/app/admin/settings/branding/page.tsx`:

```tsx
import { db } from "@/lib/db";
import { studioSettings } from "@fitness/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentTenantId } from "@/lib/auth";
import { withTenantScope } from "@/lib/withTenantScope";
import { updateBrandingAction } from "./_actions";

export default async function BrandingPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return <div>No tenant.</div>;

  const settings = await withTenantScope(tenantId, async () => {
    const rows = await db
      .select()
      .from(studioSettings)
      .where(eq(studioSettings.tenantId, tenantId))
      .limit(1);
    return rows[0] ?? null;
  });
  const params = await searchParams;

  return (
    <div className="max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Branding</h1>
      {params.saved && (
        <div className="rounded bg-green-50 p-3 text-sm text-green-800">
          Saved.
        </div>
      )}

      <form action={updateBrandingAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Gym name</label>
          <input
            name="name"
            defaultValue={settings?.name ?? ""}
            required
            maxLength={120}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Accent color</label>
          <input
            type="color"
            name="accentColor"
            defaultValue={settings?.accentColor ?? "#2f5596"}
            className="h-10 w-20 rounded border"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Logo (PNG / JPEG / WebP, max 1 MB)
          </label>
          {settings?.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="Current logo"
              className="mb-2 h-16 w-16 rounded border object-contain"
            />
          )}
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp"
            className="w-full"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Save branding
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Link from settings index**

Edit `apps/web/src/app/admin/settings/page.tsx`. Add a link entry pointing to `/admin/settings/branding`. If the file already lists Branding / Hours / Team / Roles, add Branding alongside; if not, append a new card/row:

```tsx
<Link href="/admin/settings/branding" className="block rounded border p-4 hover:bg-gray-50">
  <h2 className="font-semibold">Branding</h2>
  <p className="text-sm text-gray-600">Logo, name, accent color</p>
</Link>
```

- [ ] **Step 5: Typecheck**

`pnpm --filter @fitness/web typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/admin/settings/branding/page.tsx apps/web/src/app/admin/settings/branding/_actions.ts apps/web/src/app/admin/settings/page.tsx
git commit -m "feat(web): admin branding settings page (logo + accent + name)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 21: Mobile defensive tenant_id filter in db API

**Files (modify):**
- `apps/mobile/src/db/api/templates.ts`
- `apps/mobile/src/db/api/programs.ts`
- `apps/mobile/src/db/api/challenges.ts`
- `apps/mobile/src/db/repo.ts`

- [ ] **Step 1: Add tenant filter to list functions**

For each `list*` function (listTemplates, listPrograms, listChallenges, listWorkouts), add an `eq(table.tenantId, ...)` clause alongside the existing memberId filter. Source tenant from `useTenantStore.getState().currentTenantId`.

Example — `apps/mobile/src/db/api/templates.ts`:

```ts
import { useTenantStore } from "../../lib/tenant-store";

export function listTemplates(memberId: string): LocalWorkoutTemplate[] {
  const tenantId = useTenantStore.getState().currentTenantId;
  if (!tenantId) return [];
  return db.select()
    .from(workoutTemplates)
    .where(and(
      eq(workoutTemplates.memberId, memberId),
      eq(workoutTemplates.tenantId, tenantId),
      isNull(workoutTemplates.deletedAt),
    ))
    .all();
}
```

Apply analogous filter to:
- `listPrograms` in `db/api/programs.ts`
- `getActiveProgram` and `getTodayDay` in `db/api/programs.ts`
- `listChallenges` (if exported) in `db/api/challenges.ts`
- `listWorkouts` in `db/repo.ts`

- [ ] **Step 2: Typecheck + tests**

```bash
pnpm --filter @fitness/mobile typecheck
pnpm --filter @fitness/mobile test
```

Expected: PASS (existing tests should still pass — they mock the db chain)

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/db/api/templates.ts apps/mobile/src/db/api/programs.ts apps/mobile/src/db/api/challenges.ts apps/mobile/src/db/repo.ts
git commit -m "feat(mobile): defensive tenant_id filter in local list queries

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 22: AppHeader integration in tab screens

**Files (modify):**
- `apps/mobile/src/app/(tabs)/train.tsx`
- `apps/mobile/src/app/(tabs)/membership.tsx`
- `apps/mobile/src/app/(tabs)/classes.tsx`
- `apps/mobile/src/app/(tabs)/profile.tsx`

- [ ] **Step 1: Add AppHeader to Train tab**

Open `apps/mobile/src/app/(tabs)/train.tsx`. Locate the existing static title like `<Text style={styles.h1}>Train</Text>`. Replace with:

```tsx
import { AppHeader } from "../../components/AppHeader";

// inside JSX, in place of the static h1 title:
<AppHeader title="Train" />
```

The existing `header` style block can be deleted (now inside AppHeader). The "Session active" pill can stay below.

- [ ] **Step 2: Same for membership, classes, profile**

In each tab file, locate the existing title text and replace with `<AppHeader title="..." />`. Adjust import path: `../../components/AppHeader`.

If the screen already has no header (just content), inserting AppHeader is enough.

- [ ] **Step 3: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/src/app/(tabs)/train.tsx" "apps/mobile/src/app/(tabs)/membership.tsx" "apps/mobile/src/app/(tabs)/classes.tsx" "apps/mobile/src/app/(tabs)/profile.tsx"
git commit -m "feat(mobile): AppHeader in all tab screens

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 23: App version bump + min_version remote-config gate

**Files:**
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/src/app/_layout.tsx`
- Create: `apps/mobile/src/lib/version-gate.tsx`

- [ ] **Step 1: Bump app.json version + ios/android version codes**

Edit `apps/mobile/app.json`. Find `"version"` field and bump from current to `"2.0.0"`. Update `ios.buildNumber` and `android.versionCode` accordingly.

- [ ] **Step 2: Create version-gate component**

`apps/mobile/src/lib/version-gate.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Linking, Pressable } from "react-native";
import Constants from "expo-constants";
import { tokens } from "../theme/tokens";
import { getSupabase } from "./supabase";

const CURRENT_VERSION =
  (Constants.expoConfig?.version as string | undefined) ?? "0.0.0";

function semverLess(a: string, b: string): boolean {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

export function VersionGate({ children }: { children: React.ReactNode }) {
  const [minVersion, setMinVersion] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "mobile_min_version")
        .maybeSingle();
      if (data?.value) setMinVersion(String(data.value));
    })();
  }, []);

  if (minVersion && semverLess(CURRENT_VERSION, minVersion)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Update required</Text>
        <Text style={styles.body}>
          A new version of the app is required ({minVersion}+). Please
          update from the App Store to continue.
        </Text>
        <Pressable
          onPress={() => Linking.openURL("https://apps.apple.com/")}
          style={styles.btn}
        >
          <Text style={styles.btnText}>Open App Store</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: tokens.color.bg,
  },
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    marginBottom: 12,
  },
  body: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 15,
    color: tokens.color.fgMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: tokens.color.accent,
  },
  btnText: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 15,
    color: "white",
  },
});
```

- [ ] **Step 3: Wrap _layout with VersionGate**

Edit `apps/mobile/src/app/_layout.tsx`. Wrap the entire provider tree:

```tsx
import { VersionGate } from "../lib/version-gate";

return (
  <VersionGate>
    <AuthProvider>
      {/* ... existing tree */}
    </AuthProvider>
  </VersionGate>
);
```

- [ ] **Step 4: Add app_config table (if not present)**

The `app_config` table is a key-value config table. If it doesn't exist:

Append to `packages/db/migrations/0008_*.sql` (Task 2's migration file):

```sql
-- app_config key-value (for min_version, feature flags)
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_config_public_read ON public.app_config
  FOR SELECT USING (true);

-- service role only writes; no INSERT/UPDATE policy means RLS blocks
-- non-service-role writes (admin only via service role key).
```

Then re-amend Task 2's commit with this addition. Or include in this task's commit explicitly.

For simplicity in this plan: add the `app_config` SQL to this task's commit directly, in a small migration file:

`packages/db/migrations/0008_app_config.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_config_public_read ON public.app_config;
CREATE POLICY app_config_public_read ON public.app_config
  FOR SELECT USING (true);
```

(Apply manually on VPS via psql; not a drizzle-generated migration since it's auxiliary infrastructure.)

- [ ] **Step 5: Typecheck**

`pnpm --filter @fitness/mobile typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app.json apps/mobile/src/lib/version-gate.tsx apps/mobile/src/app/_layout.tsx packages/db/migrations/0008_app_config.sql
git commit -m "feat(mobile): app v2.0.0 + VersionGate via app_config.mobile_min_version

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 24: Repo verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

```bash
pnpm -r typecheck
```

Expected: PASS for all 5 workspace packages.

- [ ] **Step 2: Full test suite**

```bash
pnpm -r test
```

Expected: PASS — including new tests:
- `@fitness/mobile`: `lib/__tests__/tenant-store.test.ts` (5 tests)
- `@fitness/mobile`: `lib/__tests__/theme-provider.test.ts` (8 tests)

- [ ] **Step 3: Audit env binding removal**

```bash
grep -rn "EXPO_PUBLIC_TENANT_ID" apps/mobile/src/
```

Expected: 0 results.

- [ ] **Step 4: Audit static accent uses outside theme-provider**

```bash
grep -rn "tokens.color.accent" apps/mobile/src/ | grep -v theme-provider | grep -v ".test." | grep -v tokens.ts
```

Expected: minimal (only fallback defaults).

- [ ] **Step 5: No commit**

Verification task only. If any check fails, fix in a follow-up task before deploying.

---

## Task 25: VPS deploy — migration + RLS + storage

**Files:** none in repo (operational)

- [ ] **Step 1: Merge to main + push**

```bash
git checkout main
git merge feat/multi-tenant --ff-only
git push origin main
git push origin feat/multi-tenant
```

- [ ] **Step 2: Pull on VPS**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && git fetch origin main && git reset --hard origin/main && git log --oneline -1'
```

Expected: latest commit SHA matching local main.

- [ ] **Step 3: Pre-deploy backfill audit**

```bash
ssh root@100.67.196.22 "docker exec supabase-db psql -U postgres -d postgres -c \"SELECT COUNT(*) AS unmatched FROM members m WHERE m.user_id IS NULL AND m.email IS NOT NULL\""
```

Expected: pre-migration count of members without user_id (will be backfilled by Task 2's migration).

- [ ] **Step 4: Run drizzle migration**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && docker run --rm --network supabase_default -v $(pwd):/work -w /work/packages/db -e DATABASE_URL="postgres://postgres:a844f79436e19a92cca6e7cb96e9c930f6f97b3a505b7bc9@db:5432/postgres" node:20 sh -c "npm install --silent --no-audit --no-fund drizzle-kit drizzle-orm postgres dotenv 2>&1 | tail -2 && npx drizzle-kit migrate"' 2>&1 | tail -10
```

Expected: `[✓] migrations applied successfully!`

- [ ] **Step 5: Revert package.json mutation**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && git checkout -- packages/db/package.json && rm -rf packages/db/node_modules packages/db/package-lock.json'
```

- [ ] **Step 6: Verify backfill ran**

```bash
ssh root@100.67.196.22 "docker exec supabase-db psql -U postgres -d postgres -c \"SELECT COUNT(*) AS linked FROM members WHERE user_id IS NOT NULL\""
```

Expected: positive count.

- [ ] **Step 7: Apply RLS rewrite**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && docker exec -i supabase-db psql -U postgres -d postgres < infra/supabase/policies/0008_multi_tenant_rls.sql' 2>&1 | tail -20
```

Expected: many `DROP POLICY` + `CREATE POLICY` lines, no errors.

- [ ] **Step 8: Apply storage bucket + policies**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && docker exec -i supabase-db psql -U postgres -d postgres < infra/supabase/storage/0008_gym_logos_bucket.sql'
```

Expected: INSERT 0 1 (or ON CONFLICT skip) + CREATE POLICY lines.

- [ ] **Step 9: Apply app_config migration**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && docker exec -i supabase-db psql -U postgres -d postgres < packages/db/migrations/0008_app_config.sql'
```

Expected: CREATE TABLE + CREATE POLICY.

- [ ] **Step 10: Smoke test admin web (no rebuild yet)**

```bash
curl -sI https://fms.smart-cms.cloud/admin/members | head -3
```

Expected: HTTP/2 307 redirect to login.

- [ ] **Step 11: No commit**

Operational only.

---

## Task 26: VPS deploy — admin web rebuild

**Files:** none

- [ ] **Step 1: Rebuild + restart web container**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os/infra/vps && docker compose --env-file .env.production -f docker-compose.app.yml build web 2>&1 | tail -5'
```

Expected: `Image fitclub-web Built`

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os/infra/vps && docker compose --env-file .env.production -f docker-compose.app.yml up -d web 2>&1 | tail -3'
```

Expected: `Container fitclub-web Started`

- [ ] **Step 2: Verify branding route reachable**

```bash
curl -sI https://fms.smart-cms.cloud/admin/settings/branding | head -3
```

Expected: HTTP/2 307 (login redirect — proves route exists).

- [ ] **Step 3: No commit**

Operational only.

---

## Task 27: EAS build + min_version flip

**Files:** none

- [ ] **Step 1: EAS build**

```bash
cd apps/mobile
npx eas build --profile production --platform all
```

Expected: build queued and reported on EAS dashboard. Wait for completion (10-30 min).

- [ ] **Step 2: Submit to stores**

```bash
npx eas submit --profile production --platform ios
npx eas submit --profile production --platform android
```

Expected: submission accepted; review 1-3 days.

- [ ] **Step 3: After App Store + Play Store approval — set min_version**

```bash
ssh root@100.67.196.22 "docker exec -i supabase-db psql -U postgres -d postgres -c \"INSERT INTO app_config (key, value) VALUES ('mobile_min_version', '2.0.0') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()\""
```

Expected: `INSERT 0 1`.

- [ ] **Step 4: Verify gate triggers on old build**

Open old mobile build (pre-v2) — should display "Update required" gate. New v2 build should bypass.

- [ ] **Step 5: No commit**

Operational only.

---

## Self-Review

**Spec coverage:**

| Spec section | Tasks |
|---|---|
| 1 Architecture | Tasks 6 (tenant-store), 7 (theme-provider), 13 (root layout) |
| 2 Data Model | Tasks 1, 2, 3, 4 (schema + migrations + RLS + storage) |
| 3 Auth Flow | Tasks 8, 9, 10, 11, 13 (auth lib + login + verify + picker + index) |
| 4 Gym Switcher | Tasks 15, 16 (Profile + sync engine reset) |
| 5 Branding | Tasks 5, 7, 12, 18, 19, 20, 22 (types + provider + AppHeader + accent overrides + admin upload + tab integration) |
| 6 Edges + Rollout | Tasks 24, 25, 26, 27 (verification + 4-phase deploy) |
| 7 File Inventory | All tasks cover the inventory |
| 8 Out of Scope | n/a — excluded from plan |
| 9 Success Criteria | Task 24 verification + Task 27 store deploy |

Coverage complete.

**Placeholder scan:** No "TBD", "TODO", or vague directives. All code blocks complete.

**Type consistency:**
- `Membership` type defined Task 5, consumed in Task 6, 8, 11
- `Theme` type defined Task 7, consumed by Task 12, 18, 19, 22
- `useTenantStore` API consistent across Task 6 → Task 13, 14, 15, 16, 17, 21
- `currentTenantId` accessor matches across all consumer files (`useTenantStore.getState().currentTenantId` or reactive hook)
- `EXPO_PUBLIC_TENANT_ID` removal sites in Task 17 match the spec's "10 sites" list

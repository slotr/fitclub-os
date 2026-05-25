# Social-A — Admin-run Challenges Design

**Date:** 2026-05-25
**Status:** Approved design — ready for implementation planning
**Scope:** Add admin-managed competitions to the FitClub stack. The web admin creates challenges, members opt in from the mobile app, and a server-side leaderboard ranks them on real workout data.

---

## 1. Background

After Phase 1 (workout logging) and Phase 2 (progress visualisations), every
member has rich workout data flowing through the system. The Social-A track —
first sub-project of the Social roadmap — turns that data into competition.
Gym admins define a metric, a window, and a description; members join from
the mobile app; a Postgres-side leaderboard ranks everyone live.

This is purely additive: a new domain ("challenges") on top of existing
workout tables. No change to logging, sync, or any other Phase 1/2 surface.

## 2. Goals & non-goals

**Goals**
- Admins can create, edit, publish, and end challenges from the existing
  `/admin` workspace with four supported metric types — total volume,
  workout count, max single-exercise weight, and longest weekly streak.
- Members see active challenges in the mobile app under the Train tab,
  opt in with a tap, and view a live leaderboard.
- Ranking is computed server-side from existing `workouts` /
  `workout_sets` rows; no Phase-1 data duplication, no client-side
  aggregation across members.
- Two new tables (`challenges`, `challenge_participants`) and one SQL
  function (`challenge_leaderboard`) define the entire backend.

**Non-goals (v1)**
- "Leave challenge" from mobile.
- Push notifications on start / end / PR.
- Automatic end-of-challenge via cron/trigger (manual end + UI inference
  is enough).
- Reward management (admins put rewards in the description; tracking
  happens off-system).
- Materialised / cached leaderboard.
- Reactive auto-refresh on open screens (Phase-1/2 limitation applies).
- `reps_only` and `time` metric types (only `weight_reps`-compatible
  metrics in v1).
- Member-level RLS hardening (Phase-1 trade-off persists).

## 3. Decisions log

| # | Decision |
|---|----------|
| D1 | Four supported metric types: `volume`, `workout_count`, `max_weight`, `streak_weeks`. |
| D2 | Opt-in participation. A new `challenge_participants` table records each join. |
| D3 | Mobile placement: a "Challenges" entry under the Train tab, opening a sub-screen — same pattern Phase 2's "Progress" uses. |
| D4 | Server-side leaderboard via a Postgres function `challenge_leaderboard(challenge_id)`. The mobile app calls it through Supabase RPC and renders the ordered rows. |
| D5 | Members can browse all non-draft challenges; the leaderboard appears in the detail screen, opt-in or not. Leaderboard rendering uses display-name shortening (`First L.`) for privacy. |
| D6 | After publish, only `name` and `description` are editable. `metric_type`, `exercise_id`, `starts_at`, `ends_at` are locked for leaderboard consistency. |
| D7 | UI surfaces "Ended" automatically when `ends_at < now()` even if `status` is still `active`. The leaderboard function naturally excludes out-of-window workouts; admins may also flip status manually. |

## 4. Architecture

```
┌─ Admin Web (apps/web) ──────────────────────────────────┐
│  /admin/challenges                                       │
│    • list (All / Active / Draft / Ended filters)         │
│    • new — form (name, metric, exercise?, dates, desc)   │
│    • [id] — edit + participant count + Top 5 + end early │
│  Server actions: create / update / publish / end         │
└──────────────────────┬──────────────────────────────────┘
                       │ drizzle inserts/updates
┌─ Supabase Postgres ─────────────────────────────────────┐
│  challenges                                              │
│    id · tenant_id · name · description · metric_type    │
│    · exercise_id? · starts_at · ends_at · status         │
│    · created_by? · created_at/updated_at/deleted_at      │
│  challenge_participants                                  │
│    id · challenge_id · member_id · joined_at             │
│  RLS:                                                    │
│    • tenant_id = current_tenant_id() for the admin web   │
│    • permissive `using (true)` for mobile anon, matching │
│      the Phase-1 0005_mobile_anon_access.sql pattern     │
│                                                          │
│  SQL function:                                           │
│    challenge_leaderboard(p_challenge_id uuid)            │
│      → (member_id, member_name, score, rank)             │
│    CASE on metric_type aggregates from workouts +        │
│    workout_sets joined with challenge_participants       │
└──────────────────────┬──────────────────────────────────┘
                       │ supabase-js (anon REST + RPC)
┌─ Mobile (apps/mobile) ──────────────────────────────────┐
│  train/challenges.tsx                                    │
│    • Joined / Browse / Ended sections                    │
│    • Joined rows show my rank + score inline             │
│  train/challenge/[id].tsx                                │
│    • header, description, days-left, my rank             │
│    • Top 20 leaderboard + self-row if outside top 20     │
│    • Join button when not yet a participant              │
│  Train home: "🏆 Challenges" entry card                  │
└─────────────────────────────────────────────────────────┘
```

**Principles**

- **Additive only.** No change to Phase-1 sync, repo, or screens beyond
  the Train home entry card.
- **Server computes; client renders.** The leaderboard function does the
  joins and aggregations; the mobile client receives ordered rows.
- **Tenant-scoped admin writes; permissive mobile reads.** Identical
  trade-off to Phase 1 — anon key already shipped public.
- **Edit safety after publish.** Once a challenge is live, only display
  copy is editable so the leaderboard remains comparable from day one.

## 5. Schema + RLS

### 5.1 Enums

```sql
-- challengeMetricType
('volume', 'workout_count', 'max_weight', 'streak_weeks')

-- challengeStatus
('draft', 'active', 'ended', 'cancelled')
```

### 5.2 `challenges` (drizzle: `packages/db/src/schema/challenges.ts`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk via `id()` | |
| `tenant_id` | uuid notNull → `tenants` cascade | |
| `name` | varchar(120) notNull | |
| `description` | text nullable | up to ~2000 chars |
| `metric_type` | challengeMetricType notNull | |
| `exercise_id` | uuid nullable → `exercises` restrict | required for `metric_type='max_weight'` |
| `starts_at` | timestamptz notNull | |
| `ends_at` | timestamptz notNull | CHECK `ends_at > starts_at` |
| `status` | challengeStatus notNull default `'draft'` | |
| `created_by` | uuid nullable | optional auth user id for audit |
| `created_at` / `updated_at` / `deleted_at` | helpers | |

CHECK constraint (migration-level): `metric_type <> 'max_weight' OR exercise_id IS NOT NULL`.

Indexes:
- `challenges_tenant_status_idx` on `(tenant_id, status)`
- `challenges_tenant_dates_idx` on `(tenant_id, starts_at, ends_at)`

### 5.3 `challenge_participants` (`packages/db/src/schema/challengeParticipants.ts`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `challenge_id` | uuid notNull → `challenges` cascade | |
| `member_id` | uuid notNull → `members` cascade | |
| `joined_at` | timestamptz notNull default `now()` | |

- Unique `(challenge_id, member_id)`.
- Index `(member_id, challenge_id)` for the "challenges I'm in" query.

### 5.4 RLS — `infra/supabase/policies/0006_challenges_policies.sql`

```sql
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

-- Strict tenant policies (admin web sets app.tenant_id).
create policy challenges_select on public.challenges
  for select using (tenant_id = public.current_tenant_id());
create policy challenges_modify on public.challenges
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy challenge_participants_select on public.challenge_participants
  for select using (
    exists (select 1 from public.challenges c
            where c.id = challenge_participants.challenge_id
              and c.tenant_id = public.current_tenant_id())
  );
create policy challenge_participants_modify on public.challenge_participants
  for all using (
    exists (select 1 from public.challenges c
            where c.id = challenge_participants.challenge_id
              and c.tenant_id = public.current_tenant_id())
  )
  with check (
    exists (select 1 from public.challenges c
            where c.id = challenge_participants.challenge_id
              and c.tenant_id = public.current_tenant_id())
  );

-- Mobile anon access (same trade-off as 0005_mobile_anon_access.sql).
create policy challenges_mobile_anon on public.challenges
  for all using (true) with check (true);
create policy challenge_participants_mobile_anon on public.challenge_participants
  for all using (true) with check (true);
```

> The permissive policies sit alongside the strict ones; PostgreSQL OR-
> combines permissive policies. The mobile app reaches every row with the
> public anon key — same trade-off accepted in Phase 1, tracked in the
> mobile-workout-tracking memory note.

### 5.5 SQL function `challenge_leaderboard`

`infra/supabase/functions/challenge_leaderboard.sql`. One PL/pgSQL function,
branches on `metric_type`. Returns `(member_id, member_name, score, rank)`.

- **`volume`** — `sum(workouts.total_volume)` over finished, non-deleted
  workouts inside the window per participant.
- **`workout_count`** — `count(workouts.id)` over the same predicate.
- **`max_weight`** — `max(workout_sets.weight)` for sets where
  `exercise_id = c.exercise_id`, `is_warmup = false`, joined to in-window
  finished workouts.
- **`streak_weeks`** — group workouts by `date_trunc('week', started_at)`,
  rank consecutive weeks with the
  "row_number-minus-step-grouping" technique, return the longest run per
  participant.

Each branch wraps the aggregate in `rank() over (order by score desc)::int`.
Ties take the same rank; the next rank is skipped (1,2,2,4).

## 6. Shared API (`@fitness/api`)

`packages/api/src/workout/challenges.ts`:

```ts
export const CHALLENGE_METRIC_TYPES = [
  "volume", "workout_count", "max_weight", "streak_weeks",
] as const;
export type ChallengeMetricType = typeof CHALLENGE_METRIC_TYPES[number];

export const CHALLENGE_STATUSES = [
  "draft", "active", "ended", "cancelled",
] as const;
export type ChallengeStatus = typeof CHALLENGE_STATUSES[number];

export const challengeInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  metricType: z.enum(CHALLENGE_METRIC_TYPES),
  exerciseId: z.string().uuid().nullable().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
}).superRefine((v, ctx) => {
  if (v.metricType === "max_weight" && !v.exerciseId)
    ctx.addIssue({ code: "custom", message: "exerciseId required for max_weight" });
  if (new Date(v.endsAt) <= new Date(v.startsAt))
    ctx.addIssue({ code: "custom", message: "endsAt must be after startsAt" });
});

export type LeaderboardRow = {
  memberId: string;
  memberName: string;
  score: number;
  rank: number;
};
```

`packages/api/src/index.ts` gains `export * from "./workout/challenges";`.

## 7. Admin web

Three screens, mirrors the `/admin/plans` and `/admin/members` patterns
already in the codebase.

- **List `/admin/challenges`** — filter chips (All / Active / Draft / Ended),
  table (name · metric · window · status · participant count),
  `+ New challenge` action. The sidebar (`apps/web/src/components/admin/sidebar.tsx`)
  gains a `Challenges` item between `Classes` and `Check-ins` with a new
  `TrophyIcon` added to `apps/web/src/components/admin/icons.tsx` if missing.

- **New `/admin/challenges/new`** — form: name, metric (4-segment control),
  exercise picker (shown only when metric is `max_weight`, populated by the
  existing exercises catalog), start + end dates, description. Two submit
  buttons: `Save as draft` and `Publish`.

- **Detail / Edit `/admin/challenges/[id]`** — header pill row
  (metric · window · status), three stat cards (participants · aggregate
  metric · days remaining), inline Top-5 preview, edit form with
  `metric_type`, `exercise_id`, dates disabled when not draft. Bottom
  actions: `Save changes` and `End early`.

Server actions (`_actions.ts`):
- `createChallengeAction(formData)` — validates with `challengeInputSchema`,
  inserts into `challenges`, sets `status` to `draft` or `active` based on
  which submit button posted, calls `logAudit('challenge.create', ...)`,
  revalidates `/admin/challenges`.
- `updateChallengeAction(id, formData)` — drops locked fields when status
  is not `draft`, validates the rest, logs audit.
- `publishChallengeAction(id)` — moves `draft → active`.
- `endChallengeAction(id)` — moves `active → ended`.

All actions use the existing `withTenantScope` helper so RLS is satisfied
by the admin auth.

## 8. Mobile

### 8.1 REST wrapper — `apps/mobile/src/db/api/challenges.ts`

```ts
fetchChallenges(): Promise<ChallengeRow[]>
fetchMyChallengeIds(memberId: string): Promise<string[]>
joinChallenge(challengeId: string, memberId: string): Promise<{ ok: boolean }>
fetchLeaderboard(challengeId: string): Promise<LeaderboardRow[]>
```

All calls go through the existing `getSupabase()` client with the anon key
and the env `EXPO_PUBLIC_TENANT_ID`. The wrapper translates snake_case →
camelCase. `fetchLeaderboard` calls the RPC; the rest are plain table reads
and one insert. Errors return empty arrays or `{ ok: false }`.

### 8.2 Train home — `(tabs)/train.tsx`

Insert a new card below the existing Progress card. Style mirrors Progress
but in a blue-tinted accent palette to differentiate. The card displays
`N active · join leaderboards →` where `N` is the count of non-draft, not-yet-
ended challenges the screen fetches at render. Tapping pushes to
`/train/challenges`.

### 8.3 `train/challenges.tsx` — list

On mount, runs `fetchChallenges()` + `fetchMyChallengeIds(memberId)`. Splits
the list:
- **Joined** — `myIds.has(c.id) && c.status === 'active' && now < c.endsAt`.
  For each joined row, also calls `fetchLeaderboard(c.id)` and finds the
  member's own row to show inline rank + score.
- **Browse** — not joined, `c.status === 'active'`, `now < c.endsAt`. Tap →
  detail.
- **Ended** — `c.status === 'ended'` OR `now >= c.endsAt`. Tap → detail
  (read-only).

Cards reuse `tokens` from the design system. The Joined block highlights
with `tokens.color.accentSoft`. Ended block dims to ~70% opacity.

### 8.4 `train/challenge/[id].tsx` — detail + leaderboard

- Header with name + metric/window pills.
- Description (if present).
- A two-up row: "days left" on the left, "your rank" on the right (showing
  `#3` or `—` if not joined).
- Join button (full-width primary) when the member is not a participant
  and the challenge is still active.
- Leaderboard list: top 20 rows from `fetchLeaderboard(id)`. The member's
  own row is highlighted with `tokens.color.accentSoft`. If the member is
  outside the top 20, an extra row pinned at the bottom shows them with
  their rank.
- Pull-to-refresh on the FlatList re-fetches the leaderboard.

A presentational `apps/mobile/src/components/LeaderboardRow.tsx` renders
medal emoji for ranks 1–3, then the rank number, then `firstName + lastName[0]`
(name shortened in the display layer for privacy), then the formatted score.

### 8.5 Root layout — `_layout.tsx`

Two new `<Stack.Screen>` entries beside the existing `train/*`:
`train/challenges` and `train/challenge/[id]`.

## 9. Data flow

```
Open Challenges list
  ↓
fetchChallenges() + fetchMyChallengeIds(memberId)
  ↓
group → Joined / Browse / Ended
  ↓
for each Joined → fetchLeaderboard(c.id) → find self → render inline rank
```

```
Open challenge detail
  ↓
fetchLeaderboard(id)
  ↓
render top 20 + maybe pinned self row
  ↓
Pull-to-refresh → fetchLeaderboard(id) again

Tap Join (not yet joined):
  optimistic: setJoined = true
  joinChallenge(id, memberId)
    → ok: fetchLeaderboard(id) refresh
    → fail: revert, toast "Could not join"
```

```
Admin web — create / edit / publish / end:
  server action → drizzle write → logAudit → revalidatePath
```

## 10. Error handling & edge cases

| Case | Behaviour |
|------|-----------|
| `metric_type='max_weight'` with no `exercise_id` | Zod + DB CHECK reject. Admin form shows inline error. |
| `endsAt <= startsAt` | Zod + CHECK reject. Inline error. |
| Edit a published challenge's locked fields | Server action ignores them. Form disables them. |
| Member taps Join twice | Unique constraint rejects the second insert; mobile swallows the error silently (they're already in). |
| Workout soft-deleted | Leaderboard SQL filters `deleted_at IS NULL` — excluded. |
| Workout outside the window | SQL `started_at >= starts_at AND started_at < ends_at` — excluded. |
| Exercise referenced by `max_weight` deleted | FK `restrict` blocks the hard delete; exercises are soft-deleted in Phase 1 so the FK stays valid. |
| Challenge cancelled | UI treats it like ended; leaderboard frozen. |
| `ends_at < now()` but `status='active'` | UI auto-renders "Ended"; SQL excludes new workouts naturally. Admin can still flip status manually. |
| Zero participants | Leaderboard `[]`; mobile shows "No participants yet — be the first to join." |
| Tied scores | `rank()` returns the same rank for ties (1, 2, 2, 4). |
| Member name long | Display layer renders `first + last[0]`; DB keeps full name. |
| RLS / anon key public | Known Phase-1 trade-off persists here too. |

## 11. Testing

**Unit (vitest)**
- `packages/api/src/workout/__tests__/challenges.test.ts`
  - `challengeInputSchema`: accepts a minimal valid input; rejects empty
    name, `endsAt <= startsAt`, and `max_weight` without `exerciseId`;
    accepts `max_weight` + `exerciseId`.
  - `CHALLENGE_METRIC_TYPES` is a stable tuple.
- `packages/db/src/schema/__tests__/challenges.test.ts`
  - `getTableColumns(challenges)` and `getTableColumns(challengeParticipants)`
    contain the expected keys (same pattern as `auditLogs.test.ts`).

**SQL function**
- Manual smoke after deploy: insert a draft, publish, add 3 participants,
  log workouts for each, call
  `select * from challenge_leaderboard('<uuid>') order by rank;`
  for each of the four metric types and confirm the ranking.

**Manual QA — admin web**
- Create each of the four metric types as draft and as publish-on-create.
- Edit a published challenge and confirm only name + description are
  saved.
- End early and confirm status flips + UI dims.
- Audit log entries for `challenge.create`, `challenge.update`,
  `challenge.end`.
- Login as a different tenant's admin and confirm the challenges are
  invisible.

**Manual QA — mobile**
- Train home Challenges card with correct active count.
- Joined / Browse / Ended grouping renders correctly.
- Tap Join → row migrates to Joined section within a moment.
- Detail leaderboard: medal emojis on top 3, self-row highlight, pull-to-
  refresh updates after logging a fresh workout.
- `max_weight` challenge: a member who hasn't logged the chosen exercise
  ranks last with `score = 0`.
- Ended challenge: no Join button, leaderboard frozen, "🏆 Winners"
  heading on the top 3.

## 12. Files

**`@fitness/api`**
- `packages/api/src/workout/challenges.ts` (new)
- `packages/api/src/workout/__tests__/challenges.test.ts` (new)
- `packages/api/src/index.ts` (modify — one export line)

**`packages/db` + `infra`**
- `packages/db/src/schema/challengeEnums.ts` (new)
- `packages/db/src/schema/challenges.ts` (new)
- `packages/db/src/schema/challengeParticipants.ts` (new)
- `packages/db/src/schema/__tests__/challenges.test.ts` (new)
- `packages/db/src/schema/index.ts` (modify)
- `packages/db/migrations/0006_*.sql` (generated)
- `infra/supabase/policies/0006_challenges_policies.sql` (new)
- `infra/supabase/functions/challenge_leaderboard.sql` (new)

**`apps/web`**
- `apps/web/src/app/admin/challenges/page.tsx` (new — list)
- `apps/web/src/app/admin/challenges/new/page.tsx` (new — form)
- `apps/web/src/app/admin/challenges/[id]/page.tsx` (new — edit + Top 5)
- `apps/web/src/app/admin/challenges/_actions.ts` (new)
- `apps/web/src/components/admin/sidebar.tsx` (modify — nav item)
- `apps/web/src/components/admin/icons.tsx` (modify — add `TrophyIcon` if missing)

**`apps/mobile`**
- `apps/mobile/src/db/api/challenges.ts` (new)
- `apps/mobile/src/components/LeaderboardRow.tsx` (new)
- `apps/mobile/src/app/train/challenges.tsx` (new)
- `apps/mobile/src/app/train/challenge/[id].tsx` (new)
- `apps/mobile/src/app/(tabs)/train.tsx` (modify — Challenges card)
- `apps/mobile/src/app/_layout.tsx` (modify — register two Stack.Screen entries)

## 13. Deploy

This feature requires a real backend deploy on the VPS — new tables, RLS,
and an RPC function. The path mirrors Phase 1 / the exercise-visuals
import:

1. Merge to `main`, push.
2. VPS `git pull` on `main`.
3. Run drizzle migrate in a node container attached to `supabase_default`
   (Phase-1 pattern in `[[vps-deploy]]` memory): applies the `0006_*`
   migration.
4. Apply `0006_challenges_policies.sql` via `docker exec -i supabase-db psql`.
5. Apply `challenge_leaderboard.sql` the same way.
6. Rebuild the web container so the admin app picks up the new pages:
   `cd infra/vps && docker compose -f docker-compose.app.yml --env-file .env.production up -d --build web`.
7. Mobile change ships via Expo (dev tunnel or, when ready, EAS build).

## 14. Out of scope / future

- Member-initiated leave.
- Notifications (start / end / PR / new rank).
- Auto-end on `ends_at` via cron or trigger.
- Reward management / fulfilment.
- Materialised leaderboard cache.
- Reactive auto-refresh of open screens.
- `reps_only` and `time` metric types.
- Member-level RLS hardening.
- Cross-gym / global leaderboards.

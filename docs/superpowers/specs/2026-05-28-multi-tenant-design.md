# Multi-Tenant Mobile App Design

> **For agentic workers:** Implementation plan will be written next at `docs/superpowers/plans/2026-05-28-multi-tenant.md`. This spec is the source of truth.

**Goal:** Turn the mobile app into a single App Store / Play Store build that all gyms (tenants) share. Runtime tenant resolution, JWT-claim RLS, per-tenant branding, and multi-gym membership support — replacing the current build-time `EXPO_PUBLIC_TENANT_ID` binding.

**Scope:** Single coupled release. Five subsystems shipped together:
- **MT-A** Auth + tenant resolution (email + OTP, multi-gym lookup, gym picker, cache)
- **MT-B** JWT-claim RLS migration (remove permissive policies, strict policies use auth.uid())
- **MT-C** Per-tenant branding (logo + name + accent color)
- **MT-D** In-app gym switcher (multi-membership users hot-switch)
- **MT-E** Code purge of `EXPO_PUBLIC_TENANT_ID` (10 sites) + Phase-1 / Social-A / Train-B regression

**Approach:** Member-anchored. Admin creates `members` rows with email; OTP login auto-links the resulting `auth.users` row to all matching member rows. RLS policies enforce `tenant_id IN (user's memberships)`. App state holds the *currently selected* tenant; the client filters queries by it on top of RLS.

**Tech Stack:** Supabase auth (email OTP), drizzle ORM (Postgres + SQLite), React Native 0.81 / Expo 54, expo-router, AsyncStorage, expo-image.

**Status:** Approved by user — five-section design walkthrough complete (architecture, data model, auth flow, gym switcher, branding, edges/rollout, file inventory).

---

## 1. Architecture

### Layered overview

```
Mobile App
├── AuthCtx          (Supabase session, OTP send/verify)
├── TenantStore      (currentTenantId, memberships[], switch, signOut)
├── ThemeProvider    (per-tenant accent + logo + gymName)
└── Screen tree
       │
       │ Supabase REST + JWT (auth.uid() driven RLS)
       ▼
Postgres (Supabase)
   RLS policies on auth.uid():
     tenant_id IN (SELECT tenant_id FROM members WHERE user_id = auth.uid())
   Permissive mobile-anon policies REMOVED
```

### Subsystem dependency

```
MT-B (RLS migration)
   │
   │ enables
   ▼
MT-A (auth + tenant resolution) ◄── MT-D (gym switcher) reuses store
   │
   │ provides currentBranding to
   ▼
MT-C (theme provider)
   │
   │ tenant store consumed by
   ▼
MT-E (code purge + regression)
```

All five ship in one release because partial deploys are unsafe: removing permissive RLS without working JWT auth would empty all mobile screens; replacing env-binding without tenant store would crash queries.

### Critical migration concern

Existing users authenticated via `EXPO_PUBLIC_TENANT_ID` build have `auth.users` rows but no `members.user_id` link. The migration includes a **backfill** SQL step that links existing users by email match before flipping RLS.

### Reuse

- Supabase auth `signInWithOtp({ email })` + `verifyOtp` — existing primitives
- `members` table `(tenant_id, email)` already unique → multi-gym destekleniyor
- `studio_settings` already has `name` and `accent_color`; only `logo_url` is missing
- `tokens.ts` static — only 3 fields (accent, logoUrl, gymName) become dynamic; rest stays static for visual consistency

---

## 2. Data Model

### Schema additions (2 columns + 2 functions + 2 triggers)

#### `members.user_id` — Supabase auth.users link

```sql
ALTER TABLE public.members
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX members_user_id_idx ON public.members(user_id);
```

A member row is linked to a Supabase auth user via this column. A single auth user (one email globally) may link to multiple member rows across tenants (multi-gym).

#### `studio_settings.logo_url` — branding logo

```sql
ALTER TABLE public.studio_settings
  ADD COLUMN logo_url text;
```

(`name` and `accent_color` already exist.)

#### `public.user_tenant_ids()` — RLS helper

```sql
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS TABLE(tenant_id uuid)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.members
  WHERE user_id = auth.uid() AND deleted_at IS NULL;
$$;
```

`STABLE` lets the planner cache within a query. `SECURITY DEFINER` so RLS on `members` itself doesn't recurse.

#### `link_auth_user_to_members()` — auto-link trigger

```sql
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

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_auth_user_to_members();
```

Fires on first OTP login; links all member rows with the same email.

#### `link_member_to_auth_user()` — reverse trigger (newly added members)

```sql
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

CREATE TRIGGER on_member_insert_link
BEFORE INSERT ON public.members
FOR EACH ROW EXECUTE FUNCTION public.link_member_to_auth_user();
```

Fires when admin creates a member whose email already has an auth.users row.

#### One-time backfill

```sql
UPDATE public.members m
SET user_id = u.id, updated_at = now()
FROM auth.users u
WHERE m.email = u.email AND m.user_id IS NULL;
```

Idempotent. Run once during the migration.

### RLS rewrite (hybrid form)

All `*_mobile_anon` policies (~25 across all tables) are **dropped**. Strict tenant policies are **rewritten** to a hybrid form that supports both the admin web (existing `current_tenant_id()` session setting) and the mobile JWT path:

```sql
-- Example for `members` table
DROP POLICY IF EXISTS members_select ON public.members;
DROP POLICY IF EXISTS members_modify ON public.members;
DROP POLICY IF EXISTS members_mobile_anon ON public.members;

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
```

Same pattern applied to: `members`, `memberships`, `payments`, `checkins`, `bookings`, `classes`, `instructors`, `sessions`, `waitlist`, `plans`, `studio_settings`, `notification_templates`, `notification_sends`, `exercises`, `member_exercise_prefs`, `workouts`, `workout_sets`, `challenges`, `challenge_participants`, `workout_templates`, `workout_template_exercises`, `programs`, `program_days`, `program_day_completions`.

For child tables (e.g. `workout_template_exercises`, `program_days`, `program_day_completions`, `challenge_participants`) the policy uses the parent-join check, modified to include `user_tenant_ids()`:

```sql
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
```

### `tenants` self-select policy

For the gym picker to list the user's gyms:

```sql
DROP POLICY IF EXISTS tenants_select_self ON public.tenants;
CREATE POLICY tenants_select_self ON public.tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM public.user_tenant_ids())
    OR id = public.current_tenant_id()
  );
```

### Storage bucket for gym logos

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-logos', 'gym-logos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public logo read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gym-logos');

CREATE POLICY "Authenticated upload to own tenant folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gym-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.user_tenant_ids()
    )
  );

CREATE POLICY "Authenticated update own tenant logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gym-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.user_tenant_ids()
    )
  );
```

Path convention: `gym-logos/<tenant_id>/logo.<ext>`.

### Migration order

```
1. ALTER TABLE additions (members.user_id, studio_settings.logo_url)
2. CREATE FUNCTION user_tenant_ids
3. CREATE FUNCTION + trigger link_auth_user_to_members (on auth.users INSERT)
4. CREATE FUNCTION + trigger link_member_to_auth_user (on members BEFORE INSERT)
5. Backfill UPDATE
6. DROP all *_mobile_anon policies
7. REWRITE strict policies to hybrid form (current_tenant_id() OR user_tenant_ids())
8. CREATE tenants_select_self policy
9. CREATE storage.buckets gym-logos + policies
```

All in a single transactional migration file: `0008_multi_tenant.sql`.

---

## 3. Auth Flow + Tenant Resolution

### State pieces

```
lib/auth.ts            — Supabase auth wrapper (sendLoginCode, verifyLoginCode, getSession, signOut)
lib/tenant-store.ts    — TenantStore: currentTenantId, memberships[], setCurrent, switchTo, signOut, hydrate
lib/api.ts             — fetchMyMemberships() + all queries source tenant from store
lib/theme-provider.tsx — wraps app, reads tenantStore for branding
```

### AsyncStorage schema

```
fitclub.tenant.current       string  — current tenant_id uuid
fitclub.tenant.memberships   json    — Membership[] cache
fitclub.session              json    — Supabase session (auto-managed)
```

Supabase JS client is initialized with AsyncStorage adapter for session persistence:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Login flow

**Screen 1: `/login` — email entry**

```ts
export async function sendLoginCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}
```

UI: email input + "Send code" button + helper text "Ask front desk if not added yet."

**Screen 2: `/otp-verify` — code entry**

```ts
export async function verifyLoginCode(email: string, token: string): Promise<void> {
  const { data, error } = await supabase.auth.verifyOtp({
    email, token, type: "email",
  });
  if (error) throw error;
  if (!data.session) throw new Error("No session returned");
}
```

UI: 6-digit code input + resend countdown.

**Post-verify: `loadMemberships()`**

```ts
export type Membership = {
  memberId: string;
  tenantId: string;
  gymName: string;
  logoUrl: string | null;
  accentColor: string | null;
};

export async function fetchMyMemberships(): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("members")
    .select(`
      id, tenant_id,
      tenants!inner(name),
      studio_settings(logo_url, accent_color)
    `)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((m: any) => ({
    memberId: m.id,
    tenantId: m.tenant_id,
    gymName: m.tenants?.name ?? "Unknown gym",
    logoUrl: m.studio_settings?.[0]?.logo_url ?? null,
    accentColor: m.studio_settings?.[0]?.accent_color ?? null,
  }));
}
```

**Branch on count:**

| Count | Action |
|---|---|
| 0 | Show "No gym membership. Ask front desk." + Sign out |
| 1 | Auto-select, cache, `router.replace('/(tabs)')` |
| > 1 | `router.replace('/gym-picker')` |

**Screen 3: `/gym-picker`**

Vertical list of memberships, each with logo + gym name + small "Member" label. Tap selects that gym, sets store, navigates to tabs.

### Session restore (cold start)

```ts
// app/_layout.tsx top-level effect
useEffect(() => {
  (async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace("/login");
      return;
    }
    const cached = await AsyncStorage.getItem("fitclub.tenant.memberships");
    const currentId = await AsyncStorage.getItem("fitclub.tenant.current");
    if (cached && currentId) {
      tenantStore.hydrate(JSON.parse(cached), currentId);
      router.replace("/(tabs)");
    } else {
      const m = await fetchMyMemberships();
      if (m.length === 0) {
        await supabase.auth.signOut();
        router.replace("/login");
      } else {
        tenantStore.setMemberships(m);
        if (m.length === 1) {
          tenantStore.setCurrent(m[0]);
          router.replace("/(tabs)");
        } else {
          router.replace("/gym-picker");
        }
      }
    }
  })();
}, []);
```

### TenantStore API

```ts
type TenantStore = {
  memberships: Membership[];
  currentTenantId: string | null;
  currentMemberId: string | null;
  currentBranding: { gymName: string; logoUrl: string | null; accentColor: string | null } | null;
  isAuthed: boolean;

  hydrate: (memberships: Membership[], currentId: string) => void;
  setMemberships: (m: Membership[]) => Promise<void>;
  setCurrent: (m: Membership) => Promise<void>;
  switchTo: (tenantId: string) => Promise<void>;
  signOut: () => Promise<void>;
};
```

### Auth guards

```ts
// app/(tabs)/_layout.tsx — top of file
const { isAuthed, currentTenantId } = useTenantStore();
if (!isAuthed) return <Redirect href="/login" />;
if (!currentTenantId) return <Redirect href="/gym-picker" />;
```

### Phone OTP path (kept but deprioritized)

Existing `(auth)/otp-request.tsx` phone flow is kept for backward compatibility. Default UI surface is email; phone OTP accessible via a "Use phone instead" link on `/login`. Same multi-tenant lookup applies (members.phone match).

---

## 4. In-App Gym Switcher

### UI placement — Profile tab

New "My gyms" section between user info and "Account" section. Only rendered when `memberships.length > 1`.

```
Profile
─────────────────────────
[Avatar] Ahmet Yılmaz
         ahmet@example.com

My gyms
[●] [logo] FitClub Istanbul    ← current
[○] [logo] CrossFit Kadikoy    ← tappable
[○] [logo] PowerLab

Account
Settings              ›
Privacy               ›
Sign out
```

### Switch flow

```ts
const onSwitchGym = async (tenantId: string) => {
  if (activeWorkout) {
    Alert.alert(
      "Finish active workout first",
      "You have a workout in progress. Finish or discard it before switching gyms.",
    );
    return;
  }
  await tenantStore.switchTo(tenantId);
  // ThemeProvider auto-rerenders via context subscription.
  // Tab screens auto-refetch on next focus (existing useFocusEffect).
};
```

### `switchTo` semantics

```ts
switchTo: async (tenantId) => {
  const m = memberships.find((x) => x.tenantId === tenantId);
  if (!m) throw new Error("Membership not found");
  await AsyncStorage.setItem("fitclub.tenant.current", tenantId);
  set({
    currentTenantId: tenantId,
    currentMemberId: m.memberId,
    currentBranding: {
      gymName: m.gymName,
      logoUrl: m.logoUrl,
      accentColor: m.accentColor,
    },
  });
  await syncEngine.flushPending();
  syncEngine.resetCursors();
};
```

### Active workout guard

If a workout session is in progress (`useWorkoutSession().workout != null`), switching is blocked with an alert. Rationale: the workout row has the old tenant_id baked in; mid-flight switch would orphan it visually.

### Local SQLite scoping

All Train-B tables (`workouts`, `programs`, `templates`, `program_days`, `workout_sets`, etc.) have a `tenant_id` column. All db API queries filter by `memberId` (which is tenant-bound) — automatic scoping.

**Defensive addition:** all list queries gain an explicit `eq(table.tenantId, currentTenantId)` filter as a second guard. Cost: trivial. Files: `db/api/templates.ts`, `db/api/programs.ts`, `db/api/challenges.ts`, `db/repo.ts`.

### Sync engine cursor reset

`apps/mobile/src/workout/sync-engine.ts` exposes:

```ts
export function resetCursors(): void {
  lastPullAt = "1970-01-01T00:00:00Z";
  lastPullTemplatesAt = "1970-01-01T00:00:00Z";
  lastPullProgramsAt = "1970-01-01T00:00:00Z";
  lastPullCompletionsAt = "1970-01-01T00:00:00Z";
}

export async function flushPending(): Promise<void> {
  // Calls all push functions sequentially; rows tagged with their original tenant_id
  await pushTemplates();
  await pushTemplateExercises();
  await pushPrograms();
  await pushProgramDays();
  await pushWorkouts();
  await pushCompletions();
}
```

On switch: `await flushPending()` then `resetCursors()`. Next pull cycle refreshes for the new tenant.

### Branding refresh

`ThemeProvider` subscribes to `tenantStore.currentBranding`. Switch triggers re-render with new accent + logo + name.

### Sign-out

Full sign-out clears everything:

```ts
signOut: async () => {
  await supabase.auth.signOut();
  await AsyncStorage.multiRemove([
    "fitclub.tenant.current",
    "fitclub.tenant.memberships",
  ]);
  set({
    memberships: [],
    currentTenantId: null,
    currentMemberId: null,
    currentBranding: null,
    isAuthed: false,
  });
  router.replace("/login");
};
```

`v1`: no per-gym sign-out (just full sign-out). Future iteration adds "Remove from this gym only."

---

## 5. Branding ThemeProvider

### Override scope (minimal invasive)

Only **3 fields** are tenant-override in v1:

- `accent` (primary CTA, link, selected state)
- `logoUrl` (header, login background)
- `gymName` (header text, login title)

Other tokens (`font`, `border`, `fgMuted`, `surface`, `radii`, `shadows`) stay static. Static tokens preserve visual consistency across gyms.

### Theme + provider

```ts
// lib/theme-provider.tsx
export type Theme = {
  accent: string;
  accentSoft: string;
  logoUrl: string | null;
  gymName: string;
};

const ThemeContext = createContext<Theme>({
  accent: tokens.color.accent,
  accentSoft: tokens.color.accentSoft,
  logoUrl: null,
  gymName: "FitClub",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const branding = useTenantStore((s) => s.currentBranding);
  const theme = useMemo<Theme>(() => {
    const a = sanitizeHex(branding?.accentColor) ?? tokens.color.accent;
    return {
      accent: a,
      accentSoft: hexAlpha(a, 0.12),
      logoUrl: branding?.logoUrl ?? null,
      gymName: branding?.gymName ?? "FitClub",
    };
  }, [branding]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

function sanitizeHex(hex: string | null | undefined): string | null {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return hex;
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
```

`accentSoft` is computed from accent at 12% alpha — admins set only the accent.

### Component shift pattern

Before:
```tsx
const styles = StyleSheet.create({
  saveBtn: { backgroundColor: tokens.color.accent },
});
```

After:
```tsx
function SaveButton() {
  const theme = useTheme();
  return (
    <Pressable style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
      ...
    </Pressable>
  );
}
const styles = StyleSheet.create({
  saveBtn: { padding: 14, borderRadius: 10, alignItems: "center" },
});
```

Static layout tokens stay in StyleSheet; only the color override is inline.

### Header logo + name component

```tsx
// components/AppHeader.tsx
export function AppHeader({ title }: { title?: string }) {
  const { logoUrl, gymName } = useTheme();
  return (
    <View style={styles.header}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="contain" />
      ) : (
        <Text style={styles.gymName}>{gymName}</Text>
      )}
      {title && <Text style={styles.pageTitle}>{title}</Text>}
    </View>
  );
}
```

Used inside each tab's screen header (Train, Membership, Classes, Profile).

### Logo storage

Supabase Storage bucket `gym-logos` (public read, authenticated tenant-scoped write). Path: `gym-logos/<tenant_id>/logo.png`. `studio_settings.logo_url` stores the public URL.

### Admin web — branding upload UI

New route `/admin/settings/branding`:
- Logo upload (drag-drop, image preview, max 1MB, mime allowlist: png/jpeg/webp)
- Accent color (HTML color input, hex validation)
- Gym name (existing studio_settings.name — surfaced)
- Save → uploads to Storage, updates studio_settings

### Default fallback

If `logo_url` is null or 404: render `gymName` text. If `accent_color` is null or malformed: fall back to `tokens.color.accent` (`#2f5596`). App degrades gracefully to generic FitClub identity.

### Logo caching

`expo-image` handles memory + disk cache. Cache key is the URL; logo updates invalidate automatically.

### Components affected by accent override

| File | Override site |
|---|---|
| `components/PrimaryButton.tsx` | variant="primary" bg |
| `components/TodayCard.tsx` | label color, btn bg, border |
| `components/ProgramDayRow.tsx` | today highlight bg (accentSoft) |
| `components/TemplateExerciseEditor.tsx` | chipActive bg + border |
| `app/train/templates.tsx` | fab bg |
| `app/train/templates/new.tsx` | saveBtn bg |
| `app/train/templates/[id].tsx` | startBtn bg |
| `app/train/programs.tsx` | (no override needed — uses surface) |
| `app/train/programs/new.tsx` | nextBtn, tplChipActive |
| `app/train/programs/[id].tsx` | actionBtn focused state |
| `app/train/programs/presets.tsx` | chipActive bg |
| `app/train/programs/presets/[slug].tsx` | useBtn bg |
| `app/train/challenges.tsx` | accent usage from SA |
| `app/train/challenge/[id].tsx` | accent usage from SA |
| `app/(tabs)/_layout.tsx` | tab bar tintColor |

---

## 6. Edge Cases + Migration / Rollout

### Auth + tenant edges

| Scenario | Behavior |
|---|---|
| Auth user but no member rows | `fetchMyMemberships` empty → "No gym found" + sign out |
| Member soft-deleted mid-session | RLS reject; refetch on focus → missing gym drops; if was current, redirect to picker or sign out |
| Trigger race on auth.users INSERT | UPDATE is deterministic per-email; no collision |
| Admin adds member after auth user exists | BEFORE INSERT trigger on members auto-fills user_id from existing auth.users |
| Anonymous Supabase call (no JWT) | RLS denies — empty result everywhere; login is enforced |
| OTP rate limit (Supabase default 4/hour) | UI: "Too many attempts, try again in N minutes." |

### RLS isolation

| Scenario | Behavior |
|---|---|
| User A queries Gym B data | Empty (tenant_id not in user_tenant_ids) |
| Cross-tenant UPDATE attempt | WITH CHECK blocks |
| Admin web (no JWT) reads data | Hybrid policy's `current_tenant_id()` branch satisfies — admin web works unchanged |
| Service role bypass | Migrations + backend scripts run as service role; RLS bypassed safely |

### Data integrity

| Scenario | Behavior |
|---|---|
| Auth user with no matching member | user_id stays null on members; 0 memberships shown |
| Member email NULL | Cannot OTP-login; admin must add email or phone |
| Same email in 2 tenants, neither has user_id yet | First OTP-login: trigger sets user_id on both rows → multi-gym setup automatic |
| Member email changed (admin edits) | user_id stays linked to old auth user; mismatch. v1: not handled. Future: re-link on email change trigger. |

### Branding edges

| Scenario | Behavior |
|---|---|
| Logo URL 404 | expo-image onError → text fallback |
| Accent color malformed | sanitizeHex returns null → default |
| Branding changed server-side | Refetched on tenant switch and on next memberships refresh |
| Dark mode | Out of scope v1 |

### Performance

| Scenario | Behavior |
|---|---|
| 5+ memberships | Single query, no pagination needed |
| user_tenant_ids() per RLS check | STABLE + cached; indexed on `members(user_id, deleted_at)` |
| Logo 2MB+ | Admin UI compresses on upload; storage limit 1MB enforced |

### Rollout plan (4 phases)

**Phase 1 — Pre-deploy preparation (no downtime):**
1. Postgres migration 0008 — schema + functions + triggers + backfill
2. Storage bucket gym-logos + policies
3. Verify backfill: `SELECT COUNT(*) FROM members WHERE user_id IS NULL` — log unmatched

**Phase 2 — RLS rewrite:**
1. Apply `0008_multi_tenant_rls.sql` — drop permissive, rewrite strict to hybrid form
2. Smoke test admin web: login, list members, edit, classes, payments
3. Old mobile builds will fail post-rewrite — covered by Phase 3

**Phase 3 — Mobile force-update (App Store):**
1. Bump app version to **v2.0.0** (semver major — breaking auth)
2. EAS build → submit to App Store + Google Play
3. After approval, set remote config `app_config.min_version = '2.0.0'`
4. Mobile app on launch reads min_version → if older, shows "Update required" gate
5. In-app banner "App update available" for 1 week before forcing

**Phase 4 — Post-deploy verification:**
1. Admin web full smoke
2. Mobile OTP login + gym auto-select + branding
3. Multi-gym test (1 user added to 2 gyms by email)
4. Sign out / sign in cycle
5. Profile gym switcher
6. Phase-1, Social-A, Train-B end-to-end regression

### Rollback plan

**Postgres rollback (`0008_revert.sql`):**
```sql
DROP TRIGGER on_auth_user_created ON auth.users;
DROP TRIGGER on_member_insert_link ON public.members;
DROP FUNCTION public.link_auth_user_to_members();
DROP FUNCTION public.link_member_to_auth_user();
DROP FUNCTION public.user_tenant_ids();
ALTER TABLE public.members DROP COLUMN user_id;
ALTER TABLE public.studio_settings DROP COLUMN logo_url;
-- Restore previous RLS policies from 0005, 0006, 0007 files
```

**RLS rollback:** keep previous `0005`, `0006`, `0007` policy files in git; `psql -f` them in reverse order if needed.

**Mobile rollback:** old v1 build still functional with rolled-back DB (env tenant binding works again). Cannot revert App Store submission once approved — handle via DB rollback only.

### Risk inventory

| Risk | Mitigation |
|---|---|
| RLS rewrite breaks admin web | Hybrid policy keeps `current_tenant_id()` working; tested before deploy |
| Cross-tenant data leak | Migration test suite with multi-gym user + automated cross-tenant query attempts |
| Mass lockout (no email in members) | Backfill log shows unmatched count; pre-deploy email audit |
| Logo upload abused (huge / malware) | Storage size limit 1MB + content-type whitelist + admin-only via RLS |
| Custom accent CSS injection | Strict hex regex validation in admin upload action |
| Trigger performance | Indexed on email; sub-1ms per row |
| App Store review delay (1-3 days) | Force-update gate prevents broken UX; deploy during low-traffic window |

---

## 7. File Inventory

### `packages/db/`

**Modify:**
- `src/schema/members.ts` — add `userId: uuid("user_id").references(() => authUsers.id, { onDelete: "set null" })`
- `src/schema/studioSettings.ts` — add `logoUrl: text("logo_url")`

**Create:**
- `migrations/0008_<name>.sql` — drizzle generate + manual triggers + backfill

### `infra/supabase/`

**Create:**
- `policies/0008_multi_tenant_rls.sql` — DROP `*_mobile_anon` (~25 policies) + REWRITE strict policies to hybrid form for all tenant-scoped tables
- `policies/0008_revert.sql` — rollback
- `functions/user_tenant_ids.sql` — helper function
- `functions/link_auth_user_to_members.sql` — trigger function + AFTER INSERT on auth.users
- `functions/link_member_to_auth_user.sql` — trigger function + BEFORE INSERT on members
- `storage/0008_gym_logos_bucket.sql` — bucket create + policies

### `packages/api/`

**Create:**
- `src/auth/types.ts` — `Membership`, `TenantBranding` shared types

**Modify:**
- `src/index.ts` — re-export

### `apps/mobile/`

**Create — auth + tenant infrastructure:**
- `src/lib/tenant-store.ts` — `useTenantStore`, hydrate / setMemberships / setCurrent / switchTo / signOut
- `src/lib/theme-provider.tsx` — `ThemeProvider`, `useTheme()`, `hexAlpha`, `sanitizeHex`
- `src/lib/auth.ts` — `sendLoginCode`, `verifyLoginCode`, `getSession`, `signOut`

**Create — UI:**
- `src/app/(auth)/login.tsx` — email entry
- `src/app/(auth)/gym-picker.tsx` — multi-membership selection
- `src/app/(auth)/no-membership.tsx` — error screen
- `src/components/AppHeader.tsx` — logo + gymName + title
- `src/components/GymRow.tsx` — single gym row (picker + Profile)

**Modify — strip env binding (10 sites):**
- `src/lib/api.ts` — remove `TENANT_ID` const; add `fetchMyMemberships`
- `src/lib/store.ts` — drop phone-auto-create path; consume tenant store
- `src/db/api/challenges.ts` — remove `TENANT_ID`
- `src/db/api/templates.ts` — caller passes tenantId from store (already param)
- `src/db/api/programs.ts` — same
- `src/db/api/presets.ts` — same
- `src/workout/session-store.tsx` — read from tenant store
- `src/app/train/exercise/new.tsx` — same
- `src/app/train/exercise/[id].tsx` — same
- `src/app/train/programs/new.tsx` — same
- `src/app/train/programs/presets/[slug].tsx` — same
- `src/app/train/templates/new.tsx` — same

**Modify — branding accent (~15 files):**
- `src/components/PrimaryButton.tsx`
- `src/components/TodayCard.tsx`
- `src/components/ProgramDayRow.tsx`
- `src/components/TemplateExerciseEditor.tsx`
- `src/app/train/templates.tsx`
- `src/app/train/templates/new.tsx`
- `src/app/train/templates/[id].tsx`
- `src/app/train/programs/new.tsx`
- `src/app/train/programs/[id].tsx`
- `src/app/train/programs/presets.tsx`
- `src/app/train/programs/presets/[slug].tsx`
- `src/app/train/challenges.tsx`
- `src/app/train/challenge/[id].tsx`
- `src/app/(tabs)/_layout.tsx` — tab bar tintColor from theme

**Modify — root + layout:**
- `src/app/_layout.tsx` — wrap with TenantProvider + ThemeProvider, min-version gate
- `src/app/index.tsx` — entry routing (session check → memberships → picker / tabs)
- `src/app/(tabs)/_layout.tsx` — auth + tenant guards
- `src/app/(tabs)/profile.tsx` — "My gyms" section + signOut wiring
- `src/app/(auth)/otp-verify.tsx` — adapt to new flow (memberships fetch on success)
- `src/app/(auth)/otp-request.tsx` — adapt as "phone fallback" path; primary path is `/login`

**Modify — sync engine:**
- `src/workout/sync-engine.ts` — export `resetCursors`, `flushPending`; tenant from store

**Create — tests:**
- `src/lib/__tests__/tenant-store.test.ts`
- `src/lib/__tests__/theme-provider.test.ts`

### `apps/web/` (admin)

**Create:**
- `src/app/admin/settings/branding/page.tsx` — branding form
- `src/app/admin/settings/branding/_actions.ts` — `updateBrandingAction` (Storage upload + studio_settings update)
- `src/components/admin/LogoUpload.tsx` — drag-drop + compress
- `src/components/admin/ColorPicker.tsx` — hex color picker

**Modify:**
- `src/app/admin/settings/page.tsx` — link to branding sub-page

### `docs/`

**Create:**
- `docs/superpowers/specs/2026-05-28-multi-tenant-design.md` — this spec
- `docs/superpowers/plans/2026-05-28-multi-tenant.md` — implementation plan (next)

### Totals

| Category | Count |
|---|---|
| New mobile auth/UI/lib | ~12 |
| New admin web branding | ~4 |
| New infra SQL | ~6 |
| New api types | 1 |
| New tests | 2 |
| Modified mobile env strip | ~12 |
| Modified mobile branding accent | ~14 |
| Modified mobile root/layout/profile/sync | ~7 |
| Modified db schema | 2 |
| Modified admin web | 1 |
| Spec + plan docs | 2 |
| **Total new files** | **~27** |
| **Total modified files** | **~36** |

### Migration deployment order

```
1. Postgres migration 0008 (schema + functions + triggers + backfill)
2. infra/supabase/policies/0008_multi_tenant_rls.sql (RLS rewrite)
3. Supabase Storage bucket + policies
4. Admin web rebuild (branding upload UI)
5. Mobile EAS build → App Store + Play Store submission
6. App Store + Play Store approval (1-3 days)
7. Remote config flip: min_version = 2.0.0
```

---

## 8. Out of Scope (v1)

- Per-gym sign-out (full sign-out only)
- Dark mode / theme switching
- Logo dynamic generation / cropping in app
- Push notifications routing per tenant (no push yet)
- Member email change → re-link auth user (manual support today)
- Magic link login (OTP code only — magic link would need universal links setup)
- Self-signup (gym admin creates all members)
- Custom font / typography per tenant (only color + logo + name)
- Web admin multi-tenant routing (admin already single-tenant via env; future migration)
- IAP / per-tenant subscriptions on mobile (admin web bills the gym)

---

## 9. Success Criteria

- Single App Store build serves all gyms; no per-tenant build needed
- User opens app, enters email, receives OTP, enters code, lands in their gym
- Multi-gym user picks gym from picker on first login; can switch in Profile after
- Branding (logo + name + accent color) loads from server, applies app-wide
- RLS isolation: User A cannot read or write Gym B data even with crafted requests
- Admin web continues to function with current `current_tenant_id()` session setting
- Phase-1, Social-A, Train-B features pass regression
- Verification: `pnpm -r typecheck && pnpm -r test` PASS; cross-tenant query test in db package PASS
- VPS deploy: migration + RLS + storage + container rebuild green
- Force-update gate engages for old mobile builds; new build serves all features

-- Relax RLS for tables the member mobile app reads/writes.
--
-- The mobile app talks to Supabase with the public anon key and does NOT
-- establish a tenant session, so the strict `tenant_id = current_tenant_id()`
-- policies (0002/0004) deny it everything — login and the workout sync both
-- fail against a server that has those policies applied.
--
-- These permissive `using (true)` policies are added ALONGSIDE the strict
-- ones; PostgreSQL OR-combines permissive policies, so the net effect is
-- allow-all for these tables.
--
-- TRADEOFF: the anon key is public (shipped in the app bundle), so this
-- exposes these tables to anyone with the key. Acceptable for the current
-- prototype. The correct long-term fix is real Supabase auth in the mobile
-- app so RLS can key off `auth.uid()`; this file should be removed then.

create policy members_mobile_anon on public.members
  for all using (true) with check (true);

create policy plans_mobile_anon on public.plans
  for all using (true) with check (true);

create policy studio_settings_mobile_anon on public.studio_settings
  for all using (true) with check (true);

create policy exercises_mobile_anon on public.exercises
  for all using (true) with check (true);

create policy workouts_mobile_anon on public.workouts
  for all using (true) with check (true);

create policy workout_sets_mobile_anon on public.workout_sets
  for all using (true) with check (true);

create policy member_exercise_prefs_mobile_anon on public.member_exercise_prefs
  for all using (true) with check (true);

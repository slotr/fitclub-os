-- infra/supabase/policies/0004_workout_policies.sql
alter table public.exercises enable row level security;
alter table public.member_exercise_prefs enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

-- exercises: global rows (member_id null) readable by everyone;
-- custom rows scoped to the owning tenant.
create policy exercises_select on public.exercises
  for select using (
    member_id is null or tenant_id = public.current_tenant_id()
  );
create policy exercises_modify on public.exercises
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- member_exercise_prefs: tenant-scoped
create policy member_exercise_prefs_select on public.member_exercise_prefs
  for select using (tenant_id = public.current_tenant_id());
create policy member_exercise_prefs_modify on public.member_exercise_prefs
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- workouts: tenant-scoped (checkins pattern)
create policy workouts_select on public.workouts
  for select using (tenant_id = public.current_tenant_id());
create policy workouts_modify on public.workouts
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- workout_sets: scoped through the parent workout
create policy workout_sets_select on public.workout_sets
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.tenant_id = public.current_tenant_id()
    )
  );
create policy workout_sets_modify on public.workout_sets
  for all using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_sets.workout_id
        and w.tenant_id = public.current_tenant_id()
    )
  );

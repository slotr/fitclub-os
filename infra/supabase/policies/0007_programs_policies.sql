-- infra/supabase/policies/0007_programs_policies.sql

-- Enable RLS on all 5 new tables
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.programs enable row level security;
alter table public.program_days enable row level security;
alter table public.program_day_completions enable row level security;

-- Strict tenant policies (future admin web access)
create policy workout_templates_select on public.workout_templates
  for select using (tenant_id = public.current_tenant_id());
create policy workout_templates_modify on public.workout_templates
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy programs_select on public.programs
  for select using (tenant_id = public.current_tenant_id());
create policy programs_modify on public.programs
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- Child tables: parent join check
create policy wte_select on public.workout_template_exercises
  for select using (
    exists (
      select 1 from public.workout_templates t
      where t.id = workout_template_exercises.template_id
        and t.tenant_id = public.current_tenant_id()
    )
  );
create policy wte_modify on public.workout_template_exercises
  for all using (
    exists (
      select 1 from public.workout_templates t
      where t.id = workout_template_exercises.template_id
        and t.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from public.workout_templates t
      where t.id = workout_template_exercises.template_id
        and t.tenant_id = public.current_tenant_id()
    )
  );

create policy program_days_select on public.program_days
  for select using (
    exists (
      select 1 from public.programs p
      where p.id = program_days.program_id
        and p.tenant_id = public.current_tenant_id()
    )
  );
create policy program_days_modify on public.program_days
  for all using (
    exists (
      select 1 from public.programs p
      where p.id = program_days.program_id
        and p.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from public.programs p
      where p.id = program_days.program_id
        and p.tenant_id = public.current_tenant_id()
    )
  );

create policy program_day_completions_select on public.program_day_completions
  for select using (
    exists (
      select 1 from public.programs p
      where p.id = program_day_completions.program_id
        and p.tenant_id = public.current_tenant_id()
    )
  );
create policy program_day_completions_modify on public.program_day_completions
  for all using (
    exists (
      select 1 from public.programs p
      where p.id = program_day_completions.program_id
        and p.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from public.programs p
      where p.id = program_day_completions.program_id
        and p.tenant_id = public.current_tenant_id()
    )
  );

-- Mobile anon access (same Phase-1 tradeoff documented in spec)
create policy workout_templates_mobile_anon on public.workout_templates
  for all using (true) with check (true);
create policy wte_mobile_anon on public.workout_template_exercises
  for all using (true) with check (true);
create policy programs_mobile_anon on public.programs
  for all using (true) with check (true);
create policy program_days_mobile_anon on public.program_days
  for all using (true) with check (true);
create policy program_day_completions_mobile_anon on public.program_day_completions
  for all using (true) with check (true);

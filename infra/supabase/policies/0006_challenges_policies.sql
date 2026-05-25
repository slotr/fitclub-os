-- infra/supabase/policies/0006_challenges_policies.sql
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
    exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
        and c.tenant_id = public.current_tenant_id()
    )
  );
create policy challenge_participants_modify on public.challenge_participants
  for all using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
        and c.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
        and c.tenant_id = public.current_tenant_id()
    )
  );

-- Mobile anon access (same trade-off as 0005_mobile_anon_access.sql).
create policy challenges_mobile_anon on public.challenges
  for all using (true) with check (true);
create policy challenge_participants_mobile_anon on public.challenge_participants
  for all using (true) with check (true);

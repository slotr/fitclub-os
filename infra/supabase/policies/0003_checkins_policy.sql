alter table public.checkins enable row level security;
create policy checkins_select on public.checkins
  for select using (tenant_id = public.current_tenant_id());
create policy checkins_insert on public.checkins
  for insert with check (tenant_id = public.current_tenant_id());

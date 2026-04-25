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

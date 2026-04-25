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

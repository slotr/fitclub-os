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

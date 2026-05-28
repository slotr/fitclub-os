ALTER TABLE "members" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_settings" ADD COLUMN "logo_url" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "members_user_id_idx" ON "members" USING btree ("user_id");

-- ----------------------------------------------------------------------
-- Multi-tenant migration: auth.users link + helper + triggers + backfill
-- ----------------------------------------------------------------------

-- FK to auth.users (across-schema, drizzle-kit cannot generate)
ALTER TABLE "members"
  ADD CONSTRAINT "members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE SET NULL;

-- Helper: list tenant_ids the current auth user is a member of
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS TABLE(tenant_id uuid)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.tenant_id
  FROM public.members m
  WHERE m.user_id = auth.uid()
    AND m.deleted_at IS NULL;
$$;

-- Trigger: on auth.users INSERT, link existing matching member rows
CREATE OR REPLACE FUNCTION public.link_auth_user_to_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.members
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_auth_user_to_members();

-- Trigger: on members INSERT, link to existing auth user by email
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

DROP TRIGGER IF EXISTS on_member_insert_link ON public.members;
CREATE TRIGGER on_member_insert_link
BEFORE INSERT ON public.members
FOR EACH ROW EXECUTE FUNCTION public.link_member_to_auth_user();

-- One-time backfill
UPDATE public.members m
SET user_id = u.id
FROM auth.users u
WHERE m.email = u.email AND m.user_id IS NULL;
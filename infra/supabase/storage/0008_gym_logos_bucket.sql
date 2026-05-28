-- infra/supabase/storage/0008_gym_logos_bucket.sql
-- Creates the public read / authenticated write bucket for tenant logos.

INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-logos', 'gym-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Public logo read" ON storage.objects;
CREATE POLICY "Public logo read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gym-logos');

-- Authenticated write to own tenant folder
DROP POLICY IF EXISTS "Authenticated upload to own tenant folder" ON storage.objects;
CREATE POLICY "Authenticated upload to own tenant folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gym-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.user_tenant_ids()
    )
  );

DROP POLICY IF EXISTS "Authenticated update own tenant logos" ON storage.objects;
CREATE POLICY "Authenticated update own tenant logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gym-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.user_tenant_ids()
    )
  );

DROP POLICY IF EXISTS "Authenticated delete own tenant logos" ON storage.objects;
CREATE POLICY "Authenticated delete own tenant logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gym-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.user_tenant_ids()
    )
  );

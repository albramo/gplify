-- =====================================================
-- GPLify — SECURITY FIX: hide download_url from public (anon)
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run
-- Then redeploy: supabase functions deploy send-order-email
-- =====================================================
-- Problem: public policy on themes + select('*') exposed the real
-- Backblaze/Uploadthing ZIP URL to anyone before purchase.
-- Fix: column-level grants — anon can read catalog columns
-- EXCEPT download_url. Authenticated (admin login) keeps full read.
-- Edge function (service_role) bypasses RLS and resolves file_url by id.

-- 1) Remove broad access from anon on the sensitive table
REVOKE ALL ON public.themes FROM anon;

-- 2) Re-grant only safe catalog columns to anon (no download_url)
GRANT SELECT (
  id,
  title,
  title_en,
  slug,
  category,
  category_name_ar,
  categories,
  platform,
  platforms,
  price,
  original_price,
  rating,
  reviews_count,
  downloads_count,
  version,
  updated_date,
  is_popular,
  is_featured,
  is_new,
  is_active,
  badge,
  description,
  short_description,
  features,
  compatibility,
  included_plugins,
  file_size,
  gpl_license_type,
  thumbnail,
  screenshots,
  demo_url,
  tags,
  changelog,
  faq,
  created_at,
  updated_at
) ON public.themes TO anon;

-- 3) Admin panel (logged-in via Supabase Auth) keeps full read incl. download_url
GRANT SELECT ON public.themes TO authenticated;

-- 4) Row-level policy stays: public can only see active rows
-- (already created in schema.sql — kept here for idempotency)
DROP POLICY IF EXISTS "Public read active themes" ON public.themes;
CREATE POLICY "Public read active themes"
  ON public.themes FOR SELECT USING (is_active = true);

-- 5) Verify: run as anon this must FAIL (permission denied for download_url):
-- SELECT download_url FROM public.themes LIMIT 1;
-- And this must SUCCEED:
-- SELECT id, title, price FROM public.themes WHERE is_active = true LIMIT 1;

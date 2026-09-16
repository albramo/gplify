-- =====================================================
-- GPLify — Complete Supabase schema (idempotent: safe to re-run)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================

create extension if not exists "pgcrypto";

-- ---------- 1) THEMES: real store catalog (replaces demo array) ----------
CREATE TABLE IF NOT EXISTS public.themes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'business',
  category_name_ar TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'WordPress',
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 5,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL DEFAULT '1.0.0',
  updated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  badge TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  features JSONB NOT NULL DEFAULT '[]',
  compatibility JSONB NOT NULL DEFAULT '[]',
  included_plugins JSONB NOT NULL DEFAULT '[]',
  file_size TEXT NOT NULL DEFAULT '',
  gpl_license_type TEXT NOT NULL DEFAULT 'GPL v3',
  thumbnail TEXT NOT NULL DEFAULT '',
  screenshots JSONB NOT NULL DEFAULT '[]',
  demo_url TEXT NOT NULL DEFAULT '',
  download_url TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]',
  changelog JSONB NOT NULL DEFAULT '[]',
  faq JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 2) COUPONS: discount codes (replaces hardcoded list) ----------
CREATE TABLE IF NOT EXISTS public.coupons (
  code TEXT PRIMARY KEY,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  min_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 3) ORDERS (same columns the app already uses) ----------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  payment_ref TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  coupon_code TEXT,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  download_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- 4) SUBSCRIBERS ----------
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- RLS ----------
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Policies (dropped first so this script is safe to re-run)
DROP POLICY IF EXISTS "Public read active themes" ON public.themes;
CREATE POLICY "Public read active themes"
  ON public.themes FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
CREATE POLICY "Public read active coupons"
  ON public.coupons FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Enable insert for all" ON public.orders;
CREATE POLICY "Enable insert for all"
  ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select by email" ON public.orders;
-- NOTE: no public SELECT on orders (order-lookup feature removed by design:
-- no login, no order history in the storefront). Orders are insert-only;
-- read them in the Supabase dashboard table editor.

DROP POLICY IF EXISTS "Enable insert for subscribers" ON public.subscribers;
CREATE POLICY "Enable insert for subscribers"
  ON public.subscribers FOR INSERT WITH CHECK (true);

-- ---------- Backfill for stores created before download_url existed ----------
ALTER TABLE public.themes ADD COLUMN IF NOT EXISTS download_url TEXT NOT NULL DEFAULT '';

-- ---------- Theme badge: '' = none, 'exclusive' = حصري, 'featured' = مميز ----------
ALTER TABLE public.themes ADD COLUMN IF NOT EXISTS badge TEXT NOT NULL DEFAULT '';

-- ---------- Multi taxonomy: a theme can belong to several categories/platforms ----------
-- `category` / `platform` stay as the PRIMARY values (badges, compat); the arrays
-- drive filtering. Empty array = fall back to the primary value.
ALTER TABLE public.themes ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.themes ADD COLUMN IF NOT EXISTS platforms TEXT[] NOT NULL DEFAULT '{}';

-- ---------- Indexes (fast catalog + order lookup) ----------
CREATE INDEX IF NOT EXISTS themes_category_idx ON public.themes (category);
CREATE INDEX IF NOT EXISTS themes_active_idx ON public.themes (is_active);
CREATE INDEX IF NOT EXISTS orders_email_idx ON public.orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders (created_at DESC);

-- ---------- Auto-update updated_at on themes ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS themes_updated_at ON public.themes;
CREATE TRIGGER themes_updated_at
  BEFORE UPDATE ON public.themes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Starter coupons (safe to re-run) ----------
INSERT INTO public.coupons (code, discount_percent, description) VALUES
  ('GPL20', 20, 'خصم 20% على إجمالي الطلب للعملاء الجدد'),
  ('GPL10', 10, 'خصم 10% فوري'),
  ('VIPGPL', 25, 'خصم كبار العملاء 25%')
ON CONFLICT (code) DO NOTHING;

-- ---------- 6) USER_DOWNLOADS: single-use download tokens (one row per file) ----------
-- Each paid file gets its own random token. Frontend never reads this table
-- directly (RLS blocks anon). Only the `download` edge function (service_role)
-- reads + atomically consumes it, then 302-redirects to the real file URL
-- (Uploadthing / Backblaze) stored in file_url.
CREATE TABLE IF NOT EXISTS public.user_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  download_token TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL DEFAULT '',
  theme_id TEXT NOT NULL DEFAULT '',
  theme_title TEXT NOT NULL DEFAULT '',
  order_number TEXT NOT NULL DEFAULT '',
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

-- No public access by design (no SELECT / INSERT / UPDATE policies for anon).
-- service_role (edge functions) bypasses RLS. Admins can inspect from dashboard/panel:
DROP POLICY IF EXISTS "Admin read downloads" ON public.user_downloads;
CREATE POLICY "Admin read downloads" ON public.user_downloads FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin delete downloads" ON public.user_downloads;
CREATE POLICY "Admin delete downloads" ON public.user_downloads FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS user_downloads_token_idx ON public.user_downloads (download_token);
CREATE INDEX IF NOT EXISTS user_downloads_email_idx ON public.user_downloads (lower(customer_email));
CREATE INDEX IF NOT EXISTS user_downloads_order_idx ON public.user_downloads (order_number);

-- ---------- Admin writes (owner panel at /admin122, real Supabase Auth) ----------
-- Only LOGGED-IN users can write. You must ALSO do this once in the dashboard:
--   Authentication → Settings → turn OFF "Enable new user signups"
--   Authentication → Users → Add user (your admin email + password)
DROP POLICY IF EXISTS "Admin insert themes" ON public.themes;
DROP POLICY IF EXISTS "Admin update themes" ON public.themes;
DROP POLICY IF EXISTS "Admin delete themes" ON public.themes;
DROP POLICY IF EXISTS "Admin write themes" ON public.themes;
CREATE POLICY "Admin write themes"
  ON public.themes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin write coupons" ON public.coupons;
CREATE POLICY "Admin write coupons"
  ON public.coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- 5) SETTINGS: owner-configurable store options ----------
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write settings" ON public.settings;
CREATE POLICY "Admin write settings" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- Manual-payment columns + admin order access ----------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';
DROP POLICY IF EXISTS "Admin read orders" ON public.orders;
CREATE POLICY "Admin read orders" ON public.orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin delete orders" ON public.orders;
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE TO authenticated USING (true);

-- ---------- SECURITY FIX: hide download_url from anon (public catalog) ----------
-- The storefront reads themes with an explicit column list (see src/lib/store.ts).
-- Even if an attacker queries rest/v1/themes?select=download_url directly,
-- Postgres column grants deny it. Admin (authenticated) keeps full access.
-- Edge functions use service_role (bypasses RLS) to resolve file_url by theme id.
REVOKE ALL ON public.themes FROM anon;
GRANT SELECT (
  id, title, title_en, slug, category, category_name_ar, categories, platform, platforms,
  price, original_price, rating, reviews_count, downloads_count,
  version, updated_date, is_popular, is_featured, is_new, is_active, badge,
  description, short_description, features, compatibility, included_plugins,
  file_size, gpl_license_type, thumbnail, screenshots, demo_url,
  tags, changelog, faq, created_at, updated_at
) ON public.themes TO anon;
GRANT SELECT ON public.themes TO authenticated;

-- ---------- 7) CONTACT_MESSAGES: public contact form inbox (fallback + archive) ----------
-- The contact form first tries the `send-contact-email` edge function (Resend to
-- CONTACT_EMAIL). It ALSO inserts here so no message is ever lost when email
-- is not configured yet. Read from dashboard or AdminPanel (authenticated only).
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can send contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can send contact messages"
  ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin read contact messages" ON public.contact_messages;
CREATE POLICY "Admin read contact messages"
  ON public.contact_messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin update contact messages" ON public.contact_messages;
CREATE POLICY "Admin update contact messages"
  ON public.contact_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin delete contact messages" ON public.contact_messages;
CREATE POLICY "Admin delete contact messages"
  ON public.contact_messages FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON public.contact_messages (created_at DESC);

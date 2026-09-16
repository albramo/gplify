import { getSupabaseClient } from './supabase';
import type { Coupon, GPLTheme, PlatformType, ThemeCategory } from '../types';

/**
 * gplify — live store data layer.
 * The storefront reads themes + coupons ONLY from Supabase.
 * There is no demo fallback by design: unconfigured DB => explicit connect state.
 */

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function asChangelog(v: unknown): GPLTheme['changelog'] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => ({
      version: String(e.version ?? ''),
      date: String(e.date ?? ''),
      changes: asStringArray(e.changes),
    }));
}

function asFaq(v: unknown): GPLTheme['faq'] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => ({
      question: String(e.question ?? ''),
      answer: String(e.answer ?? ''),
    }));
}



/**
 * Categories + platforms are owner-editable (admin panel → settings).
 * Accept any sane value from the DB so new taxonomy works without code changes.
 */
function asCategory(v: unknown): ThemeCategory {
  const s = String(v ?? '').trim();
  if (s && s !== 'all' && /^[a-z0-9-]+$/i.test(s)) return s as ThemeCategory;
  return 'business';
}

function asPlatform(v: unknown): PlatformType {
  const s = String(v ?? '').trim();
  if (s) return s as PlatformType;
  return 'WordPress';
}

/** Badge whitelist — أي قيمة غير معروفة ترجع '' (بدون شارة). */
export function asBadge(v: unknown): string {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'exclusive' || s === 'featured' ? s : '';
}

/** Arabic label for a theme badge ('' = none). */
export function badgeLabelAr(badge: string | undefined): string {
  if (badge === 'exclusive') return 'حصري';
  if (badge === 'featured') return 'مميز';
  return '';
}

// SECURITY: public storefront must NEVER request download_url.
// The real file URL lives only in the DB (anon has no column privilege)
// and is read server-side by the send-order-email edge function (service_role).
// AdminPanel (authenticated) reads the full row separately.
const PUBLIC_THEME_COLUMNS = [
  'id',
  'title',
  'title_en',
  'slug',
  'category',
  'category_name_ar',
  'categories',
  'platform',
  'platforms',
  'price',
  'original_price',
  'rating',
  'reviews_count',
  'downloads_count',
  'version',
  'updated_date',
  'is_popular',
  'is_featured',
  'is_new',
  'is_active',
  'badge',
  'description',
  'short_description',
  'features',
  'compatibility',
  'included_plugins',
  'file_size',
  'gpl_license_type',
  'thumbnail',
  'screenshots',
  'demo_url',
  'tags',
  'changelog',
  'faq',
  'created_at',
  'updated_at',
].join(',');

// ---- Catalog cache (5 min, memory + localStorage) ----
const CATALOG_TTL_MS = 5 * 60 * 1000;
const THEMES_CACHE_KEY = 'gpl_catalog_themes_v2';
const COUPONS_CACHE_KEY = 'gpl_catalog_coupons_v1';

const memCache: {
  themes: { at: number; data: GPLTheme[] } | null;
  coupons: { at: number; data: Coupon[] } | null;
} = { themes: null, coupons: null };

function readCatalogCache<T>(key: string): T | null {
  const now = Date.now();
  const mem = key === THEMES_CACHE_KEY ? memCache.themes : memCache.coupons;
  if (mem && now - mem.at < CATALOG_TTL_MS) return mem.data as unknown as T;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: T };
    if (!parsed || now - parsed.at > CATALOG_TTL_MS || !Array.isArray(parsed.data)) {
      try { localStorage.removeItem(key); } catch {}
      return null;
    }
    if (key === THEMES_CACHE_KEY) memCache.themes = { at: parsed.at, data: parsed.data as unknown as GPLTheme[] };
    else memCache.coupons = { at: parsed.at, data: parsed.data as unknown as Coupon[] };
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCatalogCache<T>(key: string, data: T): void {
  const entry = { at: Date.now(), data };
  if (key === THEMES_CACHE_KEY) memCache.themes = entry as unknown as { at: number; data: GPLTheme[] };
  else memCache.coupons = entry as unknown as { at: number; data: Coupon[] };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

/** All categories of a theme (primary first). Works with old cached rows too. */
export function themeCategories(t: GPLTheme): string[] {
  const extra = Array.isArray(t.categories) ? t.categories.filter(Boolean) : [];
  return [...new Set([t.category, ...extra])];
}

/** All platforms of a theme (primary first). Works with old cached rows too. */
export function themePlatforms(t: GPLTheme): string[] {
  const extra = Array.isArray(t.platforms) ? t.platforms.filter(Boolean) : [];
  return [...new Set([t.platform, ...extra])];
}

export function mapThemeRow(row: Record<string, any>): GPLTheme {  return {
    id: String(row.id ?? row.slug ?? ''),
    title: String(row.title ?? ''),
    titleEn: String(row.title_en ?? ''),
    slug: String(row.slug ?? row.id ?? ''),
    category: asCategory(row.category),
    categoryNameAr: String(row.category_name_ar ?? ''),
    categories: asStringArray(row.categories),
    platform: asPlatform(row.platform),
    platforms: asStringArray(row.platforms),
    price: Number(row.price ?? 0),
    originalPrice: Number(row.original_price ?? 0),
    rating: Number(row.rating ?? 5),
    reviewsCount: Number(row.reviews_count ?? 0),
    downloadsCount: Number(row.downloads_count ?? 0),
    version: String(row.version ?? '1.0.0'),
    updatedDate: String(row.updated_date ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? row.updated_date ?? ''),
    isPopular: Boolean(row.is_popular),
    isFeatured: Boolean(row.is_featured),
    isNew: Boolean(row.is_new),
    isActive: row.is_active !== false,
    badge: asBadge(row.badge),
    description: String(row.description ?? ''),
    shortDescription: String(row.short_description ?? ''),
    features: asStringArray(row.features),
    compatibility: asStringArray(row.compatibility),
    includedPlugins: asStringArray(row.included_plugins),
    fileSize: String(row.file_size ?? ''),
    gplLicenseType: String(row.gpl_license_type ?? '').trim(),
    thumbnail: String(row.thumbnail ?? ''),
    screenshots: asStringArray(row.screenshots),
    demoUrl: String(row.demo_url ?? ''),
    downloadUrl: String(row.download_url ?? ''),
    tags: asStringArray(row.tags),
    changelog: asChangelog(row.changelog),
    faq: asFaq(row.faq),
  };
}

export async function fetchThemes(opts?: { force?: boolean }): Promise<GPLTheme[]> {
  // Catalog cache: avoid a network round-trip on every mount/remount.
  // TTL 5 min in memory + localStorage (stale entries are ignored).
  if (!opts?.force) {
    const cached = readCatalogCache<GPLTheme[]>(THEMES_CACHE_KEY);
    if (cached) return cached;
  }
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await client
    .from('themes')
    .select(PUBLIC_THEME_COLUMNS)
    .eq('is_active', true)
    .order('downloads_count', { ascending: false });
  if (error) throw error;
  const mapped = (data ?? []).map(mapThemeRow);
  writeCatalogCache(THEMES_CACHE_KEY, mapped);
  return mapped;
}

export async function fetchCoupons(opts?: { force?: boolean }): Promise<Coupon[]> {
  if (!opts?.force) {
    const cached = readCatalogCache<Coupon[]>(COUPONS_CACHE_KEY);
    if (cached) return cached;
  }
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await client.from('coupons').select('*').eq('is_active', true);
  if (error) throw error;
  const mapped = (data ?? []).map((row: any) => ({
    code: String(row.code ?? '').toUpperCase(),
    discountPercent: Number(row.discount_percent ?? 0),
    description: String(row.description ?? ''),
    minAmount: Number(row.min_amount ?? 0),
  }));
  writeCatalogCache(COUPONS_CACHE_KEY, mapped);
  return mapped;
}

/** Clear storefront catalog cache (call after admin writes so visitors see fresh data). */
export function clearCatalogCache(): void {
  memCache.themes = null;
  memCache.coupons = null;
  try {
    localStorage.removeItem(THEMES_CACHE_KEY);
    localStorage.removeItem(COUPONS_CACHE_KEY);
  } catch {}
}

import { getSupabaseClient } from './supabase';
import { CATEGORIES_LIST, PLATFORMS_LIST } from '../data/themes';

/**
 * gplify — owner-configurable store options (contact channels, payment numbers,
 * plus store taxonomy: categories + platforms).
 * Stored in the public `settings` table (key/value). Writes require login.
 */

export interface CategoryDef {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
}

export interface PlatformDef {
  id: string;
  label: string;
}

export interface AnnouncementDef {
  enabled: boolean;
  /** May contain {code} placeholder for the highlighted coupon code. Empty = bar hidden. */
  text: string;
  code: string;
}

export interface StoreSettings {
  contactMode: 'whatsapp' | 'telegram' | 'both';
  whatsappNumber: string;
  telegramUsername: string;
  vodafoneNumber: string;
  instapayAddress: string;
  categories: CategoryDef[];
  platforms: PlatformDef[];
  announcement: AnnouncementDef;
}

export const DEFAULT_CATEGORIES: CategoryDef[] = CATEGORIES_LIST.filter((c) => c.id !== 'all').map(
  (c) => ({ id: c.id, nameAr: c.nameAr, nameEn: c.nameEn, icon: c.icon })
);

export const DEFAULT_PLATFORMS: PlatformDef[] = PLATFORMS_LIST.filter((p) => p.id !== 'all').map(
  (p) => ({ id: p.id, label: p.label })
);

export const DEFAULT_ANNOUNCEMENT: AnnouncementDef = {
  enabled: true,
  text: 'خصم 20% لفترة محدودة بكود {code} — تسليم فوري عبر البريد الإلكتروني',
  code: 'GPL20',
};

export const DEFAULT_SETTINGS: StoreSettings = {
  contactMode: 'whatsapp',
  whatsappNumber: '',
  telegramUsername: '',
  vodafoneNumber: '',
  instapayAddress: '',
  categories: DEFAULT_CATEGORIES,
  platforms: DEFAULT_PLATFORMS,
  announcement: { ...DEFAULT_ANNOUNCEMENT },
};

function parseCategories(raw: string): CategoryDef[] | null {
  try {
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const out: CategoryDef[] = [];
    for (const e of arr) {
      if (typeof e !== 'object' || e === null) return null;
      const r = e as Record<string, unknown>;
      const id = String(r.id ?? '').trim().toLowerCase();
      const nameAr = String(r.nameAr ?? '').trim();
      if (!/^[a-z0-9-]+$/.test(id) || !nameAr) return null;
      out.push({
        id,
        nameAr,
        nameEn: String(r.nameEn ?? '').trim(),
        icon: String(r.icon ?? 'LayoutGrid').trim() || 'LayoutGrid',
      });
    }
    return out;
  } catch {
    return null;
  }
}

function parsePlatforms(raw: string): PlatformDef[] | null {
  try {
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const out: PlatformDef[] = [];
    for (const e of arr) {
      if (typeof e !== 'object' || e === null) return null;
      const r = e as Record<string, unknown>;
      const id = String(r.id ?? '').trim();
      const label = String(r.label ?? '').trim();
      if (!id || !label) return null;
      out.push({ id, label });
    }
    return out;
  } catch {
    return null;
  }
}

const SETTINGS_CACHE_KEY = 'gpl_catalog_settings_v1';
const SETTINGS_TTL_MS = 5 * 60 * 1000;
let memSettings: { at: number; data: StoreSettings } | null = null;

/** Merge stored settings over defaults (protects old caches missing new fields). */
function withDefaults(s: Partial<StoreSettings>): StoreSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    categories:
      Array.isArray(s.categories) && s.categories.length > 0 ? s.categories : [...DEFAULT_CATEGORIES],
    platforms:
      Array.isArray(s.platforms) && s.platforms.length > 0 ? s.platforms : [...DEFAULT_PLATFORMS],
    announcement: { ...DEFAULT_ANNOUNCEMENT, ...(s.announcement || {}) },
  };
}

export async function fetchPublicSettings(opts?: { force?: boolean }): Promise<StoreSettings> {
  if (!opts?.force) {
    const now = Date.now();
    if (memSettings && now - memSettings.at < SETTINGS_TTL_MS) return withDefaults(memSettings.data);
    try {
      const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { at: number; data: StoreSettings };
        if (parsed && now - parsed.at < SETTINGS_TTL_MS && parsed.data) {
          memSettings = { at: parsed.at, data: parsed.data };
          return withDefaults(parsed.data);
        }
      }
    } catch {}
  }
  const client = getSupabaseClient();
  if (!client) return { ...DEFAULT_SETTINGS };
  try {
    const { data, error } = await client.from('settings').select('key,value');
    if (error || !data) return { ...DEFAULT_SETTINGS };
    const map: Record<string, string> = {};
    for (const row of data as any[]) map[String(row.key)] = String(row.value ?? '');

    const categories = map.categories_json ? parseCategories(map.categories_json) : null;
    const platforms = map.platforms_json ? parsePlatforms(map.platforms_json) : null;
    const taxonomy = {
      categories: categories ?? [...DEFAULT_CATEGORIES],
      platforms: platforms ?? [...DEFAULT_PLATFORMS],
    };

    const hasAnn =
      'announcement_enabled' in map || 'announcement_text' in map || 'announcement_code' in map;
    const announcement: AnnouncementDef = hasAnn
      ? {
          enabled: !['0', 'false', 'off', ''].includes(
            (map.announcement_enabled || '').trim().toLowerCase()
          ),
          text: (map.announcement_text || '').trim(),
          code: (map.announcement_code || '').trim(),
        }
      : { ...DEFAULT_ANNOUNCEMENT };

    // New multi-channel keys
    if (map.contact_mode === 'whatsapp' || map.contact_mode === 'telegram' || map.contact_mode === 'both') {
      const out: StoreSettings = {
        contactMode: map.contact_mode,
        whatsappNumber: (map.whatsapp_number || '').trim(),
        telegramUsername: (map.telegram_username || '').trim(),
        vodafoneNumber: (map.vodafone_number || '').trim(),
        instapayAddress: (map.instapay_address || '').trim(),
        ...taxonomy,
        announcement,
      };
      memSettings = { at: Date.now(), data: out };
      try { localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(memSettings)); } catch {}
      return out;
    }

    // Backward compat: old single-channel settings
    const legacyNumber = (map.contact_number || '').trim();
    const legacyMode = map.contact_channel === 'telegram' ? 'telegram' : 'whatsapp';
    const legacy: StoreSettings = {
      contactMode: legacyMode,
      whatsappNumber: legacyMode === 'whatsapp' ? legacyNumber : '',
      telegramUsername: legacyMode === 'telegram' ? legacyNumber : '',
      vodafoneNumber: (map.vodafone_number || '').trim(),
      instapayAddress: (map.instapay_address || '').trim(),
      ...taxonomy,
      announcement,
    };
    memSettings = { at: Date.now(), data: legacy };
    try { localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(memSettings)); } catch {}
    return legacy;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveStoreSettings(s: StoreSettings): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('لا يوجد اتصال بقاعدة البيانات');
  const rows = [
    { key: 'contact_mode', value: s.contactMode },
    { key: 'whatsapp_number', value: s.whatsappNumber.trim() },
    { key: 'telegram_username', value: s.telegramUsername.trim() },
    { key: 'vodafone_number', value: s.vodafoneNumber.trim() },
    { key: 'instapay_address', value: s.instapayAddress.trim() },
    { key: 'categories_json', value: JSON.stringify(s.categories) },
    { key: 'platforms_json', value: JSON.stringify(s.platforms) },
    { key: 'announcement_enabled', value: s.announcement.enabled ? '1' : '0' },
    { key: 'announcement_text', value: s.announcement.text.trim() },
    { key: 'announcement_code', value: s.announcement.code.trim() },
  ];
  const { error } = await client.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
  clearSettingsCache();
}

/** Clear cached public settings (call after admin writes). */
export function clearSettingsCache(): void {
  memSettings = null;
  try { localStorage.removeItem(SETTINGS_CACHE_KEY); } catch {}
}

/** Normalize an Egyptian mobile to international digits for wa.me links. */
export function normalizeEgPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length >= 12) return digits;
  if (digits.startsWith('01') && digits.length === 11) return '2' + digits;
  if (digits.startsWith('1') && digits.length === 10) return '20' + digits;
  return digits;
}

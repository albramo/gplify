import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  LogOut,
  Search,
  RefreshCw,
  Database,
  Tag,
  LayoutGrid,
  Layers,
  ExternalLink,
  Settings,
  ClipboardList,
  Check,
  Megaphone,
  MessageCircle,
  Wallet,
} from 'lucide-react';
import { getSupabaseClient, isSupabaseConnected, signInAdmin, signOutAdmin, getAdminEmail, onAdminAuthChange } from '../lib/supabase';
import { mapThemeRow, clearCatalogCache } from '../lib/store';
import {
  fetchPublicSettings,
  saveStoreSettings,
  DEFAULT_SETTINGS,
  type StoreSettings,
  type CategoryDef,
  type PlatformDef,
} from '../lib/settings';
import { CATEGORY_ICON_OPTIONS, resolveCategoryIcon } from '../lib/categoryIcons';
import {
  isSafeHttpUrl,
  safeUrl,
  capText,
  MAX_TITLE_LEN,
  MAX_SHORT_DESC_LEN,
  MAX_DESC_LEN,
} from '../lib/security';
import type { Coupon, GPLTheme, Order } from '../types';
import { formatCurrency } from './ThemeCard';

/**
 * gplify — owner admin panel (route: /admin122).
 * Real login via Supabase Auth (email + password user you create in the dashboard).
 * Sessions persist automatically; logout from the header.
 * Manages the live catalog: themes CRUD + coupons CRUD + store taxonomy
 * (categories + platforms, stored in the settings table).
 */

const LICENSE_OPTIONS = ['GPL v3', 'GPL v2', 'GNU GPL'];

/** خيارات شارة الثيم المعروضة على الكارت وصفحة الثيم. */
const BADGE_OPTIONS = [
  { id: '', nameAr: '— بدون شارة —' },
  { id: 'exclusive', nameAr: 'حصري' },
  { id: 'featured', nameAr: 'مميز' },
];

interface ThemeForm {
  id: string;
  title: string;
  titleEn: string;
  slug: string;
  category: string;
  categoryNameAr: string;
  categories: string[];
  platform: string;
  platforms: string[];
  price: string;
  originalPrice: string;
  rating: string;
  reviewsCount: string;
  downloadsCount: string;
  version: string;
  updatedDate: string;
  description: string;
  shortDescription: string;
  features: string;
  compatibility: string;
  includedPlugins: string;
  screenshots: string;
  tags: string;
  changelog: string;
  faq: string;
  fileSize: string;
  gplLicenseType: string;
  badge: string;
  thumbnail: string;
  demoUrl: string;
  downloadUrl: string;
  isActive: boolean;
}

const emptyThemeForm = (): ThemeForm => ({
  id: '',
  title: '',
  titleEn: '',
  slug: '',
  category: 'business',
  categoryNameAr: 'أعمال وشركات',
  categories: ['business'],
  platform: 'WordPress',
  platforms: ['WordPress'],
  price: '9',
  originalPrice: '59',
  rating: '5',
  reviewsCount: '0',
  downloadsCount: '0',
  version: '1.0.0',
  updatedDate: new Date().toISOString().slice(0, 10),
  description: '',
  shortDescription: '',
  features: '',
  compatibility: '',
  includedPlugins: '',
  screenshots: '',
  tags: '',
  changelog: '[]',
  faq: '[]',
  fileSize: '',
  gplLicenseType: 'GPL v3',
  badge: '',
  thumbnail: '',
  demoUrl: '',
  downloadUrl: '',
  isActive: true,
});

const linesToText = (arr: string[]) => arr.join('\n');
const textToLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function formFromTheme(t: GPLTheme): ThemeForm {
  return {
    id: t.id,
    title: t.title,
    titleEn: t.titleEn,
    slug: t.slug,
    category: t.category,
    categoryNameAr: t.categoryNameAr,
    categories: Array.isArray(t.categories) && t.categories.length > 0
      ? [...new Set([t.category, ...t.categories])]
      : [t.category],
    platform: t.platform,
    platforms: Array.isArray(t.platforms) && t.platforms.length > 0
      ? [...new Set([t.platform, ...t.platforms])]
      : [t.platform],
    price: String(t.price),
    originalPrice: String(t.originalPrice),
    rating: String(t.rating),
    reviewsCount: String(t.reviewsCount),
    downloadsCount: String(t.downloadsCount),
    version: t.version,
    updatedDate: t.updatedDate || new Date().toISOString().slice(0, 10),
    description: t.description,
    shortDescription: t.shortDescription,
    features: linesToText(t.features),
    compatibility: linesToText(t.compatibility),
    includedPlugins: linesToText(t.includedPlugins ?? []),
    screenshots: linesToText(t.screenshots),
    tags: linesToText(t.tags),
    changelog: JSON.stringify(t.changelog, null, 2),
    faq: JSON.stringify(t.faq, null, 2),
    fileSize: t.fileSize,
    gplLicenseType: t.gplLicenseType,
    badge: t.badge === 'exclusive' || t.badge === 'featured' ? t.badge : '',
    thumbnail: t.thumbnail,
    demoUrl: t.demoUrl,
    downloadUrl: t.downloadUrl ?? '',
    isActive: t.isActive !== false,
  };
}

function formToRow(f: ThemeForm, isNew: boolean) {
  if (!f.title.trim()) throw new Error('اسم القالب (بالعربية) مطلوب');
  if (!f.slug.trim()) throw new Error('الرابط المختصر (slug) مطلوب');
  const slug = f.slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) throw new Error('الرابط المختصر لازم يكون حروف إنجليزية أو أرقام (مثال: minimog-pro)');
  const id = isNew ? slug : f.id;
  // SECURITY: URL fields must be absolute http(s) — blocks javascript:/data: payloads
  // from ever reaching href/src on the storefront.
  const urlFields: [string, string][] = [
    ['رابط التحميل المباشر', f.downloadUrl],
    ['رابط الديمو', f.demoUrl],
    ['رابط الصورة الرئيسية', f.thumbnail],
  ];
  for (const [label, v] of urlFields) {
    if (v.trim() && !isSafeHttpUrl(v.trim())) {
      throw new Error(`${label} غير صالح — لازم يبدأ بـ https://`);
    }
  }
  const screenshots = textToLines(f.screenshots);
  for (const s of screenshots) {
    if (!isSafeHttpUrl(s)) {
      throw new Error(`رابط لقطة شاشة غير صالح (${s.slice(0, 60)}…) — لازم يبدأ بـ https://`);
    }
  }
  let changelog: unknown = [];
  let faq: unknown = [];
  try {
    changelog = f.changelog.trim() ? JSON.parse(f.changelog) : [];
  } catch {
    throw new Error('صيغة سجل التحديثات (JSON) غير صحيحة');
  }
  try {
    faq = f.faq.trim() ? JSON.parse(f.faq) : [];
  } catch {
    throw new Error('صيغة الأسئلة الشائعة (JSON) غير صحيحة');
  }
  if (f.categories.length === 0) throw new Error('اختار تصنيف واحد على الأقل للقالب');
  if (f.platforms.length === 0) throw new Error('اختار منصة واحدة على الأقل للقالب');
  const row: Record<string, unknown> = {
    title: capText(f.title, MAX_TITLE_LEN),
    title_en: capText(f.titleEn, MAX_TITLE_LEN),
    slug,
    category: f.categories.includes(f.category) ? f.category : f.categories[0],
    category_name_ar: capText(f.categoryNameAr, 60),
    categories: f.categories,
    platform: f.platforms.includes(f.platform) ? f.platform : f.platforms[0],
    platforms: f.platforms,
    price: Number(f.price) || 0,
    original_price: Number(f.originalPrice) || 0,
    rating: Number(f.rating) || 5,
    reviews_count: Number(f.reviewsCount) || 0,
    downloads_count: Number(f.downloadsCount) || 0,
    version: f.version.trim() || '1.0.0',
    updated_date: f.updatedDate || new Date().toISOString().slice(0, 10),
    is_active: f.isActive,
    description: capText(f.description, MAX_DESC_LEN),
    short_description: capText(f.shortDescription, MAX_SHORT_DESC_LEN),
    features: textToLines(f.features),
    compatibility: textToLines(f.compatibility),
    included_plugins: textToLines(f.includedPlugins),
    file_size: f.fileSize.trim(),
    gpl_license_type: f.gplLicenseType.trim(),
    badge: f.badge === 'exclusive' || f.badge === 'featured' ? f.badge : '',
    thumbnail: f.thumbnail.trim(),
    screenshots,
    demo_url: f.demoUrl.trim(),
    download_url: f.downloadUrl.trim(),
    tags: textToLines(f.tags),
    changelog,
    faq,
  };
  if (isNew) row.id = id;
  return row;
}

interface CouponForm {
  code: string;
  discountPercent: string;
  description: string;
  minAmount: string;
  isActive: boolean;
}

const emptyCouponForm = (): CouponForm => ({
  code: '',
  discountPercent: '20',
  description: '',
  minAmount: '0',
  isActive: true,
});

const inputCls =
  'w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-[#0b132b] focus:bg-white focus:outline-none focus:border-[#0b132b] transition';
const labelCls = 'block text-xs font-bold text-[#0b132b] mb-1';
const btnPrimary =
  'px-5 py-2.5 bg-[#0b132b] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * Brute-force guard for the owner login: 3 wrong passwords → 30-minute lockout.
 * Stored in localStorage so it survives reloads (per-browser deterrent; Supabase
 * Auth also rate-limits sign-ins server-side, and new signups must stay disabled).
 */
const ADMIN_LOCK_KEY = 'gpl_admin_lock_v1';
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_MS = 30 * 60 * 1000;

interface AdminLockState {
  fails: number;
  lockUntil: number;
}

function readAdminLock(): AdminLockState {
  try {
    const raw = localStorage.getItem(ADMIN_LOCK_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AdminLockState>;
      return { fails: Number(p.fails) || 0, lockUntil: Number(p.lockUntil) || 0 };
    }
  } catch {}
  return { fails: 0, lockUntil: 0 };
}

function writeAdminLock(s: AdminLockState) {
  try {
    localStorage.setItem(ADMIN_LOCK_KEY, JSON.stringify(s));
  } catch {}
}

function clearAdminLock() {
  try {
    localStorage.removeItem(ADMIN_LOCK_KEY);
  } catch {}
}

function fmtLockRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Side sub-tabs inside the settings tab. */
const SETTINGS_NAV = [
  { id: 'announce', label: 'شريط الإعلان', Icon: Megaphone },
  { id: 'contact', label: 'التواصل', Icon: MessageCircle },
  { id: 'payment', label: 'أرقام الدفع', Icon: Wallet },
  { id: 'cats', label: 'التصنيفات', Icon: LayoutGrid },
  { id: 'plats', label: 'المنصات', Icon: Layers },
] as const;

type SettingsSectionId = (typeof SETTINGS_NAV)[number]['id'];

/** Numbered settings card used to organize the settings tab into clear sections. */
function SettingsSection({ n, title, hint, children }: { n: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-[#0b132b] text-white flex items-center justify-center font-bold text-sm shrink-0">
          {n}
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#0b132b]">{title}</h2>
          {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export const AdminPanel: React.FC = () => {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [lockInfo, setLockInfo] = useState<AdminLockState>({ fails: 0, lockUntil: 0 });
  const [, setLockTick] = useState(0);
  const [tab, setTab] = useState<'themes' | 'coupons' | 'orders' | 'settings'>('themes');

  const [themes, setThemes] = useState<GPLTheme[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ThemeForm>(emptyThemeForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState<CouponForm>(emptyCouponForm());
  const [couponError, setCouponError] = useState('');
  const [savingCoupon, setSavingCoupon] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  // Orders pagination: newest 50 first — "load more" instead of select-all.
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersLoadingMore, setOrdersLoadingMore] = useState(false);
  const [ordersTotal, setOrdersTotal] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...DEFAULT_SETTINGS });
  const [settingsMsg, setSettingsMsg] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSectionId>('announce');

  const connected = isSupabaseConnected();
  const set = (patch: Partial<ThemeForm>) => setForm((p) => ({ ...p, ...patch }));

  // Multi taxonomy: keep arrays in admin order; first item is the primary one.
  const toggleFormCategory = (id: string) => {
    const order = settingsForm.categories.map((c) => c.id);
    const next = form.categories.includes(id)
      ? form.categories.filter((c) => c !== id)
      : [...form.categories, id];
    next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const primary = next[0] ?? form.category;
    const cat = settingsForm.categories.find((c) => c.id === primary);
    set({ categories: next, category: primary, categoryNameAr: cat ? cat.nameAr : form.categoryNameAr });
  };

  const toggleFormPlatform = (id: string) => {
    const order = settingsForm.platforms.map((p) => p.id);
    const next = form.platforms.includes(id)
      ? form.platforms.filter((p) => p !== id)
      : [...form.platforms, id];
    next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    set({ platforms: next, platform: next[0] ?? form.platform });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cur = readAdminLock();
    if (cur.lockUntil > Date.now()) {
      setLockInfo(cur);
      setLoginError(
        `تم إيقاف الدخول مؤقتاً بعد 3 محاولات خاطئة — حاول بعد ${fmtLockRemaining(cur.lockUntil - Date.now())} دقيقة.`
      );
      return;
    }
    setLoginError('');
    setLoggingIn(true);
    const err = await signInAdmin(loginEmail, password);
    setLoggingIn(false);
    if (err) {
      // Count only real wrong-password attempts (not network/config errors)
      if (err === 'بيانات الدخول غير صحيحة') {
        const fails = cur.fails + 1;
        if (fails >= MAX_LOGIN_ATTEMPTS) {
          const next = { fails, lockUntil: Date.now() + LOCKOUT_MS };
          writeAdminLock(next);
          setLockInfo(next);
          setLoginError('كتبت كلمة مرور غلط 3 مرات — تم إيقاف الدخول لمدة 30 دقيقة لمنع محاولات التخمين.');
        } else {
          const next = { fails, lockUntil: 0 };
          writeAdminLock(next);
          setLockInfo(next);
          const left = MAX_LOGIN_ATTEMPTS - fails;
          setLoginError(
            `بيانات الدخول غير صحيحة — فاضل ${left === 1 ? 'محاولة واحدة' : 'محاولتين'} قبل الإيقاف المؤقت.`
          );
        }
      } else {
        setLoginError(err);
      }
      return;
    }
    clearAdminLock();
    setLockInfo({ fails: 0, lockUntil: 0 });
    setPassword('');
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setAdminEmail(null);
  };

  const ORDERS_PAGE_SIZE = 50;

  const mapOrderRow = (r: any): Order => ({
    id: String(r.id),
    orderNumber: String(r.order_number),
    customerEmail: String(r.customer_email),
    customerName: String(r.customer_name || 'عميل مميز'),
    customerPhone: r.customer_phone || undefined,
    paymentRef: r.payment_ref || undefined,
    items: Array.isArray(r.items) ? r.items : [],
    subtotal: Number(r.subtotal || 0),
    discountAmount: Number(r.discount_amount || 0),
    couponCode: r.coupon_code || undefined,
    totalAmount: Number(r.total_amount || 0),
    paymentMethod: r.payment_method === 'instapay' ? 'instapay' : 'vodafone_cash',
    status: ['completed', 'processing', 'pending', 'cancelled'].includes(r.status)
      ? r.status
      : 'pending',
    createdAt: String(r.created_at),
    downloadToken: String(r.download_token || ''),
  });

  const refreshPendingCount = async () => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { count } = await client
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (typeof count === 'number') setPendingCount(count);
    } catch {}
  };

  const loadOrdersPage = async (page: number, append = false) => {
    const client = getSupabaseClient();
    if (!client) return;
    if (append) setOrdersLoadingMore(true);
    try {
      const from = page * ORDERS_PAGE_SIZE;
      const to = from + ORDERS_PAGE_SIZE - 1;
      const { data, error, count } = await client
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      const mapped = (data ?? []).map(mapOrderRow);
      setOrders((prev) => (append ? [...prev, ...mapped] : mapped));
      setOrdersPage(page);
      if (typeof count === 'number') setOrdersTotal(count);
      setOrdersHasMore(
        mapped.length === ORDERS_PAGE_SIZE &&
          (typeof count !== 'number' || (page + 1) * ORDERS_PAGE_SIZE < count)
      );
      setOrdersError('');
    } catch (e: any) {
      if (!append) {
        setOrders([]);
        setOrdersError('تعذر قراءة الطلبات — نفذ schema.sql الجديد (سياسات الطلبات) ثم حدث الصفحة.');
      }
    } finally {
      if (append) setOrdersLoadingMore(false);
    }
  };

  const loadAll = async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    setListError('');
    try {
      const [tRes, cRes] = await Promise.all([
        client.from('themes').select('*').order('created_at', { ascending: false }),
        client.from('coupons').select('*').order('created_at', { ascending: false }),
      ]);
      if (tRes.error) throw tRes.error;
      if (cRes.error) throw cRes.error;
      setThemes((tRes.data ?? []).map(mapThemeRow));
      setCoupons(
        (cRes.data ?? []).map((r: any) => ({
          code: String(r.code ?? '').toUpperCase(),
          discountPercent: Number(r.discount_percent ?? 0),
          description: String(r.description ?? ''),
          minAmount: Number(r.min_amount ?? 0),
        }))
      );
      // Orders: first page only (50 newest) + pending counter — never select-all.
      await Promise.all([loadOrdersPage(0), refreshPendingCount()]);
      try {
        setSettingsForm(await fetchPublicSettings());
      } catch {}
    } catch (e: any) {
      setListError(e?.message || 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAdminEmail().then((email) => {
      setAdminEmail(email);
      setAuthChecking(false);
    });
    setLockInfo(readAdminLock());
    const unsub = onAdminAuthChange((email) => setAdminEmail(email));
    return unsub;
  }, []);

  // Live countdown while locked + auto-unlock when the 30 minutes pass
  useEffect(() => {
    if (!lockInfo.lockUntil) return;
    const t = setInterval(() => {
      if (Date.now() >= lockInfo.lockUntil) {
        clearInterval(t);
        clearAdminLock();
        setLockInfo({ fails: 0, lockUntil: 0 });
        setLoginError('');
      } else {
        setLockTick((x) => x + 1);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [lockInfo.lockUntil]);

  useEffect(() => {
    if (adminEmail) loadAll();
  }, [adminEmail]);

  const filteredThemes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return themes;
    return themes.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.titleEn.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [themes, search]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyThemeForm());
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0 });
  };

  const openEdit = (t: GPLTheme) => {
    setEditingId(t.id);
    setForm(formFromTheme(t));
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0 });
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;
    setFormError('');
    let row: Record<string, unknown>;
    try {
      row = formToRow(form, editingId === null);
    } catch (err: any) {
      setFormError(err?.message || 'بيانات غير صالحة');
      return;
    }
    setSaving(true);
    try {
      const saveRow = async (r: Record<string, unknown>) =>
        editingId
          ? await client.from('themes').update(r).eq('id', editingId)
          : await client.from('themes').insert(r);
      let res = await saveRow(row);
      // مرونة: لو عمود الشارة لسه متضافش في قاعدة البيانات — احفظ بدونه ونبّه المالك.
      if (res.error && /badge/i.test(res.error.message || '')) {
        const { badge: _dropped, ...rowWithoutBadge } = row;
        res = await saveRow(rowWithoutBadge);
        if (res.error) throw res.error;
        setShowForm(false);
        setEditingId(null);
        clearCatalogCache();
        await loadAll();
        setFormError('');
        alert('تم الحفظ بدون الشارة — نفّذ سكريبت عمود badge من supabase/schema.sql في SQL Editor ثم أعد حفظ الثيم.');
        return;
      }
      if (res.error) throw res.error;
      setShowForm(false);
      setEditingId(null);
      clearCatalogCache();
      await loadAll();
    } catch (e: any) {
      setFormError(e?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTheme = async (id: string, title: string) => {
    if (!window.confirm(`حذف "${title}" نهائياً من الكتالوج؟`)) return;
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('themes').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    clearCatalogCache();
    await loadAll();
  };

  const handleToggleActive = async (t: GPLTheme) => {
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('themes').update({ is_active: !activeOf(t.id) }).eq('id', t.id);
    if (error) {
      alert(error.message);
      return;
    }
    clearCatalogCache();
    await loadAll();
  };

  const activeOf = (id: string) => themes.find((t) => t.id === id)?.isActive ?? true;

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;
    setCouponError('');
    const code = couponForm.code.trim().toUpperCase();
    if (!code) {
      setCouponError('كود الخصم مطلوب');
      return;
    }
    setSavingCoupon(true);
    try {
      const payload = {
        code,
        discount_percent: Number(couponForm.discountPercent) || 0,
        description: couponForm.description.trim(),
        min_amount: Number(couponForm.minAmount) || 0,
        is_active: couponForm.isActive,
      };
      const res = editingCoupon
        ? await client.from('coupons').update(payload).eq('code', editingCoupon)
        : await client.from('coupons').upsert(payload, { onConflict: 'code' });
      if (res.error) throw res.error;
      setEditingCoupon(null);
      setCouponForm(emptyCouponForm());
      clearCatalogCache();
      await loadAll();
    } catch (e: any) {
      setCouponError(e?.message || 'فشل الحفظ');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`حذف كوبون "${code}"؟`)) return;
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('coupons').delete().eq('code', code);
    if (error) {
      alert(error.message);
      return;
    }
    clearCatalogCache();
    await loadAll();
  };

  const sendConfirmationEmail = async (o: Order): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { data, error } = await client.functions.invoke('send-order-email', {
        body: { orderNumber: o.orderNumber, email: o.customerEmail },
      });
      if (error) return false;
      return Boolean((data as any)?.sent);
    } catch {
      return false;
    }
  };

  const updateOrderStatus = async (o: Order, status: Order['status']) => {
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('orders').update({ status }).eq('id', o.id);
    if (error) {
      alert(error.message);
      return;
    }
    if (status === 'completed') {
      setSendingId(o.id);
      const sent = await sendConfirmationEmail(o);
      setSendingId(null);
      alert(
        sent
          ? 'تم تأكيد الدفع واتبعتت روابط التحميل لإيميل العميل مباشرة.'
          : 'تم تأكيد الدفع، لكن إرسال الإيميل فشل — تحقق من إعداد Resend ثم دوس إعادة إرسال الإيميل.'
      );
    }
    await Promise.all([loadOrdersPage(0), refreshPendingCount()]);
  };

  const resendEmail = async (o: Order) => {
    setSendingId(o.id);
    const sent = await sendConfirmationEmail(o);
    setSendingId(null);
    alert(sent ? 'اتبعت الإيميل بنجاح.' : 'فشل الإرسال — تحقق من إعداد Resend والفانكشن.');
  };

  const deleteOrder = async (id: string, num: string) => {
    if (!window.confirm(`حذف الطلب #${num} نهائياً؟`)) return;
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('orders').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    await Promise.all([loadOrdersPage(0), refreshPendingCount()]);
  };

  const setChannel = (which: 'whatsapp' | 'telegram', on: boolean) =>
    setSettingsForm((p) => {
      const whats = which === 'whatsapp' ? on : p.contactMode !== 'telegram';
      const tele = which === 'telegram' ? on : p.contactMode !== 'whatsapp';
      if (!whats && !tele) return p; // لازم قناة واحدة على الأقل
      return { ...p, contactMode: whats && tele ? 'both' : whats ? 'whatsapp' : 'telegram' };
    });

  const patchCategory = (idx: number, patch: Partial<CategoryDef>) =>
    setSettingsForm((p) => ({
      ...p,
      categories: p.categories.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));

  const addCategory = () =>
    setSettingsForm((p) => ({
      ...p,
      categories: [...p.categories, { id: '', nameAr: '', nameEn: '', icon: 'LayoutGrid' }],
    }));

  const removeCategory = (idx: number) => {
    if (!window.confirm('حذف هذا التصنيف من الفلتر؟ القوالب المرتبطة به لن تظهر تحته.')) return;
    setSettingsForm((p) => ({ ...p, categories: p.categories.filter((_, i) => i !== idx) }));
  };

  const patchPlatform = (idx: number, patch: Partial<PlatformDef>) =>
    setSettingsForm((p) => ({
      ...p,
      platforms: p.platforms.map((pl, i) => (i === idx ? { ...pl, ...patch } : pl)),
    }));

  const addPlatform = () =>
    setSettingsForm((p) => ({ ...p, platforms: [...p.platforms, { id: '', label: '' }] }));

  const removePlatform = (idx: number) => {
    if (!window.confirm('حذف هذه المنصة من الفلتر؟ القوالب المرتبطة بها لن تظهر تحتها.')) return;
    setSettingsForm((p) => ({ ...p, platforms: p.platforms.filter((_, i) => i !== idx) }));
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg('');
    if (settingsForm.contactMode !== 'telegram' && !settingsForm.whatsappNumber.trim()) {
      setSettingsMsg('دخل رقم الواتساب الأول (مفعّل بدون رقم).');
      return;
    }
    if (settingsForm.contactMode !== 'whatsapp' && !settingsForm.telegramUsername.trim()) {
      setSettingsMsg('دخل يوزر التليجرام الأول (مفعّل بدون يوزر).');
      return;
    }
    // Validate + normalize taxonomy before saving
    const cleanCats = settingsForm.categories.map((c) => ({
      id: c.id.trim().toLowerCase(),
      nameAr: c.nameAr.trim(),
      nameEn: c.nameEn.trim(),
      icon: c.icon.trim() || 'LayoutGrid',
    }));
    if (cleanCats.length === 0) {
      setSettingsMsg('لازم تصنيف واحد على الأقل في المتجر.');
      return;
    }
    const catIds = new Set<string>();
    for (const c of cleanCats) {
      if (!/^[a-z0-9-]+$/.test(c.id)) {
        setSettingsMsg(`معرف التصنيف «${c.id || '(فارغ)'}» لازم حروف إنجليزية صغيرة أو أرقام أو شرطة فقط.`);
        return;
      }
      if (!c.nameAr) {
        setSettingsMsg('كل تصنيف لازم له اسم بالعربية.');
        return;
      }
      if (catIds.has(c.id)) {
        setSettingsMsg(`معرف التصنيف «${c.id}» مكرر.`);
        return;
      }
      catIds.add(c.id);
    }
    const cleanPlats = settingsForm.platforms.map((p) => ({
      id: p.id.trim(),
      label: p.label.trim(),
    }));
    if (cleanPlats.length === 0) {
      setSettingsMsg('لازم منصة واحدة على الأقل في المتجر.');
      return;
    }
    const platIds = new Set<string>();
    for (const p of cleanPlats) {
      if (!p.id || !p.label) {
        setSettingsMsg('كل منصة لازم لها معرف وتسمية.');
        return;
      }
      if (platIds.has(p.id)) {
        setSettingsMsg(`معرف المنصة «${p.id}» مكرر.`);
        return;
      }
      platIds.add(p.id);
    }
    const cleaned: StoreSettings = { ...settingsForm, categories: cleanCats, platforms: cleanPlats };
    setSettingsForm(cleaned);
    setSavingSettings(true);
    try {
      await saveStoreSettings(cleaned);
      setSettingsMsg('تم حفظ الإعدادات — ظهرت فوراً في المتجر.');
    } catch (err: any) {
      setSettingsMsg(err?.message || 'فشل الحفظ');
    } finally {
      setSavingSettings(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center" dir="rtl">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!adminEmail) {
    const locked = lockInfo.lockUntil > Date.now();
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4" dir="rtl">
        <form onSubmit={handleLogin} className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-xl p-8 space-y-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-black text-[#0b132b] font-tajawal">gplify.</div>
            <h1 className="text-sm font-bold text-slate-600">تسجيل دخول المالك</h1>
          </div>
          {!connected && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              الاتصال بقاعدة البيانات غير مضبوط. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env وأعد التشغيل.
            </p>
          )}
          {locked && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5 text-center font-bold" role="alert">
              الدخول موقوف لمدة {fmtLockRemaining(lockInfo.lockUntil - Date.now())} دقيقة بعد 3 محاولات خاطئة
            </p>
          )}
          <div>
            <label htmlFor="admin-email" className={labelCls}>البريد الإلكتروني</label>
            <input
              id="admin-email"
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className={`${inputCls} font-mono`}
              placeholder="admin@example.com"
              dir="ltr"
              autoComplete="username"
              disabled={locked}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className={labelCls}>كلمة المرور</label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={locked}
            />
          </div>
          {loginError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5" role="alert">{loginError}</p>
          )}
          <button type="submit" disabled={loggingIn || locked} className={`${btnPrimary} w-full justify-center py-3`}>
            {loggingIn ? 'جاري تسجيل الدخول...' : locked ? 'الدخول موقوف مؤقتاً' : 'دخول اللوحة'}
          </button>
          <a href="/" className="block text-center text-xs text-slate-500 hover:text-[#0b132b]">العودة للمتجر</a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0b132b]" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black font-tajawal">gplify.</span>
            <span className="text-xs bg-[#0b132b] text-white px-2 py-0.5 rounded-md font-bold">لوحة التحكم</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-[11px] text-slate-500 font-mono max-w-[180px] truncate" dir="ltr" title={adminEmail}>{adminEmail}</span>
            <button onClick={loadAll} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer" title="تحديث البيانات">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <a href="/" className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 inline-flex items-center gap-1.5">
              <span>عرض الموقع</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button onClick={handleLogout} className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-700 hover:border-red-200 inline-flex items-center gap-1.5 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-2 pb-3">
          <button
            onClick={() => setTab('themes')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 ${
              tab === 'themes' ? 'bg-[#0b132b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>الثيمات ({themes.length})</span>
          </button>
          <button
            onClick={() => setTab('coupons')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 ${
              tab === 'coupons' ? 'bg-[#0b132b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>الكوبونات ({coupons.length})</span>
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 ${
              tab === 'orders' ? 'bg-[#0b132b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>الطلبات ({pendingCount} معلق{ordersTotal !== null ? ` • ${ordersTotal} كلي` : ''})</span>
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 ${
              tab === 'settings' ? 'bg-[#0b132b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>الإعدادات</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {!connected && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl flex items-center gap-2" role="alert">
            <Database className="w-4 h-4 shrink-0" />
            <span>الاتصال بقاعدة البيانات غير مضبوط. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env وأعد التشغيل.</span>
          </div>
        )}
        {listError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl" role="alert">{listError}</div>
        )}

        {tab === 'themes' && (
          <section className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو المعرّف..."
                  className={`${inputCls} pr-9`}
                  aria-label="بحث في الثيمات"
                />
              </div>
              <button onClick={openNew} className={btnPrimary}>
                <Plus className="w-4 h-4" />
                <span>إضافة ثيم جديد</span>
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <form onSubmit={handleSaveTheme} className="bg-white rounded-2xl border-2 border-[#0b132b] p-6 space-y-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">{editingId ? 'تعديل الثيم' : 'إضافة ثيم جديد'}</h2>
                  <button type="button" onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer" aria-label="إغلاق النموذج">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} htmlFor="f-title">اسم القالب (عربي) *</label>
                    <input id="f-title" className={inputCls} value={form.title} onChange={(e) => set({ title: e.target.value })} required />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-titleEn">الاسم الإنجليزي</label>
                    <input id="f-titleEn" className={inputCls} value={form.titleEn} onChange={(e) => set({ titleEn: e.target.value })} dir="ltr" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-slug">الرابط المختصر (slug) *</label>
                    <input id="f-slug" className={inputCls} value={form.slug} onChange={(e) => set({ slug: e.target.value })} dir="ltr" placeholder="astra-pro" />
                    <p className="text-[11px] text-slate-400 mt-1">يظهر في رابط صفحة القالب بعد /theme/ — غيّره بحذر لو الرابط متشير.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} htmlFor="f-price">السعر (ج.م)</label>
                      <input id="f-price" type="number" min="0" step="1" className={inputCls} value={form.price} onChange={(e) => set({ price: e.target.value })} dir="ltr" />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="f-originalPrice">السعر قبل الخصم (ج.م)</label>
                      <input id="f-originalPrice" type="number" min="0" step="1" className={inputCls} value={form.originalPrice} onChange={(e) => set({ originalPrice: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className={labelCls}>التصنيفات * (اختار واحد أو أكتر — الأول هو الأساسي)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {settingsForm.categories.map((c) => {
                        const Icon = resolveCategoryIcon(c.icon);
                        const checked = form.categories.includes(c.id);
                        const isPrimary = form.categories[0] === c.id;
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                              checked
                                ? 'bg-[#0b132b] text-white border-[#0b132b]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleFormCategory(c.id)}
                              className="w-4 h-4 rounded accent-white cursor-pointer"
                            />
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1">{c.nameAr}</span>
                            {isPrimary && checked && (
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">أساسي</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">تعديل التصنيفات نفسها من تبويب الإعدادات.</p>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-categoryNameAr">اسم التصنيف بالعربية</label>
                    <input id="f-categoryNameAr" className={inputCls} value={form.categoryNameAr} onChange={(e) => set({ categoryNameAr: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <span className={labelCls}>المنصات * (اختار واحدة أو أكتر — الأولى هي الأساسية)</span>
                    <div className="flex flex-wrap gap-2">
                      {settingsForm.platforms.map((p) => {
                        const checked = form.platforms.includes(p.id);
                        const isPrimary = form.platforms[0] === p.id;
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                              checked
                                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleFormPlatform(p.id)}
                              className="w-4 h-4 rounded accent-white cursor-pointer"
                            />
                            <span dir="ltr">{p.label}</span>
                            {isPrimary && checked && (
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">أساسية</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-license">نوع الترخيص (اختياري)</label>
                    <select id="f-license" className={inputCls} value={form.gplLicenseType} onChange={(e) => set({ gplLicenseType: e.target.value })}>
                      <option value="">— بدون ترخيص (يُخفى من صفحة الثيم) —</option>
                      {LICENSE_OPTIONS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-badge">شارة الثيم (اختياري)</label>
                    <select id="f-badge" className={inputCls} value={form.badge} onChange={(e) => set({ badge: e.target.value })}>
                      {BADGE_OPTIONS.map((b) => (
                        <option key={b.id} value={b.id}>{b.nameAr}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">تظهر كشارة ملونة على كارت الثيم وفي صفحة الثيم.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls} htmlFor="f-rating">التقييم</label>
                      <input id="f-rating" type="number" min="0" max="5" step="0.1" className={inputCls} value={form.rating} onChange={(e) => set({ rating: e.target.value })} dir="ltr" />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="f-reviews">عدد التقييمات</label>
                      <input id="f-reviews" type="number" min="0" step="1" className={inputCls} value={form.reviewsCount} onChange={(e) => set({ reviewsCount: e.target.value })} dir="ltr" />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="f-downloads">التحميلات</label>
                      <input id="f-downloads" type="number" min="0" step="1" className={inputCls} value={form.downloadsCount} onChange={(e) => set({ downloadsCount: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} htmlFor="f-version">الإصدار</label>
                      <input id="f-version" className={inputCls} value={form.version} onChange={(e) => set({ version: e.target.value })} dir="ltr" />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="f-updated">تاريخ التحديث</label>
                      <input id="f-updated" type="date" className={inputCls} value={form.updatedDate} onChange={(e) => set({ updatedDate: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-fileSize">حجم الملف</label>
                    <input id="f-fileSize" className={inputCls} value={form.fileSize} onChange={(e) => set({ fileSize: e.target.value })} dir="ltr" placeholder="14.2 MB" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-demo">رابط الديمو</label>
                    <input id="f-demo" className={inputCls} value={form.demoUrl} onChange={(e) => set({ demoUrl: e.target.value })} dir="ltr" placeholder="https://..." />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-download">رابط التحميل المباشر (Backblaze ZIP) *</label>
                    <input id="f-download" className={inputCls} value={form.downloadUrl} onChange={(e) => set({ downloadUrl: e.target.value })} dir="ltr" placeholder="https://utfs.io/f/..." />
                    <p className="text-[11px] text-slate-400 mt-1">ارفع ملف الـ ZIP على UploadThing والصق رابط الملف هنا — هو اللي بيتبعت للعميل في الإيميل.</p>
                  </div>
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-short">وصف مختصر</label>
                  <textarea id="f-short" rows={2} className={inputCls} value={form.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="f-desc">الوصف الكامل</label>
                  <textarea id="f-desc" rows={4} className={inputCls} value={form.description} onChange={(e) => set({ description: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} htmlFor="f-thumb">رابط الصورة الرئيسية</label>
                    <input id="f-thumb" className={inputCls} value={form.thumbnail} onChange={(e) => set({ thumbnail: e.target.value })} dir="ltr" placeholder="https://..." />
                    {safeUrl(form.thumbnail) ? (
                      <img src={safeUrl(form.thumbnail)} alt="معاينة" className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200" referrerPolicy="no-referrer" />
                    ) : null}
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-shots">لقطات الشاشة (رابط في كل سطر)</label>
                    <textarea id="f-shots" rows={4} className={inputCls} value={form.screenshots} onChange={(e) => set({ screenshots: e.target.value })} dir="ltr" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-features">المميزات (سطر لكل ميزة)</label>
                    <textarea id="f-features" rows={5} className={inputCls} value={form.features} onChange={(e) => set({ features: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-compat">التوافق (سطر لكل عنصر)</label>
                    <textarea id="f-compat" rows={5} className={inputCls} value={form.compatibility} onChange={(e) => set({ compatibility: e.target.value })} dir="ltr" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-plugins">إضافات مرفقة (سطر لكل إضافة)</label>
                    <textarea id="f-plugins" rows={3} className={inputCls} value={form.includedPlugins} onChange={(e) => set({ includedPlugins: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-tags">وسوم (سطر لكل وسم)</label>
                    <textarea id="f-tags" rows={3} className={inputCls} value={form.tags} onChange={(e) => set({ tags: e.target.value })} dir="ltr" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-changelog">سجل التحديثات (JSON)</label>
                    <textarea id="f-changelog" rows={5} className={`${inputCls} font-mono`} value={form.changelog} onChange={(e) => set({ changelog: e.target.value })} dir="ltr" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-faq">الأسئلة الشائعة (JSON)</label>
                    <textarea id="f-faq" rows={5} className={`${inputCls} font-mono`} value={form.faq} onChange={(e) => set({ faq: e.target.value })} dir="ltr" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => set({ isActive: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#0b132b] cursor-pointer"
                    />
                    <span>ظاهر في المتجر</span>
                  </label>
                </div>

                {formError && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5" role="alert">{formError}</p>
                )}

                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className={btnPrimary}>
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة للكتالوج'}</span>
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer">
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[720px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <th className="text-right font-bold p-3">القالب</th>
                      <th className="text-right font-bold p-3">التصنيف</th>
                      <th className="text-right font-bold p-3">السعر</th>
                      <th className="text-right font-bold p-3">الظهور</th>
                      <th className="text-right font-bold p-3">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredThemes.map((t) => {
                      const active = activeOf(t.id);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {t.thumbnail ? (
                                <img src={t.thumbnail} alt="" className="w-14 h-10 rounded-lg object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-14 h-10 rounded-lg bg-slate-100 border border-slate-200 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-[#0b132b] truncate max-w-[220px]">{t.title}</div>
                                <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{t.id} • v{t.version}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">{t.categoryNameAr}</td>
                          <td className="p-3 font-mono font-bold">${t.price}</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleActive(t)}
                              aria-pressed={active}
                              title={active ? 'إخفاء من المتجر' : 'إظهار في المتجر'}
                              className={`rounded-lg border transition cursor-pointer text-[11px] font-bold px-2.5 py-1.5 ${
                                active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {active ? 'ظاهر' : 'مخفي'}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openEdit(t)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer" title="تعديل" aria-label={`تعديل ${t.title}`}>
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteTheme(t.id, t.title)} className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 cursor-pointer" title="حذف" aria-label={`حذف ${t.title}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredThemes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          {loading ? 'جاري التحميل...' : 'لا توجد ثيمات — أضف أول قالب من الزر بالأعلى'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === 'coupons' && (
          <section className="space-y-4">
            <form onSubmit={handleSaveCoupon} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h2 className="text-sm font-bold">{editingCoupon ? `تعديل كوبون ${editingCoupon}` : 'إضافة كوبون جديد'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls} htmlFor="c-code">الكود *</label>
                  <input id="c-code" className={`${inputCls} font-mono uppercase`} value={couponForm.code} onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value }))} dir="ltr" placeholder="GPL20" disabled={editingCoupon !== null} required />
                </div>
                <div>
                  <label className={labelCls} htmlFor="c-percent">نسبة الخصم %</label>
                  <input id="c-percent" type="number" min="0" max="100" className={inputCls} value={couponForm.discountPercent} onChange={(e) => setCouponForm((p) => ({ ...p, discountPercent: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="c-min">حد أدنى (ج.م) — 0 للكل</label>
                  <input id="c-min" type="number" min="0" className={inputCls} value={couponForm.minAmount} onChange={(e) => setCouponForm((p) => ({ ...p, minAmount: e.target.value }))} dir="ltr" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input type="checkbox" checked={couponForm.isActive} onChange={(e) => setCouponForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-[#0b132b] cursor-pointer" />
                    <span>مفعّل</span>
                  </label>
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="c-desc">الوصف</label>
                <input id="c-desc" className={inputCls} value={couponForm.description} onChange={(e) => setCouponForm((p) => ({ ...p, description: e.target.value }))} placeholder="خصم 20% على إجمالي الطلب" />
              </div>
              {couponError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5" role="alert">{couponError}</p>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={savingCoupon} className={btnPrimary}>
                  <Save className="w-4 h-4" />
                  <span>{savingCoupon ? 'جاري الحفظ...' : editingCoupon ? 'حفظ التعديلات' : 'إضافة الكوبون'}</span>
                </button>
                {editingCoupon && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCoupon(null);
                      setCouponForm(emptyCouponForm());
                      setCouponError('');
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>
            </form>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {coupons.map((c) => (
                <div key={c.code} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm bg-slate-900 text-white px-2.5 py-1 rounded-lg" dir="ltr">{c.code}</span>
                    <div className="text-xs text-slate-500">
                      <span className="font-bold text-[#0b132b]">{c.discountPercent}%</span>
                      {c.description && <span> — {c.description}</span>}
                      {c.minAmount ? <span> — حد أدنى ${c.minAmount}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingCoupon(c.code);
                        setCouponForm({
                          code: c.code,
                          discountPercent: String(c.discountPercent),
                          description: c.description,
                          minAmount: String(c.minAmount ?? 0),
                          isActive: true,
                        });
                        setCouponError('');
                        window.scrollTo({ top: 0 });
                      }}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                      title="تعديل"
                      aria-label={`تعديل ${c.code}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 cursor-pointer"
                      title="حذف"
                      aria-label={`حذف ${c.code}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400">لا توجد كوبونات — أضف أول كوبون من النموذج بالأعلى</p>
              )}
            </div>
          </section>
        )}

        {tab === 'orders' && (
          <section className="space-y-4">
            {ordersError && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl" role="alert">
                {ordersError}
              </div>
            )}
            {orders.length === 0 && !ordersError && (
              <p className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                {loading ? 'جاري التحميل...' : 'لا توجد طلبات بعد — أي طلب جديد بيظهر هنا فور تأكيده'}
              </p>
            )}
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm" dir="ltr">#{o.orderNumber}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(o.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                    o.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : o.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : o.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {o.status === 'pending' ? 'بانتظار الدفع'
                      : o.status === 'completed' ? 'مكتمل'
                      : o.status === 'cancelled' ? 'ملغي' : 'قيد التنفيذ'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <strong className="text-[#0b132b]">العميل:</strong> {o.customerName}
                    {' — '}<span className="font-mono" dir="ltr">{o.customerEmail}</span>
                    {o.customerPhone && <>{' — '}<span className="font-mono" dir="ltr">{o.customerPhone}</span></>}
                  </div>
                  <div>
                    <strong className="text-[#0b132b]">الدفع:</strong> {o.paymentMethod === 'instapay' ? 'انستاباي' : 'فودافون كاش'}
                    {o.paymentRef && <>{' — رقم التحويل: '}<strong className="font-mono" dir="ltr">{o.paymentRef}</strong></>}
                    {o.couponCode && <>{' — كوبون: '}<strong className="font-mono" dir="ltr">{o.couponCode}</strong></>}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="px-3 py-2 flex justify-between gap-3 text-xs">
                      <span className="font-bold truncate">{it.themeTitle} <span className="text-slate-400 font-mono">v{it.version}</span></span>
                      <span className="font-mono font-bold shrink-0">{formatCurrency(it.price)}</span>
                    </div>
                  ))}
                  <div className="px-3 py-2 flex justify-between gap-3 text-xs font-extrabold">
                    <span>الإجمالي</span>
                    <span className="font-mono">{formatCurrency(o.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {o.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(o, 'completed')}
                      disabled={sendingId === o.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{sendingId === o.id ? 'جاري التأكيد والإرسال...' : 'تأكيد الدفع وإرسال الملفات'}</span>
                    </button>
                  )}
                  {o.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(o, 'cancelled')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      إلغاء الطلب
                    </button>
                  )}
                  {o.status === 'completed' && (
                    <button
                      onClick={() => resendEmail(o)}
                      disabled={sendingId === o.id}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-60"
                    >
                      {sendingId === o.id ? 'جاري الإرسال...' : 'إعادة إرسال الإيميل'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteOrder(o.id, o.orderNumber)}
                    className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
            {ordersHasMore && (
              <button
                onClick={() => loadOrdersPage(ordersPage + 1, true)}
                disabled={ordersLoadingMore}
                className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold rounded-2xl transition cursor-pointer disabled:opacity-60"
              >
                {ordersLoadingMore
                  ? 'جاري تحميل المزيد...'
                  : `عرض المزيد (${orders.length}${ordersTotal !== null ? ` من ${ordersTotal}` : ''})`}
              </button>
            )}
          </section>
        )}

        {tab === 'settings' && (
          <section className="space-y-4">
            {/* Sticky save bar — always visible while scrolling settings */}
            <div className="sticky top-[103px] z-20 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#0b132b]">الإعدادات العامة</h2>
                <p className="text-[11px] text-slate-400 truncate">التغييرات بتظهر في المتجر فور الحفظ</p>
              </div>
              <button type="submit" form="admin-settings-form" disabled={savingSettings} className={`${btnPrimary} shrink-0`}>
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Side sub-tabs */}
              <nav className="w-full md:w-52 shrink-0 bg-white rounded-2xl border border-slate-200 p-2 flex md:flex-col flex-row gap-1 overflow-x-auto md:sticky md:top-[196px]" aria-label="أقسام الإعدادات">
                {SETTINGS_NAV.map(({ id, label, Icon }) => {
                  const active = settingsSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSettingsSection(id)}
                      aria-pressed={active}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        active ? 'bg-[#0b132b] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>

              <form id="admin-settings-form" onSubmit={saveSettings} className="flex-1 min-w-0 w-full space-y-4">
              {settingsSection === 'announce' && (
              <SettingsSection n="1" title="شريط الإعلان العلوي" hint="يظهر فوق الهيدر في كل صفحات المتجر — اتحكم في ظهوره ونصه">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.announcement.enabled}
                    onChange={(e) =>
                      setSettingsForm((p) => ({ ...p, announcement: { ...p.announcement, enabled: e.target.checked } }))
                    }
                    className="w-4 h-4 rounded accent-[#0b132b] cursor-pointer"
                  />
                  <span>إظهار الشريط</span>
                </label>
                <div>
                  <label htmlFor="s-ann-text" className={labelCls}>النص (اكتب {'{code}'} مكان كود الخصم المميز)</label>
                  <input
                    id="s-ann-text"
                    className={inputCls}
                    value={settingsForm.announcement.text}
                    onChange={(e) =>
                      setSettingsForm((p) => ({ ...p, announcement: { ...p.announcement, text: e.target.value } }))
                    }
                    placeholder="خصم 20% لفترة محدودة بكود {code} — تسليم فوري عبر البريد الإلكتروني"
                  />
                </div>
                <div>
                  <label htmlFor="s-ann-code" className={labelCls}>الكود المميز (يظهر بخط عريض — سيبه فاضي لو مفيش كود)</label>
                  <input
                    id="s-ann-code"
                    className={`${inputCls} font-mono`}
                    dir="ltr"
                    value={settingsForm.announcement.code}
                    onChange={(e) =>
                      setSettingsForm((p) => ({ ...p, announcement: { ...p.announcement, code: e.target.value } }))
                    }
                    placeholder="GPL20"
                  />
                </div>
                <div>
                  <span className={labelCls}>معاينة حية</span>
                  <div className="rounded-xl overflow-hidden border border-slate-800">
                    <div className="bg-[#0b132b] text-white text-xs py-1.5 px-4 text-center">
                      {settingsForm.announcement.enabled && settingsForm.announcement.text.trim() ? (
                        <span className="font-medium text-slate-200">
                          {(() => {
                            const t = settingsForm.announcement.text;
                            const c = settingsForm.announcement.code.trim();
                            if (!c) return t.replace('{code}', '').replace(/\s{2,}/g, ' ').trim();
                            const parts = t.split('{code}');
                            if (parts.length === 1) {
                              return (
                                <>
                                  {t} <strong className="text-white font-mono">{c}</strong>
                                </>
                              );
                            }
                            return (
                              <>
                                {parts[0]}
                                <strong className="text-white font-mono">{c}</strong>
                                {parts.slice(1).join(c)}
                              </>
                            );
                          })()}
                        </span>
                      ) : (
                        <span className="text-slate-500">الشريط مخفي — لن يظهر في المتجر</span>
                      )}
                    </div>
                  </div>
                </div>
              </SettingsSection>
              )}
              {settingsSection === 'contact' && (
              <SettingsSection n="2" title="قنوات التواصل مع العملاء" hint="اختار واحدة أو الاتنين — تظهر للعميل بعد إتمام الطلب">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border space-y-2 ${settingsForm.contactMode !== 'telegram' ? 'border-[#0b132b] bg-slate-50' : 'border-slate-200'}`}>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.contactMode !== 'telegram'}
                        onChange={(e) => setChannel('whatsapp', e.target.checked)}
                        className="w-4 h-4 rounded accent-[#0b132b] cursor-pointer"
                      />
                      <span>تفعيل الواتساب</span>
                    </label>
                    {settingsForm.contactMode !== 'telegram' && (
                      <input
                        id="s-whatsapp"
                        className={`${inputCls} font-mono`}
                        dir="ltr"
                        value={settingsForm.whatsappNumber}
                        onChange={(e) => setSettingsForm((p) => ({ ...p, whatsappNumber: e.target.value }))}
                        placeholder="201012345678"
                      />
                    )}
                  </div>
                  <div className={`p-3 rounded-xl border space-y-2 ${settingsForm.contactMode !== 'whatsapp' ? 'border-[#0b132b] bg-slate-50' : 'border-slate-200'}`}>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.contactMode !== 'whatsapp'}
                        onChange={(e) => setChannel('telegram', e.target.checked)}
                        className="w-4 h-4 rounded accent-[#0b132b] cursor-pointer"
                      />
                      <span>تفعيل التليجرام</span>
                    </label>
                    {settingsForm.contactMode !== 'whatsapp' && (
                      <input
                        id="s-telegram"
                        className={`${inputCls} font-mono`}
                        dir="ltr"
                        value={settingsForm.telegramUsername}
                        onChange={(e) => setSettingsForm((p) => ({ ...p, telegramUsername: e.target.value }))}
                        placeholder="gplify_support"
                      />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  الواتساب: الرقم بالكود الدولي بدون + (مثال: 201012345678) — التليجرام: اليوزر بدون @.
                </p>
              </SettingsSection>
              )}
              {settingsSection === 'cats' && (
              <SettingsSection n="3" title="تصنيفات المتجر" hint="أزرار الفلتر في الرئيسية والكتالوج — زر «جميع الثيمات» يظهر تلقائياً. تغيير معرف تصنيف عليه قوالب سيخفيها من الفلتر حتى تحدث القوالب.">
                {settingsForm.categories.map((c, idx) => {
                  const Icon = resolveCategoryIcon(c.icon);
                  return (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className={labelCls}>الاسم بالعربية *</label>
                          <input
                            className={inputCls}
                            value={c.nameAr}
                            onChange={(e) => patchCategory(idx, { nameAr: e.target.value })}
                            placeholder="متاجر إلكترونية"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>الاسم بالإنجليزية</label>
                          <input
                            className={`${inputCls} font-mono`}
                            dir="ltr"
                            value={c.nameEn}
                            onChange={(e) => patchCategory(idx, { nameEn: e.target.value })}
                            placeholder="E-Commerce"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>المعرف (id) — إنجليزي صغير فقط *</label>
                          <input
                            className={`${inputCls} font-mono`}
                            dir="ltr"
                            value={c.id}
                            onChange={(e) => patchCategory(idx, { id: e.target.value })}
                            placeholder="ecommerce"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>الأيقونة</label>
                          <div className="flex items-center gap-2">
                            <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0" title={c.icon}>
                              <Icon className="w-4 h-4 text-[#0b132b]" />
                            </span>
                            <select
                              className={`${inputCls} font-mono`}
                              dir="ltr"
                              value={CATEGORY_ICON_OPTIONS.some((o) => o.value === c.icon) ? c.icon : 'LayoutGrid'}
                              onChange={(e) => patchCategory(idx, { icon: e.target.value })}
                              aria-label={`أيقونة ${c.nameAr || 'التصنيف'}`}
                            >
                              {CATEGORY_ICON_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.value} — {o.labelAr}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCategory(idx)}
                        className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        حذف هذا التصنيف
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addCategory}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة تصنيف</span>
                </button>
              </SettingsSection>
              )}
              {settingsSection === 'plats' && (
              <SettingsSection n="4" title="منصات المتجر" hint="تبويبات المنصة في الفلتر — تبويب «كافة المنصات» يظهر تلقائياً. المعرف يجب أن يطابق قيمة المنصة المحفوظة في القوالب (مثال: WordPress).">
                {settingsForm.platforms.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className={labelCls}>التسمية (تظهر للعميل) *</label>
                        <input
                          className={inputCls}
                          value={p.label}
                          onChange={(e) => patchPlatform(idx, { label: e.target.value })}
                          placeholder="WordPress"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>المعرف (id) *</label>
                        <input
                          className={`${inputCls} font-mono`}
                          dir="ltr"
                          value={p.id}
                          onChange={(e) => patchPlatform(idx, { id: e.target.value })}
                          placeholder="WordPress"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePlatform(idx)}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      حذف هذه المنصة
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPlatform}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة منصة</span>
                </button>
              </SettingsSection>
              )}
              {settingsSection === 'payment' && (
              <SettingsSection n="5" title="أرقام استلام الدفع" hint="بتظهر للعميل في الشيك أوت">
                <div>
                  <label htmlFor="s-vodafone" className={labelCls}>رقم محفظة فودافون كاش</label>
                  <input
                    id="s-vodafone"
                    className={`${inputCls} font-mono`}
                    dir="ltr"
                    value={settingsForm.vodafoneNumber}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, vodafoneNumber: e.target.value }))}
                    placeholder="01000000000"
                  />
                </div>
                <div>
                  <label htmlFor="s-instapay" className={labelCls}>عنوان انستاباي (IPA)</label>
                  <input
                    id="s-instapay"
                    className={`${inputCls} font-mono`}
                    dir="ltr"
                    value={settingsForm.instapayAddress}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, instapayAddress: e.target.value }))}
                    placeholder="gplify@instapay"
                  />
                </div>
              </SettingsSection>
              )}

              {settingsMsg && (
                <p className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2.5" role="status">
                  {settingsMsg}
                </p>
              )}
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

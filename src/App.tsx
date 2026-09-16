import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HomeSeoSections } from './components/HomeSeoSections';
import { CategoryFilter } from './components/CategoryFilter';
import { ThemeCard, formatCurrency } from './components/ThemeCard';
import { Footer } from './components/Footer';

// Lightweight inline skeletons/states (no CatalogPage import — keeps initial JS small)
function InlineGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-[1.25rem] border border-slate-200/80 overflow-hidden">
          <div className="aspect-[590/300] bg-slate-100 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-3/4 rounded-md bg-slate-100 animate-pulse" />
            <div className="h-3 w-full rounded-md bg-slate-100 animate-pulse" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-6 w-20 rounded-md bg-slate-100 animate-pulse" />
              <div className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
function InlineConnectState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
      <h3 className="text-base font-bold text-[#0b132b]">اربط المتجر بقاعدة البيانات لعرض القوالب</h3>
      <p className="text-xs text-slate-500">محتوى المتجر يُدار بالكامل من Supabase.</p>
    </div>
  );
}

// Route-level code splitting: heavy pages load on demand only (mobile initial JS -60%)
// AdminPanel (1763 lines) + Checkout + ProductDetail were inflating the 613KB initial bundle.
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./components/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./components/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessModal = lazy(() => import('./components/OrderSuccessModal').then(m => ({ default: m.OrderSuccessModal })));
const DownloadPage = lazy(() => import('./components/DownloadPage').then(m => ({ default: m.DownloadPage })));
const CatalogPage = lazy(() => import('./components/CatalogPage').then(m => ({ default: m.CatalogPage })));
const ShopifyPage = lazy(() => import('./components/ShopifyPage').then(m => ({ default: m.ShopifyPage })));
const ContactPage = lazy(() => import('./components/ContactPage').then(m => ({ default: m.ContactPage })));
const PoliciesPage = lazy(() => import('./components/PoliciesPage').then(m => ({ default: m.PoliciesPage })));
const GPLInfoModal = lazy(() => import('./components/GPLInfoModal').then(m => ({ default: m.GPLInfoModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

function PageFallback() {
  return <InlineGridSkeleton />;
}

function isAdminRoute() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  return path === '/admin122' || window.location.hash === '#/admin122';
}

type StoreView = 'home' | 'catalog' | 'shopify' | 'contact' | 'terms' | 'privacy' | 'product' | 'cart' | 'checkout' | 'order-success' | 'download';

function parseRoute(): { view: StoreView; slug?: string } {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  if (path === '/download') return { view: 'download' };
  if (path === '/catalog') return { view: 'catalog' };
  if (path === '/shopify') return { view: 'shopify' };
  if (path === '/contact') return { view: 'contact' };
  if (path === '/terms') return { view: 'terms' };
  if (path === '/privacy') return { view: 'privacy' };
  if (path === '/cart') return { view: 'cart' };
  if (path === '/checkout') return { view: 'checkout' };
  const m = path.match(/^\/theme\/([^/]+)$/);
  if (m) {
    try {
      const slug = decodeURIComponent(m[1]).trim();
      if (slug) return { view: 'product', slug };
    } catch {}
  }
  return { view: 'home' };
}

function pushUrl(url: string) {
  try {
    window.history.pushState(null, '', url);
  } catch {}
}

import { GPLTheme, CartItem, Coupon, Order, ThemeCategory } from './types';
import { fetchThemes, fetchCoupons, themeCategories, themePlatforms } from './lib/store';
import { fetchPublicSettings, DEFAULT_SETTINGS, type StoreSettings } from './lib/settings';
import { isSupabaseConnected } from './lib/supabase';
import { 
  ShoppingBag, 
  Check, 
  ArrowLeft, 
  Layers, 
  ShieldCheck, 
  Filter, 
  Eye, 
  Star, 
  TrendingUp,
  MailCheck,
  Zap,
  Search
} from 'lucide-react';

const CART_STORAGE_KEY = 'gpl_cart_items';

export default function App() {
  if (isAdminRoute()) {
    return (
      <Suspense fallback={<InlineGridSkeleton />}>
        <AdminPanel />
      </Suspense>
    );
  }

  // Navigation & View State (synced with real URLs: /catalog, /cart, /checkout, /theme/:slug)
  const [currentView, setCurrentView] = useState<StoreView>(() => parseRoute().view);
  const [pendingSlug, setPendingSlug] = useState<string | null>(() => parseRoute().slug ?? null);
  const [slugNotFound, setSlugNotFound] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'price-asc' | 'price-desc'>('popular');

  // Cart State with LocalStorage Persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Live store data (Supabase only — no demo content)
  const [themes, setThemes] = useState<GPLTheme[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [themesLoading, setThemesLoading] = useState(true);
  const [themesError, setThemesError] = useState('');
  const [storeConnected, setStoreConnected] = useState(false);

  const loadStoreData = useCallback(async (force = false) => {
    if (!isSupabaseConnected()) {
      setStoreConnected(false);
      setThemesLoading(false);
      return;
    }
    setStoreConnected(true);
    setThemesLoading(true);
    setThemesError('');
    try {
      // Cached for 5 min (see lib/store + lib/settings) — no network on every mount.
      const opts = force ? { force: true as const } : undefined;
      const [liveThemes, liveCoupons] = await Promise.all([fetchThemes(opts), fetchCoupons(opts)]);
      setThemes(liveThemes);
      setCoupons(liveCoupons);
      try {
        setSettings(await fetchPublicSettings(opts));
      } catch {}
    } catch (e) {
      console.error(e);
      setThemesError('تعذر تحميل الكتالوج من قاعدة البيانات. تحقق من الاتصال ثم أعد المحاولة.');
    } finally {
      setThemesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Resolve shared theme URLs (/theme/:slug) once the catalog loads
  useEffect(() => {
    if (!pendingSlug || themesLoading) return;
    const found = themes.find((t) => t.slug === pendingSlug);
    if (found) {
      setSelectedThemeId(found.id);
      setSlugNotFound(false);
    } else {
      setSelectedThemeId(null);
      setSlugNotFound(true);
    }
    setPendingSlug(null);
  }, [pendingSlug, themes, themesLoading]);

  // Browser back/forward across real URLs
  useEffect(() => {
    const onPop = () => {
      const route = parseRoute();
      if (route.view === 'product' && route.slug) {
        setSelectedThemeId(null);
        setSlugNotFound(false);
        setPendingSlug(route.slug);
        setCurrentView('product');
      } else {
        setPendingSlug(null);
        setSlugNotFound(false);
        setCurrentView(route.view);
      }
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Modals
  const [isGPLModalOpen, setIsGPLModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string } | null>(null);

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Trigger brief toast notification
  const showToast = (title: string, subtitle?: string) => {
    setToastMessage({ title, subtitle });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Cart Actions
  const handleAddToCart = (theme: GPLTheme) => {
    const existingIndex = cart.findIndex((item) => item.theme.id === theme.id);
    if (existingIndex > -1) {
      showToast('القالب موجود بالفعل في سلة التسوق', theme.title);
      return;
    }

    const newItem: CartItem = {
      theme,
      licenseType: 'unlimited',
      price: theme.price,
    };
    setCart((prev) => [...prev, newItem]);
    showToast('تمت إضافة القالب إلى سلة التسوق', theme.title);
  };

  const handleRemoveFromCart = (themeId: string) => {
    setCart((prev) => prev.filter((item) => item.theme.id !== themeId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Instant Buy Shortcut
  const handleInstantBuy = (theme: GPLTheme) => {
    // If not in cart, add it
    if (!cart.some((item) => item.theme.id === theme.id)) {
      setCart((prev) => [...prev, { theme, licenseType: 'unlimited', price: theme.price }]);
    }
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation Handler — every view (and every theme) has its own shareable URL
  const handleNavigate = (view: StoreView, themeId?: string) => {
    if (view === 'product' && themeId) {
      const t = themes.find((x) => x.id === themeId);
      if (!t) {
        setCurrentView('catalog');
        pushUrl('/catalog');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setSelectedThemeId(themeId);
      setSlugNotFound(false);
      setCurrentView('product');
      pushUrl(`/theme/${t.slug}`);
    } else {
      setCurrentView(view);
      pushUrl(view === 'home' ? '/' : `/${view}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered and Sorted Themes List
  const filteredThemes = useMemo(() => {
    let list = [...themes];

    // Filter by category (a theme matches if ANY of its categories match)
    if (selectedCategory !== 'all') {
      list = list.filter((t) => themeCategories(t).includes(selectedCategory));
    }

    // Filter by platform (a theme matches if ANY of its platforms match)
    if (selectedPlatform !== 'all') {
      list = list.filter((t) => themePlatforms(t).includes(selectedPlatform));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.titleEn.toLowerCase().includes(q) ||
          t.shortDescription.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.categoryNameAr.toLowerCase().includes(q)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'popular':
        list.sort((a, b) => b.downloadsCount - a.downloadsCount);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());
        break;
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
    }

    return list;
  }, [themes, selectedCategory, selectedPlatform, searchQuery, sortBy]);

  const heroStats = useMemo(() => {
    if (themes.length === 0) return null;
    return {
      themesCount: themes.length,
      downloadsTotal: themes.reduce((s, t) => s + t.downloadsCount, 0),
      avgRating: themes.reduce((s, t) => s + t.rating, 0) / themes.length,
    };
  }, [themes]);

  // Selected Theme for Product Detail Page
  const currentSelectedTheme = useMemo(() => {
    if (!selectedThemeId) return null;
    return themes.find((t) => t.id === selectedThemeId) || null;
  }, [themes, selectedThemeId]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedPlatform('all');
    setSearchQuery('');
  };

  const renderThemeGrid = (emptyTitle: string, emptyHint: string, resetLabel: string) => {
    if (themesLoading) return <InlineGridSkeleton />;
    if (!storeConnected) return <InlineConnectState />;
    if (themesError) return (
      <div className="bg-white rounded-2xl border border-red-200 p-12 text-center space-y-4" role="alert">
        <h3 className="text-base font-bold text-[#0b132b]">حدث خطأ أثناء تحميل الكتالوج</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">{themesError}</p>
        <button onClick={() => loadStoreData(true)} className="px-5 py-2.5 min-h-[44px] bg-[#0b132b] text-white text-xs font-bold rounded-xl cursor-pointer">إعادة المحاولة</button>
      </div>
    );
    if (filteredThemes.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#0b132b]">{emptyTitle}</h3>
          <p className="text-xs text-slate-500">{emptyHint}</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-[#0b132b] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            {resetLabel}
          </button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            onSelectTheme={(t) => handleNavigate('product', t.id)}
            onAddToCart={handleAddToCart}
            onInstantBuy={handleInstantBuy}
            isInCart={cart.some((item) => item.theme.id === theme.id)}
          />
        ))}
      </div>
    );
  };

  // Per-page titles + canonical/hreflang/OG (each view has its own shareable URL)
  useEffect(() => {
    // Product head يُدار من ProductDetailPage (يتضمن og:image والتواريخ) — لا نoverride هنا.
    if (currentView === 'product' && currentSelectedTheme) return;
    (async () => {
      try {
        const { setStaticHead } = await import('./lib/seo');
        if (currentView === 'catalog') {
          setStaticHead({
            title: 'تحميل قوالب GPL | كتالوج ثيمات ووردبريس وشوبيفاي الأصلية - gplify',
            description: 'تصفح كتالوج قوالب GPL الأصلية: ثيمات ووردبريس GPL، قوالب ووكومرس، ثيمات شوبيفاي GPL وقوالب Shopify — معاينة حية وتحميل فوري بترخيص GPL قانوني.',
            path: '/catalog',
          });
        } else if (currentView === 'shopify') {
          setStaticHead({
            title: 'ثيمات شوبيفاي GPL | تحميل قوالب Shopify الأصلية بسعر مخفض - gplify',
            description: 'تحميل ثيمات شوبيفاي وقوالب Shopify الأصلية بنسخ نظيفة بسعر رخيص بديل النسخ المجانية — تسليم فوري عبر البريد والدفع فودافون كاش وانستاباي.',
            path: '/shopify',
          });
        } else if (currentView === 'cart') {
          setStaticHead({ title: 'سلة التسوق | gplify', description: 'سلة التسوق — راجع قوالب GPL قبل إتمام الطلب.', path: '/cart' });
        } else if (currentView === 'contact') {
          setStaticHead({ title: 'تواصل معنا | gplify', description: 'تواصل مع gplify عبر صفحة الفيسبوك الرسمية للاستفسارات والدعم الفني.', path: '/contact' });
        } else if (currentView === 'terms') {
          setStaticHead({ title: 'شروط الاستخدام | gplify', description: 'شروط استخدام متجر gplify: الترخيص والتسليم الرقمي والدفع والاسترداد.', path: '/terms' });
        } else if (currentView === 'privacy') {
          setStaticHead({ title: 'سياسة الخصوصية | gplify', description: 'سياسة الخصوصية لمتجر gplify: البيانات التي نجمعها وكيف نستخدمها وحقوقك.', path: '/privacy' });
        } else if (currentView === 'checkout') {
          setStaticHead({ title: 'إتمام الطلب | gplify', description: 'إتمام طلب قوالب GPL — تسليم فوري لملفات ZIP عبر البريد الإلكتروني.', path: '/checkout' });
        } else if (currentView === 'download') {
          setStaticHead({ title: 'تحميل ملفك | gplify', description: 'تحميل ملفك من gplify — رابط آمن لمرة واحدة.', path: '/download' });
        } else {
          setStaticHead({
            title: 'ثيمات شوبيفاي | تحميل قوالب Shopify الأصلية بسعر مخفض - gplify',
            description: 'تحميل ثيمات شوبيفاي وقوالب Shopify الأصلية، وثيمات ووردبريس وقوالب ووكومرس — نسخ نظيفة 100% وتسليم فوري عبر البريد بالجنيه المصري.',
            path: '/',
          });
        }
      } catch {
        if (currentView === 'catalog') document.title = 'تحميل قوالب GPL | كتالوج ثيمات ووردبريس وشوبيفاي - gplify';
        else if (currentView === 'shopify') document.title = 'ثيمات شوبيفاي GPL | تحميل قوالب شوبيفاي وقوالب Shopify - gplify';
        else if (currentView === 'cart') document.title = 'سلة التسوق | gplify';
        else if (currentView === 'contact') document.title = 'تواصل معنا | gplify';
        else if (currentView === 'terms') document.title = 'شروط الاستخدام | gplify';
        else if (currentView === 'privacy') document.title = 'سياسة الخصوصية | gplify';
        else if (currentView === 'checkout') document.title = 'إتمام الطلب | gplify';
        else if (currentView === 'download') document.title = 'تحميل ملفك | gplify';
        else document.title = 'تحميل قوالب GPL الأصلية | متجر ثيمات ووردبريس GPL بالعربي - gplify';
      }
    })();
  }, [currentView, currentSelectedTheme]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0b132b] font-tajawal antialiased">
      {/* Top Navbar */}
      <Navbar
        cartCount={cart.length}
        onOpenCart={() => handleNavigate('cart')}
        onNavigate={handleNavigate}
        onOpenGPLInfo={() => setIsGPLModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        themes={themes}
        announcement={settings.announcement}
        platforms={settings.platforms}
        selectedPlatform={selectedPlatform}
        onSelectPlatform={(id) => setSelectedPlatform(id)}
      />

      {/* Main Views — lazy pages stream in without blocking home LCP */}
      <main className="flex-1">
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><InlineGridSkeleton /></div>}>
        {/* VIEW: SINGLE-USE DOWNLOAD (/download?token=...) */}
        {currentView === 'download' && (
          <DownloadPage onBackToStore={() => handleNavigate('catalog')} />
        )}

        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <HeroSection
              onExploreClick={() => handleNavigate('catalog')}
              onOpenGPLModal={() => setIsGPLModalOpen(true)}
              stats={heroStats}
              platforms={settings.platforms}
            />

            {/* Featured & Categorized Themes Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-full px-3 py-1 mb-2.5">
                    <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>الأكثر مبيعاً هذا الشهر</span>
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-tajawal">
                    اختار من القوالب الأكثر مبيعاً
                  </h2>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {themes.length > 0 ? `${themes.length} قالب جاهز للتحميل الفوري` : 'كتالوج القوالب'}
                  </p>
                </div>

                <button
                  id="home-view-all-btn"
                  onClick={() => handleNavigate('catalog')}
                  className="group inline-flex items-center gap-1.5 min-h-[44px] text-sm font-extrabold text-[#1e3a8a] hover:text-[#0b132b] transition-colors duration-200 cursor-pointer"
                >
                  <span>عرض كل القوالب</span>
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
                </button>
              </div>

              {/* Filters */}
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedPlatform={selectedPlatform}
                onSelectPlatform={setSelectedPlatform}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalResults={filteredThemes.length}
                categories={settings.categories}
                platforms={settings.platforms}
              />

              {/* Theme Grid */}
              {renderThemeGrid('لم يتم العثور على قوالب تطابق بحثك', 'جرب البحث بكلمات عامة مثل (أسترا، ووكومرس، متجر، بورتفوليو...)', 'إعادة ضبط الفلاتر')}
            </section>

            {/* Email Direct Delivery Trust Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-[#0b132b] rounded-3xl p-8 sm:p-12 text-white border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
                <div className="space-y-4 text-center lg:text-right max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold font-mono">
                    <MailCheck className="w-4 h-4 text-white" />
                    <span>آلية التسليم الرقمي الفوري</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold font-tajawal">
                    كيف تستلم ملفات الثيمات؟
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    بمجرد كتابة بريدك الإلكتروني وإتمام الطلب في صفحة الشيك أوت، يرسل النظام تلقائياً رسالة تأكيد تتضمن: روابط التحميل المباشرة لملفات الـ ZIP الأصلية زي ما هي من المصدر بدون أي تعديل، مع ترخيص GPL v3.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <button
                    onClick={() => {
                      setCurrentView('catalog');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-[#0b132b] text-xs sm:text-sm font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>اختر قالبك الآن</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* SEO: محتوى عربي غني بالكلمات المفتاحية + FAQ */}
            <HomeSeoSections themesCount={themes.length} />
          </div>
        )}

        {/* VIEW: CONTACT (/contact) */}
        {currentView === 'contact' && (
          <ContactPage onBackToStore={() => handleNavigate('catalog')} />
        )}

        {/* VIEW: POLICIES (/terms + /privacy) */}
        {currentView === 'terms' && (
          <PoliciesPage policy="terms" onBackToStore={() => handleNavigate('home')} />
        )}
        {currentView === 'privacy' && (
          <PoliciesPage policy="privacy" onBackToStore={() => handleNavigate('home')} />
        )}

        {/* VIEW 2: FULL CATALOG (/catalog) */}
        {currentView === 'catalog' && (
          <CatalogPage
            themes={filteredThemes}
            themesLoading={themesLoading}
            storeConnected={storeConnected}
            themesError={themesError}
            onRetry={loadStoreData}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={setSelectedPlatform}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onSelectTheme={(t) => handleNavigate('product', t.id)}
            onAddToCart={handleAddToCart}
            onInstantBuy={handleInstantBuy}
            isInCart={(id) => cart.some((item) => item.theme.id === id)}
            onResetFilters={resetFilters}
            categories={settings.categories}
            platforms={settings.platforms}
          />
        )}

        {/* VIEW: SHOPIFY LANDING (/shopify) — صفحة هبوط لكلمات ثيمات شوبيفاي */}
        {currentView === 'shopify' && (
          <ShopifyPage
            themes={themes.filter((t) => themePlatforms(t).some((p) => p.toLowerCase() === 'shopify'))}
            themesLoading={themesLoading}
            storeConnected={storeConnected}
            themesError={themesError}
            onRetry={loadStoreData}
            onSelectTheme={(t) => handleNavigate('product', t.id)}
            onAddToCart={handleAddToCart}
            onInstantBuy={handleInstantBuy}
            isInCart={(id) => cart.some((item) => item.theme.id === id)}
          />
        )}

        {/* VIEW 3: PRODUCT DETAIL PAGE (each theme has its own URL: /theme/:slug) */}
        {currentView === 'product' && currentSelectedTheme && (
          <ProductDetailPage
            theme={currentSelectedTheme}
            onBack={() => handleNavigate('catalog')}
            onAddToCart={handleAddToCart}
            onInstantBuy={handleInstantBuy}
            isInCart={cart.some((item) => item.theme.id === currentSelectedTheme.id)}
            themes={themes}
            onSelectTheme={(t) => handleNavigate('product', t.id)}
            isInCartById={(id) => cart.some((item) => item.theme.id === id)}
          />
        )}
        {currentView === 'product' && !currentSelectedTheme && (
          <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
            {slugNotFound ? (
              <>
                <h1 className="text-2xl font-extrabold text-[#0b132b] font-tajawal">القالب غير موجود</h1>
                <p className="text-sm text-slate-500">الرابط اللي فتحته غير صحيح أو القالب اتشال من الكتالوج.</p>
              </>
            ) : (
              <h1 className="text-2xl font-extrabold text-[#0b132b] font-tajawal">جاري تحميل القالب...</h1>
            )}
            <button
              onClick={() => handleNavigate('catalog')}
              className="px-5 py-2.5 bg-[#0b132b] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              تصفح الكتالوج
            </button>
          </div>
        )}

        {/* VIEW 4: CART */}
        {currentView === 'cart' && (
          <CartPage
            items={cart}
            coupons={coupons}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onProceedToCheckout={() => handleNavigate('checkout')}
            onContinueShopping={() => handleNavigate('catalog')}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={setAppliedCoupon}
          />
        )}

        {/* VIEW 5: CHECKOUT PAGE */}
        {currentView === 'checkout' && (
          <CheckoutPage
            items={cart}
            appliedCoupon={appliedCoupon}
            onBackToCart={() => handleNavigate('cart')}
            onOrderSuccess={(order) => {
              setLastOrder(order);
              setCart([]);
              setCurrentView('order-success');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* VIEW 6: ORDER CONFIRMATION / SUCCESS */}
        {currentView === 'order-success' && lastOrder && (
          <OrderSuccessModal
            order={lastOrder}
            settings={settings}
            onContinueShopping={() => handleNavigate('catalog')}
            onOpenGPLModal={() => setIsGPLModalOpen(true)}
          />
        )}
        </Suspense>
      </main>

      {/* Floating Cart — lifted above mobile safe-area, no clash with toast */}
      {cart.length > 0 && currentView !== 'cart' && currentView !== 'checkout' && currentView !== 'order-success' && currentView !== 'download' && (
        <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 sm:left-6 z-40 animate-in slide-in-from-bottom-4">
          <button
            id="floating-cart-btn"
            onClick={() => handleNavigate('cart')}
            className="px-5 py-3.5 min-h-[56px] bg-[#0b132b] hover:bg-[#1e293b] active:scale-[0.98] text-white rounded-2xl shadow-2xl border-2 border-white flex items-center gap-3 group transition cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-[#0b132b] font-mono text-[10px] font-extrabold rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold leading-tight">سلة التسوق</div>
              <div className="text-[11px] text-slate-300 font-mono">
                {formatCurrency(cart.reduce((sum, i) => sum + i.price, 0))} • إتمام الشراء
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Toast — docked above floating cart on mobile to avoid overlap */}
      {toastMessage && (
        <div className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-[#0b132b] text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 rounded-xl bg-white text-[#0b132b] flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{toastMessage.title}</h4>
              {toastMessage.subtitle && (
                <p className="text-[11px] text-slate-300 truncate">{toastMessage.subtitle}</p>
              )}
            </div>
            <button
              onClick={() => handleNavigate('cart')}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg shrink-0 transition"
            >
              عرض السلة
            </button>
          </div>
        </div>
      )}

      {/* Auxiliary Modals — lazy, only download when opened */}
      {isGPLModalOpen && (
        <Suspense fallback={null}>
          <GPLInfoModal isOpen={isGPLModalOpen} onClose={() => setIsGPLModalOpen(false)} />
        </Suspense>
      )}
      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenGPLInfo={() => setIsGPLModalOpen(true)}
      />
    </div>
  );
}

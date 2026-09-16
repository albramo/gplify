import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  HelpCircle, 
  Menu, 
  X, 
  LayoutGrid,
  ChevronDown,
  Facebook,
  Mail,
  Sparkles
} from 'lucide-react';
import type { GPLTheme } from '../types';
import type { AnnouncementDef, PlatformDef } from '../lib/settings';
import { safeUrl } from '../lib/security';
import { formatCurrency } from './ThemeCard';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onNavigate: (view: 'home' | 'catalog' | 'shopify' | 'contact' | 'terms' | 'privacy' | 'cart' | 'checkout' | 'product' | 'download' | 'order-success', themeId?: string) => void;
  onOpenGPLInfo: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  themes: GPLTheme[];
  announcement?: AnnouncementDef;
  platforms?: PlatformDef[];
  selectedPlatform?: string;
  onSelectPlatform?: (id: string) => void;
}

/** Render announcement text with {code} highlighted (code optional). */
function renderAnnouncementText(text: string, code: string) {
  const clean = text.replace('{code}', '§§CODE§§');
  const parts = clean.split('§§CODE§§');
  if (!code) {
    return <span className="truncate">{parts.join(' ').replace(/\s{2,}/g, ' ').trim()}</span>;
  }
  if (parts.length === 1) {
    return (
      <span className="truncate">
        {text} <strong className="text-white font-mono">{code}</strong>
      </span>
    );
  }
  return (
    <span className="truncate">
      {parts[0]}
      <strong className="text-white font-mono">{code}</strong>
      {parts.slice(1).join(code)}
    </span>
  );
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onNavigate,
  onOpenGPLInfo,
  searchQuery,
  onSearchChange,
  themes,
  announcement,
  platforms = [],
  selectedPlatform = 'all',
  onSelectPlatform,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [platformsOpen, setPlatformsOpen] = useState(true);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // أول ما مربع بحث الموبايل يتفتح — ركّز فيه تلقائيًا (يفتح الكيبورد)
  useEffect(() => {
    if (!mobileSearchOpen) return;
    const t = setTimeout(() => mobileSearchRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [mobileSearchOpen]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false);

  // Debounce search 200ms: prevents filtering 1000+ themes on every keystroke (INP on mobile)
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Side drawer: lock body scroll + close on Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  // Live matches stay on the same page — navigation happens only on explicit submit/select
  const matches = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return [];
    return themes.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.titleEn.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        t.categoryNameAr.toLowerCase().includes(q)
    );
  }, [themes, debouncedQuery]);
  const suggestions = matches.slice(0, 6);

  const renderSuggestions = (close: () => void) => {
    const q = searchQuery.trim();
    if (!q) return null;
    return (
      <div className="absolute top-full mt-2 right-0 left-0 md:left-auto md:w-[26rem] md:max-w-[70vw] bg-white border border-slate-200 rounded-none shadow-xl overflow-hidden z-50">
        {matches.length === 0 ? (
          <button
            type="button"
            onClick={() => {
              onNavigate('catalog');
              close();
            }}
            className="w-full text-right px-4 py-3 text-xs text-slate-500 hover:bg-slate-50 transition cursor-pointer"
          >
            لا توجد نتائج مطابقة — اضغط لعرض الكتالوج
          </button>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {suggestions.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('product', t.id);
                      close();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition text-right cursor-pointer"
                  >
                    {safeUrl(t.thumbnail) ? (
                      <img
                        src={safeUrl(t.thumbnail)}
                        alt={t.title}
                        width={128}
                        height={88}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-11 rounded-none object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-11 rounded-none bg-slate-100 border border-slate-200 shrink-0" />
                    )}
                    <span className="flex-1 min-w-0">
                      <span dir="auto" className="block text-[13px] font-bold text-[#0b132b] truncate text-right">{t.title}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5 truncate">
                        <strong className="text-[#0b132b] font-mono">{formatCurrency(t.price)}</strong>
                        {' '}• {t.categoryNameAr}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                onNavigate('catalog');
                close();
              }}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border-t border-slate-200 text-xs font-bold text-[#0b132b] transition cursor-pointer"
            >
              عرض كل النتائج ({matches.length})
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <>
    <header className="sticky top-0 z-40 bg-white border-b-2 border-[#0b132b]">
      {/* Top Announcement Bar (owner-editable via admin → settings; hidden when off/empty) */}
      {announcement?.enabled && announcement.text.trim() ? (
        <div className="bg-[#0b132b] text-white text-xs py-1.5 px-4">
          <div className="max-w-[1440px] mx-auto flex items-center justify-center text-center">
            <p className="flex items-center gap-1.5 font-medium text-slate-200 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              {renderAnnouncementText(announcement.text.trim(), announcement.code.trim())}
            </p>
          </div>
        </div>
      ) : null}

      {/* Main Navigation Bar — h-16 keeps sticky header compact on mobile (more viewport for LCP) */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="relative flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* Sidebar toggle — opens side drawer (themes only) */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-expanded={sidebarOpen}
              aria-label="القائمة الجانبية"
              className="p-3 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-none text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Mobile search toggle — search box is hidden until tapped */}
            <button
              id="btn-mobile-search-toggle"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-expanded={mobileSearchOpen}
              aria-label="البحث في القوالب"
              className="md:hidden p-3 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-none text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer"
            >
              {mobileSearchOpen ? <X className="w-6 h-6" /> : <Search className="w-6 h-6" />}
            </button>
            <a
              id="nav-logo-btn"
              href="/"
              onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
              aria-label="gplify - تحميل قوالب GPL الرئيسية"
              className="absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 flex items-center gap-2 sm:gap-3 group cursor-pointer"
            >
              <img
                src="/og-cover.jpg"
                alt="gplify — متجر تحميل قوالب GPL العربية"
                width={40}
                height={40}
                loading="eager"
                decoding="async"
                className="w-10 h-10 rounded-none object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0b132b] font-tajawal">
                gplify<span className="text-[#1e3a8a]">.</span>
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-0.5 mr-2" aria-label="التنقل الرئيسي">
              <a
                id="nav-home-link"
                href="/"
                onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
                className="px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap text-[#0b132b] hover:text-[#1e3a8a] border-b-2 border-transparent hover:border-[#0b132b] transition"
              >
                تحميل قوالب
              </a>
              <a
                id="nav-catalog-link"
                href="/catalog"
                onClick={(e) => { e.preventDefault(); onNavigate('catalog'); }}
                className="px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap text-slate-700 hover:text-[#0b132b] border-b-2 border-transparent hover:border-[#0b132b] transition"
              >
                ثيمات ووردبريس
              </a>
              <a
                id="nav-shopify-link"
                href="/shopify"
                onClick={(e) => { e.preventDefault(); onNavigate('shopify'); }}
                className="px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap text-slate-700 hover:text-[#0b132b] border-b-2 border-transparent hover:border-[#0b132b] transition"
              >
                ثيمات شوبيفاي
              </a>
              <button
                id="nav-gpl-info-link"
                onClick={onOpenGPLInfo}
                className="flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap text-slate-700 hover:text-[#0b132b] border-b-2 border-transparent hover:border-[#0b132b] transition"
              >
                <HelpCircle className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                ما هو ترخيص GPL؟
              </button>
              <a
                id="nav-contact-link"
                href="/contact"
                onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
                className="px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap text-slate-700 hover:text-[#0b132b] border-b-2 border-transparent hover:border-[#0b132b] transition"
              >
                تواصل معنا
              </a>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-1 lg:mx-2 min-w-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchFocused(false);
                onNavigate('catalog');
              }}
              className={`relative w-full transition-all duration-200 ${searchFocused ? 'ring-2 ring-[#0b132b] rounded-full' : ''}`}
            >
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="header-search-input"
                type="text"
                role="combobox"
                aria-expanded={searchFocused && searchQuery.trim().length > 0}
                aria-label="البحث في القوالب"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') (e.target as HTMLInputElement).blur();
                }}
                placeholder="ابحث عن ثيم (Glozin, Minimog, Hyper...)"
                className="w-full pl-4 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-full focus:border-[#0b132b] focus:outline-hidden text-[#0b132b] placeholder-slate-400 transition"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="مسح البحث"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {searchFocused && renderSuggestions(() => setSearchFocused(false))}
            </form>
          </div>

          {/* Actions: Facebook, Cart & CTA */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <a
              id="btn-facebook-header"
              href="https://facebook.com/vibecode26"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="صفحة gplify على فيسبوك"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] text-[#1877F2] hover:bg-slate-100 transition cursor-pointer"
            >
              <Facebook className="w-5 h-5 text-[#1877F2]" />
            </a>
            <button
              id="btn-open-cart"
              onClick={onOpenCart}
              className="relative flex items-center justify-center min-w-[44px] min-h-[44px] text-[#0b132b] hover:bg-slate-100 transition group cursor-pointer"
              aria-label="سلة التسوق"
            >
              <ShoppingBag className="w-5 h-5 text-[#0b132b] group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-[#0b132b] text-white font-mono text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              id="btn-quick-catalog"
              onClick={() => onNavigate('catalog')}
              className="hidden xl:inline-flex items-center px-4 py-2.5 bg-[#0b132b] hover:bg-[#1e293b] text-white text-[13px] font-bold whitespace-nowrap rounded-none transition cursor-pointer"
            >
              <span>استكشف العروض</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar — hidden until the search icon is tapped */}
        {mobileSearchOpen && (
        <div className="md:hidden pb-3 animate-in slide-in-from-top-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMobileSearchFocused(false);
              setMobileSearchOpen(false);
              onNavigate('catalog');
            }}
            className="relative w-full"
          >
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="mobile-search-input"
              ref={mobileSearchRef}
              type="text"
              role="combobox"
              aria-expanded={mobileSearchFocused && searchQuery.trim().length > 0}
              aria-label="البحث في القوالب"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setMobileSearchFocused(true)}
              onBlur={() => setTimeout(() => setMobileSearchFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setMobileSearchOpen(false);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="ابحث عن (Glozin, Minimog, Hyper...)"
              className="w-full pl-4 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-full focus:border-[#0b132b] text-[#0b132b]"
            />
            {mobileSearchFocused && renderSuggestions(() => setMobileSearchFocused(false))}
          </form>
        </div>
        )}
      </div>
    </header>

      {/* Side Drawer — themes only + collapsible platforms (outside header: fixed must be viewport-relative, header backdrop-blur creates containing block) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="القائمة الجانبية">
          {/* Overlay */}
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={closeSidebar}
            className="absolute inset-0 bg-black/50 cursor-pointer"
          />
          {/* Panel slides from the side (RTL: right side) */}
          <aside className="absolute top-0 bottom-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <img
                  src="/og-cover.jpg"
                  alt="gplify"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-none object-cover border border-slate-200"
                />
                <div className="leading-tight">
                  <p className="text-sm font-black text-[#0b132b]">gplify.</p>
                  <p className="text-[11px] text-slate-500 font-medium">القائمة الجانبية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                aria-label="إغلاق"
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-none text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body — themes only */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 px-1">الثيمات</p>
              <button
                id="sidebar-nav-catalog"
                onClick={() => {
                  onSelectPlatform?.('all');
                  onNavigate('catalog');
                  closeSidebar();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-bold text-[#0b132b] bg-slate-100 hover:bg-slate-200 transition text-right cursor-pointer"
              >
                <LayoutGrid className="w-5 h-5 text-[#1e3a8a] shrink-0" />
                <span>جميع الثيمات والقوالب</span>
              </button>
              <button
                id="sidebar-nav-contact"
                onClick={() => {
                  onNavigate('contact');
                  closeSidebar();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 transition text-right cursor-pointer"
              >
                <Mail className="w-5 h-5 text-[#1e3a8a] shrink-0" />
                <span>تواصل معنا</span>
              </button>
              <a
                id="sidebar-nav-shopify"
                href="/shopify"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('shopify');
                  closeSidebar();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition text-right cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>ثيمات شوبيفاي</span>
              </a>

              {/* Collapsible platforms */}
              <button
                id="sidebar-platforms-toggle"
                type="button"
                onClick={() => setPlatformsOpen((v) => !v)}
                aria-expanded={platformsOpen}
                className="w-full flex items-center justify-between px-4 py-3 rounded-none text-sm font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
              >
                <span>المنصات المتاحة ({platforms.length})</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${platformsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {platformsOpen && (
                <ul className="space-y-1.5 pr-1">
                  {platforms.length === 0 ? (
                    <li className="px-4 py-2.5 text-xs text-slate-400">لا توجد منصات متاحة حالياً</li>
                  ) : (
                    platforms.map((p) => {
                      const active = selectedPlatform === p.id;
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPlatform?.(p.id);
                              onNavigate('catalog');
                              closeSidebar();
                            }}
                            className={`w-full text-right px-4 py-2.5 rounded-none text-sm font-semibold transition cursor-pointer border ${
                              active
                                ? 'bg-[#0b132b] text-white border-[#0b132b]'
                                : 'text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200'
                            }`}
                          >
                            {p.label}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>

            {/* Drawer footer — Facebook */}
            <div className="border-t border-slate-200 px-4 py-3 bg-white">
              <a
                id="sidebar-facebook-link"
                href="https://facebook.com/vibecode26"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="صفحة gplify على فيسبوك"
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 min-h-[48px] rounded-none text-sm font-bold text-white bg-[#1877F2] hover:bg-[#1466cc] active:scale-[0.99] transition cursor-pointer shadow-sm"
              >
                <Facebook className="w-5 h-5 shrink-0" />
                <span>تابعنا على فيسبوك</span>
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

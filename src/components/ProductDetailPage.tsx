import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  ArrowLeft,
  Star, 
  DownloadCloud, 
  Eye, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  FileCode2, 
  Layers, 
  Calendar, 
  HardDrive, 
  Globe2, 
  HelpCircle, 
  Check, 
  Share2, 
  Mail, 
  Clock,
  Sparkles,
  Info,
  Crown,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GPLTheme } from '../types';
import { isSafeHttpUrl, safeUrl } from '../lib/security';
import { themeCategories, themePlatforms, badgeLabelAr, themeHasLicense } from '../lib/store';
import { formatCurrency, ThemeCard } from './ThemeCard';
import { ThemeSetupService } from './ThemeSetupService';
import { setProductHead, toISODate } from '../lib/seo';
import { mergeThemeFaq } from '../lib/themeSeo';

interface ProductDetailPageProps {
  theme: GPLTheme;
  onBack: () => void;
  onAddToCart: (theme: GPLTheme) => void;
  onInstantBuy: (theme: GPLTheme) => void;
  isInCart: boolean;
  /** كل ثيمات المتجر — يُشتق منها قسم "ثيمات أخرى" (بحد أقصى 4). */
  themes?: GPLTheme[];
  onSelectTheme?: (theme: GPLTheme) => void;
  isInCartById?: (themeId: string) => boolean;
  /** طلب خدمة تجهيز الثيم (يفتح صفحة التواصل برسالة جاهزة) */
  onRequestSetup?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  theme,
  onBack,
  onAddToCart,
  onInstantBuy,
  isInCart,
  themes = [],
  onSelectTheme,
  isInCartById,
  onRequestSetup,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'changelog' | 'faq' | 'license'>('overview');
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // مؤشر سكرول التبويبات: يظهر فقط لو فيه تبويبات خارج الشاشة (overflow).
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabsScroll, setTabsScroll] = useState({ overflow: false, progress: 0, visible: 100 });

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const overflow = max > 4;
      setTabsScroll({
        overflow,
        progress: max > 0 ? Math.min(1, Math.max(0, Math.abs(el.scrollLeft) / max)) : 0,
        visible: el.scrollWidth > 0 ? Math.max(15, Math.min(100, (el.clientWidth / el.scrollWidth) * 100)) : 100,
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const t = setTimeout(update, 300);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearTimeout(t);
    };
  }, [theme.id]);

  // Mobile scroll arrows for the tabs row (same pattern as the catalog categories)
  const nudgeTabs = (forward: boolean) => {
    const el = tabsRef.current;
    if (!el) return;
    const isRTL = getComputedStyle(el).direction === 'rtl';
    const amount = Math.min(240, el.clientWidth * 0.7);
    el.scrollBy({ left: forward === isRTL ? -amount : amount, behavior: 'smooth' });
  };

  // Gallery always starts with the main thumbnail, then screenshots (no duplicates).
  // SECURITY: only http(s) URLs are rendered (blocks javascript:/data: payloads from DB).
  const gallery = useMemo(() => {
    const list = [theme.thumbnail, ...theme.screenshots].filter(isSafeHttpUrl);
    return [...new Set(list)];
  }, [theme]);
  const demoUrl = safeUrl(theme.demoUrl);

  useEffect(() => {
    setSelectedScreenshotIndex(0);
    setActiveTab('overview');
    setLightboxOpen(false);
  }, [theme.id]);

  // SEO/GEO: مزامنة الـ head في تنقلات الـ SPA (prerender يغطي أول زيارة من الزاحف)
  useEffect(() => {
    setProductHead({
      slug: theme.slug,
      title: theme.title,
      titleEn: theme.titleEn,
      shortDescription: theme.shortDescription,
      description: theme.description,
      thumbnail: theme.thumbnail,
      categoryNameAr: theme.categoryNameAr,
      platform: theme.platform,
      gplLicenseType: theme.gplLicenseType,
      price: theme.price,
      rating: theme.rating,
      reviewsCount: theme.reviewsCount,
      version: theme.version,
      updatedDate: theme.updatedDate,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
      faq: theme.faq,
    });
  }, [theme]);

  // تواريخ آلية للزاحفات (مهارة seo-geo: المحتوى الأحدث أولوية ~3x)
  const publishedISO = toISODate(theme.createdAt);
  const modifiedISO = toISODate(theme.updatedAt) || toISODate(theme.updatedDate);
  // فقرة تعريفية مقتبسة (نمط "ما هو X؟" للاقتباس في إجابات AI) — بدون ادعاء ترخيص لمنتج بلا رخصة
  const licensed = themeHasLicense(theme);
  const geoIntro = `ما هو ${theme.title}؟ ${theme.shortDescription || theme.description || ''} قالب ${theme.categoryNameAr || ''} لمنصة ${theme.platform || 'WordPress'} بالإصدار v${theme.version || ''}${licensed ? ' مع ترخيص GPL' : ' بدون رخصة (يُباع بحالته)'} وتسليم فوري عبر البريد الإلكتروني.`;

  const discountPercent = Math.round(((theme.originalPrice - theme.price) / theme.originalPrice) * 100);

  // أسئلة الثيم + أسئلة تلقائية (مجاني/سعر/تثبيت) — نفس اللي في سكيما جوجل
  const displayFaq = useMemo(
    () => mergeThemeFaq(theme.faq, theme.title, theme.platform, 6, licensed),
    [theme]
  );

  // ثيمات أخرى: نفس التصنيف أولاً ثم نفس المنصة — بحد أقصى 4 ثيمات (بدون الثيم الحالي).
  const relatedThemes = useMemo(() => {
    if (!themes || themes.length === 0) return [];
    const myCats = new Set(themeCategories(theme));
    const myPlats = new Set(themePlatforms(theme));
    const score = (t: GPLTheme) => {
      let s = 0;
      for (const c of themeCategories(t)) if (myCats.has(c)) s += 2;
      for (const p of themePlatforms(t)) if (myPlats.has(p)) s += 1;
      return s;
    };
    return themes
      .filter((t) => t.id !== theme.id)
      .sort((a, b) => score(b) - score(a) || b.rating - a.rating)
      .slice(0, 4);
  }, [themes, theme]);

  const showNextImage = () =>
    setSelectedScreenshotIndex((i) => (gallery.length > 0 ? (i + 1) % gallery.length : 0));
  const showPrevImage = () =>
    setSelectedScreenshotIndex((i) => (gallery.length > 0 ? (i - 1 + gallery.length) % gallery.length : 0));

  // Lightbox keyboard: Escape closes, arrows navigate (RTL: left = next)
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowLeft') showNextImage();
      else if (e.key === 'ArrowRight') showPrevImage();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, gallery.length]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Breadcrumbs & Back Button */}
        <div className="flex items-center justify-between">
          <button
            id="btn-back-to-catalog"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0b132b] hover:text-[#1e3a8a] bg-white px-3.5 py-2 rounded-none border border-slate-200 hover:border-[#0b132b] transition cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لكل الثيمات</span>
          </button>

          <button
            id="btn-share-product"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0b132b] px-2 py-2 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة القالب'}</span>
          </button>
        </div>

        {/* Main Grid: Product Media/Details (Left) & Sticky Purchase Box (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Header Title & Badges — editorial, no card */}
            <div className="space-y-4 pb-6 border-b-2 border-[#0b132b]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-[#0b132b] text-white text-xs font-bold rounded-none">
                  {theme.categoryNameAr}
                </span>
                {theme.badge === 'exclusive' ? (
                  <span className="px-3 py-1 bg-amber-300 text-[#0b132b] text-xs font-extrabold rounded-full flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                    {badgeLabelAr(theme.badge)}
                  </span>
                ) : theme.badge === 'featured' ? (
                  <span className="px-3 py-1 bg-white text-[#0b132b] text-xs font-extrabold rounded-full border border-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" aria-hidden="true" />
                    {badgeLabelAr(theme.badge)}
                  </span>
                ) : null}
                {theme.gplLicenseType ? (
                  <span className="px-3 py-1 bg-white text-[#0b132b] text-xs font-bold rounded-none border border-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ترخيص {theme.gplLicenseType}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-none border border-amber-300">
                    بدون رخصة — يُباع بحالته
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono" dir="ltr">
                  v{theme.version}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0b132b] leading-tight font-tajawal">
                {theme.title}
              </h1>
              <p className="text-sm text-slate-500 font-mono" dir="ltr">
                {theme.titleEn}
              </p>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-1 font-bold text-[#0b132b]">
                  <Star className="w-4 h-4 fill-[#0b132b] text-[#0b132b]" />
                  <span className="text-sm">{theme.rating}</span>
                  <span className="text-slate-400 font-normal">({theme.reviewsCount} تقييم حقيقي)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DownloadCloud className="w-4 h-4 text-slate-400" />
                  <span><strong>{theme.downloadsCount.toLocaleString()}</strong> عملية تحميل سابقة</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    آخر تحديث:{' '}
                    <time dateTime={modifiedISO ?? theme.updatedDate}>{theme.updatedDate}</time>
                    {publishedISO ? (
                      <>
                        {' '}• نشر:{' '}
                        <time dateTime={publishedISO}>{(theme.createdAt || '').slice(0, 10) || theme.updatedDate}</time>
                      </>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>

            {/* Screenshots & Media Showcase */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="relative aspect-[590/300] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="عرض صورة القالب بحجم كامل"
                  className="absolute inset-0 w-full h-full p-0 bg-transparent border-0 cursor-zoom-in"
                >
                  <img
                    src={gallery[selectedScreenshotIndex] ?? gallery[0]}
                    alt={`${theme.title} — معاينة القالب (اضغط للعرض الكامل)`}
                    width={590}
                    height={300}
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>

                {/* Zoom hint */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/55 backdrop-blur text-white text-[11px] font-bold pointer-events-none"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>اضغط للتكبير</span>
                </span>

                {/* Live Demo — solid navy, stands out from the image */}
                {demoUrl ? (
                  <div className="absolute bottom-4 left-4 z-10">
                    <a
                      id="btn-live-preview-media"
                      href={demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2.5 min-h-[44px] bg-[#0b132b] hover:bg-[#1e3a8a] text-white text-xs font-extrabold rounded-none shadow-lg transition flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-white" />
                      <span>شوف الديمو</span>
                    </a>
                  </div>
                ) : null}
              </div>

              {/* Thumbnail Selector */}
              {gallery.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      id={`btn-screenshot-thumb-${idx}`}
                      onClick={() => setSelectedScreenshotIndex(idx)}
                      aria-label={`عرض الصورة ${idx + 1} من ${gallery.length}`}
                      aria-current={selectedScreenshotIndex === idx}
                      className={`relative w-20 h-14 rounded-none overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                        selectedScreenshotIndex === idx ? 'border-[#0b132b] shadow-md scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" loading="lazy" decoding="async" width={160} height={112} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="relative">
                <div ref={tabsRef} className="flex gap-5 border-b border-slate-200 overflow-x-auto scrollbar-none px-4 sm:px-5">
                <button
                  id="tab-btn-overview"
                  onClick={() => setActiveTab('overview')}
                  className={`px-1 py-3 text-[13px] border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-[#0b132b] text-[#0b132b] font-extrabold'
                      : 'border-transparent text-slate-500 font-bold hover:text-[#0b132b]'
                  }`}
                >
                  نظرة عامة والوصف
                </button>
                <button
                  id="tab-btn-features"
                  onClick={() => setActiveTab('features')}
                  className={`px-1 py-3 text-[13px] border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'features'
                      ? 'border-[#0b132b] text-[#0b132b] font-extrabold'
                      : 'border-transparent text-slate-500 font-bold hover:text-[#0b132b]'
                  }`}
                >
                  المميزات والخصائص
                </button>
                <button
                  id="tab-btn-changelog"
                  onClick={() => setActiveTab('changelog')}
                  className={`px-1 py-3 text-[13px] border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'changelog'
                      ? 'border-[#0b132b] text-[#0b132b] font-extrabold'
                      : 'border-transparent text-slate-500 font-bold hover:text-[#0b132b]'
                  }`}
                >
                  سجل التحديثات (Changelog)
                </button>
                <button
                  id="tab-btn-faq"
                  onClick={() => setActiveTab('faq')}
                  className={`px-1 py-3 text-[13px] border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'faq'
                      ? 'border-[#0b132b] text-[#0b132b] font-extrabold'
                      : 'border-transparent text-slate-500 font-bold hover:text-[#0b132b]'
                  }`}
                >
                  الأسئلة الشائعة
                </button>
                {theme.gplLicenseType ? (
                  <button
                    id="tab-btn-license"
                    onClick={() => setActiveTab('license')}
                    className={`px-1 py-3 text-[13px] border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === 'license'
                        ? 'border-[#0b132b] text-[#0b132b] font-extrabold'
                        : 'border-transparent text-slate-500 font-bold hover:text-[#0b132b]'
                    }`}
                  >
                    ضمان ترخيص GPL
                  </button>
                ) : null}
                </div>
                {/* تظليل أطراف يوضح إن فيه تبويبات بره الشاشة */}
                {tabsScroll.overflow && tabsScroll.progress < 0.99 ? (
                  <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
                ) : null}
                {tabsScroll.overflow && tabsScroll.progress > 0.01 ? (
                  <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
                ) : null}
                {/* Scroll arrows — mobile only, same as catalog categories */}
                {tabsScroll.overflow && tabsScroll.progress < 0.99 ? (
                  <button
                    type="button"
                    onClick={() => nudgeTabs(true)}
                    aria-label="عرض أقسام أكثر"
                    className="sm:hidden absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#0b132b] active:scale-95 transition-transform cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : null}
                {tabsScroll.overflow && tabsScroll.progress > 0.01 ? (
                  <button
                    type="button"
                    onClick={() => nudgeTabs(false)}
                    aria-label="رجوع للأقسام السابقة"
                    className="sm:hidden absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#0b132b] active:scale-95 transition-transform cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              {/* Tab Contents */}
              <div className="p-6 sm:p-8">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-[#0b132b] mb-3">ما هو {theme.title}؟</h2>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {geoIntro}
                      </p>
                      <h3 className="text-base font-bold text-[#0b132b] mt-5 mb-2">عن القالب بالتفصيل:</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {theme.description}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-3">
                        {publishedISO ? (
                          <>تاريخ النشر: <time dateTime={publishedISO}>{(theme.createdAt || '').slice(0, 10)}</time> • </>
                        ) : null}
                        آخر تحديث: <time dateTime={modifiedISO ?? theme.updatedDate}>{theme.updatedDate}</time> • الإصدار v{theme.version}
                      </p>
                    </div>

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-xs text-slate-500 block">الإصدار الحالي:</span>
                        <strong className="text-sm text-[#0b132b] font-mono">v{theme.version}</strong>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-xs text-slate-500 block">حجم الحزمة:</span>
                        <strong className="text-sm text-[#0b132b] font-mono">{theme.fileSize}</strong>
                      </div>
                      {theme.gplLicenseType ? (
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-xs text-slate-500 block">نوع الترخيص:</span>
                          <strong className="text-sm text-[#1e3a8a]">{theme.gplLicenseType}</strong>
                        </div>
                      ) : null}
                    </div>

                    {/* Compatibility */}
                    <div>
                      <h4 className="text-sm font-bold text-[#0b132b] mb-2">التوافق البرمجي:</h4>
                      <div className="flex flex-wrap gap-2">
                        {theme.compatibility.map((item, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-800 font-semibold px-3 py-1 rounded-lg border border-slate-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'features' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#0b132b]">المميزات المضمنة في القالب:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {theme.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
                          <span className="text-xs font-medium text-slate-700 leading-relaxed">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {theme.includedPlugins && theme.includedPlugins.length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-[#0b132b] mb-2">الإضافات والملحقات المرفقة مجاناً في التحميل:</h4>
                        <div className="flex flex-wrap gap-2">
                          {theme.includedPlugins.map((plugin, idx) => (
                            <span key={idx} className="text-xs bg-[#0b132b] text-white px-3 py-1 rounded-lg font-mono">
                              + {plugin}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'changelog' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#0b132b]">تاريخ التحديثات والإصدارات</h3>
                      <span className="text-xs text-slate-500 font-mono">آخر تحديث: {theme.updatedDate}</span>
                    </div>

                    <div className="space-y-4">
                      {theme.changelog.map((log, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1e3a8a] font-mono bg-white px-2.5 py-1 rounded border border-slate-200">
                              الإصدار: v{log.version}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{log.date}</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pt-1">
                            {log.changes.map((c, ci) => (
                              <li key={ci}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'faq' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#0b132b]">الأسئلة الأكثر تكراراً عن هذا القالب:</h3>
                    <div className="space-y-3">
                      {displayFaq.map((item, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                          <h4 className="text-sm font-bold text-[#0b132b] flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-[#1e3a8a]" />
                            {item.question}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed mr-6">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'license' && theme.gplLicenseType && (
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0b132b] text-white flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0b132b]">ضمان رخصة البرمجيات الحرة GNU GPL</h4>
                        <p className="text-xs text-slate-500">حرية الاستخدام والتطوير بنسبة 100% وفق القانون الدولي</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      وفقاً لرخصة GNU General Public License (GPL) التي يخضع لها نظام ووردبريس وكافة القوالب والإضافات المبنية عليه، يحق للمشتري إعادة استخدام وتوزيع وتعديل القالب على عدد غير محدود من النطاقات والمواقع بدون أي قيود أو اشتراكات شهرية.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>كود أصلي غير معدل</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>فحص فيروسات شامل</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>نطاقات ومواقع غير محدودة</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Purchase Box (4 Cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_-20px_rgba(11,19,43,0.3)] overflow-hidden">
              {/* Pricing Header */}
              <div className="bg-[#0b132b] p-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{theme.gplLicenseType ? 'سعر الترخيص GPL:' : 'سعر المنتج:'}</span>
                  {discountPercent > 0 ? (
                    <span className="px-2 py-0.5 bg-red-600 text-white font-bold font-mono rounded-full text-[11px]">
                      وفر {discountPercent}%
                    </span>
                  ) : null}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    {formatCurrency(theme.price)}
                  </span>
                  {theme.originalPrice > theme.price ? (
                    <span className="text-base text-slate-400 line-through font-mono">
                      {formatCurrency(theme.originalPrice)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="p-6 space-y-5">
              {!theme.gplLicenseType ? (
                <div className="p-3 bg-amber-50 border border-amber-300 text-[11px] text-amber-800 leading-relaxed">
                  <strong>تنبيه:</strong> هذا المنتج معروض بدون رخصة — راجع الوصف وشروط البيع قبل إتمام الطلب.
                </div>
              ) : null}
              {/* Crucial Email Notice Highlight */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 border-r-4 border-r-[#1e3a8a] flex items-start gap-2.5">
                <Mail className="w-5 h-5 text-[#1e3a8a] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-[#0b132b] block font-bold">تسليم رقمي فوري:</strong>
                  <span className="text-slate-600 leading-relaxed">
                    سيتم إرسال رابط تحميل الثيم المباشر وملفات التفعيل إلى بريدك الإلكتروني فور إتمام عملية الدفع.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  id="btn-product-instant-buy"
                  onClick={() => onInstantBuy(theme)}
                  className="w-full py-3.5 px-4 bg-[#0b132b] hover:bg-[#1e293b] text-white text-sm font-bold rounded-none shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-white" />
                  <span>شراء فوري واستلام الملفات الآن</span>
                </button>

                <button
                  id="btn-product-add-cart"
                  onClick={() => onAddToCart(theme)}
                  className={`w-full py-3.5 px-4 rounded-none text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                    isInCart
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-[#0b132b] border-slate-300 hover:bg-slate-50 hover:border-[#0b132b]'
                  }`}
                >
                  {isInCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                  <span>{isInCart ? 'موجود في سلة التسوق (عرض السلة)' : 'إضافة إلى سلة التسوق'}</span>
                </button>

                {demoUrl ? (
                  <a
                    id="btn-product-preview-secondary"
                    href={demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-none transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-[#1e3a8a]" />
                    <span>معاينة القالب مباشرة (Live Demo)</span>
                  </a>
                ) : null}
              </div>

              {/* Guarantees List */}
              <div className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  {licensed ? (
                    <span>استخدام غير محدود لجميع الدومينات والمواقع</span>
                  ) : (
                    <span>تسليم رقمي فوري للملفات على بريدك بعد الدفع</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ملفات أصلية كاملة بدون نقص أو حذف</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>فحص أمني دقيق بنسبة 100% بدون أي فيروسات</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>دعم فني مباشر لتوجيهات التنصيب والتفعيل</span>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* خدمة تجهيز الثيم — قبل الثيمات المرشحة */}
        {onRequestSetup ? (
          <ThemeSetupService
            variant="compact"
            themeTitle={theme.title}
            onRequestSetup={onRequestSetup}
          />
        ) : null}

        {/* Related Themes — بحد أقصى 4 ثيمات أخرى من المتجر */}
        {relatedThemes.length > 0 && onSelectTheme ? (
          <section
            aria-label="ثيمات أخرى قد تعجبك"
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#1e3a8a] mb-1">اكتشف المزيد من الكتالوج</p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-tajawal">
                  ثيمات أخرى قد تعجبك
                </h2>
              </div>
              <button
                id="btn-related-view-all"
                onClick={onBack}
                className="group min-h-[44px] text-sm font-extrabold text-[#1e3a8a] hover:text-[#0b132b] inline-flex items-center gap-1.5 cursor-pointer transition-colors duration-200"
              >
                <span>عرض كل القوالب</span>
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedThemes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  onSelectTheme={onSelectTheme}
                  onAddToCart={onAddToCart}
                  onInstantBuy={onInstantBuy}
                  isInCart={isInCartById ? isInCartById(t.id) : false}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Fullscreen lightbox */}
        {lightboxOpen && gallery.length > 0 ? (
          <div
            className="fixed inset-0 z-[80] bg-black/90 flex flex-col animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="عارض صور القالب بحجم كامل"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Top bar: counter + close */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 text-white">
              <span className="text-xs font-mono font-bold" dir="ltr">
                {selectedScreenshotIndex + 1} / {gallery.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                aria-label="إغلاق العارض"
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image + arrows */}
            <div className="flex-1 min-h-0 flex items-center justify-center gap-2 sm:gap-4 px-3 sm:px-8 pb-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrevImage();
                }}
                aria-label="الصورة السابقة"
                className="shrink-0 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <img
                key={gallery[selectedScreenshotIndex]}
                src={gallery[selectedScreenshotIndex]}
                alt={`${theme.title} — عرض كامل ${selectedScreenshotIndex + 1}`}
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNextImage();
                }}
                aria-label="الصورة التالية"
                className="shrink-0 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnails strip */}
            {gallery.length > 1 ? (
              <div
                className="flex items-center justify-center gap-2 px-4 pb-5 overflow-x-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedScreenshotIndex(idx)}
                    aria-label={`عرض الصورة ${idx + 1}`}
                    aria-current={selectedScreenshotIndex === idx}
                    className={`w-16 h-11 shrink-0 overflow-hidden border-2 transition cursor-pointer ${
                      selectedScreenshotIndex === idx
                        ? 'border-white'
                        : 'border-white/25 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

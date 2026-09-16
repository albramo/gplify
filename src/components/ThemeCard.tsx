import React, { memo } from 'react';
import {
  Star,
  ShoppingBag,
  Check,
  Zap
} from 'lucide-react';
import { GPLTheme } from '../types';
import { safeUrl } from '../lib/security';
import { badgeLabelAr, themeHasLicense } from '../lib/store';

interface ThemeCardProps {
  theme: GPLTheme;
  onSelectTheme: (theme: GPLTheme) => void;
  onAddToCart: (theme: GPLTheme) => void;
  onInstantBuy: (theme: GPLTheme) => void;
  isInCart: boolean;
}

// Store prices are in EGP — displayed exactly as entered in the admin panel.
export const formatCurrency = (amount: number) => `${Math.round(amount)} ج.م`;

/** Compact readable numbers (ux skill: Number Formatting — 14.2 ألف not 14200) */
export function formatCompact(n: number): string {
  if (n >= 1000) {
    const v = n / 1000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)} ألف+`;
  }
  return String(n);
}

export const ThemeCard: React.FC<ThemeCardProps> = memo(function ThemeCard({
  theme,
  onSelectTheme,
  onAddToCart,
  onInstantBuy,
  isInCart,
}) {
  const discountPercent = theme.originalPrice > 0
    ? Math.round(((theme.originalPrice - theme.price) / theme.originalPrice) * 100)
    : 0;
  // SECURITY: only http(s) URLs reach href/src (blocks javascript:/data: payloads from DB)
  const thumbnail = safeUrl(theme.thumbnail);
  const themeUrl = `/theme/${theme.slug}`;
  // شارة GPL تظهر فقط للمنتج المرخص — اللي بدون رخصة لا يُكتب عليه مرخص في أي حتة
  const licensed = themeHasLicense(theme);

  // Single badge slot — discount wins, otherwise the curated badge. Never both.
  const badgeText = discountPercent > 0
    ? `خصم ${discountPercent}%`
    : theme.badge === 'exclusive' || theme.badge === 'featured'
      ? badgeLabelAr(theme.badge)
      : null;
  const isDiscount = discountPercent > 0;

  // SPA navigation — keeps real crawlable href for SEO/prerender, no page reload.
  const openTheme = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelectTheme(theme);
  };

  // Whole-card click (except buttons/links) opens the theme page.
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    onSelectTheme(theme);
  };

  return (
    <article
      itemScope
      itemType="https://schema.org/Product"
      aria-label={theme.title}
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_2px_rgba(11,19,43,0.05)] hover:shadow-[0_16px_35px_-18px_rgba(11,19,43,0.25)] focus-within:shadow-[0_16px_35px_-18px_rgba(11,19,43,0.25)] hover:border-slate-300 focus-within:border-slate-300 motion-reduce:transition-none transition-shadow duration-300 flex flex-col h-full cursor-pointer [content-visibility:auto] [contain-intrinsic-size:auto_400px]"
    >
      {/* SEO: Product microdata for rich snippets (visible elements carry name/description/image below) */}
      <meta itemProp="url" content={themeUrl} />
      <meta itemProp="sku" content={theme.slug} />
      <meta itemProp="brand" content={theme.platform} />
      <div itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
        <meta itemProp="ratingValue" content={String(theme.rating)} />
        <meta itemProp="reviewCount" content={String(theme.reviewsCount)} />
      </div>

      {/* Thumbnail — 590×300 fixed aspect reserves space (CLS ≤0.1 on mobile) */}
      <div className="relative aspect-[590/300] overflow-hidden bg-slate-100">
        <img
          itemProp="image"
          src={thumbnail || undefined}
          alt={`قالب ${theme.title} - ${theme.platform} - ${theme.categoryNameAr}${licensed ? ' | تحميل نسخة GPL الأصلية' : ' | تحميل النسخة الأصلية'}`}
          title={`${theme.title}${licensed ? ' GPL' : ''} - ${theme.platform}`}
          width={590}
          height={300}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onError={(e) => {
            const el = e.currentTarget;
            if (!el.src.endsWith('/og-cover.jpg')) el.src = '/og-cover.jpg';
          }}
        />

        {/* One quiet badge only — no competing pills, no floating buttons on the image */}
        {badgeText ? (
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm ${
              isDiscount
                ? 'bg-red-600 text-white'
                : 'bg-white/95 backdrop-blur text-[#0b132b]'
            }`}>
              {badgeText}
            </span>
          </div>
        ) : null}
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Meta: taxonomy (start) / rating (end) — slate-500 for 4.5:1 contrast */}
        <div className="flex items-center justify-between gap-2 text-[11px] mb-2">
          <span className="text-slate-500 font-semibold truncate">
            {theme.categoryNameAr} • {theme.platform}
          </span>
          <span className="flex items-center gap-1 shrink-0" aria-label={`التقييم ${theme.rating.toFixed(1)} من 5 بناء على ${theme.reviewsCount} تقييم`}>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-extrabold text-[#0b132b]">{theme.rating.toFixed(1)}</span>
            <span className="text-slate-500 font-medium">({theme.reviewsCount})</span>
          </span>
        </div>

        {/* Theme Title — dir=auto keeps English-title truncation on the correct side */}
        <h3
          dir="auto"
          itemProp="name"
          className="font-extrabold text-[#0b132b] text-[15px] leading-snug text-right line-clamp-1"
          title={`${theme.title}${licensed ? ' GPL' : ''}`}
        >
          <a
            href={themeUrl}
            onClick={openTheme}
            className="group-hover:text-[#1e3a8a] group-focus-within:text-[#1e3a8a] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b132b] rounded"
          >
            {theme.title}{licensed ? ' GPL' : ''}
          </a>
        </h3>

        {/* Short Description */}
        <p dir="auto" itemProp="description" className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed text-right">
          {theme.shortDescription}
        </p>

        {/* Price + CTA footer */}
        <div className="mt-auto pt-4">
          <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="priceCurrency" content="EGP" />
            <meta itemProp="price" content={String(Math.round(theme.price))} />
            <meta itemProp="availability" content="https://schema.org/InStock" />
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#0b132b] font-mono">
                {formatCurrency(theme.price)}
              </span>
              {theme.originalPrice > theme.price ? (
                <span className="text-xs text-slate-500 line-through">
                  {formatCurrency(theme.originalPrice)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <button
              id={`card-add-cart-${theme.id}`}
              type="button"
              onClick={() => onAddToCart(theme)}
              aria-pressed={isInCart}
              className={`flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-extrabold transition-colors duration-200 active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b132b] ${
                isInCart
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  : 'bg-[#0b132b] hover:bg-[#1e3a8a] text-white shadow-sm'
              }`}
              aria-label={isInCart ? `موجود في سلة التسوق: ${theme.title}` : `أضف ${theme.title} إلى السلة`}
            >
              {isInCart ? <Check className="w-4 h-4" aria-hidden="true" /> : <ShoppingBag className="w-4 h-4" aria-hidden="true" />}
              <span>{isInCart ? 'في السلة' : 'أضف إلى السلة'}</span>
            </button>

            <button
              id={`card-buy-now-${theme.id}`}
              type="button"
              onClick={() => onInstantBuy(theme)}
              className="p-2.5 min-w-[46px] min-h-[46px] flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#0b132b] hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] motion-reduce:active:scale-100 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b132b]"
              title="شراء فوري"
              aria-label={`شراء ${theme.title} فوري`}
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

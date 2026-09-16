import React from 'react';
import {
  Star,
  DownloadCloud,
  Eye,
  ShoppingBag,
  Check,
  Sparkles,
  Crown,
  Zap
} from 'lucide-react';
import { GPLTheme } from '../types';
import { safeUrl } from '../lib/security';
import { badgeLabelAr } from '../lib/store';

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

export const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  onSelectTheme,
  onAddToCart,
  onInstantBuy,
  isInCart,
}) => {
  const discountPercent = Math.round(((theme.originalPrice - theme.price) / theme.originalPrice) * 100);
  // SECURITY: only http(s) URLs reach href/src (blocks javascript:/data: payloads from DB)
  const demoUrl = safeUrl(theme.demoUrl);
  const thumbnail = safeUrl(theme.thumbnail);

  return (
    <div
      onClick={() => onSelectTheme(theme)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          onSelectTheme(theme);
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`عرض تفاصيل ${theme.title}`}
      className="group bg-white rounded-[1.25rem] border border-slate-200/80 overflow-hidden shadow-[0_1px_2px_rgba(11,19,43,0.05)] hover:shadow-[0_20px_45px_-20px_rgba(11,19,43,0.35)] hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer [content-visibility:auto] [contain-intrinsic-size:auto_440px]"
    >
      {/* Thumbnail — 590×300 fixed aspect reserves space (CLS ≤0.1 on mobile) */}
      <div className="relative aspect-[590/300] overflow-hidden bg-slate-100">
        <img
          src={thumbnail || undefined}
          alt={`تحميل قالب ${theme.title} GPL الأصلي - ${theme.categoryNameAr}`}
          width={590}
          height={300}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />

        {/* Soft legibility gradient (bottom only) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b132b]/40 via-transparent to-transparent pointer-events-none" />

        {/* Top row: discount (start) / curated badge (end) */}
        <div className="absolute top-3 right-3 left-3 z-10 flex items-start justify-between gap-2">
          {discountPercent > 0 ? (
            <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-extrabold shadow-sm">
              خصم {discountPercent}%
            </span>
          ) : (
            <span />
          )}
          {theme.badge === 'exclusive' ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-300 text-[#0b132b] text-[11px] font-extrabold shadow-sm flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" aria-hidden="true" />
              {badgeLabelAr(theme.badge)}
            </span>
          ) : theme.badge === 'featured' ? (
            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-[#0b132b] text-[11px] font-extrabold shadow-sm flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" aria-hidden="true" />
              {badgeLabelAr(theme.badge)}
            </span>
          ) : null}
        </div>

        {/* Live demo pill (desktop hover only) */}
        {demoUrl ? (
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3 z-10 hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-[#0b132b] text-[11px] font-bold shadow-md opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:bg-white cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#1e3a8a]" />
            <span>معاينة حية</span>
          </a>
        ) : null}
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Meta: taxonomy (start) / rating (end) */}
        <div className="flex items-center justify-between gap-2 text-[11px] mb-2">
          <span className="text-slate-400 font-semibold truncate">
            {theme.categoryNameAr} • {theme.platform}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-extrabold text-[#0b132b]">{theme.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-medium">({theme.reviewsCount})</span>
          </span>
        </div>

        {/* Theme Title — dir=auto keeps English-title truncation on the correct side */}
        <h3
          dir="auto"
          className="font-extrabold text-[#0b132b] text-[15px] leading-snug text-right line-clamp-1"
          title={theme.title}
        >
          <a
            href={`/theme/${theme.slug}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectTheme(theme);
            }}
            className="group-hover:text-[#1e3a8a] transition-colors duration-200"
          >
            {theme.title} GPL
          </a>
        </h3>

        {/* Short Description */}
        <p dir="auto" className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed text-right">
          {theme.shortDescription}
        </p>

        {/* Price + CTA footer */}
        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2 pb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-[#0b132b] font-mono">
                  {formatCurrency(theme.price)}
                </span>
                {theme.originalPrice > theme.price ? (
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrency(theme.originalPrice)}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                <DownloadCloud className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{formatCompact(theme.downloadsCount)} تحميل • ترخيص GPL دائم</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              id={`card-add-cart-${theme.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(theme);
              }}
              className={`flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-extrabold transition-colors duration-200 cursor-pointer ${
                isInCart
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  : 'bg-[#0b132b] hover:bg-[#1e3a8a] text-white shadow-sm'
              }`}
              aria-label={isInCart ? 'موجود في سلة التسوق' : `أضف ${theme.title} إلى السلة`}
            >
              {isInCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              <span>{isInCart ? 'في السلة' : 'أضف إلى السلة'}</span>
            </button>

            <button
              id={`card-buy-now-${theme.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onInstantBuy(theme);
              }}
              className="p-2.5 min-w-[46px] min-h-[46px] flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors duration-200 cursor-pointer"
              title="شراء فوري"
              aria-label={`شراء ${theme.title} فوري`}
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

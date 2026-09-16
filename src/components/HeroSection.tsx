import React from 'react';
import {
  ArrowLeft,
  Star,
  DownloadCloud,
  Layers,
} from 'lucide-react';
import { formatCompact } from './ThemeCard';
import type { PlatformDef } from '../lib/settings';

export interface HeroStats {
  themesCount: number;
  downloadsTotal: number;
  avgRating: number;
}

interface HeroSectionProps {
  onExploreClick: () => void;
  onOpenGPLModal: () => void;
  stats: HeroStats | null;
  platforms?: PlatformDef[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onOpenGPLModal,
  stats,
  platforms = [],
}) => {
  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200">
      {/* Faint grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_65%_60%_at_50%_0%,#000_60%,transparent_100%)] pointer-events-none"
      />
      {/* Faded code decorations (developer vibe) — peeking from the edges on all screens */}
      <div
        aria-hidden="true"
        dir="ltr"
        className="absolute top-8 -left-8 sm:left-6 font-mono text-[10px] sm:text-[11px] leading-relaxed text-slate-300 opacity-70 sm:opacity-100 select-none pointer-events-none [mask-image:linear-gradient(to_bottom,#000_30%,transparent)]"
      >
        <pre>{`$ wp theme install minimog --activate\n✓ activated on 12 sites\nlicense: GPL-3.0-or-later\nversion: 6.0.0\n$ wp cache flush\n✓ success`}</pre>
      </div>
      <div
        aria-hidden="true"
        dir="ltr"
        className="absolute bottom-8 -right-8 sm:right-6 text-right font-mono text-[10px] sm:text-[11px] leading-relaxed text-slate-300 opacity-70 sm:opacity-100 select-none pointer-events-none [mask-image:linear-gradient(to_top,#000_30%,transparent)]"
      >
        <pre>{`<Theme name="Glozin" version="1.9.1" />\n{/* 85+ demos included */}\n// no license key required\nadd_filter( 'gpl', '__return_true' );\n$ echo "deployed ✓"`}</pre>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 sm:pt-16 sm:pb-16 relative">
        <div className="text-center max-w-2xl mx-auto">
          {/* Sharp tag */}
          <p className="inline-flex items-center gap-2 bg-[#0b132b] text-white text-[11px] font-bold px-3 py-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400" aria-hidden="true" />
            <span>نسخ أصلية 100% — من غير مفاتيح تفعيل</span>
          </p>

          {/* Main headline */}
          <h1 className="mt-5 text-3xl sm:text-5xl font-black text-[#0b132b] tracking-tight leading-[1.35]">
            ثيمات شوبيفاي وووردبريس الأصلية
            <span className="block text-[#1e3a8a]">ادفع مرة واحدة… واستخدمها على كل مواقعك</span>
          </h1>

          {/* Value proposition */}
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            بنوفر لك أشهر قوالب شوبيفاي GPL وقوالب Shopify وثيمات ووردبريس بنسخها الكاملة الأصلية — من غير اشتراكات ومن غير حدود
            على عدد المواقع والمتاجر. اطلب دلوقتي وروابط التحميل توصلك على إيميلك في ثواني.
          </p>

          {/* CTAs — sharp edges */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="hero-explore-btn"
              onClick={onExploreClick}
              className="w-full sm:w-auto px-8 py-3.5 min-h-[52px] bg-[#0b132b] hover:bg-[#1e3a8a] text-white text-base font-extrabold rounded-none transition-colors duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>اختار قالبك</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              id="hero-gpl-explainer-btn"
              onClick={onOpenGPLModal}
              className="w-full sm:w-auto px-6 py-3.5 min-h-[52px] text-sm font-bold text-[#0b132b] border border-slate-300 hover:border-[#0b132b] bg-white rounded-none transition-colors duration-200 cursor-pointer"
            >
              يعني إيه GPL؟
            </button>
          </div>

          {/* Supported platforms */}
          {platforms.length > 0 && (
            <p className="mt-5 text-[11px] font-semibold text-slate-400 tracking-wide">
              {platforms.map((p) => p.label).join('  •  ')}
            </p>
          )}

          {/* Live social proof (real catalog numbers).
              Placeholder reserves the exact strip height while loading (CLS ≤ 0.1). */}
          {stats && stats.themesCount > 0 ? (
            <dl className="mt-7 grid grid-cols-3 divide-x divide-x-reverse divide-slate-200 bg-slate-50 border border-slate-200 px-2 py-4">
              <div className="px-2">
                <dt className="sr-only">عدد القوالب المتاحة</dt>
                <dd className="flex items-center justify-center gap-1.5 text-xl sm:text-2xl font-black text-[#0b132b] font-mono">
                  <Layers className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>{stats.themesCount}</span>
                </dd>
                <dd className="text-[11px] text-slate-500 mt-1">قالب أصلي</dd>
              </div>
              <div className="px-2">
                <dt className="sr-only">إجمالي التحميلات</dt>
                <dd className="flex items-center justify-center gap-1.5 text-xl sm:text-2xl font-black text-[#0b132b] font-mono">
                  <DownloadCloud className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>{formatCompact(stats.downloadsTotal)}</span>
                </dd>
                <dd className="text-[11px] text-slate-500 mt-1">عملية تحميل</dd>
              </div>
              <div className="px-2">
                <dt className="sr-only">متوسط التقييم</dt>
                <dd className="flex items-center justify-center gap-1.5 text-xl sm:text-2xl font-black text-[#0b132b] font-mono">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                  <span>{stats.avgRating.toFixed(1)}</span>
                </dd>
                <dd className="text-[11px] text-slate-500 mt-1">متوسط التقييم</dd>
              </div>
            </dl>
          ) : (
            <div
              aria-hidden="true"
              className="mt-7 grid grid-cols-3 divide-x divide-x-reverse divide-slate-200 bg-slate-50 border border-slate-200 px-2 py-4"
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="px-2 flex flex-col items-center gap-2">
                  <div className="h-7 sm:h-8 w-16 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-12 rounded bg-slate-200 animate-pulse" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

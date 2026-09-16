import React from 'react';
import { Search, Database, RefreshCw } from 'lucide-react';
import { CategoryFilter } from './CategoryFilter';
import { ThemeCard } from './ThemeCard';
import type { GPLTheme, ThemeCategory } from '../types';
import type { CategoryDef, PlatformDef } from '../lib/settings';

export type SortOption = 'popular' | 'rating' | 'newest' | 'price-asc' | 'price-desc';

/** Loading placeholder grid (8 shimmer cards). */
export function ThemeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-[1.25rem] border border-slate-200/80 overflow-hidden">
          <div className="aspect-[590/300] bg-slate-100 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-3/4 rounded-md bg-slate-100 animate-pulse" />
            <div className="h-3 w-full rounded-md bg-slate-100 animate-pulse" />
            <div className="h-3 w-1/2 rounded-md bg-slate-100 animate-pulse" />
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

/** Shown when Supabase credentials are missing from .env */
export function ConnectSupabaseState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
        <Database className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-[#0b132b]">اربط المتجر بقاعدة البيانات لعرض القوالب</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
        محتوى المتجر يُدار بالكامل من Supabase. أدخل بيانات الاتصال لعرض الكتالوج الحقيقي.
      </p>
      <p className="text-[11px] text-slate-400">يتم تفعيل الكتالوج تلقائياً فور ضبط إعدادات الاتصال.</p>
    </div>
  );
}

/** Shown when the catalog fetch fails */
export function ThemesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-12 text-center space-y-4" role="alert">
      <h3 className="text-base font-bold text-[#0b132b]">حدث خطأ أثناء تحميل الكتالوج</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 bg-[#0b132b] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        <span>إعادة المحاولة</span>
      </button>
    </div>
  );
}

interface CatalogPageProps {
  themes: GPLTheme[];
  themesLoading: boolean;
  storeConnected: boolean;
  themesError: string;
  onRetry: () => void;
  selectedCategory: ThemeCategory;
  onSelectCategory: (cat: ThemeCategory) => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onSelectTheme: (theme: GPLTheme) => void;
  onAddToCart: (theme: GPLTheme) => void;
  onInstantBuy: (theme: GPLTheme) => void;
  isInCart: (themeId: string) => boolean;
  onResetFilters: () => void;
  categories?: CategoryDef[];
  platforms?: PlatformDef[];
}

/**
 * gplify — dedicated catalog page (route: /catalog).
 * Header + filters + states (loading / connect / error / empty / grid).
 */
export const CatalogPage: React.FC<CatalogPageProps> = ({
  themes,
  themesLoading,
  storeConnected,
  themesError,
  onRetry,
  selectedCategory,
  onSelectCategory,
  selectedPlatform,
  onSelectPlatform,
  sortBy,
  onSortChange,
  onSelectTheme,
  onAddToCart,
  onInstantBuy,
  isInCart,
  onResetFilters,
  categories,
  platforms,
}) => {
  const renderGrid = () => {
    if (themesLoading) return <ThemeGridSkeleton />;
    if (!storeConnected) return <ConnectSupabaseState />;
    if (themesError) return <ThemesErrorState message={themesError} onRetry={onRetry} />;
    if (themes.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#0b132b]">لم يتم العثور على نتائج</h3>
          <p className="text-xs text-slate-500">حاول تغيير التصنيف أو مسح شريط البحث</p>
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-[#0b132b] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            عرض جميع القوالب
          </button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            onSelectTheme={onSelectTheme}
            onAddToCart={onAddToCart}
            onInstantBuy={onInstantBuy}
            isInCart={isInCart(theme.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-tajawal">
          كتالوج القوالب | ثيمات شوبيفاي وووردبريس الأصلية
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          تصفح كافة القوالب الأصلية: <a href="/shopify" className="font-bold text-[#1e3a8a] hover:underline">ثيمات شوبيفاي وقوالب Shopify</a>، ثيمات ووردبريس، قوالب ووكومرس للمتاجر — مع معاينة حية وتحميل فوري بعد الشراء برخصة قانونية لعدد غير محدود من المواقع.
        </p>
      </div>

      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        selectedPlatform={selectedPlatform}
        onSelectPlatform={onSelectPlatform}
        sortBy={sortBy}
        onSortChange={onSortChange}
        totalResults={themes.length}
        categories={categories}
        platforms={platforms}
      />

      {renderGrid()}
    </div>
  );
};

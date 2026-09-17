import React, { useMemo, useState } from 'react';
import { Search, SearchX, X, ArrowRight } from 'lucide-react';
import { ThemeCard } from './ThemeCard';
import { CategoryFilter } from './CategoryFilter';
import { ThemeGridSkeleton, ConnectSupabaseState, ThemesErrorState, type SortOption } from './CatalogPage';
import type { GPLTheme, ThemeCategory } from '../types';
import type { CategoryDef, PlatformDef } from '../lib/settings';
import { themeCategories, themePlatforms } from '../lib/store';

interface SearchPageProps {
  query: string;
  themes: GPLTheme[];
  themesLoading: boolean;
  storeConnected: boolean;
  themesError: string;
  onRetry: () => void;
  onSelectTheme: (theme: GPLTheme) => void;
  onAddToCart: (theme: GPLTheme) => void;
  onInstantBuy: (theme: GPLTheme) => void;
  isInCart: (themeId: string) => boolean;
  onClearSearch: () => void;
  onBrowseCatalog: () => void;
  categories?: CategoryDef[];
  platforms?: PlatformDef[];
}

function matchesQuery(t: GPLTheme, q: string): boolean {
  return (
    t.title.toLowerCase().includes(q) ||
    t.titleEn.toLowerCase().includes(q) ||
    t.shortDescription.toLowerCase().includes(q) ||
    t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
    t.categoryNameAr.toLowerCase().includes(q)
  );
}

/**
 * صفحة نتائج البحث المستقلة (route: /search?q=...).
 * معزولة تماماً عن فلاتر الرئيسية والكتالوج — البحث لا يفلتر الصفحات الأخرى،
 * لكن نتائج البحث نفسها قابلة للتصفية (تصنيف + منصة + ترتيب) زي الكتالوج.
 */
export const SearchPage: React.FC<SearchPageProps> = ({
  query,
  themes,
  themesLoading,
  storeConnected,
  themesError,
  onRetry,
  onSelectTheme,
  onAddToCart,
  onInstantBuy,
  isInCart,
  onClearSearch,
  onBrowseCatalog,
  categories,
  platforms,
}) => {
  const q = query.toLowerCase().trim();

  // فلاتر خاصة بصفحة البحث فقط (مستقلة عن فلاتر home/catalog)
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const baseResults = useMemo(() => {
    if (!q) return [];
    return themes.filter((t) => matchesQuery(t, q));
  }, [themes, q]);

  const results = useMemo(() => {
    let list = [...baseResults];
    if (selectedCategory !== 'all') {
      list = list.filter((t) => themeCategories(t).includes(selectedCategory));
    }
    if (selectedPlatform !== 'all') {
      list = list.filter((t) => themePlatforms(t).includes(selectedPlatform));
    }
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
  }, [baseResults, selectedCategory, selectedPlatform, sortBy]);

  const hasActiveFilters = selectedCategory !== 'all' || selectedPlatform !== 'all';
  const resetSearchFilters = () => {
    setSelectedCategory('all');
    setSelectedPlatform('all');
    setSortBy('popular');
  };

  if (themesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SearchPageHeader query={query} count={null} onClearSearch={onClearSearch} />
        <ThemeGridSkeleton />
      </div>
    );
  }
  if (!storeConnected) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ConnectSupabaseState />
    </div>
  );
  if (themesError) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ThemesErrorState message={themesError} onRetry={onRetry} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SearchPageHeader query={query} count={q ? results.length : null} onClearSearch={onClearSearch} />

      {!q ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-[#0b132b]">اكتب كلمة للبحث في القوالب</h2>
          <p className="text-xs text-slate-500">جرب البحث بكلمات مثل (ميلانو، متجر، بورتفوليو، شوبيفاي...)</p>
          <button
            onClick={onBrowseCatalog}
            className="px-4 py-2 bg-[#0b132b] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            تصفح كل القوالب
          </button>
        </div>
      ) : (
        <>
          {/* نفس فلاتر الكتالوج: تصنيفات + منصة + ترتيب — مطبقة على نتائج البحث فقط */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={setSelectedPlatform}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalResults={results.length}
            categories={categories}
            platforms={platforms}
          />

          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <SearchX className="w-10 h-10 text-slate-300 mx-auto" />
              <h2 className="text-base font-bold text-[#0b132b]">لا توجد نتائج لـ «{query.trim()}»</h2>
              <p className="text-xs text-slate-500">
                {hasActiveFilters
                  ? 'جرب إزالة الفلاتر أو البحث بكلمات عامة أكثر'
                  : 'جرب كلمات عامة أكثر أو تصفح الكتالوج كاملاً'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                {hasActiveFilters && (
                  <button
                    onClick={resetSearchFilters}
                    className="px-4 py-2 bg-white border border-slate-300 text-[#0b132b] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    إزالة الفلاتر
                  </button>
                )}
                <button
                  onClick={onClearSearch}
                  className="px-4 py-2 bg-white border border-slate-300 text-[#0b132b] text-xs font-bold rounded-xl cursor-pointer"
                >
                  مسح البحث
                </button>
                <button
                  onClick={onBrowseCatalog}
                  className="px-4 py-2 bg-[#0b132b] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  تصفح كل القوالب
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((theme) => (
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
          )}
        </>
      )}
    </div>
  );
};

function SearchPageHeader({
  query,
  count,
  onClearSearch,
}: {
  query: string;
  count: number | null;
  onClearSearch: () => void;
}) {
  return (
    <div className="pb-4 border-b border-slate-200 space-y-2">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={onClearSearch}
          className="inline-flex items-center gap-1 font-bold text-[#1e3a8a] hover:text-[#0b132b] transition cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>رجوع للكتالوج</span>
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-tajawal">
          {query.trim() ? (
            <>نتائج البحث عن «<span className="text-[#1e3a8a]">{query.trim()}</span>»</>
          ) : (
            'البحث في القوالب'
          )}
        </h1>
        {query.trim() && (
          <button
            onClick={onClearSearch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-full hover:border-slate-500 transition cursor-pointer"
            aria-label="مسح البحث"
          >
            <X className="w-3.5 h-3.5" />
            <span>مسح البحث</span>
          </button>
        )}
      </div>
      {count !== null && (
        <p className="text-xs text-slate-500">
          <strong className="text-[#0b132b] font-extrabold font-mono">{count}</strong>
          {' '}قالب مطابق
        </p>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeCategory } from '../types';
import { CATEGORIES_LIST, PLATFORMS_LIST } from '../data/themes';
import type { CategoryDef, PlatformDef } from '../lib/settings';

interface DropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  id: string;
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  /** Align the panel to the button's start (right in RTL) or end (left) edge */
  align?: 'start' | 'end';
}

/** Custom dropdown — same designed panel on desktop & mobile (no native OS picker). */
const FilterDropdown: React.FC<FilterDropdownProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  align = 'start',
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const active = value !== options[0]?.value;

  // Close on outside tap/click + Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border pl-3 pr-4 py-2.5 min-h-[44px] text-xs font-bold cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b132b] focus-visible:ring-offset-1 max-w-[150px] sm:max-w-none ${
          active || open
            ? 'bg-white text-[#0b132b] border-[#0b132b]'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
        }`}
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${active || open ? 'text-[#0b132b]' : 'text-slate-400'}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className={`absolute top-full mt-2 z-30 min-w-[190px] w-max max-w-[72vw] rounded-xl border border-slate-200 bg-white shadow-[0_20px_45px_-15px_rgba(11,19,43,0.35)] p-1.5 max-h-72 overflow-y-auto ${
            align === 'end' ? 'left-0' : 'right-0'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 min-h-[44px] text-xs text-right transition-colors duration-150 cursor-pointer ${
                  isSelected
                    ? 'text-[#0b132b] font-extrabold'
                    : 'text-slate-600 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CategoryFilterProps {
  selectedCategory: ThemeCategory;
  onSelectCategory: (cat: ThemeCategory) => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  sortBy: 'popular' | 'rating' | 'newest' | 'price-asc' | 'price-desc';
  onSortChange: (sort: 'popular' | 'rating' | 'newest' | 'price-asc' | 'price-desc') => void;
  totalResults: number;
  /** Owner-editable taxonomy (admin panel → settings). Falls back to built-in lists. */
  categories?: CategoryDef[];
  platforms?: PlatformDef[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedPlatform,
  onSelectPlatform,
  sortBy,
  onSortChange,
  totalResults,
  categories,
  platforms,
}) => {
  const cats = [
    { id: 'all', nameAr: 'الكل' },
    ...(categories && categories.length > 0
      ? categories
      : CATEGORIES_LIST.filter((c) => c.id !== 'all')),
  ];
  const plats: DropdownOption[] = [
    { value: 'all', label: 'كل المنصات' },
    ...(platforms && platforms.length > 0
      ? platforms.map((p) => ({ value: p.id, label: p.label }))
      : PLATFORMS_LIST.filter((p) => p.id !== 'all').map((p) => ({
          value: p.id,
          label: p.label,
        }))),
  ];
  const sortOptions: DropdownOption[] = [
    { value: 'popular', label: 'الأكثر تحميلاً' },
    { value: 'rating', label: 'الأعلى تقييماً' },
    { value: 'newest', label: 'الأحدث' },
    { value: 'price-asc', label: 'السعر: من الأقل' },
    { value: 'price-desc', label: 'السعر: من الأعلى' },
  ];

  // Mobile scroll hints: arrows over the category row edges so users
  // on small screens know there's more to swipe (RTL-aware).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canNext, setCanNext] = useState(false);
  const [canPrev, setCanPrev] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 4) {
      setCanNext(false);
      setCanPrev(false);
      return;
    }
    const pos = Math.abs(el.scrollLeft);
    setCanPrev(pos > 8);
    setCanNext(pos < max - 8);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats.length]);

  const nudge = (forward: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    const isRTL = getComputedStyle(el).direction === 'rtl';
    const amount = Math.min(240, el.clientWidth * 0.7);
    el.scrollBy({ left: forward === isRTL ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="mb-6 sm:mb-8 space-y-3">
      {/* Categories — horizontal scroll on mobile with animated hint arrows */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          role="tablist"
          aria-label="تصنيفات القوالب"
        className="flex items-center gap-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cats.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectCategory(cat.id as ThemeCategory)}
              className={`shrink-0 px-1 py-2.5 min-h-[44px] text-xs border-b-2 transition-colors duration-200 cursor-pointer ${
                active
                  ? 'text-[#0b132b] font-extrabold border-[#0b132b]'
                  : 'text-slate-500 font-bold border-transparent hover:text-[#0b132b]'
              }`}
            >
              {cat.nameAr}
            </button>
          );
        })}
        </div>

        {/* Scroll hints — mobile only, hidden once the edge is reached */}
        {canNext && (
          <>
            <span
              aria-hidden="true"
              className="sm:hidden pointer-events-none absolute top-0 bottom-1 left-0 w-12 bg-gradient-to-r from-[#f8fafc] to-transparent"
            />
            <button
              type="button"
              onClick={() => nudge(true)}
              aria-label="عرض تصنيفات أكثر"
              className="sm:hidden absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#0b132b] active:scale-95 transition-transform cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
        {canPrev && (
          <>
            <span
              aria-hidden="true"
              className="sm:hidden pointer-events-none absolute top-0 bottom-1 right-0 w-12 bg-gradient-to-l from-[#f8fafc] to-transparent"
            />
            <button
              type="button"
              onClick={() => nudge(false)}
              aria-label="رجوع للتصنيفات السابقة"
              className="sm:hidden absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#0b132b] active:scale-95 transition-transform cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Toolbar: results count + platform + sort */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-slate-500">
          <strong className="text-[#0b132b] font-extrabold font-mono">{totalResults}</strong>
          {' '}قالب متاح
        </p>
        <div className="ms-auto flex items-center gap-2">
          <FilterDropdown
            id="select-platforms"
            label="تصفية حسب المنصة"
            value={selectedPlatform}
            options={plats}
            onChange={onSelectPlatform}
            align="start"
          />
          <FilterDropdown
            id="select-sort-by"
            label="ترتيب حسب"
            value={sortBy}
            options={sortOptions}
            onChange={(v) => onSortChange(v as any)}
            align="end"
          />
        </div>
      </div>
    </div>
  );
};

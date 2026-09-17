import React, { useEffect, useMemo, useState } from 'react';
import { Search, LayoutTemplate, ShieldCheck, Zap, BadgeCheck, RefreshCw } from 'lucide-react';
import { ThemeCard } from './ThemeCard';
import { CategoryFilter } from './CategoryFilter';
import { ThemeGridSkeleton, ConnectSupabaseState, ThemesErrorState, type SortOption } from './CatalogPage';
import type { GPLTheme, ThemeCategory } from '../types';
import type { CategoryDef, PlatformDef } from '../lib/settings';
import { themeCategories, themePlatforms } from '../lib/store';

interface WordpressPageProps {
  themes: GPLTheme[];
  themesLoading: boolean;
  storeConnected: boolean;
  themesError: string;
  onRetry: () => void;
  onSelectTheme: (theme: GPLTheme) => void;
  onAddToCart: (theme: GPLTheme) => void;
  onInstantBuy: (theme: GPLTheme) => void;
  isInCart: (themeId: string) => boolean;
  categories?: CategoryDef[];
  platforms?: PlatformDef[];
}

const WORDPRESS_FAQ = [
  {
    q: 'يعني ايه ثيمات ووردبريس GPL؟',
    a: 'ثيمات ووردبريس GPL هي نسخ أصلية 100% من أشهر قوالب ووردبريس المدفوعة (زي Astra Pro، Avada، WoodMart، Flatsome، Divi وغيرها) بنوفرها لك بملفات نظيفة ومفحوصة بسعر أقل بكتير من سعرها الرسمي، مع تسليم فوري عبر البريد الإلكتروني.',
  },
  {
    q: 'هل القوالب متوافقة مع ووكومرس وإليمنتور؟',
    a: 'أيوه — أغلب ثيمات ووردبريس عندنا متوافقة مع ووكومرس للمتاجر ومع إليمنتور وجوتنبرج لتصميم الصفحات بالسحب والإفلات. كل صفحة قالب مكتوب فيها المنصات المدعومة قبل ما تشتري.',
  },
  {
    q: 'ازاي بثبت قالب ووردبريس بعد الشراء؟',
    a: 'بعد الدفع بفودافون كاش أو انستاباي بيوصلك إيميل فيه ملف القالب بصيغة ZIP، بتدخل على لوحة تحكم ووردبريس ثم المظهر ثم قوالب ثم إضافة جديد ورفع قالب — والموضوع بياخد دقيقتين، والملف زي الأصلي بالظبط بدون أي تعديل.',
  },
  {
    q: 'هل قالب ووردبريس بيشتغل على أكثر من موقع؟',
    a: 'أيوه — نسخ GPL بتشتغل على أي عدد مواقع تملكها بدون مفاتيح تفعيل وبدون اشتراك سنوي. تشتري مرة واحدة وتستخدم القالب في كل مواقعك.',
  },
  {
    q: 'ايه الفرق بين قوالب ووردبريس الأصلية والنسخ المجانية (nulled)؟',
    a: 'النسخ المجانية (nulled) من المنتديات غالبا قديمة ومليانة ثغرات ومالوير وروابط سبام ممكن تدمر ترتيب موقعك في جوجل. نسخ gplify أصلية من المطور، بأحدث إصدار متوفر، مفحوصة أمنيا، ومعاها دعم توجيهي للتثبيت.',
  },
];

/**
 * صفحة هبوط مخصصة لكلمات: ثيمات ووردبريس GPL / قوالب ووردبريس / ووكومرس
 * / قالب ووردبريس / wordpress themes — الرابط: /wordpress
 */
export const WordpressPage: React.FC<WordpressPageProps> = ({
  themes,
  themesLoading,
  storeConnected,
  themesError,
  onRetry,
  onSelectTheme,
  onAddToCart,
  onInstantBuy,
  isInCart,
  categories,
  platforms,
}) => {
  // فلاتر خاصة بالصفحة (مستقلة عن فلاتر home/catalog/search)
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  useEffect(() => {
    const id = 'wordpress-faq-schema';
    let el = document.head.querySelector<HTMLScriptElement>(`script[data-seo="${id}"]`);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-seo', id);
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'ar',
      mainEntity: WORDPRESS_FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }, []);

  const filtered = useMemo(() => {
    let list = [...themes];
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
  }, [themes, selectedCategory, selectedPlatform, sortBy]);

  const hasActiveFilters = selectedCategory !== 'all' || selectedPlatform !== 'all';
  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedPlatform('all');
    setSortBy('popular');
  };

  const updatedLabel = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });

  const renderGrid = () => {
    if (themesLoading) return <ThemeGridSkeleton />;
    if (!storeConnected) return <ConnectSupabaseState />;
    if (themesError) return <ThemesErrorState message={themesError} onRetry={onRetry} />;
    if (themes.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#0b132b]">قوالب ووردبريس بتتجهز دلوقتي</h3>
          <p className="text-xs text-slate-500">بنرفع دفعة جديدة من ثيمات ووردبريس GPL — تصفح باقي الكتالوج لحد ما تنزل.</p>
          <a href="/catalog" className="inline-block px-4 py-2 bg-[#0b132b] text-white text-xs font-bold rounded-xl">
            تصفح كل القوالب
          </a>
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#0b132b]">لا توجد قوالب مطابقة للفلاتر الحالية</h3>
          <p className="text-xs text-slate-500">جرب إزالة الفلاتر لعرض كل ثيمات ووردبريس</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-[#0b132b] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            إزالة الفلاتر
          </button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((theme) => (
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="text-xs text-slate-500">
        <a href="/" className="hover:text-[#0b132b]">الرئيسية</a>
        <span className="mx-1.5">/</span>
        <a href="/catalog" className="hover:text-[#0b132b]">تحميل قوالب GPL</a>
        <span className="mx-1.5">/</span>
        <span className="text-[#0b132b] font-bold">ثيمات ووردبريس GPL</span>
      </nav>

      {/* H1 + intro — كل الكلمات المستهدفة في أول 150 كلمة */}
      <header className="pb-6 border-b border-slate-200 space-y-3">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#1e3a8a] bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
          <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>نسخ أصلية 100% — ووكومرس وإليمنتور مدعومة</span>
        </p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0b132b] font-tajawal leading-snug">
          تحميل ثيمات ووردبريس | قوالب WordPress الأصلية
        </h1>
        <p className="text-sm text-slate-600 leading-loose max-w-3xl">
          لو بتدور على <strong>ثيمات ووردبريس</strong> أو <strong>قوالب ووردبريس</strong> بسعر رخيص، فـ gplify بيجمع لك أشهر{' '}
          <strong>قوالب WordPress</strong> العالمية — بما فيها قوالب <strong>ووكومرس</strong> للمتاجر والقوالب المتوافقة مع{' '}
          <strong>إليمنتور</strong> — بنسخ <strong>GPL</strong> أصلية ونظيفة 100% بدل ما تخاطر بالنسخ{' '}
          <strong>المجانية (nulled)</strong> المضروبة اللي مليانة فيروسات. كل الثيمات محدثة لآخر إصدار، بتشتغل على أي عدد مواقع من غير مفاتيح تفعيل،
          وبتوصلك برابط تحميل فوري على إيميلك بعد الدفع بفودافون كاش أو انستاباي بالجنيه المصري.
        </p>
        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500">
          {['ثيمات ووردبريس gpl', 'قوالب ووردبريس', 'قوالب ووكومرس', 'قالب ووردبريس عربي'].map((k) => (
            <span key={k} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-600">
              {k}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-slate-400">آخر تحديث للتشكيلة: {updatedLabel}</p>
      </header>

      {/* Filters — نفس فلاتر الكتالوج على قوالب ووردبريس فقط */}
      {!themesLoading && storeConnected && !themesError && themes.length > 0 && (
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalResults={filtered.length}
          categories={categories}
          platforms={platforms}
        />
      )}

      {/* Product grid */}
      {renderGrid()}

      {/* SEO content block */}
      <section aria-label="دليل تحميل قوالب ووردبريس" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-tajawal leading-relaxed">
            ليه تشتري قوالب ووردبريس GPL من gplify بدل النسخ المجانية؟
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600 leading-loose">
          <div className="space-y-3">
            <h3 className="font-bold text-[#0b132b]">مشكلة قوالب ووردبريس المجانية (nulled)</h3>
            <p>
              أغلب مواقع <strong>ووردبريس مجاني</strong> بتوزع ملفات قديمة ومسروقة: أكواد ملغومة بتسرق بيانات موقعك،
              روابط سبام بتدمر ترتيبك في جوجل، وإصدارات قديمة بتكسر مع تحديثات ووردبريس وووكومرس الجديدة وممكن توقف موقعك تماما.
            </p>
            <p>
              عندنا بتاخد <strong>نسخ GPL</strong> أصلية من المطور مباشرة: <strong>تحميل قوالب ووردبريس</strong> بملفات
              نظيفة ومفحوصة أمنيا، بأحدث إصدار متوفر — بسعر أقل من 10% من السعر الرسمي.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-[#0b132b]">مميزات ثيمات ووردبريس عندنا</h3>
            <ul className="space-y-2">
              <li className="flex gap-2"><LayoutTemplate className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-1" /><span><strong>قوالب WordPress أصلية:</strong> نفس كود المطور بدون تعديل أو حقن.</span></li>
              <li className="flex gap-2"><Zap className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-1" /><span><strong>تسليم فوري:</strong> رابط ZIP بيوصلك على البريد في ثواني بعد الدفع.</span></li>
              <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-1" /><span><strong>مواقع غير محدودة:</strong> ثبت أي قالب على كل مواقعك بدون مفاتيح.</span></li>
              <li className="flex gap-2"><RefreshCw className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-1" /><span><strong>متوافقة مع ووكومرس وإليمنتور:</strong> المنصات المدعومة مكتوبة على كل قالب.</span></li>
            </ul>
          </div>
        </div>

        {/* Comparison table — نسخ GPL مقابل nulled */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border border-slate-200 rounded-2xl overflow-hidden">
            <caption className="text-right font-bold text-[#0b132b] pb-2">مقارنة سريعة: نسخ GPL الأصلية مقابل النسخ المجانية (nulled)</caption>
            <thead>
              <tr className="bg-slate-50 text-[#0b132b]">
                <th scope="col" className="p-3 text-right font-extrabold">وجه المقارنة</th>
                <th scope="col" className="p-3 text-right font-extrabold">نسخ gplify الأصلية</th>
                <th scope="col" className="p-3 text-right font-extrabold">النسخ المجانية</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr className="border-t border-slate-200"><td className="p-3 font-bold">مصدر الملفات</td><td className="p-3">من المطور مباشرة بدون تعديل</td><td className="p-3">منتديات مجهولة ومعدلة</td></tr>
              <tr className="border-t border-slate-200"><td className="p-3 font-bold">الأمان</td><td className="p-3">مفحوصة أمنيا ونظيفة 100%</td><td className="p-3">غالبا فيها مالوير وروابط سبام</td></tr>
              <tr className="border-t border-slate-200"><td className="p-3 font-bold">التحديثات</td><td className="p-3">أحدث إصدار متوفر من المطور</td><td className="p-3">إصدارات قديمة ومكسورة</td></tr>
              <tr className="border-t border-slate-200"><td className="p-3 font-bold">عدد المواقع</td><td className="p-3">غير محدود بدون مفاتيح</td><td className="p-3">غير مضمونة الاستقرار</td></tr>
            </tbody>
          </table>
        </div>

        <nav aria-label="تصفح أقسام المتجر" className="flex flex-wrap gap-2 pt-2">
          <a href="/catalog" className="px-4 py-2 bg-[#0b132b] text-white text-xs font-bold rounded-xl hover:bg-[#1e293b] transition">تصفح كتالوج قوالب GPL كامل</a>
          <a href="/shopify" className="px-4 py-2 bg-slate-100 text-[#0b132b] text-xs font-bold rounded-xl border border-slate-200 hover:border-[#0b132b] transition">تحميل ثيمات شوبيفاي GPL</a>
        </nav>
      </section>

      {/* FAQ */}
      <section aria-label="الأسئلة الشائعة عن ثيمات ووردبريس" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-tajawal mb-1">الأسئلة الشائعة عن تحميل ثيمات ووردبريس GPL</h2>
        <p className="text-xs text-slate-500 mb-4">كل اللي محتاج تعرفه عن قوالب WordPress وووكومرس والترخيص والتثبيت والدفع.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {WORDPRESS_FAQ.map((f, i) => (
            <details key={i} className="group bg-slate-50 rounded-2xl border border-slate-200 p-4 open:bg-white open:shadow-sm transition">
              <summary className="cursor-pointer text-sm font-bold text-[#0b132b] list-none flex items-start justify-between gap-3">
                <span>{f.q}</span>
                <span className="text-[#1e3a8a] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};

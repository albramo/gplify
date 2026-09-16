import React, { useEffect } from 'react';

/**
 * سكاشن السيو العربي للصفحة الرئيسية — يستهدف كلمات:
 * قوالب GPL / ثيمات GPL / تحميل قوالب ووردبريس / متجر GPL عربي / مواقع GPL
 * + FAQ Schema لظهور Featured Snippets + إجابات AI
 */
const FAQ_ITEMS = [
  {
    q: 'هل كل القوالب على الموقع برخصة GPL؟',
    a: 'لا — معظم القوالب معروضة برخصة GPL قانونية (v2/v3)، لكن في منتجات تانية معروضة بدون رخصة. قبل ما تشتري أي قالب لازم تتأكد من صفحة المنتج نفسها: لو مذكور فيها نوع الرخصة يبقى مشمول بها، ولو مش مذكور أي رخصة يبقى المنتج بدون رخصة وبيتباع بحالته كما هو. ولو مش متأكد اسألنا من صفحة تواصل معنا قبل الدفع.',
  },
  {
    q: 'ما هي قوالب GPL وهل هي قانونية؟',
    a: 'قوالب GPL هي ثيمات ووردبريس وإضافات أصلية مرخصة برخصة GNU العامة (GPL v2/v3) نفس رخصة الووردبريس نفسه. الرخصة بتديك حق قانوني كامل تستخدم القالب على عدد غير محدود من المواقع وتعدل عليه وتعيد توزيعه. ملاحظة مهمة: الكلام ده ينطبق على المنتجات اللي صفحتها مذكور فيها رخصة GPL فقط — راجع سؤال "هل كل القوالب برخصة GPL؟" فوق.',
  },
  {
    q: 'ازاي بحمل القالب بعد الشراء؟',
    a: 'فور إتمام الدفع (فودافون كاش أو انستاباي) بيوصلك إيميل تلقائي فيه روابط التحميل المباشرة لملفات ZIP الأصلية زي ما هي بدون أي تعديل + الفاتورة. التسليم فوري في ثواني بدون انتظار.',
  },
  {
    q: 'هل القالب يشتغل على أكثر من موقع؟',
    a: 'أيوه. بترخيص GPL تقدر تثبت أي قالب اشتريته من gplify على أي عدد مواقع ودومينات تملكها — مواقع عملاء، متاجر ووكومرس، مدونات — بدون رسوم إضافية أو اشتراك سنوي.',
  },
  {
    q: 'هل الملفات نظيفة وآمنة؟',
    a: 'كل قالب بيعدي على فحص أمني كامل قبل رفعه: كود أصلي من المطور، بدون فيروسات أو روابط خبيثة أو إعلانات مخفية. وبنعرض أحدث إصدار متوفر من المطور وقت إضافة القالب للكتالوج.',
  },
  {
    q: 'ايه الفرق بين الشراء منكم ومن المطور الأصلي؟',
    a: 'نفس الملف الأصلي بالظبط بدون أي تعديل، لكن بسعر أقل بكتير لأنك بتشتري برخصة GPL بدل رخصة الموقع الواحد الغالية. الفرق الوحيد: الدعم المباشر من المطور بيكون للمشترين من موقعه، واحنا بنعوض ده بتوجيه للتنصيب والتفعيل.',
  },
  {
    q: 'هل عندكم ثيمات شوبيفاي GPL؟',
    a: 'أيوه — عندنا قسم كامل لثيمات شوبيفاي وقوالب Shopify الأصلية بنسخ نظيفة 100% بسعر رخيص بالجنيه المصري مع تسليم فوري عبر البريد. افتح صفحة ثيمات شوبيفاي من القائمة واختار قالبك وشوف الديمو قبل الشراء.',
  },
  {
    q: 'بتدعموا الدفع في مصر؟',
    a: 'أيوه — الدفع بفودافون كاش وانستاباي، والأسعار كلها بالجنيه المصري بدون رسوم خفية. بعد التحويل بتأكد الطلب وبيوصلك التحميل على إيميلك فورا.',
  },
];

export const HomeSeoSections: React.FC<{ themesCount: number }> = ({ themesCount }) => {
  // FAQ JSON-LD للصفحة الرئيسية (Rich Results + AI Citations)
  useEffect(() => {
    const id = 'home-faq-schema';
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
      mainEntity: FAQ_ITEMS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }, []);

  return (
    <>
      {/* 1) محتوى تعريفي غني بالكلمات المفتاحية */}
      <section aria-label="دليل تحميل قوالب GPL بالعربي" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="max-w-3xl">
            <p className="text-xs font-bold text-[#1e3a8a] mb-2">ثيمات شوبيفاي GPL وقوالب Shopify — متجر GPL العربي في مصر</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-tajawal leading-relaxed">
              تحميل ثيمات شوبيفاي GPL وقوالب Shopify وثيمات ووردبريس الأصلية
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600 leading-loose">
            <div className="space-y-3">
              <h3 className="font-bold text-[#0b132b]">ليه تشتري قوالب GPL من gplify؟</h3>
              <p>
                لو بتدور على <strong>ثيمات شوبيفاي GPL</strong> أو <strong>قوالب شوبيفاي</strong> بسعر رخيص، فـ gplify معمول مخصوص ليك: بنجمع لك أشهر{' '}
                <strong>قوالب Shopify</strong> و<strong>ثيمات Shopify</strong> العالمية بنسخ <strong>GPL</strong> أصلية
                100% — بديل آمن ومضمون للنسخ <strong>المجانية</strong> المضروبة — وبسعر أقل من 10% من سعر المطور. كل القوالب عندنا مفحوصة أمنيا، محدثة لآخر إصدار،
                وتشتغل على عدد غير محدود من المواقع والمتاجر.
              </p>
              <p>
                سواء عندك متجر شوبيفاي، متجر ووكومرس، مدونة، موقع شركة أو بورتفوليو — هتلاقي{' '}
                <strong>تحميل قوالب شوبيفاي</strong> و<strong>تحميل قوالب ووردبريس</strong> المناسبة لمشروعك مع معاينة حية (Live Demo) قبل الشراء، وتسليم فوري
                لملف ZIP على إيميلك بعد الدفع بفودافون كاش أو انستاباي.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-[#0b132b]">ايه اللي بيخلي ملفاتنا مضمونة؟</h3>
              <ul className="space-y-2">
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>ملفات أصلية غير معدلة:</strong> نفس كود المطور بدون حقن أو إعلانات.</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>ترخيص GPL v2/v3 قانوني:</strong> استخدام وتعديل لعدد لا نهائي من الدومينات.</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>أحدث إصدار متوفر:</strong> بنعرض آخر إصدار متاح من المطور وقت إضافة القالب ({themesCount > 0 ? `الكتالوج حاليا فيه ${themesCount} قالب` : 'كتالوج متجدد باستمرار'}).</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>تسليم فوري:</strong> رابط التحميل بيوصلك على البريد في ثواني، والملفات زي الأصلية بالظبط بدون أي تعديل.</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>دفع مصري سهل:</strong> فودافون كاش وانستاباي والأسعار بالجنيه المصري.</span></li>
              </ul>
            </div>
          </div>
          {/* روابط داخلية بكلمات مفتاحية (Internal Linking) */}
          <nav aria-label="تصفح أقسام قوالب GPL" className="flex flex-wrap gap-2 pt-2">
            <a href="/shopify" className="px-4 py-2 bg-[#0b132b] text-white text-xs font-bold rounded-xl hover:bg-[#1e293b] transition">ثيمات شوبيفاي GPL — قوالب Shopify</a>
            <a href="/catalog" className="px-4 py-2 bg-slate-100 text-[#0b132b] text-xs font-bold rounded-xl border border-slate-200 hover:border-[#0b132b] transition">تحميل قوالب ووردبريس GPL</a>
            <a href="/catalog" className="px-4 py-2 bg-slate-100 text-[#0b132b] text-xs font-bold rounded-xl border border-slate-200 hover:border-[#0b132b] transition">ثيمات ووكومرس للمتاجر</a>
            <a href="/catalog" className="px-4 py-2 bg-slate-100 text-[#0b132b] text-xs font-bold rounded-xl border border-slate-200 hover:border-[#0b132b] transition">قوالب الشركات والبورتفوليو</a>
          </nav>
        </div>
      </section>

      {/* 2) FAQ — أسئلة بصيغة البحث الصوتي العربي */}
      <section aria-label="الأسئلة الشائعة عن قوالب GPL" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-tajawal mb-1">الأسئلة الشائعة عن تحميل قوالب GPL</h2>
          <p className="text-xs text-slate-500 mb-4">إجابات مختصرة عن الترخيص والتحميل والدفع والاستخدام على أكثر من موقع.</p>
          {/* تنبيه التراخيص */}
          <div role="note" className="mb-6 border-2 border-amber-400 bg-amber-50 p-4 flex gap-3">
            <span aria-hidden="true" className="shrink-0 w-8 h-8 bg-amber-400 text-[#0b132b] flex items-center justify-center font-black text-lg leading-none">!</span>
            <div className="text-xs leading-relaxed text-amber-900">
              <strong className="block text-sm font-extrabold text-[#0b132b] mb-1">تنبيه مهم قبل الشراء</strong>
              مش كل المحتوى على الموقع برخصة GPL — في منتجات معروضة بدون رخصة. اتأكد من صفحة كل منتج: لو مذكور فيها نوع الرخصة يبقى مشمول بها، ولو مش مذكور يبقى بدون رخصة.
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {FAQ_ITEMS.map((f, i) => (
              <details key={i} className="group bg-slate-50 rounded-2xl border border-slate-200 p-4 open:bg-white open:shadow-sm transition">
                <summary className="cursor-pointer text-sm font-bold text-[#0b132b] list-none flex items-start justify-between gap-3">
                  <span>{f.q}</span>
                  <span className="text-[#1e3a8a] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

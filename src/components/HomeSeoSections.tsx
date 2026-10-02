import React, { useEffect } from 'react';

/**
 * سكاشن السيو العربي للصفحة الرئيسية — يستهدف كلمات:
 * قوالب GPL / ثيمات GPL / تحميل قوالب ووردبريس / متجر GPL عربي / مواقع GPL
 * + FAQ Schema لظهور Featured Snippets + إجابات AI
 */
const FAQ_ITEMS = [
  {
    q: 'هل يمكن العثور على قوالب شوبيفاي مجاني أو قوالب وردبريس مجاني آمنة؟',
    a: 'العديد من الأشخاص يبحثون عن قوالب شوبيفاي مجاني أو قوالب وردبريس مجاني وثيمات مجانيه، لكن معظم النسخ المتاحة مجاناً على منتديات النولد تكون ملغومة بفيروسات وأكواد خبيثة تضر متجرك وموقعك. في gplify نوفر لك القوالب الأصلية 100% برخصة GPL بسعر رمزى ورخيص جداً بديل النسخ المجانية المضروبة.',
  },
  {
    q: 'كيف يمكنني تحميل ثيمات شوبيفاي وقوالب Shopify بسعر رمزي؟',
    a: 'من خلال قسم ثيمات شوبيفاي وقوالب Shopify على gplify، يمكنك تصفح أشهر قوالب شوبيفاي العالمية ومعاينتها حياً، وعند الشراء يتم إرسال روابط تحميل ملفات ה-ZIP الأصلية فوراً إلى بريدك الإلكتروني بعد الدفع بفودافون كاش أو انستاباي.',
  },
  {
    q: 'هل كل القوالب على الموقع برخصة GPL؟',
    a: 'لا — معظم القوالب معروضة برخصة GPL قانونية (v2/v3)، لكن في منتجات تانية معروضة بدون رخصة. قبل ما تشتري أي قالب لازم تتأكد من صفحة المنتج نفسها: لو مذكور فيها نوع الرخصة يبقى مشمول بها، ولو مش مذكور أي رخصة يبقى المنتج بدون رخصة وبيتباع بحالته كما هو. ولو مش متأكد اسألنا من صفحة تواصل معنا قبل الدفع.',
  },
  {
    q: 'ما هي قوالب GPL وهل هي قانونية؟',
    a: 'قوالب GPL هي ثيمات ووردبريس وإضافات أصلية مرخصة برخصة GNU العامة (GPL v2/v3) نفس رخصة الووردبريس نفسه. الرخصة بتديك حق قانوني كامل تستخدم القالب على عدد غير محدود من المواقع وتعدل عليه وتعيد توزيعه.',
  },
  {
    q: 'كيف أستلم روابط تحميل القالب بعد إتمام الطلب؟',
    a: 'فور إتمام الدفع (فودافون كاش أو انستاباي) يصلك إيميل تلقائي فوراً يحتوي على روابط التحميل المباشرة لملفات ZIP الأصلية النظيفة 100% مع الفاتورة والتسليم فوري في ثوانٍ.',
  },
  {
    q: 'هل يمكن استخدام قالب شوبيفاي أو ووردبريس على أكثر من متجر وموقع؟',
    a: 'نعم! بترخيص GPL يمكنك تركيب القالب على أي عدد من المتاجر والمواقع والدومينات الخاصة بك أو بعملائك دون أي رسوم إضافية أو اشتراكات سنوية.',
  },
  {
    q: 'هل الملفات والقوالب آمنة ومفحوصة؟',
    a: 'نعم، كل القوالب والثيمات تمر بفحص أمني دقيق للتأكد من أنها أصلية ومطابقة لملفات المطور بدون أي تعديل أو أكواد إعلانية أو خبيثة.',
  },
  {
    q: 'ما هي وسائل الدفع المتاحة في مصر والوطن العربي؟',
    a: 'ندعم الدفع المباشر بالجنيه المصري عبر فودافون كاش Vodafone Cash وانستاباي InstaPay، والأسعار مناسبة جداً لجميع الشباب والشركات والمتاجر في مصر والعالم العربي.',
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
      <section aria-label="دليل تحميل قوالب GPL وقوالب شوبيفاي ووردبريس بالعربي" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="max-w-3xl">
            <p className="text-xs font-bold text-[#1e3a8a] mb-2">البديل الآمن للباحثين عن الثيمات المجانية — لمتاجر العرب</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-tajawal leading-relaxed">
              البديل الآمن لقوالب شوبيفاي ووردبريس المجانية: ثيمات shopify الأصلية
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600 leading-loose">
            <div className="space-y-3">
              <h3 className="font-bold text-[#0b132b]">لماذا تبحث عن البديل المضمون للنسخ المجانية المضروبة؟</h3>
              <p>
                كثير من أصحاب المتاجر والمواقع يبحثون عن <strong>قوالب شوبيفاي مجاني</strong> و<strong>قوالب شوبيفاي مجانيه</strong> و<strong>قوالب شوبيفاي مجانية</strong> أو <strong>ثيمات شوبيفاي مجانيه</strong>، و<strong>قوالب وردبريس مجاني</strong> و<strong>قوالب وردبريس مجانيه</strong> و<strong>ثيمات مجانيه</strong> و<strong>قوالب مجانيه</strong> على الإنترنت، ولكن الصدمة تكون بوجود فيروسات، برمجيات خبيثة، وأكواد تجسس تؤدي لإغلاق المتجر أو حظر الدومين في محركات البحث.
              </p>
              <p>
                في متجر <strong>gplify</strong> المخصص للوطن العربي ومصر، نوفر لك الحل الأمثل للباحثين عن <strong>تحميل قوالب مجانيه</strong> و<strong>تحميل ثيمات مجانيه</strong>: تحميل <strong>قوالب shopify مجانيه</strong> بديل آمن، بملفات أصلية 100% ومفحوصة أمنياً بترخيص GPL وبسعر مخفض جداً بالجنيه المصري. تحصل على نفس الملفات النظيفة من المطور بدون مخاطرة، مع تسليم رقمي فوري عبر البريد الإلكتروني وتوافق كامل مع فودافون كاش وانستاباي.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-[#0b132b]">مميزات تحميل القوالب والثيمات من gplify</h3>
              <ul className="space-y-2">
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>بديل آمن للنسخ المجانية المضروبة:</strong> ملفات أصلية 100% بدون أي تعديل أو فيروسات.</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>استخدام غير محدود:</strong> رخصة GPL تمنحك حق استخدام القالب على جميع متاجرك ومواقعك.</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>تحديثات مستمرة وكتالوج متجدد:</strong> نحدث القوالب لأحدث الإصدارات العالمية ({themesCount > 0 ? `يتوفر حالياً ${themesCount} قالب أصلي` : 'كتالوج يتحدث باستمرار'}).</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>تسليم آلي وفوري:</strong> يصلك رابط التحميل لملف ZIP في ثوانٍ معدودة عقب إتمام الدفع.</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span><strong>طرق دفع عربية ميسرة:</strong> دعم كامل لفودافون كاش وانستاباي بالجنيه المصري.</span></li>
              </ul>
            </div>
          </div>

          {/* كلمات مفتاحية بارزة — بدون ادعاء مجانية: كلها GPL / أصلية */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {['قوالب شوبيفاي GPL', 'ثيمات شوبيفاي الأصلية', 'قوالب وردبريس GPL', 'ثيمات ووردبريس الأصلية', 'قوالب ووكومرس', 'قوالب shopify الأصلية', 'ثيمات shopify الأصلية', 'قوالب GPL العربية'].map((tag) => (
              <span key={tag} className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {tag}
              </span>
            ))}
          </div>

          {/* روابط داخلية بكلمات مفتاحية (Internal Linking) — بدون ادعاء مجانية */}
          <nav aria-label="تصفح أقسام قوالب GPL" className="flex flex-wrap gap-2 pt-2">
            <a href="/shopify" className="px-4 py-2 bg-[#0b132b] text-white text-xs font-bold rounded-xl hover:bg-[#1e293b] transition">قسم ثيمات شوبيفاي GPL وقوالب Shopify الأصلية</a>
            <a href="/wordpress" className="px-4 py-2 bg-slate-100 text-[#0b132b] text-xs font-bold rounded-xl border border-slate-200 hover:border-[#0b132b] transition">تحميل قوالب وردبريس GPL الأصلية</a>
            <a href="/wordpress" className="px-4 py-2 bg-slate-100 text-[#0b132b] text-xs font-bold rounded-xl border border-slate-200 hover:border-[#0b132b] transition">ثيمات ووكومرس للمتاجر الإلكترونية</a>
            <a href="/catalog" className="px-4 py-2 bg-slate-100 text-[#0b132b] text-xs font-bold rounded-xl border border-slate-200 hover:border-[#0b132b] transition">كتالوج الثيمات والقوالب الكامل</a>
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

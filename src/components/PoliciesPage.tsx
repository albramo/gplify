import React, { useEffect } from 'react';
import { ArrowRight, FileText, ShieldCheck } from 'lucide-react';

interface PoliciesPageProps {
  policy: 'terms' | 'privacy';
  onBackToStore: () => void;
}

const UPDATED = '2026-09-16';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base sm:text-lg font-extrabold text-[#0b132b]">{title}</h2>
      <div className="text-sm text-slate-600 leading-loose space-y-2">{children}</div>
    </section>
  );
}

/**
 * صفحتا السياسات: /terms (شروط الاستخدام) و /privacy (سياسة الخصوصية).
 * مربوطتان من الفوتر + متولد لهما نسخة ثابتة للزاحفات في prerender.
 */
export const PoliciesPage: React.FC<PoliciesPageProps> = ({ policy, onBackToStore }) => {
  const isTerms = policy === 'terms';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [policy]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <button
        onClick={onBackToStore}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#0b132b] hover:text-[#1e3a8a] bg-white px-3.5 py-2 rounded-none border border-slate-200 hover:border-[#0b132b] transition cursor-pointer mb-6"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للمتجر</span>
      </button>

      <article className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
        <header className="space-y-2 pb-6 border-b border-slate-200">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#1e3a8a] bg-slate-100 border border-slate-200 rounded-full px-3 py-1">
            {isTerms ? <FileText className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{isTerms ? 'شروط الاستخدام' : 'سياسة الخصوصية'}</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-tajawal">
            {isTerms ? 'شروط استخدام متجر gplify' : 'سياسة الخصوصية لمتجر gplify'}
          </h1>
          <p className="text-xs text-slate-400">
            آخر تحديث: <time dateTime={UPDATED}>16 سبتمبر 2026</time>
          </p>
        </header>

        {isTerms ? (
          <>
            <Section title="1) طبيعة المنتجات">
              <p>
                متجر gplify يبيع ملفات رقمية جاهزة للتحميل: قوالب ووردبريس وShopify وإضافات وملحقاتها.
                جميع المنتجات رقمية — لا يوجد شحن أو منتجات مادية، والتسليم يتم عبر البريد الإلكتروني.
              </p>
            </Section>
            <Section title="2) الترخيص وحالة كل منتج">
              <p>
                حالة الترخيص مكتوبة بوضوح على صفحة كل منتج وهي المرجع الوحيد المعتمد:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>لو مكتوب على صفحة المنتج نوع الرخصة (مثل GPL v2 أو v3) فالمنتج مشمول بها بكل حقوقها.</li>
                <li>لو مش مكتوب أي رخصة فالمنتج معروض بدون رخصة ويُباع بحالته كما هو.</li>
              </ul>
            </Section>
            <Section title="3) التسليم الرقمي">
              <p>
                بعد إتمام الدفع وتأكيده، تُرسل روابط تحميل الملفات إلى بريدك الإلكتروني الذي أدخلته في الطلب.
                تأكد من كتابة بريد صحيح — المتجر غير مسؤول عن التأخير الناتج عن بريد خاطئ أدخله العميل.
              </p>
            </Section>
            <Section title="4) الدفع والأسعار">
              <p>
                الدفع يتم عبر فودافون كاش أو انستاباي، وجميع الأسعار بالجنيه المصري وتشمل أي رسوم معلنة.
                تأكيد الدفع يتم يدوياً، لذلك قد يستغرق التسليم دقائق بعد التحويل.
              </p>
            </Section>
            <Section title="5) الاسترداد">
              <p>
                نظراً لطبيعة المنتجات الرقمية (تُسلَّم ملفات قابلة للنسخ فور الدفع)، لا يوجد استرداد بعد تسليم
                روابط التحميل، إلا في حالتين: عدم وصول الملفات نهائياً، أو وصول ملفات تالفة لا تعمل وتعذّر
                إصلاحها — وفي الحالتين يتم الاستبدال أو الاسترداد بعد المراجعة عبر صفحة تواصل معنا.
              </p>
            </Section>
            <Section title="6) الدعم الفني">
              <p>
                نوفر توجيهاً عاماً للتثبيت والتفعيل، والملفات تُسلَّم زي الأصلية بالظبط بدون أي تعديل. الدعم لا يشمل التعديلات البرمجية
                المخصصة أو تصميم المتجر نيابة عنك.
              </p>
            </Section>
            <Section title="7) الاستخدام الممنوع">
              <p>
                يُمنع استخدام الموقع أو الملفات في أي نشاط مخالف للقانون، أو محاولة اختراق الموقع، أو انتحال
                صفة المتجر. الأسعار والعروض وتوفر المنتجات قابلة للتغيير في أي وقت.
              </p>
            </Section>
            <Section title="8) التواصل">
              <p>
                لأي استفسار حول طلبك أو هذه الشروط، تواصل معنا من صفحة تواصل معنا أو عبر صفحة الفيسبوك الرسمية.
              </p>
            </Section>
          </>
        ) : (
          <>
            <Section title="1) البيانات التي نجمعها">
              <p>نجمع الحد الأدنى اللازم لتشغيل المتجر فقط:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>بيانات الطلب: الاسم والبريد الإلكتروني ورقم الهاتف التي تدخلها عند إتمام الشراء.</li>
                <li>البريد الإلكتروني الذي تشترك به في النشرة البريدية (اختياري).</li>
                <li>محتوى سلة التسوق محفوظ على جهازك فقط (لا يُرسل لنا إلا عند إتمام الطلب).</li>
              </ul>
              <p>لا نطلب منك إنشاء حساب، ولا نجمع بيانات بطاقات بنكية (الدفع يتم عبر محافظ خارجية).</p>
            </Section>
            <Section title="2) كيف نستخدم بياناتك">
              <ul className="list-disc list-inside space-y-1">
                <li>إرسال روابط التحميل والفواتير إلى بريدك.</li>
                <li>التواصل معك بخصوص طلبك أو الدعم الفني.</li>
                <li>إشعارات العروض — فقط إذا اشتركت في النشرة، وتقدر تلغيها في أي وقت.</li>
              </ul>
            </Section>
            <Section title="3) مشاركة البيانات">
              <p>
                لا نبيع بياناتك ولا نشاركها لأغراض تسويقية مع أي طرف. تُحفظ البيانات لدى مقدمي الخدمة
                التقنية اللازمين لتشغيل المتجر (الاستضافة وقاعدة البيانات) فقط.
              </p>
            </Section>
            <Section title="4) ملفات تعريف الارتباط والتخزين المحلي">
              <p>
                نستخدم التخزين المحلي في متصفحك لحفظ سلة التسوق فقط. لا نستخدم كوكيز تتبع إعلانية.
              </p>
            </Section>
            <Section title="5) حقوقك">
              <p>
                تقدر في أي وقت تطلب نسخة من بياناتك أو تعديلها أو حذفها تماماً من سجلاتنا عبر صفحة تواصل
                معنا أو صفحة الفيسبوك الرسمية، وسننفذ طلبك خلال أيام عمل قليلة.
              </p>
            </Section>
            <Section title="6) أمان البيانات">
              <p>
                نطبق إجراءات حماية معقولة (اتصال مشفر، صلاحيات محدودة على قاعدة البيانات)، ولا يمكن ضمان
                أمان مطلق لأي نظام على الإنترنت.
              </p>
            </Section>
            <Section title="7) تحديثات السياسة">
              <p>
                قد نحدّث هذه السياسة من وقت لآخر، وسيظهر تاريخ آخر تحديث أعلى الصفحة. استمرارك في استخدام
                المتجر يعني موافقتك على النسخة الحالية.
              </p>
            </Section>
          </>
        )}
      </article>
    </div>
  );
};

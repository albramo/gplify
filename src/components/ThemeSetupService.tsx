import React from 'react';
import { Wrench, ArrowLeft } from 'lucide-react';

interface ThemeSetupServiceProps {
  onRequestSetup: () => void;
  /** 'banner' للصفحة الرئيسية — 'compact' لصفحة الثيم وصفحة الشراء */
  variant?: 'banner' | 'compact';
  /** اسم الثيم الحالي (يُستخدم في النسخة المدمجة داخل صفحة الثيم) */
  themeTitle?: string;
}

export const ThemeSetupService: React.FC<ThemeSetupServiceProps> = ({
  onRequestSetup,
  variant = 'banner',
  themeTitle,
}) => {
  if (variant === 'compact') {
    return (
      <section
        aria-label="خدمة تجهيز الثيم"
        className="bg-white rounded-2xl border-2 border-dashed border-[#0b132b]/25 p-5 sm:p-6 space-y-3.5"
      >
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-[#0b132b] text-white flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" aria-hidden="true" />
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0b132b] font-tajawal leading-snug">
            {themeTitle ? (
              <>محتاج نظبطلك ثيم {themeTitle} على متجرك؟</>
            ) : (
              <>محتاج نظبطلك الثيم على متجرك؟</>
            )}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          خدمة منفصلة: نركّب الثيم اللي اشتريته ونظبط الألوان والشعار والصفحات الأساسية
          على الموقع أو المتجر بتاعك — تستلمه جاهز للشغل.
        </p>
        <button
          id="btn-request-setup-compact"
          type="button"
          onClick={onRequestSetup}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] bg-[#0b132b] hover:bg-[#1e293b] text-white text-sm font-bold rounded-xl transition cursor-pointer"
        >
          <span>اطلب خدمة التجهيز</span>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          خدمة مدفوعة منفصلة عن سعر الثيم — التكلفة والمدة حسب المطلوب.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="خدمة تجهيز الثيم على موقعك" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-white rounded-2xl px-6 py-6 sm:px-8 sm:py-7 text-[#0b132b] border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
        <div className="space-y-2.5 text-center lg:text-right flex-1">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
            <span>خدمة منفصلة — تجهيز الثيم على موقعك</span>
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold font-tajawal leading-snug">
            اشتريت الثيم؟ نركبهولك على متجرك ونسلّمهولك شغال
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            نركّب الثيم اللي اشتريته ونظبط الألوان والشعار والصفحات الأساسية — خدمة مدفوعة منفصلة عن سعر الثيم.
          </p>
        </div>

        <button
          id="btn-request-setup-banner"
          type="button"
          onClick={onRequestSetup}
          className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 min-h-[52px] bg-[#0b132b] hover:bg-[#1e293b] text-white text-sm font-extrabold rounded-xl transition cursor-pointer shrink-0"
        >
          <Wrench className="w-4 h-4" aria-hidden="true" />
          <span>اطلب تجهيز الثيم</span>
        </button>
      </div>
    </section>
  );
};

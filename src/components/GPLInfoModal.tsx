import React, { useEffect } from 'react';
import {
  X,
  Terminal,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface GPLInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PILLARS = [
  {
    no: '01',
    title: 'استخدام غير محدود',
    text: 'ثبّت القالب على موقعك ومواقع عملائك كلها — من غير رخصة منفصلة لكل دومين.',
  },
  {
    no: '02',
    title: 'أمان ونظافة 100%',
    text: 'ملفات أصلية غير معدلة من المطور الرسمي، وتخضع لفحص دوري ضد الفيروسات.',
  },
  {
    no: '03',
    title: 'وفّر أكثر من 90%',
    text: 'رسوم رمزية لتغطية السيرفرات وإعادة التوزيع والتحديثات — بدل الأسعار الباهظة.',
  },
];

const FAQ = [
  {
    q: 'هل يطلب القالب مفتاح تفعيل (License Key)؟',
    a: 'لا. القوالب تعمل بكامل مميزاتها وتصاميمها دون مفتاح تفعيل — المفتاح الرسمي مخصص فقط للدعم المباشر من المطور الأصلي.',
  },
  {
    q: 'كيف أستلم التحديثات الجديدة؟',
    a: 'تصلك التحديثات على بريدك الإلكتروني فور صدور أي إصدار جديد للقالب.',
  },
];

export const GPLInfoModal: React.FC<GPLInfoModalProps> = ({ isOpen, onClose }) => {
  // Close on Escape + lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="دليل رخصة GPL"
    >
      <div
        className="bg-white w-full max-w-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#0b132b] text-white flex items-center justify-between gap-3 border-b-4 border-emerald-400">
          <div className="flex items-center gap-3 min-w-0">
            <Terminal className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold font-tajawal truncate">
                دليلك لرخصة GPL وحرياتك القانونية
              </h3>
              <p className="text-[11px] text-slate-400 font-mono" dir="ltr">$ man gpl --lang=ar</p>
            </div>
          </div>

          <button
            id="btn-close-gpl-modal"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-6 overflow-y-auto space-y-7 text-slate-700">
          {/* What is GPL */}
          <div className="space-y-2">
            <h4 className="text-sm font-extrabold text-[#0b132b] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>ما هي رخصة GPL؟</span>
            </h4>
            <p className="text-xs leading-loose text-slate-600">
              نظام <strong>WordPress</strong> مبني بالكامل تحت رخصة البرمجيات الحرة (GNU GPL v2/v3).
              وبحسب بنود الرخصة، أي قالب أو إضافة مُبرمجة للعمل مع ووردبريس ترث هذه الرخصة تلقائياً —
              وتمنحك حرية الاستخدام والتعديل وإعادة التوزيع بشكل قانوني كامل.
            </p>
          </div>

          {/* Pillars — numbered rows */}
          <div className="border-t-2 border-[#0b132b]">
            {PILLARS.map((p) => (
              <div key={p.no} className="flex gap-4 py-4 border-b border-slate-200">
                <span className="font-mono text-xs font-bold text-slate-400 pt-0.5" dir="ltr">
                  {p.no}
                </span>
                <div className="space-y-1">
                  <h5 className="text-[13px] font-extrabold text-[#0b132b]">{p.title}</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ accordion */}
          <div>
            <h4 className="text-[13px] font-extrabold text-[#0b132b] mb-1">أسئلة متكررة</h4>
            <div className="border-t border-slate-200">
              {FAQ.map((f) => (
                <details key={f.q} className="group border-b border-slate-200">
                  <summary className="flex items-center justify-between gap-3 py-3.5 text-xs font-extrabold text-[#0b132b] cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:text-[#1e3a8a] transition-colors">
                    <span>{f.q}</span>
                    <ChevronDown className="w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-4 text-xs text-slate-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Action */}
          <button
            onClick={onClose}
            className="w-full py-3.5 min-h-[52px] bg-[#0b132b] hover:bg-[#1e3a8a] text-white text-sm font-extrabold transition-colors cursor-pointer"
          >
            تمام، تصفح القوالب
          </button>
        </div>
      </div>
    </div>
  );
};

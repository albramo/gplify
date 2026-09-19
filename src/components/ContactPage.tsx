import React, { useState, useEffect } from 'react';
import { Facebook, MessageCircle, ArrowLeft, Send, Check, User, Mail, FileText } from 'lucide-react';
import { sendContactMessage } from '../lib/supabase';

const FACEBOOK_URL = 'https://facebook.com/gplify';

interface ContactPageProps {
  onBackToStore: () => void;
  /** رسالة مبدئية (مثلاً طلب خدمة تجهيز الثيم) تُملأ تلقائياً في النموذج */
  initialMessage?: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBackToStore, initialMessage = '' }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(initialMessage);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (initialMessage) setMessage(initialMessage);
  }, [initialMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setFormError('');
    setFormSuccess('');
    setSending(true);
    try {
      const res = await sendContactMessage(name, email, message);
      if (res.sent || res.archived) {
        setFormSuccess('تم استلام رسالتك بنجاح! هنرد عليك على إيميلك في أقرب وقت.');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setFormError(res.error || 'تعذر إرسال الرسالة. حاول مرة أخرى أو راسلنا على فيسبوك.');
      }
    } catch {
      setFormError('تعذر إرسال الرسالة. حاول مرة أخرى أو راسلنا على فيسبوك.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#0b132b] px-6 sm:px-10 py-8 sm:py-10 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-4">
            <MessageCircle className="w-4 h-4 text-white" />
            <span>تواصل معنا</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-tajawal">
            عندك سؤال؟ ابعتلنا رسالة
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-3 max-w-xl mx-auto">
            املا النموذج وهنوصلك على إيميلك — أو كلمنا مباشرة على صفحة الفيسبوك الرسمية.
          </p>
        </div>

        <div className="px-6 sm:px-10 py-8 sm:py-10 space-y-8">
          {/* Contact form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-base sm:text-lg font-extrabold text-[#0b132b]">نموذج التواصل</h2>

            <div>
              <label htmlFor="contact-name" className="block text-xs font-bold text-slate-600 mb-1.5">
                الاسم
              </label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="contact-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اكتب اسمك"
                  className="w-full pr-10 pl-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-[#0b132b] placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-[#0b132b] transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-bold text-slate-600 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pr-10 pl-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-[#0b132b] placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-[#0b132b] transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-bold text-slate-600 mb-1.5">
                الرسالة
              </label>
              <div className="relative">
                <FileText className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <textarea
                  id="contact-message"
                  required
                  minLength={5}
                  maxLength={5000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا (استفسار، دعم فني، متابعة طلب...)"
                  className="w-full pr-10 pl-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-[#0b132b] placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-[#0b132b] transition resize-y min-h-[120px]"
                />
              </div>
            </div>

            {formError && (
              <p role="alert" className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p role="status" className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </p>
            )}

            <button
              id="contact-submit-btn"
              type="submit"
              disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 min-h-[52px] bg-[#0b132b] hover:bg-[#1e293b] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'جاري الإرسال...' : 'إرسال الرسالة'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
            <span className="flex-1 h-px bg-slate-200" />
            <span>أو</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Facebook */}
          <a
            id="contact-facebook-btn"
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تواصل معنا عبر صفحة فيسبوك"
            className="flex items-center gap-4 p-5 rounded-2xl border-2 border-[#1877F2]/20 bg-[#1877F2]/5 hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40 transition cursor-pointer group"
          >
            <span className="w-14 h-14 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Facebook className="w-7 h-7" />
            </span>
            <span className="flex-1 min-w-0 text-right">
              <span className="block text-base sm:text-lg font-extrabold text-[#0b132b]">
                صفحة الفيسبوك الرسمية
              </span>
              <span className="block text-xs sm:text-sm text-slate-500 font-mono mt-0.5 truncate" dir="ltr">
                facebook.com/gplify
              </span>
              <span className="block text-xs text-slate-500 mt-1">
                اضغط للانتقال للصفحة وإرسال رسالة مباشرة
              </span>
            </span>
            <ArrowLeft className="w-5 h-5 text-[#1877F2] shrink-0 group-hover:-translate-x-1 transition-transform" />
          </a>

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={onBackToStore}
              className="px-6 py-3 min-h-[48px] text-sm font-bold text-[#0b132b] bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              العودة للمتجر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

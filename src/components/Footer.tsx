import React, { useState } from 'react';
import { 
  Layers, 
  Mail, 
  Facebook,
  HelpCircle, 
  Check, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { subscribeNewsletter } from '../lib/supabase';

interface FooterProps {
  onNavigate: (view: 'home' | 'catalog' | 'search' | 'shopify' | 'wordpress' | 'contact' | 'terms' | 'privacy' | 'cart' | 'checkout' | 'product' | 'download' | 'order-success') => void;
  onOpenGPLInfo: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenGPLInfo,
}) => {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subMessage, setSubMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setSubscribing(true);
    const res = await subscribeNewsletter(email);
    setSubscribing(false);
    setSubMessage(res.message);
    setEmail('');
    setTimeout(() => setSubMessage(''), 5000);
  };

  return (
    <footer className="bg-[#0b132b] text-white border-t border-slate-800">
      {/* Top Newsletter CTA */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-[#111c44] rounded-3xl p-6 sm:p-8 border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-right max-w-lg">
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>عروض وكوبونات حصرية</span>
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-400 text-[#0b132b] text-xs font-extrabold">
                  قريباً
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold font-tajawal">
                اشترك لتصلك أحدث ثيمات GPL المخفضة
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                أدخل بريدك الإلكتروني للحصول على كوبونات خصم تصل إلى 50% وإشعار بآخر القوالب المضافة.
              </p>
            </div>

            <div className="w-full md:w-auto min-w-[320px]">
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="newsletter-email-input"
                    type="email"
                    required
                    disabled
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pr-10 pl-4 py-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-hidden focus:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  id="btn-newsletter-subscribe"
                  type="submit"
                  disabled
                  className="px-5 py-3 bg-white hover:bg-slate-100 text-[#0b132b] text-xs font-bold rounded-xl transition cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  قريباً
                </button>
              </form>

              {subMessage && (
                <p className="text-xs text-emerald-400 font-medium mt-2 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{subMessage}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-[#0b132b] flex items-center justify-center font-bold shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight font-tajawal">
                gplify<span className="text-slate-300">.</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              gplify متجر عربي لتحميل ثيمات شوبيفاي وقوالب Shopify الأصلية، وثيمات ووردبريس وقوالب ووكومرس للمتاجر — ملفات نظيفة 100% برخصة GPL لعدد غير محدود من المواقع مع تسليم فوري عبر البريد الإلكتروني والدفع بفودافون كاش وانستاباي بالجنيه المصري.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">100% رخصة قانونية</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">ملفات نظيفة ومفحوصة</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">تسليم فوري عبر البريد</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">روابط سريعة</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-white transition">
                  تحميل قوالب GPL - الصفحة الرئيسية
                </a>
              </li>
              <li>
                <a href="/shopify" onClick={(e) => { e.preventDefault(); onNavigate('shopify'); }} className="hover:text-white transition font-bold text-emerald-300">
                  ثيمات شوبيفاي GPL — قوالب Shopify الأصلية
                </a>
              </li>
              <li>
                <a href="/wordpress" onClick={(e) => { e.preventDefault(); onNavigate('wordpress'); }} className="hover:text-white transition font-bold text-blue-300">
                  ثيمات ووردبريس GPL — قوالب وووكومرس
                </a>
              </li>
              <li>
                <a href="/catalog" onClick={(e) => { e.preventDefault(); onNavigate('catalog'); }} className="hover:text-white transition">
                  كتالوج ثيمات ووردبريس GPL
                </a>
              </li>
              <li>
                <a href="/catalog" onClick={(e) => { e.preventDefault(); onNavigate('catalog'); }} className="hover:text-white transition">
                  قوالب ووكومرس للمتاجر
                </a>
              </li>
              <li>
                <a href="/cart" onClick={(e) => { e.preventDefault(); onNavigate('cart'); }} className="hover:text-white transition">
                  سلة التسوق
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Integrations */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">الضمان والتكامل</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button onClick={onOpenGPLInfo} className="hover:text-white transition flex items-center gap-1 cursor-pointer">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>دليل رخصة GPL القانونية</span>
                </button>
              </li>
              <li>
                <a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }} className="hover:text-white transition">
                  شروط الاستخدام
                </a>
              </li>
              <li>
                <a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }} className="hover:text-white transition">
                  سياسة الخصوصية
                </a>
              </li>
              <li>
                <span className="text-slate-400 block text-[11px] leading-relaxed pt-1">
                  جميع الملفات يتم تسليمها فورياً، وحالة ترخيص كل منتج مكتوبة على صفحته.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 gplify — جميع الحقوق محفوظة.</p>
          <a
            href="https://facebook.com/gplify"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="صفحة gplify على فيسبوك"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-colors duration-200 cursor-pointer font-bold"
          >
            <Facebook className="w-4 h-4" />
            <span>تابعنا على فيسبوك</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

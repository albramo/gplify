import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  MailCheck,
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Order } from '../types';
import type { StoreSettings } from '../lib/settings';
import { normalizeEgPhone } from '../lib/settings';
import { formatCurrency } from './ThemeCard';

interface OrderSuccessModalProps {
  order: Order;
  settings: StoreSettings;
  onContinueShopping: () => void;
  onOpenGPLModal: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  settings,
  onContinueShopping,
  onOpenGPLModal,
}) => {
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [showTeleHelp, setShowTeleHelp] = useState(false);
  const openedRef = React.useRef(false);
  const showWhats = settings.contactMode !== 'telegram' && settings.whatsappNumber.trim() !== '';
  const showTele = settings.contactMode !== 'whatsapp' && settings.telegramUsername.replace(/^@/, '').trim() !== '';
  const singleAuto = (showWhats && !showTele) || (showTele && !showWhats);

  useEffect(() => {
    // Lazy confetti: ~15KB saved from initial bundle, loads only on success screen
    let cancelled = false;
    import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return;
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0b132b', '#1e3a8a', '#ffffff', '#64748b'],
          disableForReducedMotion: true,
        });
      } catch (e) {
        console.error(e);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const buildMessage = () => {
    const lines = [
      'طلب جديد من gplify',
      `رقم الطلب: ${order.orderNumber}`,
      'القوالب:',
      ...order.items.map((i) => `- ${i.themeTitle} (v${i.version}) — ${formatCurrency(i.price)}`),
      `الإجمالي: ${formatCurrency(order.totalAmount)}`,
      `الدفع: ${order.paymentMethod === 'instapay' ? 'انستاباي' : 'فودافون كاش'}`,
    ];
    if (order.paymentRef) lines.push(`رقم التحويل: ${order.paymentRef}`);
    lines.push(`الاسم: ${order.customerName}`, `البريد: ${order.customerEmail}`);
    if (order.customerPhone) lines.push(`الهاتف: ${order.customerPhone}`);
    return lines.join('\n');
  };

  const copyText = async (text: string, done: () => void) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    if (ok) {
      done();
      setTimeout(() => setCopiedMsg(false), 5000);
    }
  };

  const openWhatsApp = () => {
    const digits = normalizeEgPhone(settings.whatsappNumber);
    if (!digits) return;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(buildMessage())}`, '_blank', 'noopener');
  };

  const openTelegram = () => {
    setShowTeleHelp(true);
    const username = settings.telegramUsername.replace(/^@/, '').trim();
    copyText(buildMessage(), () => setCopiedMsg(true));
    if (username) {
      window.open(`https://t.me/${username}`, '_blank', 'noopener');
    }
  };

  // Auto-open when exactly one channel is configured (button(s) below are the fallback)
  useEffect(() => {
    if (openedRef.current || !singleAuto) return;
    openedRef.current = true;
    const t = setTimeout(() => {
      if (showTele && !showWhats) openTelegram();
      else openWhatsApp();
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Hero */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border-2 border-[#0b132b] shadow-xl text-center space-y-5">
          <div className="w-18 h-18 bg-[#0b132b] text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold font-mono">
              رقم الطلب: #{order.orderNumber}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0b132b] font-tajawal">
              طلبك اتسجل بنجاح!
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              طلبك اتسجل! فتحنالك شات مباشر معانا بتفاصيل طلبك — هنبعتلك رقم الدفع ونتابع معاك لحد ما تستلم ملفاتك.
            </p>
          </div>

          {/* Chat CTAs (auto-opens when a single channel is set) */}
          <div className="max-w-md mx-auto space-y-2">
            {singleAuto && (
              <p className="text-[11px] text-slate-500">فتحنا لك الشات تلقائياً — لو مفتحش دوس الزرار:</p>
            )}
            {showWhats && showTele && (
              <p className="text-xs font-bold text-[#0b132b]">اختار القناة اللي تناسبك لمتابعة طلبك:</p>
            )}
            {showWhats && (
              <button
                id="btn-order-whatsapp"
                onClick={openWhatsApp}
                className="w-full py-4 px-4 bg-[#1faa55] hover:bg-[#178a44] text-white text-sm font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>ابعت تفاصيل الطلب واتساب</span>
              </button>
            )}
            {showTele && (
              <button
                id="btn-order-telegram"
                onClick={openTelegram}
                className="w-full py-4 px-4 bg-[#229ED9] hover:bg-[#1b8ac0] text-white text-sm font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
                <span>ابعت تفاصيل الطلب تليجرام</span>
              </button>
            )}
            {showTele && showTeleHelp && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-right space-y-2">
                <p className="text-xs font-bold text-[#0b132b]">
                  تليجرام مش بيكتب تلقائياً — انسخ التفاصيل والصقها في الشات:
                </p>
                <pre className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg p-2.5 max-h-32 overflow-y-auto whitespace-pre-wrap font-tajawal" dir="auto">
                  {buildMessage()}
                </pre>
                <button
                  onClick={() => copyText(buildMessage(), () => setCopiedMsg(true))}
                  className="w-full py-2.5 bg-[#0b132b] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {copiedMsg ? 'اتنسخت — الصقها في الشات وابعته' : 'نسخ تفاصيل الطلب'}
                </button>
              </div>
            )}
            {!showWhats && !showTele && (
              <p className="text-[11px] text-amber-700">قناة التواصل بتتظبط من لوحة التحكم — وتقدر تتواصل برقم الطلب: #{order.orderNumber}</p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#0b132b]">ملخص طلبك:</h2>
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 font-bold px-2.5 py-1 rounded-lg">
              بانتظار تأكيد الدفع
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.themeId} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#0b132b] truncate">{item.themeTitle}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">v{item.version}</span>
                </div>
                <div className="text-xs font-bold font-mono text-[#0b132b] shrink-0">
                  {formatCurrency(item.price)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-base font-extrabold text-[#0b132b]">
            <span>الإجمالي:</span>
            <span className="text-xl font-mono">{formatCurrency(order.totalAmount)}</span>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-xs text-slate-600 flex items-start gap-2">
            <MailCheck className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
            <span>
              بعد تأكيد الدفع هنبعت روابط التحميل على بريدك: <strong className="font-mono" dir="ltr">{order.customerEmail}</strong>
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            id="btn-success-back-shop"
            onClick={onContinueShopping}
            className="px-6 py-3 bg-[#0b132b] hover:bg-[#1e293b] text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للمتجر</span>
          </button>

          <button
            id="btn-success-gpl-info"
            onClick={onOpenGPLModal}
            className="text-xs font-semibold text-slate-600 hover:text-[#0b132b] flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#1e3a8a]" />
            <span>اقرأ دليل رخصة GPL</span>
          </button>
        </div>
      </div>
    </div>
  );
};

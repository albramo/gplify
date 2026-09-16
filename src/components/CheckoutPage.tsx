import React, { useState } from 'react';
import {
  Mail,
  User,
  Phone,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Zap,
  Wallet,
  Sparkles,
  Layers
} from 'lucide-react';
import { CartItem, Coupon, Order } from '../types';
import { saveOrder } from '../lib/supabase';
import { isValidEmail, sanitizeName, normalizePhone, safeUrl } from '../lib/security';
import { formatCurrency } from './ThemeCard';
import { ThemeSetupService } from './ThemeSetupService';

interface CheckoutPageProps {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  onBackToCart: () => void;
  onOrderSuccess: (order: Order) => void;
  initialEmail?: string;
  /** طلب خدمة تجهيز الثيم (يفتح صفحة التواصل برسالة جاهزة) */
  onRequestSetup?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  appliedCoupon,
  onBackToCart,
  onOrderSuccess,
  initialEmail = '',
  onRequestSetup,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'instapay'>('vodafone_cash');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercent) / 100) : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Strict per-field validation (email + name + phone each have their own type)
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح وحقيقي لنتابع معك استلام ملفاتك عليه.');
      const emailField = document.getElementById('checkout-email-input');
      emailField?.focus();
      return;
    }

    const cleanName = sanitizeName(name) || 'عميل مميز';
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone === null) {
      setErrorMessage('رقم الهاتف غير صالح — اكتب أرقام فقط (مثال: 01001234567).');
      const phoneField = document.getElementById('checkout-phone-input');
      phoneField?.focus();
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('يرجى الموافقة على شروط الاستخدام للمتابعة.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = `GPL-${Date.now().toString().slice(-6)}`;
      const downloadToken = `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

      const newOrder: Order = {
        id: crypto.randomUUID ? crypto.randomUUID() : `ord_${Date.now()}`,
        orderNumber,
        customerEmail: cleanEmail,
        customerName: cleanName,
        customerPhone: cleanPhone || undefined,
        items: items.map((i) => ({
          themeId: i.theme.id,
          themeTitle: i.theme.title,
          themeTitleEn: i.theme.titleEn,
          price: i.price,
          version: i.theme.version,
          fileSize: i.theme.fileSize,
          // SECURITY: never trust client-supplied file URLs.
          // The edge function resolves the real file_url server-side from themes.theme id.
        })),
        subtotal,
        discountAmount,
        couponCode: appliedCoupon?.code,
        totalAmount,
        paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString(),
        downloadToken,
      };

      // Save order as PENDING — owner confirms payment manually via chat
      await saveOrder(newOrder);

      // Short delay for realistic smooth transaction feedback
      setTimeout(() => {
        setIsSubmitting(false);
        onOrderSuccess(newOrder);
      }, 800);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setIsSubmitting(false);
      setErrorMessage('حدث خطأ أثناء تسجيل الطلب، حاول مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Back & Info */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            id="btn-checkout-back-cart"
            onClick={onBackToCart}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0b132b] hover:text-[#1e3a8a] bg-white px-3.5 py-2 rounded-xl border border-slate-200 hover:border-[#0b132b] transition cursor-pointer shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرجوع لسلة التسوق</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>دفع يدوي آمن — تأكيد مباشر مع الإدارة</span>
          </div>
        </div>

        {/* Checkout Form & Order Summary */}
        <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Checkout Details & Payment (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Contact Info */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#0b132b] shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0b132b] text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#0b132b]">
                      بيانات التواصل <span className="text-red-500">*</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      هنتابع معاك عليها لاستلام الدفع وتسليم ملفاتك.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Input Field */}
              <div className="relative pt-2">
                <label htmlFor="checkout-email-input" className="block text-xs font-bold text-[#0b132b] mb-1.5">
                  عنوان بريدك الإلكتروني (تأكد من كتابته بدقة):
                </label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e3a8a]" />
                  <input
                    id="checkout-email-input"
                    type="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pr-10 pl-4 py-3 text-sm font-medium bg-slate-50 border-2 border-slate-300 focus:border-[#0b132b] focus:bg-white rounded-xl text-[#0b132b] focus:outline-hidden transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  <span>هنبعتلك عليه تأكيد الدفع وروابط التحميل بعد التحويل.</span>
                </p>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label htmlFor="checkout-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    الاسم الكامل (اختياري):
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="checkout-name-input"
                      type="text"
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="محمد علي"
                      className="w-full pr-9 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-[#0b132b] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-phone-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    رقم الهاتف / واتساب (مهم للمتابعة):
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="checkout-phone-input"
                      type="tel"
                      maxLength={20}
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+20 100 123 4567"
                      className="w-full pr-9 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-[#0b132b] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Manual Payment Method */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0b132b] text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0b132b]">طريقة الدفع</h2>
                  <p className="text-xs text-slate-500">اختار الطريقة اللي تناسبك — وبعد التأكيد هنتواصل معاك شات مباشرة لاستكمال الدفع والاستلام</p>
                </div>
              </div>

              {/* Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="pay-method-vodafone"
                  onClick={() => setPaymentMethod('vodafone_cash')}
                  aria-pressed={paymentMethod === 'vodafone_cash'}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 min-h-[76px] justify-center ${
                    paymentMethod === 'vodafone_cash'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-red-400" />
                  <span className="text-xs font-bold">فودافون كاش</span>
                </button>

                <button
                  type="button"
                  id="pay-method-instapay"
                  onClick={() => setPaymentMethod('instapay')}
                  aria-pressed={paymentMethod === 'instapay'}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 min-h-[76px] justify-center ${
                    paymentMethod === 'instapay'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Zap className="w-5 h-5 text-amber-300" />
                  <span className="text-xs font-bold">انستا باي</span>
                </button>
              </div>

              {/* Agreement Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                  <input
                    id="chk-gpl-agreement"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#0b132b] focus:ring-0 cursor-pointer"
                  />
                  <span>
                    أوافق على شروط الاستخدام الموضحة في صفحة كل منتج واستلام الملفات بعد تأكيد الدفع.
                  </span>
                </label>
              </div>

              {/* Error Message if any */}
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200 font-medium" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                id="btn-submit-order"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-4 bg-[#0b132b] hover:bg-[#1e293b] text-white text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري تسجيل طلبك...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span>تأكيد الطلب ({formatCurrency(totalAmount)})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Order Items & Totals (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#0b132b] pb-2 border-b border-slate-100">
                القوالب المطلوبة ({items.length})
              </h3>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.theme.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <img
                      src={safeUrl(item.theme.thumbnail) || undefined}
                      alt={item.theme.title}
                      className="w-14 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#0b132b] truncate">
                        {item.theme.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>v{item.theme.version}</span>
                        <span>•</span>
                        <span>{item.theme.fileSize}</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold font-mono text-[#0b132b]">
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono font-bold text-[#0b132b]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>كوبون خصم ({appliedCoupon.code}):</span>
                    <span className="font-mono font-bold">
                      - {formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>إرسال الملفات:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">بعد تأكيد الدفع <Zap className="w-3.5 h-3.5" /></span>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-base font-extrabold text-[#0b132b]">
                  <span>المبلغ المطلوب تحويله:</span>
                  <span className="text-xl font-mono text-[#0b132b]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Manual delivery note */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-xs text-slate-600 flex items-start gap-2">
                <Layers className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
                <span>
                  بعد تأكيد طلبك هتبعتلنا التفاصيل شات، وهنراجع الدفع ونبعتلك روابط التحميل على بريدك فوراً.
                </span>
              </div>
            </div>

            {/* خدمة تجهيز الثيم — تحت ملخص الطلب */}
            {onRequestSetup ? (
              <ThemeSetupService variant="compact" onRequestSetup={onRequestSetup} />
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
};

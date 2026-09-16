import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Tag, 
  Check, 
  Sparkles,
  HelpCircle,
  MailCheck,
  Zap
} from 'lucide-react';
import { CartItem, Coupon } from '../types';
import { sanitizeCouponCode, MAX_COUPON_LEN, safeUrl } from '../lib/security';
import { formatCurrency } from './ThemeCard';

interface CartPageProps {
  items: CartItem[];
  onRemoveItem: (themeId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon | null) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  items,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onContinueShopping,
  coupons,
  appliedCoupon,
  onApplyCoupon,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercent) / 100) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const clean = sanitizeCouponCode(couponInput);
    if (!clean) {
      setCouponError('اكتب كود الخصم بحروف إنجليزية أو أرقام فقط.');
      return;
    }
    const found = coupons.find((c) => c.code.toUpperCase() === clean);

    if (!found) {
      setCouponError('كود الخصم غير صالح أو منتهي الصلاحية');
      return;
    }
    const currentSubtotal = items.reduce((sum, item) => sum + item.price, 0);
    if (found.minAmount && currentSubtotal < found.minAmount) {
      setCouponError(`هذا الكوبون يتطلب حداً أدنى للطلب بقيمة ${formatCurrency(found.minAmount)}`);
      return;
    }
    onApplyCoupon(found);
    setCouponSuccess(`تم تطبيق كود الخصم (${found.code}) بنسبة ${found.discountPercent}% بنجاح!`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
          <ShoppingBag className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-[#0b132b] mb-2 font-tajawal">سلة التسوق فارغة حالياً</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          لم تقم بإضافة أي قوالب إلى سلتك بعد. تصفح أحدث ثيمات ووردبريس وووكومرس الأصلية بترخيص GPL بأسعار مخفضة.
        </p>
        <button
          id="btn-cart-empty-shop"
          onClick={onContinueShopping}
          className="px-6 py-3 bg-[#0b132b] hover:bg-[#1e293b] text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <span>تصفح الثيمات المتاحة</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-tajawal">
              سلة التسوق ({items.length} {items.length === 1 ? 'قالب' : 'قوالب'})
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              جميع الثيمات تشمل ترخيص GPL للاستخدام على مواقع غير محدودة مع تسليم فوري بالبريد.
            </p>
          </div>

          <button
            id="btn-cart-continue"
            onClick={onContinueShopping}
            className="text-xs font-bold text-[#0b132b] hover:text-[#1e3a8a] flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>متابعة التسوق وإضافة ثيمات أخرى</span>
          </button>
        </div>

        {/* Main Cart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {items.map((item) => (
                <div key={item.theme.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Thumbnail & Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={safeUrl(item.theme.thumbnail) || undefined}
                      alt={item.theme.title}
                      className="w-20 h-16 sm:w-24 sm:h-18 object-cover rounded-xl border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold bg-slate-100 text-[#0b132b] px-2 py-0.5 rounded">
                          {item.theme.platform}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          الإصدار: v{item.theme.version}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#0b132b] line-clamp-1">
                        {item.theme.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1e3a8a]" />
                        <span>ترخيص GPL v3 - استخدام غير محدود</span>
                      </p>
                    </div>
                  </div>

                  {/* Price & Delete Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-extrabold text-[#0b132b] font-mono">
                        {formatCurrency(item.price)}
                      </div>
                      <div className="text-[11px] text-slate-400 line-through">
                        {formatCurrency(item.theme.originalPrice)}
                      </div>
                    </div>

                    <button
                      id={`btn-cart-remove-${item.theme.id}`}
                      onClick={() => onRemoveItem(item.theme.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart option */}
            <div className="flex justify-between items-center px-1">
              <button
                id="btn-cart-clear-all"
                onClick={onClearCart}
                className="text-xs text-slate-500 hover:text-red-600 transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إفراغ سلة التسوق بالكامل</span>
              </button>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <MailCheck className="w-4 h-4 text-[#1e3a8a]" />
                <span>يتم إرسال جميع الملفات في رسالة بريد واحدة فور الدفع</span>
              </div>
            </div>
          </div>

          {/* Cart Summary & Checkout CTA (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-[#0b132b]">ملخص الطلب</h2>

              {/* Promo Coupon Form */}
              <div className="space-y-2">
                <label htmlFor="coupon-code-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  <span>هل لديك كود خصم إضافي؟</span>
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    id="coupon-code-input"
                    type="text"
                    maxLength={MAX_COUPON_LEN}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="مثال: GPL20"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono text-[#0b132b] focus:bg-white focus:outline-hidden"
                  />
                  <button
                    id="btn-apply-coupon"
                    type="submit"
                    className="px-4 py-2 bg-[#0b132b] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    تطبيق
                  </button>
                </form>

                {couponSuccess && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{couponSuccess}</span>
                  </div>
                )}
                {couponError && (
                  <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg font-medium">
                    {couponError}
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono font-bold text-[#0b132b]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>خصم الكوبون ({appliedCoupon.code}):</span>
                    <span className="font-mono font-bold">
                      - {formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>رسوم التوصيل الرقمي بالبريد:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">مجاني 100% <Zap className="w-3.5 h-3.5" /></span>
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-slate-200 text-base sm:text-lg font-extrabold text-[#0b132b]">
                  <span>الإجمالي النهائي للدفع:</span>
                  <span className="text-2xl font-mono text-[#0b132b]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout CTA */}
              <button
                id="btn-cart-proceed-checkout"
                onClick={onProceedToCheckout}
                className="w-full py-4 px-4 bg-[#0b132b] hover:bg-[#1e293b] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>متابعة لإتمام الطلب وتحديد البريد</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="pt-2 text-xs text-center text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>دفع آمن ومشفر 100% مع ضمان فوري لاستلام الملفات</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

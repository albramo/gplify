import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Download, ArrowLeft, ShieldCheck } from 'lucide-react';
import { consumeDownloadToken, getTokenFromUrl } from '../lib/download';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; fileUrl: string; themeTitle: string; countdown: number }
  | { kind: 'error'; title: string; message: string; alreadyUsed: boolean };

/**
 * Public gated download page: /download?token=XXXX
 * Email links point here (NOT to Uploadthing directly).
 * First visit consumes the token and auto-starts the download;
 * second visit shows "already used".
 */
export const DownloadPage: React.FC<{ onBackToStore: () => void }> = ({ onBackToStore }) => {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const token = getTokenFromUrl();
    if (!token) {
      setState({
        kind: 'error',
        title: 'رابط غير مكتمل',
        message: 'رابط التحميل ناقص التوكن. ارجع للإيميل واضغط على زر التحميل مرة أخرى.',
        alreadyUsed: false,
      });
      return;
    }

    consumeDownloadToken(token).then((res) => {
      if (res.ok === true) {
        setState({ kind: 'ready', fileUrl: res.fileUrl, themeTitle: res.themeTitle, countdown: 3 });
        return;
      }
      const err = res as { error: string; message: string };
      const titles: Record<string, string> = {
        ALREADY_USED: 'تم استخدام الرابط مسبقاً',
        INVALID_TOKEN: 'رابط غير صالح',
        EXPIRED: 'انتهت صلاحية الرابط',
      };
      setState({
        kind: 'error',
        title: titles[err.error] ?? 'حدث خطأ مؤقت',
        message: err.message,
        alreadyUsed: err.error === 'ALREADY_USED' || err.error === 'EXPIRED',
      });
    });
  }, []);

  // Auto-redirect countdown on success (gives the user a moment to read + keep a copy).
  useEffect(() => {
    if (state.kind !== 'ready') return;
    if (state.countdown <= 0) {
      window.location.href = state.fileUrl;
      return;
    }
    const t = setTimeout(
      () => setState((s) => (s.kind === 'ready' ? { ...s, countdown: s.countdown - 1 } : s)),
      1000,
    );
    return () => clearTimeout(t);
  }, [state]);

  const startNow = () => {
    if (state.kind !== 'ready') return;
    window.location.href = state.fileUrl;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6" dir="rtl">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl border-2 border-[#0b132b] shadow-xl p-8 sm:p-10 text-center space-y-5">
          {state.kind === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-[#0b132b] mx-auto" />
              <h1 className="text-xl font-extrabold text-[#0b132b] font-tajawal">جاري تجهيز ملفك...</h1>
              <p className="text-sm text-slate-500">نتحقق من رابط التحميل لمرة واحدة. ثواني ويبدأ التنزيل.</p>
            </>
          )}

          {state.kind === 'ready' && (
            <>
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-tajawal">ملفك جاهز للتحميل</h1>
              {state.themeTitle && (
                <p className="text-sm font-bold text-slate-700">{state.themeTitle}</p>
              )}
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
                الرابط ده اشتغل مرة واحدة واتسجّل أنه مستخدم — حمّل الملف دلوقتي واحتفظ بنسخة عندك.
              </p>
              <button
                onClick={startNow}
                className="w-full py-4 px-4 bg-[#0b132b] hover:bg-[#1e293b] text-white text-sm font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الآن{state.countdown > 0 ? ` (يبدأ تلقائياً خلال ${state.countdown})` : ''}</span>
              </button>
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>رابط آمن لمرة واحدة — gplify</span>
              </p>
            </>
          )}

          {state.kind === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto">
                <XCircle className="w-9 h-9 text-red-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-tajawal">{state.title}</h1>
              <p className="text-sm text-slate-600 leading-relaxed">{state.message}</p>
              {state.alreadyUsed && (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">
                  لو فقدت الملف بعد تحميله، تواصل مع الدعم برقم طلبك من الإيميل وهنساعدك.
                </p>
              )}
              <button
                onClick={onBackToStore}
                className="w-full py-3.5 px-4 bg-[#0b132b] hover:bg-[#1e293b] text-white text-sm font-bold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>العودة للمتجر</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

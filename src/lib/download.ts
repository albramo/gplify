import { getSupabaseClient } from './supabase';
import { isSafeHttpUrl } from './security';

export type DownloadResult =
  | { ok: true; fileUrl: string; themeTitle: string }
  | { ok: false; error: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'ALREADY_USED' | 'EXPIRED' | 'SERVER_ERROR'; message: string };

/**
 * Consume a single-use download token.
 * Calls the `download` edge function (POST { token }) which atomically
 * marks the token used and returns the real file URL — exactly once.
 */
export async function consumeDownloadToken(token: string): Promise<DownloadResult> {
  const clean = token.trim();
  if (!clean) {
    return { ok: false, error: 'MISSING_TOKEN', message: 'رابط التحميل ناقص التوكن.' };
  }
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: 'SERVER_ERROR', message: 'تعذر الاتصال بالسيرفر. تحقق من الإنترنت وحاول مرة أخرى.' };
  }
  try {
    const { data, error } = await client.functions.invoke('download', {
      body: { token: clean },
    });
    if (error) {
      // Edge function returns JSON errors with context; surface Arabic message when present.
      const ctx = (error as { context?: unknown })?.context;
      if (ctx && typeof ctx === 'object') {
        const body = (ctx as { body?: unknown }).body;
        if (typeof body === 'string') {
          try {
            const parsed = JSON.parse(body) as { message?: string; error?: string };
            if (parsed?.message) {
              const code =
                parsed.error === 'ALREADY_USED' ? 'ALREADY_USED'
                : parsed.error === 'INVALID_TOKEN' ? 'INVALID_TOKEN'
                : parsed.error === 'EXPIRED' ? 'EXPIRED'
                : 'SERVER_ERROR';
              return { ok: false, error: code, message: parsed.message };
            }
          } catch {
            /* fall through */
          }
        }
      }
      return { ok: false, error: 'SERVER_ERROR', message: 'حدث خطأ مؤقت. حاول مرة أخرى.' };
    }
    const body = data as { ok?: boolean; file_url?: string; theme_title?: string; message?: string; error?: string };
    if (body?.ok && typeof body.file_url === 'string' && isSafeHttpUrl(body.file_url)) {
      return { ok: true, fileUrl: body.file_url, themeTitle: String(body.theme_title || '') };
    }
    const code =
      body?.error === 'ALREADY_USED'
        ? 'ALREADY_USED'
        : body?.error === 'INVALID_TOKEN'
          ? 'INVALID_TOKEN'
          : body?.error === 'EXPIRED'
            ? 'EXPIRED'
            : body?.error === 'MISSING_TOKEN'
              ? 'MISSING_TOKEN'
              : 'SERVER_ERROR';
    return {
      ok: false,
      error: code,
      message:
        body?.message ||
        (code === 'ALREADY_USED'
          ? 'عفواً، لقد قمت بتحميل هذا الملف من قبل. الرابط متاح للتحميل مرة واحدة فقط.'
          : code === 'INVALID_TOKEN'
            ? 'رابط التحميل غير صالح.'
            : code === 'EXPIRED'
              ? 'انتهت صلاحية رابط التحميل (صالح لمدة 7 أيام من تاريخ الإرسال). تواصل مع الدعم برقم طلبك.'
              : 'حدث خطأ مؤقت. حاول مرة أخرى.'),
    };
  } catch {
    return { ok: false, error: 'SERVER_ERROR', message: 'حدث خطأ مؤقت. حاول مرة أخرى.' };
  }
}

export function getTokenFromUrl(): string {
  try {
    return new URLSearchParams(window.location.search).get('token')?.trim() || '';
  } catch {
    return '';
  }
}

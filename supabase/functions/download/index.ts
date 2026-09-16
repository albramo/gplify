// gplify — download edge function (single-use token gate).
// Public URL:  https://<project-ref>.supabase.co/functions/v1/download?token=XXXX
// The storefront NEVER exposes the real file URL. Email links point to:
//   https://gplify.vercel.app/download?token=XXXX
// and that page calls this function with ?format=json, then redirects.
//
// Logic (race-safe):
//   1. token missing -> 400
//   2. atomic UPDATE ... WHERE token AND download_count < 1 AND created_at within TTL
//      RETURNING file_url
//      - 1 row  -> first use: mark used, return/redirect to file_url
//      - 0 rows -> lookup token: missing = 404 invalid, used = 403 already used,
//        fresh-but-unused can't happen here, expired-unused = 410 expired
//
// TOKEN EXPIRY: single-use links are valid for TOKEN_TTL_DAYS after the email
// is sent. Expired links fail closed (never reveal the file URL).
//
// Deploy:  supabase functions deploy download
// No secrets needed beyond the built-in SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function htmlPage(title: string, message: string, status = 400) {
  const safe = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return new Response(
    `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>${safe(title)} — gplify</title></head>` +
      `<body style="font-family:Tahoma,Arial,sans-serif;background:#f8fafc;color:#0b132b;` +
      `display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;">` +
      `<div style="max-width:480px;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:36px;text-align:center;">` +
      `<h1 style="font-size:20px;margin:0 0 12px;">${safe(title)}</h1>` +
      `<p style="color:#475569;font-size:14px;line-height:1.9;">${safe(message)}</p>` +
      `<a href="/" style="display:inline-block;margin-top:16px;background:#0b132b;color:#fff;` +
      `padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:14px;">العودة للمتجر</a>` +
      `</div></body></html>`,
    { status, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  let token = (url.searchParams.get('token') || '').trim();

  // Allow POST { token } from the SPA as well
  if (!token && req.method === 'POST') {
    try {
      const body = await req.json();
      token = String(body?.token || '').trim();
    } catch {
      /* ignore */
    }
  }

  const wantJson =
    url.searchParams.get('format') === 'json' ||
    (req.headers.get('accept') || '').includes('application/json') ||
    req.method === 'POST';

  if (!token) {
    if (wantJson) return json({ ok: false, error: 'MISSING_TOKEN', message: 'رابط التحميل ناقص التوكن.' }, 400);
    return htmlPage('رابط غير مكتمل', 'رابط التحميل ناقص التوكن. ارجع للإيميل واضغط على زر التحميل مرة أخرى.', 400);
  }

  if (token.length > 128) {
    if (wantJson) return json({ ok: false, error: 'INVALID_TOKEN', message: 'رابط التحميل غير صالح.' }, 404);
    return htmlPage('رابط غير صالح', 'رابط التحميل غير صالح.', 404);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Tokens expire TOKEN_TTL_DAYS after minting (created_at).
  const TOKEN_TTL_DAYS = 7;
  const freshSince = new Date(Date.now() - TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // 1) Atomic consume: only the FIRST concurrent request wins — and only for fresh tokens.
  const { data: consumed, error: consumeError } = await supabase
    .from('user_downloads')
    .update({ download_count: 1, used_at: new Date().toISOString() })
    .eq('download_token', token)
    .lt('download_count', 1)
    .gt('created_at', freshSince)
    .select('file_url, theme_title');

  if (consumeError) {
    console.error('download consume error:', consumeError.message);
    if (wantJson) return json({ ok: false, error: 'SERVER_ERROR', message: 'حدث خطأ مؤقت. حاول مرة أخرى.' }, 500);
    return htmlPage('خطأ مؤقت', 'حدث خطأ مؤقت أثناء تجهيز ملفك. حاول مرة أخرى بعد قليل.', 500);
  }

  if (consumed && consumed.length === 1) {
    const fileUrl = String((consumed[0] as Record<string, unknown>).file_url || '');
    const themeTitle = String((consumed[0] as Record<string, unknown>).theme_title || '');
    if (!fileUrl.startsWith('https://')) {
      console.error('download: unsafe file_url for token');
      if (wantJson) return json({ ok: false, error: 'SERVER_ERROR', message: 'ملف التحميل غير مهيأ. تواصل مع الدعم.' }, 500);
      return htmlPage('ملف غير مهيأ', 'ملف التحميل غير مهيأ. تواصل مع الدعم برقم طلبك.', 500);
    }
    if (wantJson) return json({ ok: true, file_url: fileUrl, theme_title: themeTitle });
    return Response.redirect(fileUrl, 302);
  }

  // 2) No row consumed -> token invalid, already used, or expired.
  const { data: existing } = await supabase
    .from('user_downloads')
    .select('download_count, created_at')
    .eq('download_token', token)
    .maybeSingle();

  if (!existing) {
    if (wantJson) return json({ ok: false, error: 'INVALID_TOKEN', message: 'رابط التحميل غير صالح.' }, 404);
    return htmlPage('رابط غير صالح', 'رابط التحميل غير صالح. تأكد أنك ضغطت على الرابط الصحيح من إيميلك.', 404);
  }

  const alreadyUsed = Number((existing as Record<string, unknown>).download_count ?? 0) >= 1;
  if (alreadyUsed) {
    if (wantJson) {
      return json(
        { ok: false, error: 'ALREADY_USED', message: 'عفواً، لقد قمت بتحميل هذا الملف من قبل. الرابط متاح للتحميل مرة واحدة فقط.' },
        403,
      );
    }
    return htmlPage(
      'تم استخدام الرابط مسبقاً',
      'عفواً، لقد قمت بتحميل هذا الملف من قبل. الرابط متاح للتحميل مرة واحدة فقط. لو فقدت الملف تواصل مع الدعم برقم طلبك.',
      403,
    );
  }

  // Exists, unused, but older than the TTL -> expired (fail closed).
  if (wantJson) {
    return json(
      { ok: false, error: 'EXPIRED', message: 'انتهت صلاحية رابط التحميل (صالح لمدة 7 أيام من تاريخ الإرسال). تواصل مع الدعم برقم طلبك لإعادة إرسال رابط جديد.' },
      410,
    );
  }
  return htmlPage(
    'انتهت صلاحية الرابط',
    'انتهت صلاحية رابط التحميل (صالح لمدة 7 أيام من تاريخ الإرسال). تواصل مع الدعم برقم طلبك لإعادة إرسال رابط جديد.',
    410,
  );
});

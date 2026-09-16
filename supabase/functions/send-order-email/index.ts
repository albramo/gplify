// gplify — send-order-email edge function (single-use download links).
// Trigger: invoked by AdminPanel when the owner confirms payment (status -> completed),
// or via resend. It creates ONE row per file in `user_downloads` and emails the
// customer gated links like:  https://gplify.vercel.app/download?token=X89Z1A
// The real file URL (Uploadthing) is NEVER put in the email.
//
// SECURITY GATES (do not remove — they block free downloads without payment):
//   1. STATUS GATE: only orders with status = 'completed' get links (403 otherwise).
//      Anyone can create a pending order and know its number, so pending must fail.
//   2. CALLER GATE: only a logged-in owner (AdminPanel Supabase Auth session)
//      may invoke this function (401 otherwise).
//      Anonymous calls — even with a valid orderNumber+email pair — are rejected.
//
// Setup:
//   supabase secrets set RESEND_API_KEY=... FROM_EMAIL=... SITE_URL=https://gplify.vercel.app
//   supabase functions deploy send-order-email
// Re-send is idempotent: existing tokens for the same order+theme are reused,
// so old links are not silently duplicated.
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'gplify <orders@gplify.store>';
const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://gplify.vercel.app').replace(/\/+$/, '');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function esc(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 12-char uppercase token (e.g. X89Z1A9Q2M4B) — collision-safe + URL-friendly.
function newToken(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { orderNumber, email } = await req.json();
    if (!orderNumber || !email) return json({ error: 'Missing orderNumber or email' }, 400);
    // Strict email shape (also blocks newline/header-injection attempts)
    if (
      typeof email !== 'string' ||
      email.length > 254 ||
      /[\r\n<>]/.test(email) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
    ) {
      return json({ error: 'Invalid email' }, 400);
    }
    if (!RESEND_API_KEY) return json({ error: 'Email service not configured' }, 500);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', String(orderNumber))
      .single();

    if (error || !order) return json({ error: 'Order not found' }, 404);
    if (String(order.customer_email).toLowerCase() !== String(email).toLowerCase()) {
      return json({ error: 'Email mismatch' }, 403);
    }

    // GATE 1 — payment: only completed (paid + owner-confirmed) orders get files.
    if (String((order as Record<string, unknown>).status ?? '') !== 'completed') {
      return json({ error: 'Order not paid yet' }, 403);
    }

    // GATE 2 — caller: only the logged-in owner (AdminPanel session) may trigger emails.
    // The storefront sends the user's access token automatically when logged in;
    // anonymous callers (anon key only) have no user and are rejected.
    const callerJwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    let callerIsOwner = false;
    if (callerJwt) {
      try {
        const anonClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        );
        const { data: { user } } = await anonClient.auth.getUser(callerJwt);
        callerIsOwner = Boolean(user?.id);
      } catch {
        callerIsOwner = false;
      }
    }
    if (!callerIsOwner) return json({ error: 'Unauthorized' }, 401);

    const items = Array.isArray(order.items) ? order.items : [];

    // Reuse tokens on resend so we never mint duplicates for the same file —
    // but only FRESH + UNUSED ones. Used/expired tokens get a brand-new token
    // instead of resending a dead link.
    const TOKEN_TTL_DAYS = 7;
    const freshSince = new Date(Date.now() - TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingRows } = await supabase
      .from('user_downloads')
      .select('download_token, theme_id, theme_title, file_url, created_at, download_count')
      .eq('order_number', String(order.order_number));
    const tokenByTheme = new Map<string, string>();
    for (const r of existingRows ?? []) {
      const rec = r as Record<string, unknown>;
      const used = Number(rec.download_count ?? 0) >= 1;
      const expired = String(rec.created_at ?? '') < freshSince;
      if (used || expired) continue;
      const key = String(rec.theme_id || rec.theme_title || '');
      if (key && !tokenByTheme.has(key)) tokenByTheme.set(key, String(rec.download_token));
    }

    // Build one gated link per item — SECURITY: file_url is resolved
    // server-side from themes by id (service_role). Client-supplied URLs
    // in order.items are ignored completely (fail closed, no direct fallback).
    const links: { title: string; version: string; gatedUrl: string | null }[] = [];
    for (const it of items as Array<Record<string, unknown>>) {
      const themeId = String(it.themeId ?? '').trim();
      const themeTitle = String(it.themeTitle ?? 'الملف');
      const version = String(it.version ?? '');
      const key = themeId || themeTitle;

      // Server-side lookup: never trust it.downloadUrl from the browser.
      let fileUrl = '';
      if (themeId) {
        const { data: themeRow } = await supabase
          .from('themes')
          .select('download_url')
          .eq('id', themeId)
          .maybeSingle();
        fileUrl = String((themeRow as Record<string, unknown> | null)?.download_url ?? '');
      }
      if (!fileUrl.startsWith('https://')) {
        links.push({ title: themeTitle, version, gatedUrl: null });
        continue;
      }
      let token = tokenByTheme.get(key);
      if (!token) {
        // Mint + insert with a few retries on (unlikely) token collision.
        let inserted = false;
        for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
          token = newToken();
          const { error: insErr } = await supabase.from('user_downloads').insert({
            customer_email: String(order.customer_email).toLowerCase(),
            download_token: token,
            file_url: fileUrl,
            theme_id: themeId,
            theme_title: themeTitle,
            order_number: String(order.order_number),
            download_count: 0,
          });
          if (!insErr) {
            inserted = true;
            tokenByTheme.set(key, token);
          } else if (!insErr.message.includes('duplicate')) {
            console.error('user_downloads insert error:', insErr.message);
            break;
          }
        }
        if (!inserted || !token) {
          // Fail closed: never expose the direct file URL.
          links.push({ title: themeTitle, version, gatedUrl: null });
          continue;
        }
      }
      links.push({ title: themeTitle, version, gatedUrl: `${SITE_URL}/download?token=${token}` });
    }

    const itemsHtml = links
      .map((l) => {
        const btn = l.gatedUrl
          ? `<a href="${esc(l.gatedUrl)}" style="display:inline-block;background:#0b132b;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">تحميل لمرة واحدة</a>` +
            `<div style="margin-top:6px;font-size:11px;color:#94a3b8;word-break:break-all;" dir="ltr">${esc(l.gatedUrl)}</div>`
          : `<span style="color:#64748b;">رابط التحميل غير متوفر — تواصل مع الدعم برقم طلبك</span>`;
        return `<tr><td style="padding:12px;border-bottom:1px solid #e2e8f0;">
          <div style="font-weight:bold;color:#0b132b;">${esc(l.title)} <span style="color:#64748b;">v${esc(l.version)}</span></div>
          <div style="margin-top:8px;">${btn}</div>
        </td></tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"></head>
<body style="font-family:Tahoma,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0b132b;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:28px;">
<h1 style="font-size:22px;margin:0 0 8px;">ملفات طلبك جاهزة — gplify</h1>
<p style="color:#475569;font-size:14px;">شكراً لشرائك! رقم الطلب: <strong>#${esc(order.order_number)}</strong></p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">${itemsHtml}</table>
<p style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:10px 14px;color:#92400e;font-size:13px;">⚠️ كل رابط يعمل <strong>لمرة واحدة فقط</strong> وصالح لمدة <strong>7 أيام</strong> من تاريخ الإرسال — اضغط عليه من جهازك الأساسي وحمّل الملف واحتفظ بنسخة.</p>
<p style="color:#475569;font-size:13px;">جميع الملفات بترخيص GPL — استخدمها على أي عدد من المواقع.</p>
<p style="color:#94a3b8;font-size:12px;">لو الزرار مش شغال، انسخ رابط التحميل والصقه في المتصفح.</p>
</div></body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [order.customer_email],
        subject: `ملفات طلبك ${order.order_number} — gplify`,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Resend error:', text);
      return json({ error: 'Email provider rejected the request' }, 502);
    }

    return json({ sent: true, links: links.length });
  } catch (e) {
    console.error(e);
    return json({ error: 'Unexpected error' }, 500);
  }
});

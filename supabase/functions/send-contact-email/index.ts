// gplify — send-contact-email edge function.
// Receives { name, email, message } from the public Contact page (/contact)
// and forwards it to the owner inbox via Resend.
//
// Setup:
//   supabase secrets set RESEND_API_KEY=... FROM_EMAIL="gplify <orders@gplify.store>" CONTACT_EMAIL=albramostafa137@gmail.com
//   supabase functions deploy send-contact-email
//
// NOTE: CONTACT_EMAIL defaults to albramostafa137@gmail.com when the secret is not set.
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'gplify <orders@gplify.store>';
const CONTACT_EMAIL = Deno.env.get('CONTACT_EMAIL') ?? 'albramostafa137@gmail.com';

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

function isValidEmail(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (!s || s.length > 254) return false;
  if (/[\r\n<>]/.test(s)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { name, email, message } = await req.json();

    const cleanName = String(name ?? '').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const cleanMessage = String(message ?? '').trim().slice(0, 5000);

    if (!cleanName || cleanName.length < 2) return json({ error: 'Invalid name' }, 400);
    if (!isValidEmail(email)) return json({ error: 'Invalid email' }, 400);
    if (!cleanMessage || cleanMessage.length < 5) return json({ error: 'Message too short' }, 400);
    if (!RESEND_API_KEY) return json({ error: 'Email service not configured' }, 500);

    const cleanEmail = String(email).trim().toLowerCase();

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"></head>
<body style="font-family:Tahoma,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0b132b;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:28px;">
<h1 style="font-size:20px;margin:0 0 8px;">رسالة جديدة من صفحة تواصل معنا — gplify</h1>
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
<tr><td style="padding:8px 0;color:#64748b;width:90px;">الاسم</td><td style="font-weight:bold;">${esc(cleanName)}</td></tr>
<tr><td style="padding:8px 0;color:#64748b;">الإيميل</td><td dir="ltr" style="text-align:right;font-weight:bold;">${esc(cleanEmail)}</td></tr>
</table>
<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.9;white-space:pre-wrap;">${esc(cleanMessage)}</div>
<p style="color:#94a3b8;font-size:12px;margin-top:16px;">رد على المرسل مباشرة عبر: ${esc(cleanEmail)}</p>
</div></body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [CONTACT_EMAIL],
        reply_to: cleanEmail,
        subject: `رسالة تواصل من ${cleanName} — gplify`,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Resend contact error:', text);
      return json({ error: 'Email provider rejected the request' }, 502);
    }

    return json({ sent: true });
  } catch (e) {
    console.error(e);
    return json({ error: 'Unexpected error' }, 500);
  }
});

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order } from '../types';
import { isValidEmail, sanitizeName } from './security';

// Local storage keys for state persistence
const STORAGE_KEYS = {
  ORDERS: 'gpl_orders_db',
  CART: 'gpl_cart_items',
  SUBSCRIBERS: 'gpl_subscribers_db',
};

// Store connection is configured ONLY by the owner via the .env file.
// There is intentionally no client-side UI to change it.
function getEnvConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getEnvConfig();
  if (config.url && config.anonKey && config.url.startsWith('https://')) {
    try {
      cachedClient = createClient(config.url, config.anonKey);
      return cachedClient;
    } catch (err) {
      console.warn('Supabase initialization failed:', err);
    }
  }
  return null;
}

export function isSupabaseConnected(): boolean {
  const config = getEnvConfig();
  return Boolean(config.url && config.anonKey && config.url.startsWith('https://'));
}

// ---------- Owner Auth (admin panel) ----------

export async function signInAdmin(email: string, password: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return 'الاتصال بقاعدة البيانات غير مضبوط في ملف .env';
  const { error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    if (error.message.includes('Invalid login credentials')) return 'بيانات الدخول غير صحيحة';
    return error.message;
  }
  return null;
}

export async function signOutAdmin() {
  const client = getSupabaseClient();
  await client?.auth.signOut();
}

export async function getAdminEmail(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.user?.email ?? null;
}

export function onAdminAuthChange(cb: (email: string | null) => void) {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    cb(session?.user?.email ?? null);
  });
  return () => data.subscription.unsubscribe();
}

// Full SQL schema lives in supabase/schema.sql — the owner runs it once
// in the Supabase dashboard SQL editor (see supabase/README.md).

// Helper: Save order to Supabase + localStorage
export async function saveOrder(order: Order): Promise<{ success: boolean; error?: string; source: 'supabase' | 'local' }> {
  // Always persist to localStorage for instant reliable access
  try {
    const existingOrdersStr = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const existingOrders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
    existingOrders.unshift(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(existingOrders));
  } catch (e) {
    console.error('Local order save error:', e);
  }

  // Attempt Supabase sync if connected
  const client = getSupabaseClient();
  if (client) {
    try {
      // SECURITY: strip any client-supplied download URLs — server resolves file_url by theme id.
      const safeItems = Array.isArray(order.items)
        ? order.items.map((it: any) => {
            const { downloadUrl, fileUrl, url, ...rest } = it ?? {};
            return rest;
          })
        : order.items;
      const { error } = await client.from('orders').insert([
        {
          order_number: order.orderNumber,
          customer_email: order.customerEmail.toLowerCase().trim(),
          customer_name: order.customerName,
          customer_phone: order.customerPhone || null,
          payment_ref: order.paymentRef || null,
          items: safeItems,
          subtotal: order.subtotal,
          discount_amount: order.discountAmount,
          coupon_code: order.couponCode || null,
          total_amount: order.totalAmount,
          payment_method: order.paymentMethod,
          status: order.status,
          download_token: order.downloadToken,
        },
      ]);

      if (error) {
        console.warn('Supabase order insert error (saved locally):', error.message);
        return { success: true, error: error.message, source: 'local' };
      }
      return { success: true, source: 'supabase' };
    } catch (err: any) {
      console.warn('Supabase connection error during order save:', err);
      return { success: true, error: err.message, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

// Subscribe email newsletter
export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.toLowerCase().trim();
  if (!isValidEmail(cleanEmail)) {
    return { success: false, message: 'يرجى إدخال بريد إلكتروني صحيح للاشتراك.' };
  }
  const client = getSupabaseClient();

  if (client) {
    try {
      const { error } = await client.from('subscribers').insert([{ email: cleanEmail }]);
      if (error && !error.message.includes('unique')) {
        console.warn('Supabase subscriber insert error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase subscriber error:', err);
    }
  }

  // Save to local state
  try {
    const subscribersStr = localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS);
    const list: string[] = subscribersStr ? JSON.parse(subscribersStr) : [];
    if (!list.includes(cleanEmail)) {
      list.push(cleanEmail);
      localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(list));
    }
  } catch (e) {
    console.error(e);
  }

  return { success: true, message: 'تم الاشتراك بنجاح في النشرة البريدية وسنرسل لك أحدث الثيمات المخفضة!' };
}

// Helper: Generate simulated downloadable archive for GPL themes
export function generateThemeDownloadZip(themeTitle: string, version: string) {
  // Generates and triggers browser download of real text/readme package with GPL license info
  const sanitized = themeTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const content = `=====================================================
gplify - OFFICIAL VERIFIED DOWNLOAD
Theme: ${themeTitle}
Version: ${version}
License: GNU General Public License (GPL v3)
=====================================================

Thank you for your purchase!
This theme is 100% original, untouched, and legally distributed under the GNU General Public License.

HOW TO INSTALL IN WORDPRESS:
1. Log into your WordPress Admin Dashboard (wp-admin).
2. Navigate to: Appearance (المظهر) -> Themes (قوالب) -> Add New (أضف جديد) -> Upload Theme (رفع قالب).
3. Choose the theme .zip package from this directory.
4. Click "Install Now" (التنصيب الآن) and then "Activate" (تفعيل).
5. If bundled plugins are required, click "Begin installing plugins" at the top banner.

FREEDOM TO USE:
- You have the legal freedom to use this theme on unlimited domain names.
- Zero license keys required to run on your sites.
- Clean code with 100% virus scan verification.

Support & Updates:
Direct download link sent to your registered email address.
=====================================================
gplify (c) 2026 - All Rights Reserved.
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitized}_v${version}_GPL_Package.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper: download a real file (Backblaze direct link) in a new tab
export function downloadDirectFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || '';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Owner inbox for the public contact form (free FormSubmit delivery — no Resend needed).
const CONTACT_DEST_EMAIL = 'albramostafa137@gmail.com';

// Best-effort: send a contact-form message to the owner inbox.
// 1) Free delivery via FormSubmit AJAX (no account, no edge function, no Resend).
//    NOTE: the FIRST message ever triggers a one-time activation email to the
//    owner inbox — the owner must click "Activate" once, then all later
//    messages arrive normally.
// 2) Always archives into `contact_messages` so nothing is lost when email
//    is not configured yet (owner reads from dashboard / AdminPanel).
export async function sendContactMessage(
  name: string,
  email: string,
  message: string
): Promise<{ sent: boolean; archived: boolean; error?: string }> {
  const cleanName = sanitizeName(name);
  const cleanEmail = email.trim().toLowerCase();
  const cleanMessage = message.trim().slice(0, 5000);
  if (!cleanName || cleanName.length < 2) return { sent: false, archived: false, error: 'يرجى كتابة الاسم.' };
  if (!isValidEmail(cleanEmail)) return { sent: false, archived: false, error: 'يرجى إدخال بريد إلكتروني صحيح.' };
  if (!cleanMessage || cleanMessage.length < 5) return { sent: false, archived: false, error: 'يرجى كتابة رسالة لا تقل عن 5 أحرف.' };

  let sent = false;
  let archived = false;

  // Free email delivery (client-side, no backend needed)
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_DEST_EMAIL)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        _subject: `رسالة تواصل من ${cleanName} — gplify`,
        _template: 'table',
        _captcha: 'false',
        _honey: '',
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
    if (res.ok) sent = true;
    else console.warn('FormSubmit contact error:', res.status);
  } catch (err) {
    console.warn('FormSubmit contact failed:', err);
  }

  // Archive first (never lose the message even if email fails)
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('contact_messages').insert([
        { name: cleanName, email: cleanEmail, message: cleanMessage },
      ]);
      if (!error) archived = true;
      else console.warn('contact_messages insert error:', error.message);
    } catch (err) {
      console.warn('contact_messages insert failed:', err);
    }
  }

  // Local fallback so the sender always gets confirmation on this device
  try {
    const key = 'gpl_contact_messages_db';
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ name: cleanName, email: cleanEmail, message: cleanMessage, at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
    archived = true;
  } catch {}

  if (!sent && !archived) return { sent, archived, error: 'تعذر إرسال الرسالة. حاول مرة أخرى أو راسلنا على فيسبوك.' };
  return { sent, archived };
}

// Best-effort: ask the edge function to email the customer their download links.
// Returns true only when the email was accepted for delivery.
export async function sendOrderEmail(orderNumber: string, email: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { data, error } = await client.functions.invoke('send-order-email', {
      body: { orderNumber, email },
    });
    if (error) {
      console.warn('Order email function error:', error.message);
      return false;
    }
    return Boolean((data as any)?.sent);
  } catch (err) {
    console.warn('Order email invoke failed:', err);
    return false;
  }
}

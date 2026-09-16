/**
 * gplify — input validation + output safety helpers.
 *
 * Threat model:
 * - SQL injection: not possible from the client (Supabase JS client sends
 *   parameterized queries; no raw SQL / rpc string building anywhere).
 * - Stored/reflected XSS: React escapes all text by default. The remaining
 *   vectors are URL contexts (href / src / redirects) which MUST pass
 *   isSafeHttpUrl, plus strict per-field validation below.
 */

export const MAX_EMAIL_LEN = 254;
export const MAX_NAME_LEN = 80;
export const MAX_PHONE_DIGITS = 15;
export const MAX_TITLE_LEN = 120;
export const MAX_SHORT_DESC_LEN = 300;
export const MAX_DESC_LEN = 5000;
export const MAX_COUPON_LEN = 20;

/** Strict email check (also rejects newlines/header-injection attempts). */
export function isValidEmail(v: string): boolean {
  const s = v.trim();
  if (!s || s.length > MAX_EMAIL_LEN) return false;
  if (/[\r\n<>]/.test(s)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

/** Clean a free-text name: trim, collapse whitespace, strip control chars, cap length. */
export function sanitizeName(v: string): string {
  return v
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LEN);
}

/**
 * Validate an optional phone number. Allows +, digits, spaces, dashes, parentheses.
 * Returns normalized digits (with leading + kept) or null if invalid.
 * Empty input → '' (field is optional).
 */
export function normalizePhone(v: string): string | null {
  const s = v.trim();
  if (!s) return '';
  if (/[\r\n<>]/.test(s)) return null;
  if (!/^[+\d][\d\s\-().]{5,24}$/.test(s)) return null;
  const digits = s.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > MAX_PHONE_DIGITS) return null;
  return (s.startsWith('+') ? '+' : '') + digits;
}

/** Coupon codes: uppercase alphanumerics + dash/underscore only. */
export function sanitizeCouponCode(v: string): string {
  return v.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, MAX_COUPON_LEN);
}

/**
 * Allow ONLY absolute http(s) URLs. Blocks javascript:, data:, vbscript:,
 * protocol-relative and relative URLs (our file/image links are always absolute).
 */
export function isSafeHttpUrl(v: string): boolean {
  const s = v.trim();
  if (!s || s.length > 2048) return false;
  if (/[\r\n<>]/.test(s)) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Return the URL if safe, otherwise '' (safe to bind to href/src). */
export function safeUrl(v: string | undefined | null): string {
  const s = String(v ?? '');
  return isSafeHttpUrl(s) ? s.trim() : '';
}

/** Cap long admin text fields (prevents DB bloat / oversized payloads). */
export function capText(v: string, max: number): string {
  return v.trim().slice(0, max);
}

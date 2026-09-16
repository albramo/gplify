// GA4 pageview tracking for the SPA (gtag.js loaded in index.html).
// Client-side navigation (pushState) doesn't trigger automatic page_view,
// so App.tsx calls trackPageView() on every view change.

const GA_ID = 'G-ERVV9SGWFT';

export function trackPageView(path: string) {
  try {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== 'function') return;
    gtag('config', GA_ID, { page_path: path });
  } catch {
    // Analytics must never break the store.
  }
}

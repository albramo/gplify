/**
 * gplify — SEO/GEO head helper for the SPA.
 * prerender.ts covers the first paint for crawlers (static HTML per /theme/*),
 * this helper keeps <head> in sync on client-side navigation (social previews,
 * Google, AIanswer engines reading DOM after hydrate).
 */

import { mergeThemeFaq } from './themeSeo';

const SITE_URL = 'https://gplify.vercel.app';
const DEFAULT_OG = `${SITE_URL}/og-cover.jpg`;

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  if (typeof document === 'undefined') return;
  const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, data: unknown) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-seo="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function toISODate(d?: string): string | null {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

export interface ThemeSeo {
  slug: string;
  title: string;
  titleEn?: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  categoryNameAr?: string;
  platform?: string;
  gplLicenseType?: string;
  price?: number;
  rating?: number;
  reviewsCount?: number;
  version?: string;
  updatedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  faq?: { question: string; answer: string }[];
}

export function setProductHead(t: ThemeSeo) {
  const canonical = `${SITE_URL}/theme/${t.slug}`;
  const licensed = Boolean((t.gplLicenseType || '').trim());
  const isShopify = (t.platform || '').toLowerCase().includes('shopify');
  const pageTitle = !licensed
    ? `تحميل ${t.title} | ${t.categoryNameAr || 'قوالب ووردبريس'} - gplify`
    : isShopify
      ? `تحميل ${t.title} شوبيفاي GPL الأصلي | ${t.categoryNameAr || 'قوالب شوبيفاي'} - gplify`
      : `تحميل ${t.title} GPL الأصلي | ${t.categoryNameAr || 'قوالب ووردبريس'} - gplify`;
  const desc = (!licensed
    ? `تحميل ${t.title} ${t.titleEn ? `(${t.titleEn}) ` : ''}(بدون رخصة — يُباع بحالته) - ${t.shortDescription || t.description || 'تسليم فوري عبر البريد.'}`
    : `تحميل ${t.title} ${t.titleEn ? `(${t.titleEn}) ` : ''}الأصلي برخصة GPL - ${t.shortDescription || t.description || 'ملفات نظيفة وتسليم فوري.'}`
  ).slice(0, 160);
  const ogImage = t.thumbnail && /^https?:\/\//i.test(t.thumbnail) ? t.thumbnail : DEFAULT_OG;
  const publishedISO = toISODate(t.createdAt);
  const modifiedISO = toISODate(t.updatedAt) || toISODate(t.updatedDate);

  document.title = pageTitle;
  upsertMeta('name', 'description', desc);
  upsertLink('canonical', canonical);
  upsertLink('alternate', canonical, 'ar');
  upsertLink('alternate', canonical, 'x-default');
  upsertMeta('property', 'og:title', pageTitle);
  upsertMeta('property', 'og:description', desc);
  upsertMeta('property', 'og:type', 'product');
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:image', ogImage);
  upsertMeta('property', 'og:image:alt', `تحميل قالب ${t.title}${licensed ? ' GPL' : ''} الأصلي - معاينة القالب`);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', pageTitle);
  upsertMeta('name', 'twitter:description', desc);
  upsertMeta('name', 'twitter:image', ogImage);
  if (publishedISO) upsertMeta('property', 'article:published_time', publishedISO);
  if (modifiedISO) upsertMeta('property', 'article:modified_time', modifiedISO);

  upsertJsonLd('product', {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name: t.title,
    alternateName: t.titleEn || undefined,
    description: desc,
    image: [ogImage],
    sku: t.slug,
    brand: { '@type': 'Brand', name: 'gplify' },
    category: t.categoryNameAr || undefined,
    inLanguage: 'ar',
    ...(publishedISO ? { datePublished: publishedISO } : {}),
    ...(modifiedISO ? { dateModified: modifiedISO } : {}),
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'EGP',
      price: String(t.price ?? 0),
      availability: 'https://schema.org/InStock',
    },
    ...(t.reviewsCount && t.reviewsCount > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: String(t.rating ?? 5), reviewCount: String(t.reviewsCount) } }
      : {}),
  });
  upsertJsonLd('breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'تحميل قوالب GPL', item: `${SITE_URL}/catalog` },
      { '@type': 'ListItem', position: 3, name: t.title, item: canonical },
    ],
  });
  // FAQ Schema لصفحات المنتجات — أسئلة الثيم + أسئلة تلقائية (مجاني/سعر/تثبيت)
  const mergedFaq = mergeThemeFaq(t.faq, t.title, t.platform, 5, licensed);
  if (mergedFaq.length > 0) {
    upsertJsonLd('faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'ar',
      mainEntity: mergedFaq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }
}

export function setStaticHead(opts: { title: string; description: string; path: string }) {
  const canonical = `${SITE_URL}${opts.path}`;
  document.title = opts.title;
  upsertMeta('name', 'description', opts.description);
  upsertLink('canonical', canonical);
  upsertLink('alternate', canonical, 'ar');
  upsertLink('alternate', canonical, 'x-default');
  upsertMeta('property', 'og:title', opts.title);
  upsertMeta('property', 'og:description', opts.description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:image', DEFAULT_OG);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', opts.title);
  upsertMeta('name', 'twitter:description', opts.description);
  upsertMeta('name', 'twitter:image', DEFAULT_OG);
}

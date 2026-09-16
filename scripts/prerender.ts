// gplify — prerender one static HTML page per theme + SEO/GEO assets.
// Runs automatically at the end of `npm run build` (no separate command).
// Result:
//   dist/theme/<slug>/index.html  لكل ثيم (title + description + canonical + hreflang
//     + og:image الخاص بالثيم + تواريخ نشر/تحديث + JSON-LD Product/Breadcrumb
//     + محتوى ثابت داخل #root للزاحفات التي لا تنفذ JS مثل AI crawlers)
//   dist/sitemap.xml  (الرئيسية + الكتالوج + كل الثيمات مع lastmod)
//   dist/robots.txt   (السماح لزاحفات البحث AI: OAI-SearchBot / Claude-SearchBot / PerplexityBot)
//   dist/llms.txt     (ملخص للأنظمة غير Google — Google نفسها تتجاهله للترتيب)
// NOTE: re-run the build (and redeploy) after adding/editing themes so the
// static pages stay in sync with the catalog.
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = (process.env.SITE_URL || 'https://gplify.vercel.app').replace(/\/+$/, '');
const DIST = join(process.cwd(), 'dist');
const DEFAULT_OG = `${SITE_URL}/og-cover.jpg`;

function esc(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isHttpUrl(u: unknown): u is string {
  return typeof u === 'string' && /^https?:\/\//i.test(u.trim());
}

function toISO(d: unknown): string | null {
  if (!d) return null;
  const t = new Date(String(d));
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

function asStrArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

async function main() {
  const templatePath = join(DIST, 'index.html');
  if (!existsSync(templatePath)) {
    console.error('dist/index.html is missing — run `vite build` first.');
    process.exit(1);
  }
  const template = readFileSync(templatePath, 'utf8');

  const url = process.env.VITE_SUPABASE_URL ?? '';
  const key = process.env.VITE_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env — skipping prerender.');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('themes')
    .select(
      'slug,title,title_en,short_description,description,thumbnail,category_name_ar,platform,price,original_price,rating,reviews_count,downloads_count,version,updated_date,created_at,updated_at,features,tags,faq'
    )
    .eq('is_active', true);

  if (error) {
    console.error('Prerender fetch failed:', error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as Record<string, any>[];
  let count = 0;
  const sitemapUrls: { loc: string; lastmod: string | null; priority: string; changefreq: string }[] = [
    { loc: `${SITE_URL}/`, lastmod: new Date().toISOString(), priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/catalog`, lastmod: new Date().toISOString(), priority: '0.9', changefreq: 'daily' },
  ];

  for (const row of rows) {
    const slug = String(row.slug || '').trim().toLowerCase();
    if (!slug) continue;
    const rawTitle = String(row.title || slug);
    const titleEn = String(row.title_en || '');
    const catAr = String(row.category_name_ar || 'قوالب ووردبريس');
    const title = `تحميل ${rawTitle} GPL الأصلي | ${catAr} - gplify`;
    const desc = (`تحميل ${rawTitle} ${titleEn ? `(${titleEn}) ` : ''}الأصلي برخصة GPL - ${String(row.short_description || row.description || 'ملفات نظيفة وتسليم فوري.')}`).slice(0, 160);
    const longDesc = String(row.description || row.short_description || desc).slice(0, 600);
    const canonical = `${SITE_URL}/theme/${slug}`;
    const ogImage = isHttpUrl(row.thumbnail) ? String(row.thumbnail).trim() : DEFAULT_OG;
    const publishedISO = toISO(row.created_at);
    const modifiedISO = toISO(row.updated_at) || toISO(row.updated_date);
    const price = Number(row.price ?? 0);
    const rating = Number(row.rating ?? 5);
    const reviews = Number(row.reviews_count ?? 0);
    const features: string[] = asStrArr(row.features).slice(0, 6);
    const faq: { question?: string; answer?: string }[] = Array.isArray(row.faq) ? row.faq.slice(0, 5) : [];

    // JSON-LD: Product + Breadcrumb (للاكتشاف في بحث AI — التواريخ تعطي المحتوى الأحدث أولوية)
    const productJson = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${canonical}#product`,
      name: String(row.title || slug),
      alternateName: String(row.title_en || ''),
      description: desc,
      image: [ogImage],
      sku: slug,
      brand: { '@type': 'Brand', name: 'gplify' },
      category: String(row.category_name_ar || ''),
      inLanguage: 'ar',
      ...(modifiedISO ? { dateModified: modifiedISO } : {}),
      ...(publishedISO ? { datePublished: publishedISO } : {}),
      offers: {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: 'EGP',
        price: String(price),
        availability: 'https://schema.org/InStock',
      },
      ...(reviews > 0
        ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: String(rating), reviewCount: String(reviews) } }
        : {}),
    };
    const breadcrumbJson = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'تحميل قوالب GPL', item: `${SITE_URL}/catalog` },
        { '@type': 'ListItem', position: 3, name: String(row.title || slug), item: canonical },
      ],
    };
    const faqJson = faq.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: 'ar',
          mainEntity: faq.map((q) => ({
            '@type': 'Question',
            name: String(q.question || ''),
            acceptedAnswer: { '@type': 'Answer', text: String(q.answer || '') },
          })),
        }
      : null;

    // محتوى ثابت داخل #root: الزاحفات التي لا تنفذ JS (كل زاحفات AI) ترى H1 + وصف + مميزات + تواريخ.
    // React يستبدله فور التحميل — لا تأثير بصري على الزوار.
    const staticFallback = `<div id="root"><main dir="rtl" lang="ar" style="max-width:720px;margin:0 auto;padding:24px;font-family:system-ui">`
      + `<nav aria-label="breadcrumb"><a href="${esc(SITE_URL)}/">الرئيسية</a> / <a href="${esc(SITE_URL)}/catalog">تحميل قوالب GPL</a> / <span>${esc(rawTitle)}</span></nav>`
      + `<h1>تحميل ${esc(rawTitle)} GPL الأصلي - ${esc(catAr)}</h1>`
      + `<p><strong>ما هو ${esc(rawTitle)}؟</strong> ${esc(longDesc)}</p>`
      + `<p>قالب ${esc(String(row.category_name_ar || ''))} لمنصة ${esc(String(row.platform || 'WordPress'))} — الإصدار ${esc(String((row as any).version || ''))} بسعر ${esc(String(price))} ج.م مع ترخيص GPL قانوني لعدد غير محدود من المواقع وتسليم فوري عبر البريد الإلكتروني. الدفع فودافون كاش وانستاباي.</p>`
      + (features.length ? `<h2>مميزات تحميل ${esc(rawTitle)} GPL</h2><ul>${features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '')
      + (faq.length ? `<h2>الأسئلة الشائعة عن ${esc(rawTitle)}</h2>${faq.map((q) => `<h3>${esc(q.question || '')}</h3><p>${esc(q.answer || '')}</p>`).join('')}` : '')
      + (modifiedISO ? `<p><time datetime="${esc(modifiedISO)}">آخر تحديث: ${esc(String(row.updated_date || modifiedISO.slice(0, 10)))}</time></p>` : '')
      + `</main></div>`;

    let html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
      // og:image لكل ثيم + twitter
      .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(ogImage)}$2`)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(ogImage)}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
      .replace(
        '</head>',
        `<link rel="canonical" href="${esc(canonical)}">\n`
        + `    <link rel="alternate" hreflang="ar" href="${esc(canonical)}">\n`
        + `    <link rel="alternate" hreflang="x-default" href="${esc(canonical)}">\n`
        + `    <meta property="og:url" content="${esc(canonical)}">\n`
        + `    <meta property="og:type" content="product">\n`
        + `    <meta property="og:image:alt" content="تحميل قالب ${esc(rawTitle)} GPL الأصلي - معاينة القالب">\n`
        + (publishedISO ? `    <meta property="article:published_time" content="${esc(publishedISO)}">\n` : '')
        + (modifiedISO ? `    <meta property="article:modified_time" content="${esc(modifiedISO)}">\n` : '')
        + `    <script type="application/ld+json">${JSON.stringify(productJson)}<\/script>\n`
        + `    <script type="application/ld+json">${JSON.stringify(breadcrumbJson)}<\/script>\n`
        + (faqJson ? `    <script type="application/ld+json">${JSON.stringify(faqJson)}<\/script>\n` : '')
        + `  </head>`
      )
      .replace(/<div id="root"><\/div>/, staticFallback);

    const dir = join(DIST, 'theme', slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    count++;
    sitemapUrls.push({ loc: canonical, lastmod: modifiedISO, priority: '0.8', changefreq: 'weekly' });
  }

  // ---- prerender الهوم والكتالوج بمحتوى ثابت للزاحفات (H1 + روابط داخلية) ----
  try {
    const homeTitle = 'تحميل قوالب GPL الأصلية | متجر ثيمات ووردبريس وشوبيفاي GPL بالعربي - gplify';
    const homeDesc = 'gplify أفضل متجر عربي لتحميل قوالب GPL الأصلية: ثيمات ووردبريس GPL، قوالب ووكومرس، ثيمات شوبيفاي بترخيص قانوني وتسليم فوري.';
    const themeLinks = rows.slice(0, 30).map((r) => {
      const s = String((r as any).slug || '').trim().toLowerCase();
      const t = String((r as any).title || s);
      return `<li><a href="${esc(SITE_URL)}/theme/${esc(s)}">تحميل ${esc(t)} GPL الأصلي</a></li>`;
    }).join('');
    const homeStatic = `<div id="root"><main dir="rtl" lang="ar" style="max-width:720px;margin:0 auto;padding:24px;font-family:system-ui">`
      + `<h1>تحميل قوالب GPL الأصلية للووردبريس وشوبيفاي</h1>`
      + `<p><strong>gplify</strong> أفضل متجر GPL عربي لتحميل ثيمات ووردبريس GPL وقوالب ووكومرس وثيمات شوبيفاي الأصلية بترخيص GPL قانوني لعدد غير محدود من المواقع مع تسليم فوري عبر البريد الإلكتروني والدفع فودافون كاش وانستاباي بالجنيه المصري.</p>`
      + `<h2>أشهر قوالب GPL للتحميل الفوري</h2><ul>${themeLinks}</ul>`
      + `<h2>ليه تحمل قوالب GPL من gplify؟</h2><p>ملفات أصلية 100% مفحوصة أمنيا، تحديثات مستمرة، استخدام على أي عدد مواقع، ودليل تثبيت عربي خطوة بخطوة.</p>`
      + `<p><a href="${esc(SITE_URL)}/catalog">تصفح كتالوج تحميل قوالب GPL كاملا</a></p>`
      + `</main></div>`;
    const homeHtml = template
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(homeTitle)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(homeDesc)}$2`)
      .replace(/<div id="root"><\/div>/, homeStatic);
    writeFileSync(join(DIST, 'index.html'), homeHtml);

    const catalogTitle = 'تحميل قوالب GPL | كتالوج ثيمات ووردبريس وشوبيفاي الأصلية - gplify';
    const catalogDesc = 'تصفح كتالوج قوالب GPL الأصلية: ثيمات ووردبريس GPL، قوالب ووكومرس، ثيمات شوبيفاي — معاينة حية وتحميل فوري بترخيص GPL قانوني.';
    const catalogStatic = `<div id="root"><main dir="rtl" lang="ar" style="max-width:720px;margin:0 auto;padding:24px;font-family:system-ui">`
      + `<h1>تحميل قوالب GPL | كتالوج ثيمات ووردبريس وشوبيفاي الأصلية</h1>`
      + `<p>تصفح كافة قوالب GPL الأصلية: ثيمات ووردبريس GPL وقوالب ووكومرس للمتاجر وثيمات شوبيفاي مع معاينة حية وتحميل فوري بعد الشراء.</p>`
      + `<ul>${themeLinks}</ul>`
      + `</main></div>`;
    const catalogHtml = template
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(catalogTitle)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(catalogDesc)}$2`)
      .replace(/<div id="root"><\/div>/, catalogStatic);
    const catalogDir = join(DIST, 'catalog');
    mkdirSync(catalogDir, { recursive: true });
    writeFileSync(join(catalogDir, 'index.html'), catalogHtml);
  } catch (e) {
    console.error('Home/catalog prerender failed:', (e as Error).message);
  }

  // ---- sitemap.xml ----
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    + sitemapUrls
      .map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${esc(u.lastmod)}</lastmod>` : ''}<changefreq>${esc(u.changefreq)}</changefreq><priority>${esc(u.priority)}</priority></url>`)
      .join('\n')
    + `\n</urlset>\n`;
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap);

  // ---- robots.txt (السماح لزاحفات بحث AI + منع صفحات الدفع/التنزيل) ----
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /checkout',
    'Disallow: /cart',
    'Disallow: /download',
    'Disallow: /admin122',
    '',
    '# AI Search crawlers (ChatGPT Search / Claude search / Perplexity citability)',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    'User-agent: Claude-SearchBot',
    'Allow: /',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
  writeFileSync(join(DIST, 'robots.txt'), robots);

  // ---- llms.txt (للأنظمة غير Google — Google تتجاهله للترتيب) ----
  const llms = [
    '# gplify',
    '> متجر عربي لقوالب وثيمات GPL الأصلية (WordPress / WooCommerce / Shopify) مع تسليم فوري عبر البريد الإلكتروني.',
    '',
    '## Main sections',
    `- [الرئيسية](${SITE_URL}/): قوالب WordPress وShopify الأصلية بسعر مخفض وتسليم فوري.`,
    `- [الكتالوج](${SITE_URL}/catalog): تصفح كافة القوالب مع المعاينة الحية والتحميل الفوري بعد الشراء.`,
    ...rows.slice(0, 50).map((r) => {
      const slug = String((r as any).slug || '').trim().toLowerCase();
      const t = String((r as any).title || slug);
      const d = String((r as any).short_description || '').slice(0, 100);
      return `- [${t}](${SITE_URL}/theme/${slug}): ${d}`;
    }),
    '',
    '## Key facts',
    '- كل القوالب أصلية 100% بترخيص GPL v2/v3 وتعمل على عدد غير محدود من المواقع.',
    '- التسليم رقمي فوري: روابط التحميل تصل على البريد الإلكتروني بعد الدفع.',
    '- الدفع: فودافون كاش / انستاباي. الأسعار بالجنيه المصري.',
    '- اللغة الأساسية للمحتوى: العربية (ar).',
    '',
  ].join('\n');
  writeFileSync(join(DIST, 'llms.txt'), llms);

  console.log(`Prerendered ${count} theme page(s) into dist/theme/*/index.html + sitemap.xml + robots.txt + llms.txt`);
}

main();

/**
 * gplify — one-time seed script.
 * Pushes the starter catalog + coupons into Supabase.
 *
 * Run:  npm run seed
 * Needs .env with: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (service_role key is server-only: NEVER prefix it with VITE_)
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { SEED_THEMES, SEED_COUPONS } from './seed-data';
import type { GPLTheme } from '../src/types';

const url = process.env.SUPABASE_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env and fill them.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

function themeToRow(t: GPLTheme) {
  return {
    id: t.id,
    title: t.title,
    title_en: t.titleEn,
    slug: t.slug,
    category: t.category,
    category_name_ar: t.categoryNameAr,
    categories: t.categories ?? [],
    platform: t.platform,
    platforms: t.platforms ?? [],
    price: t.price,
    original_price: t.originalPrice,
    rating: t.rating,
    reviews_count: t.reviewsCount,
    downloads_count: t.downloadsCount,
    version: t.version,
    updated_date: t.updatedDate,
    is_popular: t.isPopular ?? false,
    is_featured: t.isFeatured ?? false,
    is_new: t.isNew ?? false,
    is_active: true,
    badge: t.badge ?? '',
    description: t.description,
    short_description: t.shortDescription,
    features: t.features,
    compatibility: t.compatibility,
    included_plugins: t.includedPlugins ?? [],
    file_size: t.fileSize,
    gpl_license_type: t.gplLicenseType,
    thumbnail: t.thumbnail,
    screenshots: t.screenshots,
    demo_url: t.demoUrl,
    download_url: t.downloadUrl ?? '',
    tags: t.tags,
    changelog: t.changelog,
    faq: t.faq,
  };
}

async function main() {
  console.log(`Seeding ${SEED_THEMES.length} themes...`);
  const { error: themeError } = await supabase
    .from('themes')
    .upsert(SEED_THEMES.map(themeToRow), { onConflict: 'id' });
  if (themeError) {
    console.error('Themes seed failed:', themeError.message);
    process.exit(1);
  }

  console.log(`Seeding ${SEED_COUPONS.length} coupons...`);
  const { error: couponError } = await supabase.from('coupons').upsert(
    SEED_COUPONS.map((c) => ({
      code: c.code.toUpperCase(),
      discount_percent: c.discountPercent,
      description: c.description,
      is_active: true,
    })),
    { onConflict: 'code' }
  );
  if (couponError) {
    console.error('Coupons seed failed:', couponError.message);
    process.exit(1);
  }

  console.log('Seed completed successfully.');
}

main();

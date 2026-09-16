/**
 * GPLify - Default store taxonomy (fallback only).
 * The owner can edit categories + platforms from the admin panel (/admin122 → الإعدادات),
 * which are stored in the `settings` table and override these defaults at runtime.
 * Product content (themes, coupons) lives in Supabase and is fetched at runtime.
 * See supabase/schema.sql + supabase/seed-data.ts
 */
export const CATEGORIES_LIST = [
  { id: 'all', nameAr: 'الكل', nameEn: 'All Themes', icon: 'LayoutGrid' },
  { id: 'ecommerce', nameAr: 'متاجر إلكترونية', nameEn: 'E-Commerce', icon: 'ShoppingBag' },
  { id: 'business', nameAr: 'شركات وأعمال', nameEn: 'Business & Agency', icon: 'Briefcase' },
  { id: 'magazine', nameAr: 'مجلات ومدونات', nameEn: 'News & Blog', icon: 'Newspaper' },
  { id: 'portfolio', nameAr: 'بورتفوليو وإبداعي', nameEn: 'Portfolio & Creative', icon: 'Palette' },
  { id: 'saas', nameAr: 'SaaS وسرعة فائقة', nameEn: 'SaaS & Speed', icon: 'Zap' },
];

export const PLATFORMS_LIST: { id: string; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'WordPress', label: 'WordPress' },
  { id: 'WooCommerce', label: 'WooCommerce' },
  { id: 'Shopify', label: 'Shopify' },
  { id: 'Elementor', label: 'Elementor' },
  { id: 'HTML5', label: 'HTML5' },
];

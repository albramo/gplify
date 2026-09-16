import {
  LayoutGrid,
  ShoppingBag,
  Briefcase,
  Newspaper,
  Palette,
  Zap,
  GraduationCap,
  Rocket,
  Store,
  Globe,
  Camera,
  Music,
  Heart,
  Gamepad2,
  Laptop,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * gplify — category icon registry.
 * The admin panel stores only the icon NAME (string) per category.
 * To add a new icon choice: import it from lucide-react, add it to
 * CATEGORY_ICON_OPTIONS (admin dropdown) + resolveCategoryIcon (storefront).
 */
export const CATEGORY_ICON_OPTIONS: { value: string; labelAr: string }[] = [
  { value: 'LayoutGrid', labelAr: 'شبكة (عام)' },
  { value: 'ShoppingBag', labelAr: 'شنطة تسوق' },
  { value: 'Briefcase', labelAr: 'شنطة أعمال' },
  { value: 'Newspaper', labelAr: 'جريدة / مدونة' },
  { value: 'Palette', labelAr: 'باليتة ألوان (إبداعي)' },
  { value: 'Zap', labelAr: 'برق (سرعة)' },
  { value: 'GraduationCap', labelAr: 'قبعة تخرج (تعليم)' },
  { value: 'Rocket', labelAr: 'صاروخ (انطلاق)' },
  { value: 'Store', labelAr: 'متجر' },
  { value: 'Globe', labelAr: 'كرة أرضية' },
  { value: 'Camera', labelAr: 'كاميرا' },
  { value: 'Music', labelAr: 'موسيقى' },
  { value: 'Heart', labelAr: 'قلب' },
  { value: 'Gamepad2', labelAr: 'ألعاب' },
  { value: 'Laptop', labelAr: 'لابتوب' },
  { value: 'Wrench', labelAr: 'صيانة / أدوات' },
];

/** Resolve a stored icon name to its component (unknown names fall back to grid). */
export function resolveCategoryIcon(name: string): LucideIcon {
  switch ((name || '').trim()) {
    case 'ShoppingBag':
      return ShoppingBag;
    case 'Briefcase':
      return Briefcase;
    case 'Newspaper':
      return Newspaper;
    case 'Palette':
      return Palette;
    case 'Zap':
      return Zap;
    case 'GraduationCap':
      return GraduationCap;
    case 'Rocket':
      return Rocket;
    case 'Store':
      return Store;
    case 'Globe':
      return Globe;
    case 'Camera':
      return Camera;
    case 'Music':
      return Music;
    case 'Heart':
      return Heart;
    case 'Gamepad2':
      return Gamepad2;
    case 'Laptop':
      return Laptop;
    case 'Wrench':
      return Wrench;
    case 'LayoutGrid':
    default:
      return LayoutGrid;
  }
}

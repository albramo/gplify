export type ThemeCategory = 
  | 'all'
  | 'ecommerce'
  | 'business'
  | 'magazine'
  | 'portfolio'
  | 'landing'
  | 'education'
  | 'saas';

export type PlatformType = 'WordPress' | 'WooCommerce' | 'Elementor' | 'Shopify' | 'HTML5';

export interface GPLTheme {
  id: string;
  title: string;
  titleEn: string;
  slug: string;
  category: ThemeCategory;
  categoryNameAr: string;
  platform: PlatformType;
  /** Extra categories/platforms (primary stays in `category`/`platform`). Empty/missing = primary only. */
  categories?: string[];
  platforms?: string[];
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  downloadsCount: number;
  version: string;
  updatedDate: string;
  /** ISO timestamps من قاعدة البيانات — للـ SEO/GEO (datePublished/dateModified تعطي المحتوى الأحدث أولوية). */
  createdAt?: string;
  updatedAt?: string;
  isPopular?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  /** شارة مميزة على الكارت: '' = بدون شارة، 'exclusive' = حصري، 'featured' = مميز. */
  badge?: string;
  description: string;
  shortDescription: string;
  features: string[];
  compatibility: string[];
  includedPlugins?: string[];
  fileSize: string;
  /** Empty string = no license shown on the theme page (owner left it blank). */
  gplLicenseType: string;
  thumbnail: string;
  screenshots: string[];
  demoUrl: string;
  downloadUrl?: string;
  tags: string[];
  changelog: {
    version: string;
    date: string;
    changes: string[];
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export interface CartItem {
  theme: GPLTheme;
  licenseType: 'unlimited';
  price: number;
}

export interface OrderItem {
  themeId: string;
  themeTitle: string;
  themeTitleEn: string;
  price: number;
  version: string;
  fileSize: string;
  // Legacy field from old orders — never set on new checkouts.
  // Server resolves the real file_url by themeId (service_role).
  downloadUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  paymentRef?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMethod: 'vodafone_cash' | 'instapay';
  status: 'completed' | 'processing' | 'pending' | 'cancelled';
  createdAt: string;
  downloadToken: string;
  downloadCount?: number;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
  minAmount?: number;
}

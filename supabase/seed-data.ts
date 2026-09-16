/**
 * GPLify - Starter catalog SEED (one-time use).
 * This data is pushed to Supabase via pm run seed\ and is NOT imported by the UI.
 * Manage your real catalog in the Supabase dashboard (themes table) after seeding.
 */
import type { Coupon, GPLTheme } from '../src/types';

export const SEED_THEMES: GPLTheme[] = [
  {
    id: 'astra-pro',
    title: 'قالب أسترا برو - Astra Pro Multi-Purpose',
    titleEn: 'Astra Pro - Fast, Lightweight & Highly Customizable',
    slug: 'astra-pro',
    category: 'business',
    categoryNameAr: 'أعمال وشركات',
    platform: 'WordPress',
    price: 450,
    originalPrice: 2950,
    rating: 4.9,
    reviewsCount: 384,
    downloadsCount: 14200,
    version: '4.8.2',
    updatedDate: '2026-08-25',
    isPopular: true,
    isFeatured: true,
    isNew: false,
    shortDescription: 'القالب الأسرع والأكثر مبيعاً في العالم، متوافق كلياً مع إليمنتور وجميع محررات الصفحات.',
    description: 'قالب Astra Pro الأصلي بترخيص GPL كامل غير معدل. يتميز بالسرعة الخارقة والتحكم الكامل في الهيدر والفوتر والطباعة والألوان. متوافق 100% مع ووكومرس ومحرر Elementor ومناسب لجميع أنواع المواقع.',
    features: [
      'سرعة تحميل فائقة (أقل من نصف ثانية وبحجم أقل من 50 كيلوبايت)',
      'تكامل كامل وتصميمات جاهزة لمحرر Elementor و Gutenberg',
      'منشئ الهيدر والفوتر المتقدم بالسحب والإفلات',
      'تخصيص كامل للألوان والخطوط مع دعم خطوط جوجل والعربية',
      'تكامل احترافي مع متاجر WooCommerce لتصميم متجر متكامل',
      'ملفات أصلية ونظيفة 100% تم فحصها من الفيروسات والبرمجيات الخبيثة',
      'استخدام غير محدود لعدد لا نهائي من الدومينات والمواقع'
    ],
    compatibility: ['WordPress 6.7+', 'Elementor Pro', 'WooCommerce 9.0+', 'PHP 8.1 - 8.3', 'WPML', 'Polylang'],
    includedPlugins: ['Astra Pro Addon', 'Astra Premium Starter Templates', 'Ultimate Addons for Gutenberg'],
    fileSize: '14.2 MB',
    gplLicenseType: 'GPL v3',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80'
    ],
    demoUrl: 'https://wpastra.com/starter-templates/',
    tags: ['Astra', 'WordPress', 'Fast', 'Elementor', 'GPL', 'Business'],
    changelog: [
      {
        version: '4.8.2',
        date: '2026-08-25',
        changes: ['تحسين التوافق مع ووردبريس 6.7', 'إصلاح مشكلة الهيدر الثابت في الهواتف', 'تسريع تحميل CSS']
      },
      {
        version: '4.8.0',
        date: '2026-07-10',
        changes: ['إضافة 12 نموذج موقع جديد', 'دعم الخطوط المحلية للخصوصية']
      }
    ],
    faq: [
      {
        question: 'هل القالب أصلي 100% وهل يحتوي على أكواد معدلة؟',
        answer: 'نعم، الملفات أصلية تماماً وغير معدلة، مستخرجة مباشرة من المطور ويتم توفيرها لك وفق رخصة البرمجيات الحرة والمفتوحة المصدر GNU GPL.'
      },
      {
        question: 'على كم موقع يمكنني استخدام القالب؟',
        answer: 'يمكنك استخدامه على عدد غير محدود من المواقع والدومينات الشخصية والتجارية دون أي قيود.'
      }
    ]
  },
  {
    id: 'woodmart-theme',
    title: 'قالب وودمارت - WoodMart WooCommerce Theme',
    titleEn: 'WoodMart - Multipurpose WooCommerce Theme',
    slug: 'woodmart-theme',
    category: 'ecommerce',
    categoryNameAr: 'متاجر إلكترونية',
    platform: 'WooCommerce',
    price: 600,
    originalPrice: 3450,
    rating: 5.0,
    reviewsCount: 512,
    downloadsCount: 19800,
    version: '7.6.1',
    updatedDate: '2026-09-02',
    isPopular: true,
    isFeatured: true,
    isNew: true,
    shortDescription: 'أقوى قالب متجر إلكتروني لووكومرس في العالم مع فلاتر ذكية وسرعة فائقة.',
    description: 'قالب WoodMart مخصص للمتاجر الإلكترونية المتكاملة بمظهر فائق الرقي والسرعة. يأتي مع أكثر من 70 متجر جاهز للتثبيت بنقرة واحدة، ومحرك بحث وفلاتر أجاكس AJAX فائقة السرعة، ونظام مقارنة وتمنيات مدمج.',
    features: [
      'أكثر من 70+ تصميم متجر جاهز للاستيراد بنقرة واحدة (ملابس، إلكترونيات، أثاث...)',
      'فلاتر وبحث مباشر AJAX فائق السرعة دون إعادة تحميل الصفحة',
      'منشئ صفحات المنتجات وسلة الشراء بالسحب والإفلات عبر Elementor أو WPBakery',
      'دعم كامل ومتقن للغة العربية من اليمين لليسار RTL بنسبة 100%',
      'نظام المقاسات وعينات الألوان المتطورة Swatches',
      'تسجيل الدخول عبر السوشيال ميديا ونافذة الشراء السريع Quick View',
      'ترخيص GPL كامل - استخدمه لجميع عملائك ومشاريعك'
    ],
    compatibility: ['WordPress 6.7+', 'WooCommerce 9.0+', 'Elementor', 'WPBakery', 'PHP 8.1 - 8.3'],
    includedPlugins: ['WoodMart Core', 'Slider Revolution', 'WPBakery Page Builder'],
    fileSize: '38.5 MB',
    gplLicenseType: 'GPL v3',
    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=80'
    ],
    demoUrl: 'https://woodmart.xtemos.com/',
    tags: ['WooCommerce', 'WoodMart', 'Store', 'E-commerce', 'GPL', 'RTL'],
    changelog: [
      {
        version: '7.6.1',
        date: '2026-09-02',
        changes: ['إضافة ديمو جديد للمتاجر الرقمية', 'تسريع معالجة سلة الشراء عبر AJAX', 'تحديث سلايدر ريفليوشن']
      }
    ],
    faq: [
      {
        question: 'هل يدعم قالب وودمارت اللغة العربية واتجاه اليمين لليسار RTL؟',
        answer: 'نعم، قالب WoodMart يدعم اللغة العربية والـ RTL بشكل مدمج واحترافي دون الحاجة لأي إضافات خارجية.'
      }
    ]
  },
  {
    id: 'flatsome-theme',
    title: 'قالب فلاتسوم - Flatsome Multi-Purpose Responsive Theme',
    titleEn: 'Flatsome - #1 Best Selling WooCommerce Theme',
    slug: 'flatsome-theme',
    category: 'ecommerce',
    categoryNameAr: 'متاجر إلكترونية',
    platform: 'WooCommerce',
    price: 500,
    originalPrice: 2950,
    rating: 4.8,
    reviewsCount: 420,
    downloadsCount: 16500,
    version: '3.19.4',
    updatedDate: '2026-08-18',
    isPopular: true,
    isFeatured: false,
    isNew: false,
    shortDescription: 'القالب رقم 1 لمتاجر ووكومرس مع محرر UX Builder المدمج الثوري.',
    description: 'قالب Flatsome الأكثر شعبية لإنشاء متاجر إلكترونية عصرية وسريعة. يأتي مع باني صفحات خاص UX Builder لا يثقل الموقع ويمنحك حرية تصميم لا محدودة لصفحات المنتجات والتصنيفات.',
    features: [
      'محرر صفحات UX Builder المباشر فائق السرعة',
      'مكتبة تصاميم وعناصر متكاملة مع مئات الكتل الجاهزة',
      'متوافق ومحسن كلياً للهواتف الذكية وتجربة المستخدم اللمسية',
      'نظام هيدر تفاعلي مباشر متعدد المستويات',
      'دعم كامل للغة العربية ونمط RTL',
      'ملفات نظيفة 100% بترخيص GPL أصلي'
    ],
    compatibility: ['WordPress 6.6+', 'WooCommerce 9.0+', 'PHP 8.0 - 8.3'],
    fileSize: '24.8 MB',
    gplLicenseType: 'GPL v3',
    thumbnail: 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80'
    ],
    demoUrl: 'https://flatsome3.uxthemes.com/',
    tags: ['Flatsome', 'WooCommerce', 'Store', 'UX Builder', 'GPL'],
    changelog: [
      {
        version: '3.19.4',
        date: '2026-08-18',
        changes: ['تحسين كود ووكومرس الأخير', 'تحديث عناصر UX Builder للمنتجات']
      }
    ],
    faq: [
      {
        question: 'هل يمكنني استيراد الديمو بنقرة واحدة؟',
        answer: 'نعم، يتوفر مع القالب معالج استيراد الديمو التجريبي كاملاً بجميع الصور والنصوص التجريبية.'
      }
    ]
  },
  {
    id: 'divi-theme',
    title: 'قالب وديفي بيلدر - Divi Theme & Visual Builder',
    titleEn: 'Divi - The Ultimate Visual Page Builder & Theme',
    slug: 'divi-theme',
    category: 'business',
    categoryNameAr: 'أعمال وشركات',
    platform: 'WordPress',
    price: 550,
    originalPrice: 4450,
    rating: 4.9,
    reviewsCount: 670,
    downloadsCount: 22000,
    version: '4.26.1',
    updatedDate: '2026-09-08',
    isPopular: true,
    isFeatured: true,
    isNew: false,
    shortDescription: 'أشهر قالب ومركب صفحات مرئي في العالم من شركة Elegant Themes.',
    description: 'قالب Divi يغير طريقة بناء مواقع ووردبريس تماماً. يتيح لك بناء وتعديل أي جزء في الموقع مباشرة في الواجهة الأمامية بسلاسة تامة، مع أكثر من 2000 نموذج موقع جاهز ومئات العناصر المتقدمة.',
    features: [
      'محرر مرئي حقيقي WYSIWYG متطور وتفاعلي بنسبة 100%',
      'أكثر من 2000+ حزمة تخطيط جاهزة لمختلف المجالات',
      'تحكم كامل في الرسوم المتحركة والتأثيرات والتحولات',
      'نظام تحكم في الخطوط والطباعة وخلفيات التدرج والفيديو',
      'منشئ الثيمات العام Theme Builder لتخصيص القوالب والصفحات الفردية',
      'ترخيص GPL كامل وغير مقيد'
    ],
    compatibility: ['WordPress 6.7+', 'WooCommerce 9.0+', 'PHP 8.1 - 8.3'],
    fileSize: '19.4 MB',
    gplLicenseType: 'GPL v3',
    thumbnail: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80'
    ],
    demoUrl: 'https://www.elegantthemes.com/gallery/divi/',
    tags: ['Divi', 'Page Builder', 'WordPress', 'GPL', 'Agency'],
    changelog: [
      {
        version: '4.26.1',
        date: '2026-09-08',
        changes: ['تحسين أداء معالج العرض المرئي', 'إصلاح التوافق مع PHP 8.3']
      }
    ],
    faq: [
      {
        question: 'هل يشمل ذلك قالب Divi وإضافة Divi Builder؟',
        answer: 'نعم، يشمل ملف التحميل قالب Divi Theme الكامل مع المحرر المدمج وحزم النماذج.'
      }
    ]
  },
  {
    id: 'jannah-news',
    title: 'قالب جنة - Jannah Newspaper & Magazine Theme',
    titleEn: 'Jannah - News, Newspaper, Magazine & AMP Theme',
    slug: 'jannah-news',
    category: 'magazine',
    categoryNameAr: 'مجلات ومدونات',
    platform: 'WordPress',
    price: 500,
    originalPrice: 2950,
    rating: 4.9,
    reviewsCount: 310,
    downloadsCount: 11400,
    version: '6.4.0',
    updatedDate: '2026-08-30',
    isPopular: true,
    isFeatured: false,
    isNew: true,
    shortDescription: 'أفضل قالب إخباري ومجلة عربية وعالمية مع دعم AMP والإعلانات.',
    description: 'قالب جنة (Jannah) العربي العالمي الأقوى للمدونات والمواقع الإخبارية والمجلات والمراجعات. تصميم عصري سريع جداً مع دعم تسريع صفحات الهاتف AMP، وإمكانية تخصيص أماكن الإعلانات لزيادة الأرباح.',
    features: [
      'تصميم مخصص بالكامل للغة العربية والـ RTL بتناسق بصري مثالي',
      'دعم كامل لتقنية Accelerated Mobile Pages (AMP) للظهور الأول في جوجل',
      'أكثر من 50+ نمط لعرض المقالات والكتل الإخبارية',
      'نظام مدمج متقدم للإعلانات AdSense والبانرات بأماكن مدروسة',
      'نظام تقييم ومراجعات احترافي للمنتجات والخدمات',
      'أداة تحويل الموقع إلى تطبيق ويب تقدمي PWA وتنبيهات الويب Web Push'
    ],
    compatibility: ['WordPress 6.7+', 'AMP', 'WooCommerce 9.0+', 'PHP 8.1 - 8.3'],
    fileSize: '32.1 MB',
    gplLicenseType: 'GPL v3',
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80'
    ],
    demoUrl: 'https://jannah.tielabs.com/',
    tags: ['Jannah', 'News', 'Magazine', 'Arabic', 'AMP', 'GPL'],
    changelog: [
      {
        version: '6.4.0',
        date: '2026-08-30',
        changes: ['إضافة كتل عرض مقالات الفيديو Shorts', 'تحديث أماكن الإعلانات التلقائية']
      }
    ],
    faq: [
      {
        question: 'هل قالب جنة مناسب لمواقع أدسنس؟',
        answer: 'بالتأكيد، تم تصميم القالب خصيصاً لتحقيق أعلى عائد لكل ألف ظهور مع أماكن إعلانية استراتيجية وسرعة تحميل فائقة.'
      }
    ]
  },
  {
    id: 'generatepress-premium',
    title: 'قالب جينريت بريس بريميوم - GeneratePress Premium',
    titleEn: 'GeneratePress Premium - The Lightweight WordPress Theme',
    slug: 'generatepress-premium',
    category: 'saas',
    categoryNameAr: 'SaaS وسرعة قياسية',
    platform: 'WordPress',
    price: 400,
    originalPrice: 2950,
    rating: 5.0,
    reviewsCount: 290,
    downloadsCount: 13100,
    version: '3.4.1 / GP Premium 2.4.1',
    updatedDate: '2026-08-14',
    isPopular: false,
    isFeatured: true,
    isNew: false,
    shortDescription: 'القالب رقم واحد في العالم لمعايير Core Web Vitals وسرعة 100/100.',
    description: 'قالب GeneratePress Premium يركز على الكود النظيف الخالي من التعقيد. إذا كان هدفك هو الحصول على علامة 100% في Google PageSpeed وتحقيق أعلى مراتب السيو SEO، فهذا هو خيارك الأنسب.',
    features: [
      'حجم كود أقل من 30KB فقط مع صفر اعتمادات ثقيلة',
      'نظام Elements المعياري لإنشاء هوكس مخصصة بدون لمس الكود البرمجي',
      'مكتبة Site Library تحتوي على عشرات المواقع الجاهزة الأنيقة',
      'متوافق مع محرر الكتل GenerateBlocks و Gutenberg',
      'تصميم متجاوب بالكامل وآمن بنسبة 100%',
      'ترخيص GPL v3 كامل'
    ],
    compatibility: ['WordPress 6.7+', 'PHP 8.0 - 8.3', 'GenerateBlocks'],
    fileSize: '8.7 MB',
    gplLicenseType: 'GPL v3',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80'
    ],
    demoUrl: 'https://generatepress.com/site-library/',
    tags: ['GeneratePress', 'Speed', 'SEO', 'GPL', 'Lightweight'],
    changelog: [
      {
        version: '3.4.1',
        date: '2026-08-14',
        changes: ['تحسين محاذاة الخطوط', 'دعم خصائص CSS الحديثة لتقليل مساحة الصفحة']
      }
    ],
    faq: [
      {
        question: 'هل يأتي مع الإضافة البريميوم GP Premium؟',
        answer: 'نعم، الحزمة تشمل قالب GeneratePress والإضافة الملحقة GP Premium بجميع وحداتها المفعلة.'
      }
    ]
  },
  {
    id: 'porto-ecommerce',
    title: 'قالب بورتو - Porto Multipurpose & WooCommerce',
    titleEn: 'Porto - Ultimate Multipurpose WooCommerce Theme',
    slug: 'porto-ecommerce',
    category: 'ecommerce',
    categoryNameAr: 'متاجر إلكترونية',
    platform: 'WooCommerce',
    price: 550,
    originalPrice: 2950,
    rating: 4.8,
    reviewsCount: 390,
    downloadsCount: 15400,
    version: '7.2.0',
    updatedDate: '2026-08-20',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    shortDescription: 'قالب متكامل لأكثر من 130+ موقع ومتجر إلكتروني مع محرر Porto Studio.',
    description: 'قالب Porto هو أحد أكثر القوالب ثقة في العالم للمتاجر والشركات الكبرى. يأتي مع خيارات أداء فائقة، ومكتبة Porto Studio الضخمة التي تتيح لك إدراج أقسام مجهزة مسبقاً بضغطة زر واحدة.',
    features: [
      'أكثر من 130+ تصميم تجريبي متكامل للمتاجر والشركات',
      'نظام تحسين سرعة الأداء الذكي Soft Mode لضغط الأكواد والسكربتات',
      'باني صفحات كامل للمنتجات، الهيدر، الفوتر، وسلة الشراء',
      'تكامل مع Elementor و WPBakery',
      'دعم كامل للغة العربية RTL',
      'ترخيص GPL غير مقيد لجميع النطاقات'
    ],
    compatibility: ['WordPress 6.7+', 'WooCommerce 9.0+', 'Elementor', 'PHP 8.1 - 8.3'],
    fileSize: '41.0 MB',
    gplLicenseType: 'GPL v3',
    thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1200&auto=format&fit=crop&q=80'
    ],
    demoUrl: 'https://www.portotheme.com/wordpress/porto/',
    tags: ['Porto', 'WooCommerce', 'Multipurpose', 'GPL'],
    changelog: [
      {
        version: '7.2.0',
        date: '2026-08-20',
        changes: ['إضافة 5 ديموهات جديدة', 'تطوير كفاءة فلاتر الأسعار للمتاجر']
      }
    ],
    faq: [
      {
        question: 'هل يحتوي على جميع إضافات السلايدر المرفقة؟',
        answer: 'نعم، يشمل ملف الحزمة إضافات Slider Revolution و WPBakery مدمجة.'
      }
    ]
  },
  {
    id: 'salient-creative',
    title: 'قالب سالينت - Salient Creative & Agency Theme',
    titleEn: 'Salient - Responsive Multi-Purpose Theme',
    slug: 'salient-creative',
    category: 'portfolio',
    categoryNameAr: 'بورتفوليو وإبداعي',
    platform: 'WordPress',
    price: 500,
    originalPrice: 3000,
    rating: 4.9,
    reviewsCount: 260,
    downloadsCount: 9200,
    version: '17.0.8',
    updatedDate: '2026-09-01',
    isPopular: false,
    isFeatured: true,
    isNew: true,
    shortDescription: 'القالب الإبداعي الفاخر للوكالات الإعلانية، المصممين، والمحافظ الفنية.',
    description: 'قالب Salient يتميز بالحركات التفاعلية الساحرة والتأثيرات ثلاثية الأبعاد والتدرجات الهندسية المتقنة. الخيار الأول للوكالات الرقمية والمبدعين ومصممي الهوية البصرية.',
    features: [
      'أكثر من 425+ نموذج مقطع مصمم باحترافية استثنائية',
      'تأثيرات تمرير وانتقالات صفحات فريدة وسلسة بمعدل 60 إطار بالثانية',
      'أكثر من 1000 نوع من الأيقونات والخطوط المنسقة بدقة',
      'معرض بورتفوليو مرن متعدد الأنماط والشبكات',
      'ترخيص GPL كامل 100% نظيف وآمن'
    ],
    compatibility: ['WordPress 6.7+', 'PHP 8.1 - 8.3', 'WooCommerce 9.0+'],
    fileSize: '36.8 MB',
    gplLicenseType: 'GPL v3',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80'
    ],
    demoUrl: 'https://themenectar.com/salient/',
    tags: ['Salient', 'Portfolio', 'Agency', 'Creative', 'GPL'],
    changelog: [
      {
        version: '17.0.8',
        date: '2026-09-01',
        changes: ['إضافة عناصر معرض جديدة', 'تحسين دعم الشاشات اللمسية']
      }
    ],
    faq: [
      {
        question: 'هل هو مناسب للمصممين المستقلين؟',
        answer: 'نعم، يتيح لك بناء موقع بورتفوليو مذهل يعرض أعمالك وفيديوهاتك بطريقة تبهر العملاء.'
      }
    ]
  }
];

export const SEED_COUPONS: Coupon[] = [
  { code: 'GPL20', discountPercent: 20, description: 'خصم 20% على إجمالي الطلب للعملاء الجدد' },
  { code: 'GPL10', discountPercent: 10, description: 'خصم 10% فوري' },
  { code: 'VIPGPL', discountPercent: 25, description: 'خصم كبار العملاء 25%' },
];

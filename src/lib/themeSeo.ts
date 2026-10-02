/**
 * توليد أسئلة شائعة تلقائية لأي ثيم — تستهدف صيغ البحث الشائعة:
 * "[اسم الثيم] مجاني" / "[اسم الثيم] رخيص" / "[اسم الثيم] gpl" / "تحميل [اسم الثيم]"
 *
 * القاعدة: الأسئلة التلقائية تكمل الناقص فقط (لا تكرر أسئلة الثيم نفسه).
 * الإجابات صادقة: لا ندعي المجانية، بل نشرح خطر النسخ المجانية وسعرنا الرخيص.
 */

export interface ThemeFaqItem {
  question: string;
  answer: string;
}

export function themeAutoFaq(title: string, platform?: string, licensed = true): ThemeFaqItem[] {
  const t = (title || '').trim();
  if (!t) return [];
  const isShopify = (platform || '').toLowerCase().includes('shopify');
  const place = isShopify ? 'متجرك في شوبيفاي' : 'موقعك في وردبريس';
  const panel = isShopify ? 'لوحة تحكم شوبيفاي ثم الثيمات' : 'لوحة تحكم وردبريس ثم المظهر';
  const platformTerm = isShopify ? 'ثيمات شوبيفاي وقوالب shopify' : 'قوالب وردبريس وثيمات ووردبريس';
  return [
    {
      question: `هل يمكن تحميل ${t} مجاني؟`,
      answer: licensed
        ? `البحث عن تحميل ${t} مجاناً أو نسخ مجانية مضروبة (nulled) قد يعرض ${place} للخطر بسبب الفيروسات والأكواد الخبيثة. في gplify بدلاً من المخاطرة بنسخ مجانية غير آمنة، نوفر لك قالب ${t} الأصلي 100% بترخيص GPL وبسعر رمزي ومخفض جدا بالجنيه المصري مع تسليم فوري لملف الـ ZIP على إيميلك.`
        : `النسخ المجانية المنتشرة من ${t} غالباً قديمة وملغومة وتضر ${place}. النسخة المتاحة هنا أصلية ونظيفة ومفحوصة، معروضة بحالتها بسعر رمزي جدا بديل النسخ المجانية المضروبة مع تسليم فوري عبر البريد الإلكتروني.`,
    },
    {
      question: `ما هو الفرق بين شراء ${t} هنا وسعره من المطور؟`,
      answer: `السعر الرسمي لقالب ${t} على موقع المطور الأصلي يصل لعشرات الدولارات لرخصة موقع واحد، بينما نوفر نفس الملف الأصلي النظيف 100% بسعر مخفض جداً بالجنيه المصري لاستخدامه على عدد غير محدود من المواقع والمتاجر ضمن ${platformTerm}.`,
    },
    {
      question: `طريقة تثبيت قالب ${t} بعد التحميل؟`,
      answer: `فور الشراء يصلك رابط تحميل مباشر لملف الـ ZIP الأصلي على بريدك الإلكتروني. يمكنك رفعه وتفعيله مباشرة عبر ${panel} خلال دقيقتين فقط وبدون أي تعقيد برمجي.`,
    },
  ];
}

/** دمج أسئلة الثيم المدخلة مع الأسئلة التلقائية (بحد أقصى max). */
export function mergeThemeFaq(
  themeFaq: ThemeFaqItem[] | undefined,
  title: string,
  platform?: string,
  max = 5,
  licensed = true
): ThemeFaqItem[] {
  const base = Array.isArray(themeFaq)
    ? themeFaq.filter((f) => f && (f.question || '').trim() && (f.answer || '').trim())
    : [];
  if (base.length >= max) return base.slice(0, max);
  const auto = themeAutoFaq(title, platform, licensed).filter(
    (a) => !base.some((b) => b.question.trim() === a.question.trim())
  );
  return [...base, ...auto].slice(0, max);
}

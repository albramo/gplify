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
  const place = isShopify ? 'متجرك في شوبيفاي' : 'موقعك';
  const panel = isShopify ? 'لوحة تحكم شوبيفاي ثم الثيمات' : 'لوحة تحكم ووردبريس ثم المظهر';
  return [
    {
      question: `هل ${t} متوفر مجانا؟`,
      answer: licensed
        ? `النسخ المجانية من ${t} المنتشرة على المنتديات غالبا قديمة أو فيها أكواد خبيثة ممكن تضر ${place}. في gplify بتاخد النسخة الأصلية الكاملة برخصة GPL بسعر رخيص بالجنيه المصري مع تسليم فوري على إيميلك وتحديثات مستمرة.`
        : `النسخ المجانية من ${t} المنتشرة على المنتديات غالبا قديمة أو فيها أكواد خبيثة ممكن تضر ${place}. النسخة المتوفرة هنا معروضة بدون رخصة وتُباع بحالتها كما هي بسعر رخيص بالجنيه المصري مع تسليم فوري على إيميلك.`,
    },
    {
      question: `كم سعر ${t} الأصلي؟`,
      answer: `سعر ${t} الرسمي على موقع المطور بيوصل لعشرات الدولارات لرخصة الموقع الواحد، لكن عندنا بتاخد نفس الملف الأصلي بسعر مخفض بكتير وبدون حدود على عدد المواقع والمتاجر.`,
    },
    {
      question: `ازاي أثبت ${t}؟`,
      answer: `بعد الشراء بيوصلك ملف ZIP على إيميلك زي الأصلي بالظبط بدون أي تعديل — بترفعه من ${panel} والموضوع بياخد دقايق بدون أي خبرة برمجية.`,
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

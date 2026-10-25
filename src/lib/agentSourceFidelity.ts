import type { FieldSchema } from '../types';

export type SourceFidelity = { status: 'verified' | 'needs-review'; reason: string };
/** Verify source-language reconstruction only. Translation and alternative options still need editorial review. */
export function verifySourceFidelity(sourceText: string, body: string, fields: readonly FieldSchema[]): SourceFidelity {
  const no = (reason: string): SourceFidelity => ({ status: 'needs-review', reason });
  const canonical = (text: string) => text.replace(/\r\n?/g, '\n').trim();
  if (!sourceText.trim() || !body.trim()) return no('متن اصلی یا متن آماده‌شده خالی است.');
  const spans = new Map<string, string>();
  for (const field of fields) {
    if (!field.sourceText || !sourceText.includes(field.sourceText)) return no(`عبارت اصلی فیلد «${field.label}» در منبع مشخص نیست.`);
    if (spans.has(field.key)) return no('کلید تکراری در فیلدها وجود دارد.');
    if (!/^[a-z][a-z0-9_]*$/.test(field.key)) return no('کلید فیلد معتبر نیست.');
    const inputToken = /^(?:\{\{[^{}]+\}\}|\[\[[^\]]+\]\]|\[[^\]\n]+\])$/.test(field.sourceText);
    if (!inputToken && field.defaultValue !== field.sourceText) return no(`پیش‌فرض فیلد «${field.label}» با عبارت اصلی برابر نیست.`);
    if (inputToken && field.defaultValue) return no(`برای ورودی «${field.label}» مقدار پیش‌فرض ساختگی مجاز نیست.`);
    if (field.options?.length && field.defaultValue && field.options[0].split('|')[0].trim() !== field.defaultValue)
      return no(`اولین گزینهٔ «${field.label}» پیش‌فرض اصلی را بازسازی نمی‌کند.`);
    if (!body.includes(`[[${field.key}]]`) && !body.includes(`{{${field.key}}}`)) return no(`فیلد «${field.label}» در متن استفاده نشده است.`);
    if (field.options?.length && field.defaultValueFa && field.options[0].includes('|') && field.options[0].split('|')[1].trim() !== field.defaultValueFa)
      return no(`پیش‌فرض فارسی «${field.label}» با اولین گزینه هماهنگ نیست.`);
    spans.set(field.key, field.sourceText);
  }
  const restored = body.replace(/\[\[([a-z][a-z0-9_]*)\]\]|\{\{([a-z][a-z0-9_]*)\}\}/g,
    (token, a, b) => spans.get(a || b) ?? token);
  if (canonical(restored) !== canonical(sourceText)) return no('متن آماده‌شده پس از بازگرداندن عبارت‌های اصلی با منبع برابر نیست؛ ممکن است عبارتی حذف یا تغییر کرده باشد.');
  return { status: 'verified', reason: 'متن زبان اصلی با بازگرداندن عبارت‌های فیلدها دقیقاً حفظ شده است؛ ترجمه و گزینه‌های جایگزین هنوز نیازمند بازبینی‌اند.' };
}

import type { Prompt } from '../types';

// Stable identifiers shared by authoring, search and persistence.
export const useCaseGroups: { slug: string; title: string; parent?: string }[] = [
  { slug: 'business', title: 'کسب‌وکار' },
  { slug: 'product', title: 'معرفی محصول', parent: 'business' },
  { slug: 'social', title: 'سوشال مدیا' },
  { slug: 'software', title: 'توسعه نرم‌افزار' },
  { slug: 'design', title: 'طراحی رابط و محتوای بصری' },
  { slug: 'personal', title: 'رشد فردی و یادگیری' },
  { slug: 'publishing', title: 'نوشتن و نشر' },
  { slug: 'content', title: 'تولید محتوا' },
];
export const getGroup = (slug?: string) => useCaseGroups.find(item => item.slug === slug);
export function groupAncestors(slug?: string): string[] {
  const result: string[] = [];
  while (slug && !result.includes(slug)) { result.push(slug); slug = getGroup(slug)?.parent; }
  return result;
}
export const useCaseInGroups = (slug: string | undefined, groups: string[]) => !groups.length || groupAncestors(getUseCase(slug)?.group).some(group => groups.includes(group));
export function useCasePath(slug?: string): string {
  const item = getUseCase(slug);
  return item ? [...groupAncestors(item.group).reverse().map(group => getGroup(group)!.title), item.title].join(' ← ') : '';
}
export const useCases = [
  { slug: 'product-video', group: 'product', title: 'ساخت ویدیوی محصول', aliases: ['ویدئو', 'ویدیو تبلیغاتی', 'تیزر'] },
  { slug: 'product-image', group: 'product', title: 'ساخت تصویر محصول', aliases: ['عکس محصول', 'عکاسی محصول'] },
  { slug: 'product-script', group: 'product', title: 'نوشتن سناریوی تبلیغاتی', aliases: ['سناریوی ویدیو', 'سناریو معرفی محصول'] },
  { slug: 'mobile-app', group: 'software', title: 'ساخت اپلیکیشن موبایل', aliases: ['اندروید', 'اندرویدی', 'android', 'اپ موبایل'] },
  { slug: 'app-development', group: 'software', title: 'ساخت اپلیکیشن', aliases: ['ساخت برنامه', 'توسعه اپ'] },
  { slug: 'business-ideas', group: 'business', title: 'کشف و ارزیابی ایده', aliases: ['ایده پردازی کسب و کار', 'ایده کسب‌وکار'] },
  { slug: 'business-plan', group: 'business', title: 'تدوین برنامه کسب‌وکار', aliases: ['بیزنس پلن', 'طرح کسب و کار'] },
  { slug: 'sales-analysis', group: 'business', title: 'تحلیل عملکرد فروش', aliases: ['فروش ماهانه', 'گزارش فروش'] },
  { slug: 'personal-goal', group: 'personal', title: 'برنامه‌ریزی برای یک هدف', aliases: ['کوچینگ', 'توسعه فردی', 'رشد فردی'] },
  { slug: 'learning-plan', group: 'personal', title: 'برنامه‌ریزی یادگیری', aliases: ['مسیر یادگیری', 'آموزش مهارت'] },
  { slug: 'ui-building', group: 'design', title: 'ساخت رابط کاربری', aliases: ['ui', 'طراحی رابط', 'کامپوننت'] },
  { slug: 'ui-review', group: 'design', title: 'ارزیابی رابط کاربری', aliases: ['دسترس پذیری', 'accessibility', 'بازبینی ui'] },
  { slug: 'reference-portrait', group: 'design', title: 'ساخت پرتره با تصویر مرجع', aliases: ['پرتره', 'فشن', 'عکس چهره'] },
  { slug: 'book-writing', group: 'publishing', title: 'تدوین کتاب', aliases: ['نوشتن کتاب', 'نویسندگی', 'فصل کتاب'] },
  { slug: 'content-calendar', group: 'social', title: 'برنامه‌ریزی انتشار', aliases: ['تقویم محتوا', 'شبکه های اجتماعی', 'تقویم محتوایی'] },
  { slug: 'social-content', group: 'social', title: 'تولید محتوای شبکه‌های اجتماعی', aliases: ['محتوای سوشال مدیا', 'social media content'] },
  { slug: 'social-brand', group: 'social', title: 'تدوین استراتژی برند در سوشال مدیا', aliases: ['برند کوچ', 'brand coach', 'هویت برند', 'برند شخصی'] },
  { slug: 'social-profile', group: 'social', title: 'ساخت عکس پروفایل اینستاگرام', aliases: ['عکس پروفایل', 'instagram profile', 'آواتار'] },
  { slug: 'instagram-post', group: 'social', title: 'ساخت پست و کاروسل اینستاگرام', aliases: ['پست اینستاگرام', 'instagram post', 'اسلاید اینستاگرام'] },
  { slug: 'instagram-story', group: 'social', title: 'ساخت استوری اینستاگرام', aliases: ['استوری', 'instagram story'] },
  { slug: 'instagram-growth', group: 'social', title: 'رشد و فروش در اینستاگرام', aliases: ['کسب و کار اینستاگرام', 'کسب‌وکار اینستاگرام', 'instagram business'] },
  { slug: 'article-writing', group: 'content', title: 'نوشتن مقاله و محتوای وب', aliases: ['مقاله نویسی', 'وبلاگ', 'blog'] },
  { slug: 'text-editing', group: 'content', title: 'بازنویسی و خلاصه‌سازی متن', aliases: ['ویرایش متن', 'خلاصه سازی', 'بازنویسی'] },
];
export const resourceTypes = { prompt: 'پرامپت', skill: 'Skill', 'agent-guide': 'راهنمای ایجنت' };
export type ResourceType = keyof typeof resourceTypes;
export const outputLabels: Record<string, string> = {
  text: 'متن', image: 'تصویر', video: 'ویدیو', audio: 'صدا', code: 'کد و پروژه',
  table: 'جدول', roadmap: 'برنامه مرحله‌ای', report: 'گزارش', chart: 'نمودار',
  markdown: 'Markdown', json: 'JSON', csv: 'CSV', html: 'HTML', react: 'React',
  checklist: 'چک‌لیست', presentation: 'ارائه', pdf: 'PDF', css: 'CSS', javascript: 'JavaScript', python: 'Python', typescript: 'TypeScript', sql: 'SQL', xml: 'XML',
};
export const getUseCase = (slug?: string) => useCases.find(item => item.slug === slug);
export const normalizeIntent = (value: string) => value.toLowerCase() === 'learning' ? 'teaching' : value.toLowerCase();
export function normalizeArchivePrompt<T extends Partial<Prompt>>(prompt: T): T {
  const useCase = getUseCase(prompt.useCase);
  return { ...prompt,
    ...(prompt.intent ? { intent: normalizeIntent(prompt.intent) } : {}),
    ...(prompt.intents ? { intents: [...new Set(prompt.intents.map(normalizeIntent))] } : {}),
    ...(useCase ? { category: useCase.title } : {}),
  };
}

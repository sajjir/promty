import type { Prompt } from '../types';
import { researchedUseCases, legacyUseCases } from './archiveUseCaseDefinitions';

// Stable identifiers shared by authoring, search and persistence.
export const useCaseGroups: { slug: string; title: string; parent?: string }[] = [
  { slug: 'business', title: 'کسب‌وکار و مدیریت' },
  { slug: 'product', title: 'معرفی محصول', parent: 'business' },
  { slug: 'social', title: 'سوشال مدیا و جامعه‌سازی' },
  { slug: 'publishing', title: 'نوشتن، محتوا و نشر' },
  { slug: 'visual', title: 'طراحی بصری و تولید رسانه' },
  { slug: 'ux', title: 'طراحی محصول و تجربه کاربری' },
  { slug: 'software', title: 'توسعه نرم‌افزار و اتوماسیون' },
  { slug: 'data', title: 'داده، تحلیل و پژوهش' },
  { slug: 'education', title: 'آموزش و یادگیری' },
  { slug: 'personal', title: 'رشد فردی، مسیر شغلی و زندگی روزمره' },
];
// Preserve old filter links without introducing extra parent categories.
export function expandGroupFilters(groups: string[]): string[] {
  return [...new Set(groups.flatMap(group => group === 'design' ? ['visual', 'ux'] : group === 'content' ? ['publishing'] : [group]))];
}
export const getGroup = (slug?: string) => useCaseGroups.find(item => item.slug === slug);
export function groupAncestors(slug?: string): string[] {
  const result: string[] = [];
  while (slug && !result.includes(slug)) { result.push(slug); slug = getGroup(slug)?.parent; }
  return result;
}
export const useCaseInGroups = (slug: string | undefined, groups: string[]) => !groups.length || groupAncestors(getUseCase(slug)?.group).some(group => expandGroupFilters(groups).includes(group));
export function useCasePath(slug?: string): string {
  const item = getUseCase(slug);
  return item ? [...groupAncestors(item.group).reverse().map(group => getGroup(group)!.title), item.title].join(' ← ') : '';
}
export const useCases = [...researchedUseCases, ...legacyUseCases];
export const resourceTypes = { prompt: 'پرامپت · Prompt', skill: 'مهارت · Skill', 'agent-guide': 'راهنمای ایجنت · Agent Guide' };
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

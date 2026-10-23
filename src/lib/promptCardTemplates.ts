/** Saved template IDs are allowlisted; existing installations start with normal cards. */
export type PromptCardTemplate = 'grid' | 'fan';

export const promptCardTemplates = [
  {id: 'grid', title: 'کارت معمولی', description: 'چیدمان شبکه‌ای؛ چند منبع در یک نگاه', recommended: true},
  {id: 'fan', title: 'کارت بادبزنی', description: 'مرور کارت‌ها با ورق‌زدن و کشیدن', recommended: false},
] as const;

export function normalizePromptCardTemplate(value?: unknown): PromptCardTemplate {
  return value === 'fan' ? 'fan' : 'grid';
}

export function getPromptCardTemplateError(value: unknown): string | null {
  return value === 'grid' || value === 'fan' ? null : 'قالب کارت باید معمولی یا بادبزنی باشد.';
}

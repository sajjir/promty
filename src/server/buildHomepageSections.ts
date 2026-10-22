import type { Prompt } from '../types';
import { normalizeHomepageSections } from '../lib/homepageSections';
import { filterPrompts } from './repositories/filterPrompts';

/** Supplemental shelves never inherit search filters or an administrator's draft access. */
export function buildHomepageSections(prompts: Prompt[], settings: unknown) {
  return normalizeHomepageSections(settings).filter(section => section.id !== 'latest' && section.enabled).map(section => {
    let rows = filterPrompts(prompts, {isActive:true,sort:section.source === 'trending' ? 'usage' : 'latest',
      ...(section.source === 'category' ? {group:[section.group],...(section.useCase ? {useCase:[section.useCase]} : {})} : {})});
    if (section.source === 'trending') rows = rows.filter(prompt => (prompt.usageCount || 0) > 0);
    return {...section,total:rows.length,prompts:rows.slice(0,section.limit).map(prompt => {
      const {editorial,...publicPrompt} = prompt as Prompt & {editorial?:unknown};
      return publicPrompt;
    })};
  });
}

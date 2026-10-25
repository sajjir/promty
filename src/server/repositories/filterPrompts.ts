import { filterValues, FilterSelection } from "../../lib/archiveFilters";
import { getUseCase, groupAncestors, useCaseInGroups, normalizeArchivePrompt, normalizeIntent } from '../../lib/archiveCatalog';
import { Prompt } from "../../types";
import { PromptFilters } from "./IPromptRepository";
import { SearchService } from "../services/SearchService";

/** Shared semantics for both persistence adapters; pagination happens last. */
export function filterPrompts(prompts: Prompt[], filters: PromptFilters = {}): Prompt[] {
  const equal = (a: string | undefined, b: string) => SearchService.normalizeText(a || "") === SearchService.normalizeText(b);
  const matches = (selection: FilterSelection | undefined, values: (string | undefined)[]) => {
    const selected = filterValues(selection);
    return !selected.length || selected.some(choice => values.some(value => equal(value, choice)));
  };
  let list = prompts.map(p => normalizeArchivePrompt(p)).filter(p =>
    matches(filters.useCase, [p.useCase]) &&
    useCaseInGroups(p.useCase, filterValues(filters.group)) &&
    matches(filters.resourceType, [p.resourceType || "prompt"]) &&
    matches(filters.outputFormat, p.outputFormats || []) &&
    (filters.isActive === undefined || p.isActive === filters.isActive) &&
    (!filters.category || equal(p.category, filters.category)) &&
    matches(filters.tool, p.tools || []) &&
    matches(filters.domain, p.domains || []) &&
    matches(filterValues(filters.intent).map(normalizeIntent), [...(p.intents || []), p.intent]) &&
    matches(filters.difficulty, [p.difficulty]) &&
    matches(filters.language, [p.language]) &&
    matches(filters.access, [p.isPremium ? "premium" : "free"]) &&
    (!filterValues(filters.referenceImage).some(value => value.toLowerCase() === 'required') || p.requiresReferenceImage === true)
  );
  if (filters.q?.trim()) list = SearchService.search(list, filters.q).prompts;
  return [...list].sort((a, b) => {
    const primary = filters.sort === "title" ? a.title.localeCompare(b.title, "fa")
      : filters.sort === "usage" ? (b.usageCount || 0) - (a.usageCount || 0)
      : filters.q && (!filters.sort || filters.sort === "relevance") ? 0 : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return primary || (filters.q && (!filters.sort || filters.sort === "relevance") ? 0 : a.id.localeCompare(b.id));
  });
}
export function paginatePrompts(list: Prompt[], filters: PromptFilters = {}) {
  const totalCount = list.length;
  if (filters.page && filters.limit) list = list.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
  return { prompts: list, totalCount };
}

/** Count alternatives for each facet, omitting only its own selection. */
export function buildArchiveFacets(prompts: Prompt[], filters: PromptFilters = {}) {
  const rows = (omit: string[]) => filterPrompts(prompts, Object.fromEntries(Object.entries(filters).filter(([key]) => ![...omit, 'page', 'limit', 'sort'].includes(key))));
  const count = (list: Prompt[], values: (prompt: Prompt) => (string | undefined)[]) => {
    const result: Record<string, number> = {};
    for (const prompt of list) for (const value of new Set(values(prompt).filter(Boolean))) result[value!] = (result[value!] || 0) + 1;
    return result;
  };
  return {
    archiveFacets: {
      groups: count(rows(['group', 'useCase']), p => groupAncestors(getUseCase(p.useCase)?.group)),
      useCases: count(rows(['useCase']), p => [p.useCase]),
      resourceTypes: count(rows(['resourceType']), p => [p.resourceType || 'prompt']),
      outputFormats: count(rows(['outputFormat']), p => p.outputFormats || []),
      access: count(rows(['access']), p => [p.isPremium ? 'premium' : 'free']),
      referenceImage: count(rows(['referenceImage']), p => p.requiresReferenceImage === true ? ['required'] : []),
    },
    facets: {
      tools: count(rows(['tool']), p => (p.tools || []).map(value => value.toLowerCase())),
      domains: count(rows(['domain']), p => (p.domains || []).map(value => value.toLowerCase())),
      intents: count(rows(['intent']), p => [...(p.intents || []), p.intent].filter(Boolean).map(value => normalizeIntent(value!))),
      difficulties: count(rows(['difficulty']), p => [p.difficulty?.toLowerCase()]),
      languages: count(rows(['language']), p => [p.language?.toLowerCase()]),
    },
  };
}

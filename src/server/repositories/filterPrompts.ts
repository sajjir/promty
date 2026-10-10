import { Prompt } from "../../types";
import { PromptFilters } from "./IPromptRepository";
import { SearchService } from "../services/SearchService";

/** Shared semantics for both persistence adapters; pagination happens last. */
export function filterPrompts(prompts: Prompt[], filters: PromptFilters = {}): Prompt[] {
  const equal = (a: string | undefined, b: string) => SearchService.normalizeText(a || "") === SearchService.normalizeText(b);
  let list = prompts.filter(p =>
    (filters.isActive === undefined || p.isActive === filters.isActive) &&
    (!filters.category || equal(p.category, filters.category)) &&
    (!filters.tool || (p.tools || []).some(t => equal(t, filters.tool!))) &&
    (!filters.domain || (p.domains || []).some(d => equal(d, filters.domain!))) &&
    (!filters.intent || [...(p.intents || []), p.intent].some(i => equal(i, filters.intent!))) &&
    (!filters.difficulty || equal(p.difficulty, filters.difficulty)) &&
    (!filters.language || equal(p.language, filters.language))
  );
  if (filters.q?.trim()) list = SearchService.search(list, filters.q).prompts;
  return [...list].sort((a, b) => {
    const primary = filters.sort === "title" ? a.title.localeCompare(b.title, "fa")
      : filters.sort === "usage" ? (b.usageCount || 0) - (a.usageCount || 0)
      : filters.q && !filters.sort ? 0 : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return primary || (filters.q && !filters.sort ? 0 : a.id.localeCompare(b.id));
  });
}
export function paginatePrompts(list: Prompt[], filters: PromptFilters = {}) {
  const totalCount = list.length;
  if (filters.page && filters.limit) list = list.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
  return { prompts: list, totalCount };
}

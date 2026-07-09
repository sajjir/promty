// src/server/services/SearchService.ts
import { Prompt } from "../../types";

export interface SearchResult {
  prompts: Prompt[];
  matchedTools: string[];
  matchedDomains: string[];
  matchedTags: string[];
  matchedTasks: string[];
  suggestions: string[];
}

export class SearchService {
  private static searchHistory: string[] = [];

  /**
   * Normalizes Persian and English text to optimize matching and bypass typos
   */
  public static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[أإآ]/g, "ا")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Records a user search query in history, keeping it clean and unique
   */
  public static recordSearch(query: string): void {
    const normalized = query.trim();
    if (!normalized) return;

    this.searchHistory = [
      normalized,
      ...this.searchHistory.filter((q) => q !== normalized)
    ].slice(0, 10); // Limit to top 10 recent searches
  }

  public static getSearchHistory(): string[] {
    return this.searchHistory;
  }

  /**
   * Universal natural language search over multiple entity layers
   */
  public static search(prompts: Prompt[], query: string): SearchResult {
    const normalizedQuery = this.normalizeText(query);
    if (!normalizedQuery) {
      return {
        prompts,
        matchedTools: [],
        matchedDomains: [],
        matchedTags: [],
        matchedTasks: [],
        suggestions: []
      };
    }

    const matchedToolsSet = new Set<string>();
    const matchedDomainsSet = new Set<string>();
    const matchedTagsSet = new Set<string>();
    const matchedTasksSet = new Set<string>();
    const suggestionsSet = new Set<string>();

    const matches = prompts.filter((p) => {
      const normalizedTitle = this.normalizeText(p.title);
      const normalizedDesc = this.normalizeText(p.description);
      const normalizedTask = this.normalizeText(p.task || "");
      
      // Checking title/desc match
      const isTitleMatch = normalizedTitle.includes(normalizedQuery);
      const isDescMatch = normalizedDesc.includes(normalizedQuery);
      const isTaskMatch = normalizedTask.includes(normalizedQuery);

      if (isTitleMatch) suggestionsSet.add(p.title);

      // Checking tag match
      let isTagMatch = false;
      p.tags.forEach((tag) => {
        const normalizedTag = this.normalizeText(tag);
        if (normalizedTag.includes(normalizedQuery) || normalizedQuery.includes(normalizedTag)) {
          isTagMatch = true;
          matchedTagsSet.add(tag);
        }
      });

      // Checking tool match
      let isToolMatch = false;
      (p.tools || []).forEach((tool) => {
        const normalizedTool = this.normalizeText(tool);
        if (normalizedTool.includes(normalizedQuery) || normalizedQuery.includes(normalizedTool)) {
          isToolMatch = true;
          matchedToolsSet.add(tool);
        }
      });

      // Checking domain match
      let isDomainMatch = false;
      (p.domains || []).forEach((domain) => {
        const normalizedDomain = this.normalizeText(domain);
        if (normalizedDomain.includes(normalizedQuery) || normalizedQuery.includes(normalizedDomain)) {
          isDomainMatch = true;
          matchedDomainsSet.add(domain);
        }
      });

      if (p.task && isTaskMatch) {
        matchedTasksSet.add(p.task);
      }

      return isTitleMatch || isDescMatch || isTaskMatch || isTagMatch || isToolMatch || isDomainMatch;
    });

    // Populate dynamic autocomplete suggestions
    if (suggestionsSet.size < 5) {
      prompts.forEach((p) => {
        if (suggestionsSet.size >= 5) return;
        if (p.title.toLowerCase().startsWith(normalizedQuery)) {
          suggestionsSet.add(p.title);
        }
      });
    }

    return {
      prompts: matches,
      matchedTools: Array.from(matchedToolsSet),
      matchedDomains: Array.from(matchedDomainsSet),
      matchedTags: Array.from(matchedTagsSet),
      matchedTasks: Array.from(matchedTasksSet),
      suggestions: Array.from(suggestionsSet).slice(0, 5)
    };
  }
}

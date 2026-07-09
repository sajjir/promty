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

    const SYNONYM_MAP: Record<string, string[]> = {
      "midjourney": ["میدجرنی", "میدجرینی", "تصویرساز", "عکس", "نقاشی", "midjourney", "mj"],
      "chatgpt": ["چت جی پی تی", "چت‌جی‌پی‌تی", "جی پی تی", "gpt", "chatgpt"],
      "claude": ["کلود", "کلاود", "claude"],
      "gemini": ["جمینای", "جمینی", "gemini"],
      "flux": ["فلاکس", "فلوکس", "flux"],
      "suno": ["سونو", "موزیک", "آهنگ", "suno"],
      "elevenlabs": ["الون لبز", "الون‌لبز", "صدا", "گویندگی", "elevenlabs"]
    };

    const matchedToolsSet = new Set<string>();
    const matchedDomainsSet = new Set<string>();
    const matchedTagsSet = new Set<string>();
    const matchedTasksSet = new Set<string>();
    const suggestionsSet = new Set<string>();

    // Split query into keywords
    const keywords = normalizedQuery.split(/\s+/).filter(k => k.length > 1);

    // If query is very short, just use it as single keyword
    if (keywords.length === 0 && normalizedQuery.length > 0) {
      keywords.push(normalizedQuery);
    }

    const scoredPrompts = prompts.map((p) => {
      const normalizedTitle = this.normalizeText(p.title);
      const normalizedDesc = this.normalizeText(p.description);
      const normalizedTask = this.normalizeText(p.task || "");
      
      let score = 0;
      let matchedAnyKeyword = false;

      // 1. Check exact phrase match (high priority bonus)
      if (normalizedTitle.includes(normalizedQuery)) {
        score += 30;
        matchedAnyKeyword = true;
        suggestionsSet.add(p.title);
      }
      if (normalizedDesc.includes(normalizedQuery)) {
        score += 15;
        matchedAnyKeyword = true;
      }

      // 2. Keyword-based matching
      keywords.forEach((keyword) => {
        let keywordMatched = false;

        // Check title match
        if (normalizedTitle.includes(keyword)) {
          score += 10;
          keywordMatched = true;
        }

        // Check description match
        if (normalizedDesc.includes(keyword)) {
          score += 3;
          keywordMatched = true;
        }

        // Check task match
        if (normalizedTask.includes(keyword)) {
          score += 5;
          keywordMatched = true;
          if (p.task) matchedTasksSet.add(p.task);
        }

        // Check tag match
        p.tags.forEach((tag) => {
          const normalizedTag = this.normalizeText(tag);
          if (normalizedTag.includes(keyword) || keyword.includes(normalizedTag)) {
            score += 5;
            keywordMatched = true;
            matchedTagsSet.add(tag);
          }
        });

        // Check tool matches (including synonym mapping)
        (p.tools || []).forEach((tool) => {
          const normalizedTool = this.normalizeText(tool);
          const synonyms = SYNONYM_MAP[normalizedTool.toLowerCase()] || [];
          const isToolSynonymMatch = synonyms.some(syn => syn.includes(keyword) || keyword.includes(syn));

          if (normalizedTool.includes(keyword) || keyword.includes(normalizedTool) || isToolSynonymMatch) {
            score += 8;
            keywordMatched = true;
            matchedToolsSet.add(tool);
          }
        });

        // Check domain matches
        (p.domains || []).forEach((domain) => {
          const normalizedDomain = this.normalizeText(domain);
          if (normalizedDomain.includes(keyword) || keyword.includes(normalizedDomain)) {
            score += 6;
            keywordMatched = true;
            matchedDomainsSet.add(domain);
          }
        });

        if (keywordMatched) {
          matchedAnyKeyword = true;
        }
      });

      return { prompt: p, score, matched: matchedAnyKeyword };
    });

    // Filter prompts that have a positive match score and sort by score descending
    const filteredAndSorted = scoredPrompts
      .filter((sp) => sp.matched && sp.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((sp) => sp.prompt);

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
      prompts: filteredAndSorted,
      matchedTools: Array.from(matchedToolsSet),
      matchedDomains: Array.from(matchedDomainsSet),
      matchedTags: Array.from(matchedTagsSet),
      matchedTasks: Array.from(matchedTasksSet),
      suggestions: Array.from(suggestionsSet).slice(0, 5)
    };
  }
}

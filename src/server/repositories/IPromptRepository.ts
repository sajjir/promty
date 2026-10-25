// src/server/repositories/IPromptRepository.ts
import type { FilterSelection } from "../../lib/archiveFilters";
import { Prompt } from "../../types";

export interface PromptFilters {
  useCase?: FilterSelection; group?: FilterSelection; resourceType?: FilterSelection; outputFormat?: FilterSelection;
  category?: string; isActive?: boolean; page?: number; limit?: number;
  q?: string; tool?: FilterSelection; domain?: FilterSelection; intent?: FilterSelection; difficulty?: FilterSelection; language?: FilterSelection;
  referenceImage?: FilterSelection; // Currently only "required"; false/missing is not proof of no image prerequisite.
  access?: FilterSelection; // free | premium; choices combine with OR.
  sort?: string;
}
export interface IPromptRepository {
  getById(id: string): Promise<Prompt | null>;
  getAll(filters?: PromptFilters): Promise<{ prompts: Prompt[]; totalCount: number }>;
  create(prompt: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<Prompt>;
  update(id: string, prompt: Partial<Prompt>): Promise<Prompt>;
  delete(id: string): Promise<boolean>;
  incrementUsageCount(id: string): Promise<void>;
  getStats(): Promise<{ totalPrompts: number; totalUsages: number; mostPopular: string }>;
  getFacets(filters?: PromptFilters): Promise<{
    tools: Record<string, number>;
    domains: Record<string, number>;
    intents: Record<string, number>;
    difficulties: Record<string, number>;
    languages: Record<string, number>;
  }>;
}

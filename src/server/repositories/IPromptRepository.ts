// src/server/repositories/IPromptRepository.ts
import { Prompt } from "../../types";

export interface IPromptRepository {
  getById(id: string): Promise<Prompt | null>;
  getAll(filters?: { category?: string; isActive?: boolean; page?: number; limit?: number }): Promise<{ prompts: Prompt[]; totalCount: number }>;
  create(prompt: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<Prompt>;
  update(id: string, prompt: Partial<Prompt>): Promise<Prompt>;
  delete(id: string): Promise<boolean>;
  incrementUsageCount(id: string): Promise<void>;
  getStats(): Promise<{ totalPrompts: number; totalUsages: number; mostPopular: string }>;
  getFacets(filters?: { q?: string; tool?: string; domain?: string; intent?: string; difficulty?: string; language?: string }): Promise<{
    tools: Record<string, number>;
    domains: Record<string, number>;
    intents: Record<string, number>;
    difficulties: Record<string, number>;
    languages: Record<string, number>;
  }>;
}

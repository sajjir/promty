// src/server/repositories/json/JsonPromptRepository.ts
import fs from "fs";
import path from "path";
import { IPromptRepository } from "../IPromptRepository";
import { Prompt } from "../../../types";

const DB_FILE = path.join(process.cwd(), "db.json");

export class JsonPromptRepository implements IPromptRepository {
  private readDB(): any {
    if (!fs.existsSync(DB_FILE)) {
      return { prompts: [], categories: [], settings: {} };
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  }

  private writeDB(db: any): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  public async getById(id: string): Promise<Prompt | null> {
    const db = this.readDB();
    const prompt = db.prompts.find((p: Prompt) => p.id === id);
    return prompt || null;
  }

  public async getAll(filters?: { category?: string; isActive?: boolean; page?: number; limit?: number }): Promise<{ prompts: Prompt[]; totalCount: number }> {
    const db = this.readDB();
    let list: Prompt[] = db.prompts || [];

    if (filters) {
      if (filters.isActive !== undefined) {
        list = list.filter((p) => p.isActive === filters.isActive);
      }
      if (filters.category) {
        list = list.filter((p) => p.category === filters.category);
      }
    }

    const totalCount = list.length;

    if (filters && filters.page && filters.limit) {
      const page = filters.page;
      const limit = filters.limit;
      const skip = (page - 1) * limit;
      list = list.slice(skip, skip + limit);
    }

    return { prompts: list, totalCount };
  }

  public async create(promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<Prompt> {
    const db = this.readDB();
    const newPrompt: Prompt = {
      ...promptData,
      id: Math.random().toString(36).substr(2, 9),
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!db.prompts) db.prompts = [];
    db.prompts.push(newPrompt);
    this.writeDB(db);
    return newPrompt;
  }

  public async update(id: string, updates: Partial<Prompt>): Promise<Prompt> {
    const db = this.readDB();
    const index = db.prompts.findIndex((p: Prompt) => p.id === id);

    if (index === -1) {
      throw new Error("Prompt not found");
    }

    const updatedPrompt: Prompt = {
      ...db.prompts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.prompts[index] = updatedPrompt;
    this.writeDB(db);
    return updatedPrompt;
  }

  public async delete(id: string): Promise<boolean> {
    const db = this.readDB();
    const originalLength = db.prompts.length;
    db.prompts = db.prompts.filter((p: Prompt) => p.id !== id);

    if (db.prompts.length === originalLength) {
      return false;
    }

    this.writeDB(db);
    return true;
  }

  public async incrementUsageCount(id: string): Promise<void> {
    const db = this.readDB();
    const index = db.prompts.findIndex((p: Prompt) => p.id === id);
    if (index !== -1) {
      db.prompts[index].usageCount = (db.prompts[index].usageCount || 0) + 1;
      this.writeDB(db);
    }
  }

  public async getFacets(filters?: { q?: string; tool?: string; domain?: string; intent?: string; difficulty?: string; language?: string }): Promise<{
    tools: Record<string, number>;
    domains: Record<string, number>;
    intents: Record<string, number>;
    difficulties: Record<string, number>;
    languages: Record<string, number>;
  }> {
    const db = this.readDB();
    let list: Prompt[] = db.prompts || [];

    if (filters) {
      if (filters.q) {
        const keyword = filters.q.toLowerCase();
        list = list.filter(p => p.title.toLowerCase().includes(keyword) || (p.body && p.body.toLowerCase().includes(keyword)));
      }
      if (filters.tool) {
        list = list.filter(p => (p.tools || []).some(t => t.toLowerCase() === filters.tool!.toLowerCase()));
      }
      if (filters.domain) {
        list = list.filter(p => (p.domains || []).some(d => d.toLowerCase() === filters.domain!.toLowerCase()));
      }
      if (filters.intent) {
        list = list.filter(p => p.intent?.toLowerCase() === filters.intent!.toLowerCase());
      }
      if (filters.difficulty) {
        list = list.filter(p => p.difficulty?.toLowerCase() === filters.difficulty!.toLowerCase());
      }
      if (filters.language) {
        list = list.filter(p => p.language?.toLowerCase() === filters.language!.toLowerCase());
      }
    }

    const aggregated = {
      tools: {} as Record<string, number>,
      domains: {} as Record<string, number>,
      intents: {} as Record<string, number>,
      difficulties: {} as Record<string, number>,
      languages: {} as Record<string, number>
    };

    for (const p of list) {
      for (const t of p.tools || []) {
        const key = t.toLowerCase();
        aggregated.tools[key] = (aggregated.tools[key] || 0) + 1;
      }
      for (const d of p.domains || []) {
        const key = d.toLowerCase();
        aggregated.domains[key] = (aggregated.domains[key] || 0) + 1;
      }
      if (p.intent) {
        const key = p.intent.toLowerCase();
        aggregated.intents[key] = (aggregated.intents[key] || 0) + 1;
      }
      if (p.difficulty) {
        const key = p.difficulty.toLowerCase();
        aggregated.difficulties[key] = (aggregated.difficulties[key] || 0) + 1;
      }
      if (p.language) {
        const key = p.language.toLowerCase();
        aggregated.languages[key] = (aggregated.languages[key] || 0) + 1;
      }
    }

    return aggregated;
  }

  public async getStats(): Promise<{ totalPrompts: number; totalUsages: number; mostPopular: string }> {
    const db = this.readDB();
    const list: Prompt[] = db.prompts || [];
    const totalPrompts = list.length;
    const totalUsages = list.reduce((sum, p) => sum + (p.usageCount || 0), 0);
    const sorted = [...list].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    const mostPopular = sorted.length > 0 ? sorted[0].title : "هیچ پرامپتی ثبت نشده";

    return { totalPrompts, totalUsages, mostPopular };
  }
}

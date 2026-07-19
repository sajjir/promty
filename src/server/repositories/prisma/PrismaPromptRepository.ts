// src/server/repositories/prisma/PrismaPromptRepository.ts
import { PrismaClient, Prompt as PrismaPrompt } from "@prisma/client";
import { IPromptRepository } from "../IPromptRepository";
import { Prompt, FieldSchema } from "../../../types";
import { SearchService } from "../../services/SearchService";
import fs from "fs/promises";
import path from "path";

export class PrismaPromptRepository implements IPromptRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapPrismaPrompt(dbPrompt: any): Prompt {
    return {
      id: dbPrompt.id,
      title: dbPrompt.title,
      description: dbPrompt.description,
      body: dbPrompt.body,
      fieldsSchema: (dbPrompt.fieldsSchema as unknown) as FieldSchema[],
      category: dbPrompt.category,
      tags: dbPrompt.tags,
      sampleImage: dbPrompt.sampleImage || undefined,
      isPremium: dbPrompt.isPremium,
      isActive: dbPrompt.isActive,
      usageCount: dbPrompt.usageCount,
      intent: dbPrompt.intent || undefined,
      intents: dbPrompt.intents && dbPrompt.intents.length > 0 ? dbPrompt.intents : (dbPrompt.intent ? [dbPrompt.intent] : []),
      domains: dbPrompt.domains,
      tools: dbPrompt.tools,
      task: dbPrompt.task || undefined,
      language: dbPrompt.language || undefined,
      difficulty: dbPrompt.difficulty || undefined,
      outputFormats: dbPrompt.outputFormats,
      bodyFa: dbPrompt.bodyFa || undefined,
      requiresReferenceImage: dbPrompt.requiresReferenceImage || false,
      createdAt: dbPrompt.createdAt.toISOString(),
      updatedAt: dbPrompt.updatedAt.toISOString(),
      parentId: dbPrompt.parentId || undefined,
      sourceText: dbPrompt.sourceText || undefined,
      parent: dbPrompt.parent ? {
        id: dbPrompt.parent.id,
        title: dbPrompt.parent.title
      } : undefined,
      coverImage: dbPrompt.coverImage || undefined,
      mediaGallery: dbPrompt.mediaGallery ? (dbPrompt.mediaGallery as unknown as string[]) : undefined
    };
  }

  public async getById(id: string): Promise<Prompt | null> {
    try {
      const dbPrompt = await this.prisma.prompt.findUnique({
        where: { id },
        include: { parent: true },
      });
      return dbPrompt ? this.mapPrismaPrompt(dbPrompt) : null;
    } catch (error) {
      console.error("Prisma getById failed:", error);
      throw new Error("Failed to get prompt by ID", { cause: error });
    }
  }

  public async getAll(filters?: { category?: string; isActive?: boolean; page?: number; limit?: number }): Promise<{ prompts: Prompt[]; totalCount: number }> {
    try {
      const where: any = {};
      if (filters) {
        if (filters.isActive !== undefined) {
          where.isActive = filters.isActive;
        }
        if (filters.category) {
          where.category = filters.category;
        }
      }

      const totalCount = await this.prisma.prompt.count({ where });

      let promptsData: PrismaPrompt[];
      if (filters && filters.page && filters.limit) {
        const take = filters.limit;
        const skip = (filters.page - 1) * filters.limit;
        promptsData = await this.prisma.prompt.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take,
          skip,
        });
      } else {
        promptsData = await this.prisma.prompt.findMany({
          where,
          orderBy: { createdAt: "desc" },
        });
      }

      return {
        prompts: promptsData.map((p) => this.mapPrismaPrompt(p)),
        totalCount,
      };
    } catch (error) {
      console.error("Prisma getAll failed:", error);
      throw new Error("Failed to retrieve prompts", { cause: error });
    }
  }

  public async create(promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<Prompt> {
    try {
      const dbPrompt = await this.prisma.prompt.create({
        data: {
          title: promptData.title,
          description: promptData.description || "",
          body: promptData.body,
          fieldsSchema: promptData.fieldsSchema as any,
          category: promptData.category || "عمومی",
          tags: promptData.tags || [],
          sampleImage: promptData.sampleImage || null,
          isPremium: promptData.isPremium !== undefined ? promptData.isPremium : false,
          isActive: promptData.isActive !== undefined ? promptData.isActive : true,
          usageCount: 0,
          intent: promptData.intent || null,
          intents: promptData.intents || [],
          domains: promptData.domains || [],
          tools: promptData.tools || [],
          task: promptData.task || null,
          language: promptData.language || null,
          difficulty: promptData.difficulty || null,
          outputFormats: promptData.outputFormats || [],
          bodyFa: promptData.bodyFa || null,
          requiresReferenceImage: promptData.requiresReferenceImage !== undefined ? promptData.requiresReferenceImage : false,
          parentId: promptData.parentId || null,
          sourceText: promptData.sourceText || null,
          coverImage: promptData.coverImage || null,
          mediaGallery: promptData.mediaGallery ? (promptData.mediaGallery as any) : null,
        },
      });
      return this.mapPrismaPrompt(dbPrompt);
    } catch (error) {
      console.error("Prisma create failed:", error);
      throw new Error("Failed to create prompt", { cause: error });
    }
  }

  public async update(id: string, updates: Partial<Prompt>): Promise<Prompt> {
    try {
      const data: any = {};
      if (updates.title !== undefined) data.title = updates.title;
      if (updates.description !== undefined) data.description = updates.description;
      if (updates.body !== undefined) data.body = updates.body;
      if (updates.fieldsSchema !== undefined) data.fieldsSchema = updates.fieldsSchema as any;
      if (updates.category !== undefined) data.category = updates.category;
      if (updates.tags !== undefined) data.tags = updates.tags;
      if (updates.sampleImage !== undefined) data.sampleImage = updates.sampleImage;
      if (updates.isPremium !== undefined) data.isPremium = updates.isPremium;
      if (updates.isActive !== undefined) data.isActive = updates.isActive;
      if (updates.usageCount !== undefined) data.usageCount = updates.usageCount;
      if (updates.intent !== undefined) data.intent = updates.intent || null;
      if (updates.intents !== undefined) data.intents = updates.intents;
      if (updates.domains !== undefined) data.domains = updates.domains;
      if (updates.tools !== undefined) data.tools = updates.tools;
      if (updates.task !== undefined) data.task = updates.task || null;
      if (updates.language !== undefined) data.language = updates.language || null;
      if (updates.difficulty !== undefined) data.difficulty = updates.difficulty || null;
      if (updates.outputFormats !== undefined) data.outputFormats = updates.outputFormats;
      if (updates.bodyFa !== undefined) data.bodyFa = updates.bodyFa || null;
      if (updates.requiresReferenceImage !== undefined) data.requiresReferenceImage = updates.requiresReferenceImage;
      if (updates.parentId !== undefined) data.parentId = updates.parentId || null;
      if (updates.sourceText !== undefined) data.sourceText = updates.sourceText || null;
      if (updates.coverImage !== undefined) data.coverImage = updates.coverImage || null;
      if (updates.mediaGallery !== undefined) data.mediaGallery = updates.mediaGallery ? (updates.mediaGallery as any) : null;

      const dbPrompt = await this.prisma.prompt.update({
        where: { id },
        data,
      });
      return this.mapPrismaPrompt(dbPrompt);
    } catch (error) {
      console.error("Prisma update failed:", error);
      throw new Error("Failed to update prompt", { cause: error });
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      // 1. Delete physical files from disk recursively
      const dirPath = path.join(process.cwd(), "dl", "prompts", id);
      try {
        await fs.rm(dirPath, { recursive: true, force: true });
        console.log(`Successfully deleted physical media directory for prompt ${id}: ${dirPath}`);
      } catch (err) {
        console.error(`Error deleting physical directory ${dirPath}:`, err);
      }

      // 2. Delete database record
      await this.prisma.prompt.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Prisma delete failed:", error);
      return false;
    }
  }

  public async incrementUsageCount(id: string): Promise<void> {
    try {
      await this.prisma.prompt.update({
        where: { id },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error("Prisma incrementUsageCount failed:", error);
    }
  }

  public async getStats(): Promise<{ totalPrompts: number; totalUsages: number; mostPopular: string }> {
    try {
      const totalPrompts = await this.prisma.prompt.count();
      const aggregations = await this.prisma.prompt.aggregate({
        _sum: {
          usageCount: true,
        },
      });
      const totalUsages = aggregations._sum.usageCount || 0;

      const popularPrompts = await this.prisma.prompt.findMany({
        orderBy: { usageCount: "desc" },
        take: 1,
      });
      const mostPopular = popularPrompts.length > 0 ? popularPrompts[0].title : "هیچ پرامپتی ثبت نشده";

      return { totalPrompts, totalUsages, mostPopular };
    } catch (error) {
      console.error("Prisma getStats failed:", error);
      return { totalPrompts: 0, totalUsages: 0, mostPopular: "خطا در دریافت اطلاعات" };
    }
  }

  public async getFacets(filters?: {
    q?: string;
    tool?: string;
    domain?: string;
    intent?: string;
    difficulty?: string;
    language?: string;
  }): Promise<{
    tools: Record<string, number>;
    domains: Record<string, number>;
    intents: Record<string, number>;
    difficulties: Record<string, number>;
    languages: Record<string, number>;
  }> {
    try {
      const dbPrompts = await this.prisma.prompt.findMany({
        where: { isActive: true },
      });
      const prompts = dbPrompts.map((p) => this.mapPrismaPrompt(p));

      let matchedPrompts = prompts;
      if (filters?.q && filters.q.trim()) {
        matchedPrompts = SearchService.search(prompts, filters.q).prompts;
      }

      if (filters) {
        if (filters.tool) {
          const tLower = filters.tool.toLowerCase();
          matchedPrompts = matchedPrompts.filter((p) =>
            (p.tools || []).some((t) => t.toLowerCase() === tLower)
          );
        }
        if (filters.domain) {
          const dLower = filters.domain.toLowerCase();
          matchedPrompts = matchedPrompts.filter((p) =>
            (p.domains || []).some((d) => d.toLowerCase() === dLower)
          );
        }
        if (filters.intent) {
          const iLower = filters.intent.toLowerCase();
          matchedPrompts = matchedPrompts.filter(
            (p) => p.intent && p.intent.toLowerCase() === iLower
          );
        }
        if (filters.difficulty) {
          const diffLower = filters.difficulty.toLowerCase();
          matchedPrompts = matchedPrompts.filter(
            (p) => p.difficulty && p.difficulty.toLowerCase() === diffLower
          );
        }
        if (filters.language) {
          const langLower = filters.language.toLowerCase();
          matchedPrompts = matchedPrompts.filter(
            (p) => p.language && p.language.toLowerCase() === langLower
          );
        }
      }

      const toolsCount: Record<string, number> = {};
      const domainsCount: Record<string, number> = {};
      const intentsCount: Record<string, number> = {};
      const difficultiesCount: Record<string, number> = {};
      const languagesCount: Record<string, number> = {};

      for (const p of matchedPrompts) {
        if (p.tools && Array.isArray(p.tools)) {
          for (const t of p.tools) {
            if (t) {
              const key = t.toLowerCase();
              toolsCount[key] = (toolsCount[key] || 0) + 1;
            }
          }
        }
        if (p.domains && Array.isArray(p.domains)) {
          for (const d of p.domains) {
            if (d) {
              const key = d.toLowerCase();
              domainsCount[key] = (domainsCount[key] || 0) + 1;
            }
          }
        }
        if (p.intent) {
          const key = p.intent.toLowerCase();
          intentsCount[key] = (intentsCount[key] || 0) + 1;
        }
        if (p.difficulty) {
          const key = p.difficulty.toLowerCase();
          difficultiesCount[key] = (difficultiesCount[key] || 0) + 1;
        }
        if (p.language) {
          const key = p.language.toLowerCase();
          languagesCount[key] = (languagesCount[key] || 0) + 1;
        }
      }

      return {
        tools: toolsCount,
        domains: domainsCount,
        intents: intentsCount,
        difficulties: difficultiesCount,
        languages: languagesCount,
      };
    } catch (error) {
      console.error("Prisma getFacets failed:", error);
      throw new Error("Failed to retrieve facets", { cause: error });
    }
  }
}

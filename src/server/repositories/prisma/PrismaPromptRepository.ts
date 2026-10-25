import { normalizeArchivePrompt } from '../../../lib/archiveCatalog';
import { filterPrompts, paginatePrompts, buildArchiveFacets } from "../filterPrompts";
// src/server/repositories/prisma/PrismaPromptRepository.ts
import { PrismaClient, Prompt as PrismaPrompt } from "@prisma/client";
import { IPromptRepository, PromptFilters } from "../IPromptRepository";
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
    return normalizeArchivePrompt({
      useCase: dbPrompt.useCase || undefined,
      relatedUseCases: dbPrompt.relatedUseCases || [],
      editorial: dbPrompt.editorial || undefined,
      resourceType: dbPrompt.resourceType || "prompt",
      isDemo: dbPrompt.isDemo || false,
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
      parent: dbPrompt.parent?.isActive ? {
        id: dbPrompt.parent.id,
        title: dbPrompt.parent.title
      } : undefined,
      coverImage: dbPrompt.coverImage || undefined,
      mediaGallery: dbPrompt.mediaGallery ? (dbPrompt.mediaGallery as unknown as string[]) : undefined
    });
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

  public async getAll(filters?: PromptFilters): Promise<{ prompts: Prompt[]; totalCount: number }> {
    const list = (await this.prisma.prompt.findMany({ where: filters?.isActive === undefined ? {} : { isActive: filters.isActive } })).map(p => this.mapPrismaPrompt(p));
    return paginatePrompts(filterPrompts(list, filters), filters);
  }

  public async create(promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<Prompt> {
    try {
      promptData = normalizeArchivePrompt(promptData);
      const dbPrompt = await this.prisma.prompt.create({
        data: {
          useCase: promptData.useCase || null,
          relatedUseCases: promptData.relatedUseCases || [],
          ...(promptData.editorial ? { editorial: promptData.editorial as any } : {}),
          resourceType: promptData.resourceType || "prompt",
          isDemo: promptData.isDemo || false,
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
      updates = normalizeArchivePrompt(updates);
      const data: any = {};
      if (updates.relatedUseCases !== undefined) data.relatedUseCases = updates.relatedUseCases;
      if (updates.editorial !== undefined) data.editorial = updates.editorial;
      for (const key of ["useCase", "resourceType", "isDemo"] as const) if (updates[key] !== undefined) data[key] = updates[key];
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

  public async getFacets(filters?: PromptFilters) {
    const { prompts } = await this.getAll({ isActive: true });
    return buildArchiveFacets(prompts, { ...filters, isActive: true }).facets;
  }
}

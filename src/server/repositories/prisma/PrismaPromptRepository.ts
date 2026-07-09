// src/server/repositories/prisma/PrismaPromptRepository.ts
import { PrismaClient, Prompt as PrismaPrompt } from "@prisma/client";
import { IPromptRepository } from "../IPromptRepository";
import { Prompt, FieldSchema } from "../../../types";

export class PrismaPromptRepository implements IPromptRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapPrismaPrompt(dbPrompt: PrismaPrompt): Prompt {
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
      domains: dbPrompt.domains,
      tools: dbPrompt.tools,
      task: dbPrompt.task || undefined,
      language: dbPrompt.language || undefined,
      difficulty: dbPrompt.difficulty || undefined,
      outputFormats: dbPrompt.outputFormats,
      industry: dbPrompt.industry || undefined,
      createdAt: dbPrompt.createdAt.toISOString(),
      updatedAt: dbPrompt.updatedAt.toISOString(),
    };
  }

  public async getById(id: string): Promise<Prompt | null> {
    try {
      const dbPrompt = await this.prisma.prompt.findUnique({
        where: { id },
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
          domains: promptData.domains || [],
          tools: promptData.tools || [],
          task: promptData.task || null,
          language: promptData.language || null,
          difficulty: promptData.difficulty || null,
          outputFormats: promptData.outputFormats || [],
          industry: promptData.industry || null,
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
      if (updates.domains !== undefined) data.domains = updates.domains;
      if (updates.tools !== undefined) data.tools = updates.tools;
      if (updates.task !== undefined) data.task = updates.task || null;
      if (updates.language !== undefined) data.language = updates.language || null;
      if (updates.difficulty !== undefined) data.difficulty = updates.difficulty || null;
      if (updates.outputFormats !== undefined) data.outputFormats = updates.outputFormats;
      if (updates.industry !== undefined) data.industry = updates.industry || null;

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
}

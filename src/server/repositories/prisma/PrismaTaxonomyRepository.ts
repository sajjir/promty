// src/server/repositories/prisma/PrismaTaxonomyRepository.ts
import { PrismaClient, Taxonomy as PrismaTaxonomy } from "@prisma/client";
import { ITaxonomyRepository } from "../ITaxonomyRepository";
import { TaxonomyTerm, TaxonomyType } from "../../domain/Taxonomy";

export class PrismaTaxonomyRepository implements ITaxonomyRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapPrismaTaxonomy(dbTax: PrismaTaxonomy): TaxonomyTerm {
    return {
      id: dbTax.id,
      type: dbTax.type as TaxonomyType,
      slug: dbTax.slug,
      titleEn: dbTax.titleEn,
      titleFa: dbTax.titleFa,
      descriptionFa: dbTax.descriptionFa || undefined,
      descriptionEn: dbTax.descriptionEn || undefined,
      aliases: dbTax.aliases,
      synonyms: dbTax.synonyms,
      popularity: dbTax.popularity,
      usageCount: 0,
      createdAt: dbTax.createdAt.toISOString(),
      updatedAt: dbTax.updatedAt.toISOString(),
      status: dbTax.status as "active" | "archived"
    };
  }

  public async getById(id: string): Promise<TaxonomyTerm | null> {
    try {
      const dbTax = await this.prisma.taxonomy.findUnique({
        where: { id },
      });
      return dbTax ? this.mapPrismaTaxonomy(dbTax) : null;
    } catch (error) {
      console.error("Prisma getById failed:", error);
      throw new Error("Failed to get taxonomy by ID", { cause: error });
    }
  }

  public async getBySlug(slug: string, type: TaxonomyType): Promise<TaxonomyTerm | null> {
    try {
      const dbTax = await this.prisma.taxonomy.findFirst({
        where: { slug, type },
      });
      return dbTax ? this.mapPrismaTaxonomy(dbTax) : null;
    } catch (error) {
      console.error("Prisma getBySlug failed:", error);
      throw new Error("Failed to get taxonomy by slug", { cause: error });
    }
  }

  public async getAll(type?: TaxonomyType): Promise<TaxonomyTerm[]> {
    try {
      const where: any = {};
      if (type) {
        where.type = type;
      }
      const dbTaxes = await this.prisma.taxonomy.findMany({
        where,
        orderBy: { popularity: "desc" },
      });
      return dbTaxes.map(dbTax => this.mapPrismaTaxonomy(dbTax));
    } catch (error) {
      console.error("Prisma getAll failed:", error);
      throw new Error("Failed to get all taxonomies", { cause: error });
    }
  }

  public async create(term: Omit<TaxonomyTerm, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<TaxonomyTerm> {
    try {
      const dbTax = await this.prisma.taxonomy.create({
        data: {
          type: term.type,
          slug: term.slug,
          titleEn: term.titleEn,
          titleFa: term.titleFa,
          descriptionFa: term.descriptionFa || null,
          descriptionEn: term.descriptionEn || null,
          aliases: term.aliases || [],
          synonyms: term.synonyms || [],
          popularity: term.popularity !== undefined ? term.popularity : 0.5,
          status: term.status || "active",
        },
      });
      return this.mapPrismaTaxonomy(dbTax);
    } catch (error) {
      console.error("Prisma create failed:", error);
      throw new Error("Failed to create taxonomy", { cause: error });
    }
  }

  public async update(id: string, term: Partial<TaxonomyTerm>): Promise<TaxonomyTerm> {
    try {
      const data: any = {};
      if (term.type !== undefined) data.type = term.type;
      if (term.slug !== undefined) data.slug = term.slug;
      if (term.titleEn !== undefined) data.titleEn = term.titleEn;
      if (term.titleFa !== undefined) data.titleFa = term.titleFa;
      if (term.descriptionFa !== undefined) data.descriptionFa = term.descriptionFa || null;
      if (term.descriptionEn !== undefined) data.descriptionEn = term.descriptionEn || null;
      if (term.aliases !== undefined) data.aliases = term.aliases;
      if (term.synonyms !== undefined) data.synonyms = term.synonyms;
      if (term.popularity !== undefined) data.popularity = term.popularity;
      if (term.status !== undefined) data.status = term.status;

      const dbTax = await this.prisma.taxonomy.update({
        where: { id },
        data,
      });
      return this.mapPrismaTaxonomy(dbTax);
    } catch (error) {
      console.error("Prisma update failed:", error);
      throw new Error("Failed to update taxonomy", { cause: error });
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.taxonomy.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Prisma delete failed:", error);
      return false;
    }
  }

  public async incrementUsageCount(id: string): Promise<void> {
    // Handled silently
  }
}

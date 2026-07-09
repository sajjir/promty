// src/server/repositories/prisma/PrismaTaxonomyRepository.ts
import { PrismaClient } from "@prisma/client";
import { ITaxonomyRepository } from "../ITaxonomyRepository";
import { TaxonomyTerm, TaxonomyType } from "../../domain/Taxonomy";
import { JsonTaxonomyRepository } from "../json/JsonTaxonomyRepository";

export class PrismaTaxonomyRepository implements ITaxonomyRepository {
  private prisma: PrismaClient;
  private fallbackRepo: JsonTaxonomyRepository;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.fallbackRepo = new JsonTaxonomyRepository();
  }

  public async getById(id: string): Promise<TaxonomyTerm | null> {
    return this.fallbackRepo.getById(id);
  }

  public async getBySlug(slug: string, type: TaxonomyType): Promise<TaxonomyTerm | null> {
    return this.fallbackRepo.getBySlug(slug, type);
  }

  public async getAll(type?: TaxonomyType): Promise<TaxonomyTerm[]> {
    return this.fallbackRepo.getAll(type);
  }

  public async create(term: Omit<TaxonomyTerm, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<TaxonomyTerm> {
    return this.fallbackRepo.create(term);
  }

  public async update(id: string, term: Partial<TaxonomyTerm>): Promise<TaxonomyTerm> {
    return this.fallbackRepo.update(id, term);
  }

  public async delete(id: string): Promise<boolean> {
    return this.fallbackRepo.delete(id);
  }

  public async incrementUsageCount(id: string): Promise<void> {
    return this.fallbackRepo.incrementUsageCount(id);
  }
}

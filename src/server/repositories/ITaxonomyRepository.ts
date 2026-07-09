// src/server/repositories/ITaxonomyRepository.ts
import { TaxonomyTerm, TaxonomyType } from "../domain/Taxonomy";

export interface ITaxonomyRepository {
  getById(id: string): Promise<TaxonomyTerm | null>;
  getBySlug(slug: string, type: TaxonomyType): Promise<TaxonomyTerm | null>;
  getAll(type?: TaxonomyType): Promise<TaxonomyTerm[]>;
  create(term: Omit<TaxonomyTerm, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<TaxonomyTerm>;
  update(id: string, term: Partial<TaxonomyTerm>): Promise<TaxonomyTerm>;
  delete(id: string): Promise<boolean>;
  incrementUsageCount(id: string): Promise<void>;
}

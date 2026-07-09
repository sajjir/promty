// src/server/domain/Taxonomy.ts

export type TaxonomyType =
  | "intent"
  | "domain"
  | "tool"
  | "language"
  | "difficulty"
  | "outputFormat"
  | "industry"
  | "fieldType";

export interface TaxonomyTerm {
  id: string;
  type: TaxonomyType;
  slug: string;
  titleEn: string;
  titleFa: string;
  descriptionFa?: string;
  descriptionEn?: string;
  aliases: string[];
  synonyms: string[];
  popularity: number; // For search prioritizing
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  status: "active" | "archived";
}

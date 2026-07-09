// src/server/domain/Relationship.ts

export type EntityType = "Prompt" | "TaxonomyTerm" | "Collection" | "User";

export interface Relationship {
  id: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  relationType: string; // e.g., "Intent_To_Task", "Task_To_Tool", "Prompt_To_Prompt", "Prompt_To_Collection"
  confidenceScore: number; // 0.0 to 1.0 (calculated by AI or verified manually)
  priority: number; // Order ranking (e.g., 0, 1, 2)
  weight: number; // Strength of association (0.0 to 1.0)
  recommendationScore: number; // Calculated by intelligence layer
  similarityScore: number; // Semantic/vector similarity score
  createdAt: string;
  updatedAt: string;
}

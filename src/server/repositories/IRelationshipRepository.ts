// src/server/repositories/IRelationshipRepository.ts
import { Relationship, EntityType } from "../domain/Relationship";

export interface IRelationshipRepository {
  getById(id: string): Promise<Relationship | null>;
  getRelationships(entityId: string, entityType: EntityType): Promise<Relationship[]>;
  create(relationship: Omit<Relationship, "id" | "createdAt" | "updatedAt">): Promise<Relationship>;
  delete(id: string): Promise<boolean>;
  updateWeights(id: string, updates: { confidenceScore?: number; priority?: number; weight?: number; recommendationScore?: number; similarityScore?: number }): Promise<Relationship>;
}

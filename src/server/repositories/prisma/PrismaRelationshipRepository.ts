// src/server/repositories/prisma/PrismaRelationshipRepository.ts
import { PrismaClient } from "@prisma/client";
import { IRelationshipRepository } from "../IRelationshipRepository";
import { Relationship, EntityType } from "../../domain/Relationship";
import { JsonRelationshipRepository } from "../json/JsonRelationshipRepository";

export class PrismaRelationshipRepository implements IRelationshipRepository {
  private prisma: PrismaClient;
  private fallbackRepo: JsonRelationshipRepository;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.fallbackRepo = new JsonRelationshipRepository();
  }

  public async getById(id: string): Promise<Relationship | null> {
    return this.fallbackRepo.getById(id);
  }

  public async getRelationships(entityId: string, entityType: EntityType): Promise<Relationship[]> {
    return this.fallbackRepo.getRelationships(entityId, entityType);
  }

  public async create(relationship: Omit<Relationship, "id" | "createdAt" | "updatedAt">): Promise<Relationship> {
    return this.fallbackRepo.create(relationship);
  }

  public async delete(id: string): Promise<boolean> {
    return this.fallbackRepo.delete(id);
  }

  public async updateWeights(id: string, updates: { confidenceScore?: number; priority?: number; weight?: number; recommendationScore?: number; similarityScore?: number }): Promise<Relationship> {
    return this.fallbackRepo.updateWeights(id, updates);
  }
}

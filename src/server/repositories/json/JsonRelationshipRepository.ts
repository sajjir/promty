// src/server/repositories/json/JsonRelationshipRepository.ts
import fs from "fs";
import path from "path";
import { IRelationshipRepository } from "../IRelationshipRepository";
import { Relationship, EntityType } from "../../domain/Relationship";

const DB_FILE = path.join(process.cwd(), "db.json");

export class JsonRelationshipRepository implements IRelationshipRepository {
  private readDB(): any {
    if (!fs.existsSync(DB_FILE)) {
      return { prompts: [], categories: [], settings: {}, taxonomies: [], relationships: [] };
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(data);
    if (!db.relationships) {
      db.relationships = [];
    }
    return db;
  }

  private writeDB(db: any): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  public async getById(id: string): Promise<Relationship | null> {
    const db = this.readDB();
    const rel = db.relationships.find((r: Relationship) => r.id === id);
    return rel || null;
  }

  public async getRelationships(entityId: string, entityType: EntityType): Promise<Relationship[]> {
    const db = this.readDB();
    return db.relationships.filter(
      (r: Relationship) =>
        (r.sourceId === entityId && r.sourceType === entityType) ||
        (r.targetId === entityId && r.targetType === entityType)
    );
  }

  public async create(relData: Omit<Relationship, "id" | "createdAt" | "updatedAt">): Promise<Relationship> {
    const db = this.readDB();
    const newRel: Relationship = {
      ...relData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.relationships.push(newRel);
    this.writeDB(db);
    return newRel;
  }

  public async delete(id: string): Promise<boolean> {
    const db = this.readDB();
    const originalLength = db.relationships.length;
    db.relationships = db.relationships.filter((r: Relationship) => r.id !== id);

    if (db.relationships.length === originalLength) {
      return false;
    }

    this.writeDB(db);
    return true;
  }

  public async updateWeights(
    id: string,
    updates: { confidenceScore?: number; priority?: number; weight?: number; recommendationScore?: number; similarityScore?: number }
  ): Promise<Relationship> {
    const db = this.readDB();
    const index = db.relationships.findIndex((r: Relationship) => r.id === id);

    if (index === -1) {
      throw new Error("Relationship not found");
    }

    const updatedRel: Relationship = {
      ...db.relationships[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    db.relationships[index] = updatedRel;
    this.writeDB(db);
    return updatedRel;
  }
}

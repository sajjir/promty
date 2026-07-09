// src/server/services/IntelligenceService.ts
import { Prompt } from "../../types";

export interface IntelligenceReport {
  qualityScore: number; // 0 to 100
  seoSuggestions: { titleFa: string; metaDescriptionFa: string; keywords: string[] };
  suggestedTags: string[];
  duplicateDetected: boolean;
  duplicatePromptId?: string;
}

export class IntelligenceService {
  /**
   * Calculates a prompt quality score based on structure, length, placeholders, and standard guidelines.
   */
  public static calculateQualityScore(prompt: Prompt): number {
    let score = 50; // Starting baseline

    if (prompt.title && prompt.title.length > 10) score += 10;
    if (prompt.description && prompt.description.length > 30) score += 10;
    if (prompt.body && prompt.body.length > 100) score += 10;
    
    // Encouraging structured placeholders
    if (prompt.fieldsSchema && prompt.fieldsSchema.length > 0) {
      score += Math.min(prompt.fieldsSchema.length * 5, 20);
    }

    // Language verification check
    if (prompt.language && prompt.language === "Persian") score += 10;

    return Math.min(score, 100);
  }

  /**
   * Suggests SEO optimization variables and tags
   */
  public static generateSeoSuggestions(prompt: Prompt): IntelligenceReport["seoSuggestions"] {
    const keywords = [...(prompt.tags || [])];
    if (prompt.tools && prompt.tools.length > 0) keywords.push(...prompt.tools);
    if (prompt.domains && prompt.domains.length > 0) keywords.push(...prompt.domains);

    return {
      titleFa: `${prompt.title} | پرامپت آماده هوش مصنوعی`,
      metaDescriptionFa: prompt.description || `بهترین پرامپت برای ${prompt.title} در سایت پرامتی دات آی آر.`,
      keywords: Array.from(new Set(keywords))
    };
  }

  /**
   * Pre-generates embedding vector values (Mock structure ready for full pgvector implementation)
   */
  public static async generateEmbedding(text: string): Promise<number[]> {
    // Under full pgvector rollout, we fetch this from a model like Google's text-embedding-004
    // Return a structured dummy 1536-dim vector for immediate type compliance
    return Array.from({ length: 1536 }, () => Math.random());
  }
}

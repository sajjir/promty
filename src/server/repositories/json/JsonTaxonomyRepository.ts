// src/server/repositories/json/JsonTaxonomyRepository.ts
import fs from "fs";
import path from "path";
import { ITaxonomyRepository } from "../ITaxonomyRepository";
import { TaxonomyTerm, TaxonomyType } from "../../domain/Taxonomy";
import { defaultTaxonomies } from "../../../lib/defaultTaxonomies";

const DB_FILE = path.join(process.cwd(), "db.json");

export class JsonTaxonomyRepository implements ITaxonomyRepository {
  private readDB(): any {
    if (!fs.existsSync(DB_FILE)) {
      return { prompts: [], categories: [], settings: {}, taxonomies: [] };
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(data);
    
    // Auto-seed if taxonomies are empty
    if (!db.taxonomies || db.taxonomies.length === 0) {
      db.taxonomies = this.generateInitialSeededTaxonomies();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    }
    
    return db;
  }

  private writeDB(db: any): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  private generateInitialSeededTaxonomies(): TaxonomyTerm[] {
    const timestamp = new Date().toISOString();
    return defaultTaxonomies.map((item) => ({
      id: `${item.type}_${item.slug.replace(/[^a-z0-9]/g, "_")}`,
      type: item.type as TaxonomyType,
      slug: item.slug,
      titleEn: item.titleEn,
      titleFa: item.titleFa,
      aliases: [],
      synonyms: [],
      popularity: 0.5,
      usageCount: 0,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  }

  private translateToFa(val: string): string {
    const dict: Record<string, string> = {
      Create: "ایجاد", Write: "نگارش", Code: "کدنویسی", Design: "طراحی", Market: "بازاریابی",
      Analyze: "تحلیل", Learn: "آموزش", Automate: "اتوماسیون", Research: "تحقیق", Productivity: "بهره‌وری",
      Business: "تجارت", Marketing: "مارکتینگ", Education: "آموزش", Medical: "سلامت و پزشکی", Health: "سلامت و پزشکی", "Health & Medical": "سلامت و پزشکی",
      Legal: "حقوقی", Finance: "مالی", Programming: "برنامه‌نویسی", Gaming: "بازی", Food: "غذا",
      Travel: "سفر", Architecture: "معماری", Photography: "عکاسی", "Real Estate": "املاک", Sports: "ورزش",
      AI: "هوش مصنوعی", Robotics: "رباتیک", Science: "علمی", Religion: "مذهبی", History: "تاریخ",
      ChatGPT: "ChatGPT", Claude: "Claude", Gemini: "Gemini", Grok: "Grok", Midjourney: "Midjourney",
      Flux: "Flux", "Stable Diffusion": "Stable Diffusion", Ideogram: "Ideogram", Veo: "Veo",
      Kling: "Kling", Runway: "Runway", ElevenLabs: "ElevenLabs", Suno: "Suno", "n8n AI Agent": "اتوماسیون n8n",
      Persian: "فارسی", English: "انگلیسی",
      Beginner: "مبتدی", Intermediate: "متوسط", Advanced: "پیشرفته", Expert: "حرفه‌ای",
      Text: "متن", Markdown: "مارک‌داون", JSON: "JSON", CSV: "CSV", HTML: "HTML", CSS: "CSS",
      JavaScript: "JavaScript", Python: "Python", React: "React", TypeScript: "TypeScript", SQL: "SQL",
      XML: "XML", PDF: "PDF", Image: "تصویر", Video: "ویدیو", Table: "جدول", Checklist: "چک‌لیست",
      Roadmap: "نقشه راه", Presentation: "ارائه/پرزنتیشن",
      Ecommerce: "تجارت الکترونیک", Startup: "استارتاپ", Healthcare: "مراقبت‌های درمانی", Restaurant: "رستوران",
      Construction: "صنعت و عمران", Law: "حقوق و قضا", Bank: "بانکداری", Crypto: "رمزارز", Fashion: "مد و پوشاک",
      Fitness: "ورزش و تناسب اندام", Agriculture: "کشاورزی", Tourism: "گردشگری", Insurance: "بیمه", NGO: "خیریه/مردم‌نهاد",
      text: "متن کوتاه", textarea: "متن چندخطی", color: "رنگ", select: "انتخابی (Drop-down)", radio: "رادیویی",
      switch: "سوئیچ", slider: "اسلایدر عددی", multiselect: "چندانتخابی", url: "آدرس وب (URL)"
    };
    return dict[val] || val;
  }

  public async getById(id: string): Promise<TaxonomyTerm | null> {
    const db = this.readDB();
    const term = db.taxonomies.find((t: TaxonomyTerm) => t.id === id);
    return term || null;
  }

  public async getBySlug(slug: string, type: TaxonomyType): Promise<TaxonomyTerm | null> {
    const db = this.readDB();
    const term = db.taxonomies.find((t: TaxonomyTerm) => t.slug === slug && t.type === type);
    return term || null;
  }

  public async getAll(type?: TaxonomyType): Promise<TaxonomyTerm[]> {
    const db = this.readDB();
    let list: TaxonomyTerm[] = db.taxonomies || [];
    if (type) {
      list = list.filter((t) => t.type === type);
    }
    return list;
  }

  public async create(termData: Omit<TaxonomyTerm, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<TaxonomyTerm> {
    const db = this.readDB();
    const newTerm: TaxonomyTerm = {
      ...termData,
      id: Math.random().toString(36).substr(2, 9),
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!db.taxonomies) db.taxonomies = [];
    db.taxonomies.push(newTerm);
    this.writeDB(db);
    return newTerm;
  }

  public async update(id: string, updates: Partial<TaxonomyTerm>): Promise<TaxonomyTerm> {
    const db = this.readDB();
    const index = db.taxonomies.findIndex((t: TaxonomyTerm) => t.id === id);

    if (index === -1) {
      throw new Error("Taxonomy term not found");
    }

    const updatedTerm: TaxonomyTerm = {
      ...db.taxonomies[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    db.taxonomies[index] = updatedTerm;
    this.writeDB(db);
    return updatedTerm;
  }

  public async delete(id: string): Promise<boolean> {
    const db = this.readDB();
    const originalLength = db.taxonomies.length;
    db.taxonomies = db.taxonomies.filter((t: TaxonomyTerm) => t.id !== id);

    if (db.taxonomies.length === originalLength) {
      return false;
    }

    this.writeDB(db);
    return true;
  }

  public async incrementUsageCount(id: string): Promise<void> {
    const db = this.readDB();
    const index = db.taxonomies.findIndex((t: TaxonomyTerm) => t.id === id);
    if (index !== -1) {
      db.taxonomies[index].usageCount = (db.taxonomies[index].usageCount || 0) + 1;
      this.writeDB(db);
    }
  }
}

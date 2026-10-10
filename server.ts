import "dotenv/config";
import crypto from "node:crypto";
import { securityState } from "./src/server/services/securityState.ts";
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import sharp from "sharp";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { OAuth2Client } from "google-auth-library";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import { PrismaPromptRepository } from "./src/server/repositories/prisma/PrismaPromptRepository.ts";
import { PrismaTaxonomyRepository } from "./src/server/repositories/prisma/PrismaTaxonomyRepository.ts";
import { PrismaRelationshipRepository } from "./src/server/repositories/prisma/PrismaRelationshipRepository.ts";
import { IPromptRepository } from "./src/server/repositories/IPromptRepository.ts";
import { ITaxonomyRepository } from "./src/server/repositories/ITaxonomyRepository.ts";
import { IRelationshipRepository } from "./src/server/repositories/IRelationshipRepository.ts";
import { JsonPromptRepository } from "./src/server/repositories/json/JsonPromptRepository.ts";
import { JsonTaxonomyRepository } from "./src/server/repositories/json/JsonTaxonomyRepository.ts";
import { JsonRelationshipRepository } from "./src/server/repositories/json/JsonRelationshipRepository.ts";
import { SearchService } from "./src/server/services/SearchService";
import { smsService, sanitizeIranianMobile } from "./src/server/services/smsService.ts";

if (process.env.LOCAL_PREVIEW === "1" && process.env.HOST && !["127.0.0.1", "localhost", "::1"].includes(process.env.HOST)) throw new Error("Local preview must bind loopback.");
const operationalProduction = process.env.NODE_ENV === "production" && process.env.LOCAL_PREVIEW !== "1";
if (operationalProduction) {
  for (const key of ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD", "APP_ORIGIN", "MELIPAYAMAK_USERNAME", "MELIPAYAMAK_PASSWORD", "MELIPAYAMAK_OTP_BODY_ID"]) {
    if (!process.env[key]) throw new Error(`Production configuration missing: ${key}`);
  }
  if (process.env.JWT_SECRET!.length < 32 || process.env.ADMIN_PASSWORD!.length < 12 || process.env.ADMIN_PASSWORD === "admin123") throw new Error("Production credentials are too weak.");
  if (!process.env.APP_ORIGIN!.startsWith("https://")) throw new Error("APP_ORIGIN must use HTTPS in production.");
}
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString("hex");
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]!));
const safeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

let prisma: PrismaClient | null = null;
let promptRepo: IPromptRepository;
let taxonomyRepo: ITaxonomyRepository;
let relationshipRepo: IRelationshipRepository;

const FIELD_TYPE_OPTIONS = ["text", "textarea", "color", "select", "radio", "switch", "slider", "multiselect", "url"];
const INTENT_OPTIONS = ["Visual Generation", "Writing", "Coding", "Analysis", "Planning", "Automation", "Teaching", "Research", "Persona"];
const DOMAIN_OPTIONS = [
  "Business", "Marketing", "Education", "Health & Medical", "Legal", "Finance & Banking",
  "Programming", "Gaming", "Food & Restaurant", "Travel & Tourism", "Architecture & Construction",
  "Photography", "Real Estate", "Sports & Fitness", "AI", "Robotics", "Science", "Religion", "History",
  "Ecommerce", "Startup", "Fashion", "Agriculture", "Crypto", "Insurance", "NGO"
];
const TOOL_OPTIONS = ["ChatGPT", "Claude", "Gemini", "Grok", "Midjourney", "Flux", "Stable Diffusion", "Ideogram", "Veo", "Kling", "Runway", "ElevenLabs", "Suno", "n8n AI Agent"];
const LANGUAGE_OPTIONS = ["Persian", "English"];
const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const OUTPUT_FORMAT_OPTIONS = ["Text", "Markdown", "JSON", "CSV", "HTML", "CSS", "JavaScript", "Python", "React", "TypeScript", "SQL", "XML", "PDF", "Image", "Video", "Table", "Checklist", "Roadmap", "Presentation"];

interface FieldSchema {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'select' | 'radio' | 'switch' | 'slider' | 'multiselect' | 'url';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

interface Prompt {
  id: string;
  title: string;
  description: string;
  body: string;
  fieldsSchema: FieldSchema[];
  category?: string;
  // Metadata Layers
  intent?: string;
  domains?: string[];
  tools?: string[];
  task?: string;
  language?: string;
  difficulty?: string;
  outputFormats?: string[];
  tags: string[];
  bodyFa?: string;
  requiresReferenceImage: boolean;
  // Stats & Status
  sampleImage?: string;
  isPremium: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DBSettings {
  n8nWebhookUrl: string;
  n8nAnalyzeWebhook: string; // وبهوک مخصوص تحلیل چشمه
  n8nRefineWebhook: string;  // وبهوک مخصوص ارتقا پرامپت
  geminiApiKey: string;      // کلید مستقیم جمینای (Fallback)
  openaiApiKey: string;      // کلید مستقیم اوپنای‌آی (برای آینده)
  siteTitle?: string;        // عنوان سراسری سایت
  siteSubtitle?: string;     // شعار هدر
  heroTitle?: string;        // عنوان اصلی هیرو
  heroDescription?: string;  // متن توضیحی هیرو
  footerAbout?: string;      // متن درباره ما در فوتر
  footerCopyright?: string;  // متن کپی رایت
  siteLogo?: string;         // آدرس لوگو
  aiTimeoutSeconds?: number; // مدت زمان تایم اوت هوش مصنوعی (پیش‌فرض 60 ثانیه)
}

interface DB {
  prompts: Prompt[];
  categories: { id: string; name: string; slug: string; icon: string }[];
  settings: DBSettings;
  relationships?: any[];
  taxonomies?: any[];
  presets?: any[];
  savedPrompts?: any[];
  users?: any[];
}

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to read database
function readDB(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data) as any;
      let databaseChanged = false;
      
      // Ensure settings exists and has all keys
      if (!parsed.settings) {
        parsed.settings = {
          n8nWebhookUrl: "",
          n8nAnalyzeWebhook: "",
          n8nRefineWebhook: "",
          geminiApiKey: "",
          openaiApiKey: "",
          siteTitle: "Promty.ir"
        };
        databaseChanged = true;
      } else {
        if (parsed.settings.n8nWebhookUrl === undefined) {
          parsed.settings.n8nWebhookUrl = "";
          databaseChanged = true;
        }
        if (parsed.settings.n8nAnalyzeWebhook === undefined) {
          parsed.settings.n8nAnalyzeWebhook = "";
          databaseChanged = true;
        }
        if (parsed.settings.n8nRefineWebhook === undefined) {
          parsed.settings.n8nRefineWebhook = "";
          databaseChanged = true;
        }
        if (parsed.settings.geminiApiKey === undefined) {
          parsed.settings.geminiApiKey = "";
          databaseChanged = true;
        }
        if (parsed.settings.openaiApiKey === undefined) {
          parsed.settings.openaiApiKey = "";
          databaseChanged = true;
        }
        if (parsed.settings.siteTitle === undefined) {
          parsed.settings.siteTitle = "Promty.ir";
          databaseChanged = true;
        }
      }

      // Soft-migrate legacy singular tool/domain/outputFormat fields to arrays
      if (Array.isArray(parsed.prompts)) {
        parsed.prompts = parsed.prompts.map((p: any) => {
          let promptChanged = false;
          if (!Array.isArray(p.tools)) {
            p.tools = p.tool ? [p.tool] : [];
            promptChanged = true;
          }
          if (!Array.isArray(p.domains)) {
            p.domains = p.domain ? [p.domain] : [];
            promptChanged = true;
          }
          if (!Array.isArray(p.outputFormats)) {
            p.outputFormats = p.outputFormat ? [p.outputFormat] : [];
            promptChanged = true;
          }
          if (promptChanged) {
            databaseChanged = true;
          }
          return p;
        });
      }

      if (databaseChanged) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
      }
      
      return parsed as DB;
    }
  } catch (error) {
    console.error("Error reading database file, using fallback:", error);
  }

  // Fallback / Initial Seed Data
  const initialDB: DB = {
    settings: {
      n8nWebhookUrl: "",
      n8nAnalyzeWebhook: "",
      n8nRefineWebhook: "",
      geminiApiKey: "",
      openaiApiKey: "",
      siteTitle: "پرامپتی | Promty",
      siteSubtitle: "موتور شخصی‌سازی و پرامپت مهندسی",
      heroTitle: "قلب تپنده نوآوری با پرامپتی",
      heroDescription: "مرجع جستجو و شخصی‌سازی پرامپت. با جستجو، فیلترها، ابزارها، قالب‌های خروجی و دسته‌بندی‌های معنایی را با یک کلیک کاوش کنید.",
      footerAbout: "پرامپتی مرجع تخصصی مهندسی پرامپت و گراف دانش هوش مصنوعی در ایران است. ما به شما کمک می‌کنیم تا با دقیق‌ترین پرامپت‌ها، به بهترین نتایج دست یابید.",
      footerCopyright: "تمامی حقوق مادی و معنوی برای پرامپتی محفوظ است.",
      siteLogo: "",
      aiTimeoutSeconds: 60
    },
    categories: [
      { id: "1", name: "تبلیغات", slug: "advertising", icon: "Megaphone" },
      { id: "2", name: "وبسایت", slug: "website", icon: "Globe" },
      { id: "3", name: "ویدیو", slug: "video", icon: "Video" },
      { id: "4", name: "عکاسی", slug: "photography", icon: "Camera" },
    ],
    prompts: [
      {
        id: "p1",
        title: "تصویر تبلیغاتی محصول جواهرات",
        description: "یک پرامپت عالی برای ساخت تصاویر تبلیغاتی حرفه‌ای مخصوص طلا، نقره و جواهرات مجلل",
        body: "یک عکس تبلیغاتی حرفه‌ای از {{product_name}} بساز. رنگ غالب {{brand_color}}. پس‌زمینه سفید خالص. نور استودیویی. کیفیت 4K. در پایین بنویس: {{ad_text}}",
        category: "Midjourney",
        intent: "Visual Generation",
        domains: ["Photography"],
        tools: ["Midjourney"],
        task: "Product Commercial Portrait",
        language: "Persian",
        difficulty: "Beginner",
        outputFormats: ["Presentation"],
        tags: ["جواهرات", "تبلیغات", "Midjourney", "طلا"],
        requiresReferenceImage: false,
        sampleImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
        isPremium: false,
        isActive: true,
        usageCount: 142,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fieldsSchema: [
          {
            key: "product_name",
            label: "نام محصول",
            type: "text",
            placeholder: "مثال: گوشواره طلا دست‌ساز",
            required: true
          },
          {
            key: "brand_color",
            label: "رنگ غالب برند",
            type: "color",
            required: false
          },
          {
            key: "ad_text",
            label: "متن تبلیغ",
            type: "textarea",
            placeholder: "جمله‌ای که می‌خواهید روی تصویر باشد (انگلیسی یا فارسی)",
            required: false
          }
        ]
      },
      {
        id: "p2",
        title: "لندینگ پیج کسب‌وکار",
        description: "پرامپت توسعه‌دهندگان وب برای دریافت کدهای لندینگ پیج مدرن و سازگار با فریم‌ورک‌های روز",
        body: "یک لندینگ پیج حرفه‌ای با React و Tailwind CSS برای کسب‌وکار {{business_name}} در حوزه {{business_field}} بساز. رنگ اصلی برند {{brand_color}}. لحن: {{tone}}. شامل: هدر، hero section، بخش خدمات، و فوتر.",
        category: "ChatGPT",
        intent: "Coding",
        domains: ["Programming"],
        tools: ["ChatGPT"],
        task: "React Component Coding",
        language: "English",
        difficulty: "Intermediate",
        outputFormats: ["React"],
        tags: ["برنامه‌نویسی", "کد", "React", "Tailwind"],
        requiresReferenceImage: false,
        sampleImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600",
        isPremium: false,
        isActive: true,
        usageCount: 98,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fieldsSchema: [
          {
            key: "business_name",
            label: "نام کسب‌‌وکار",
            type: "text",
            placeholder: "مثال: دیجی استایل",
            required: true
          },
          {
            key: "business_field",
            label: "حوزه فعالیت",
            type: "text",
            placeholder: "مثال: فروشگاه اینترنتی مد و پوشاک",
            required: true
          },
          {
            key: "brand_color",
            label: "رنگ سازمانی",
            type: "color",
            required: false
          },
          {
            key: "tone",
            label: "لحن محتوا",
            type: "select",
            required: true,
            options: ["رسمی", "دوستانه", "هیجان‌انگیز"],
            placeholder: "یکی را انتخاب کنید"
          }
        ]
      },
      {
        id: "p3",
        title: "ویدیو تیزر محصول",
        description: "پرامپت طلایی برای ساخت ویدیوهای کوتاه تبلیغاتی یا تیزرهای ۱۵ ثانیه‌ای اینستاگرام و یوتیوب",
        body: "یک تیزر ویدیویی ۱۵ ثانیه‌ای برای {{product_name}} بساز. سبک: {{style}}. موزیک: {{music_mood}}. متن روی صفحه: {{tagline}}",
        category: "Runway",
        intent: "Visual Generation",
        domains: ["Marketing"],
        tools: ["Runway"],
        task: "Video Teaser Creation",
        language: "Persian",
        difficulty: "Advanced",
        outputFormats: ["Markdown"],
        tags: ["تیزر", "ویدیو", "Kling", "Sora", "اینستاگرام"],
        requiresReferenceImage: false,
        sampleImage: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=600",
        isPremium: true,
        isActive: true,
        usageCount: 235,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fieldsSchema: [
          {
            key: "product_name",
            label: "نام محصول",
            type: "text",
            placeholder: "مثال: گوشی هوشمند جدید سامسونگ S24",
            required: true
          },
          {
            key: "style",
            label: "سبک ویدیو",
            type: "select",
            required: true,
            options: ["مدرن", "کلاسیک", "پویا و پرانرژی"],
            placeholder: "انتخاب سبک"
          },
          {
            key: "music_mood",
            label: "حال‌وهوای موسیقی",
            type: "text",
            placeholder: "مثال: الکترونیک پرانرژی با بیس قوی",
            required: false
          },
          {
            key: "tagline",
            label: "شعار تبلیغاتی روی صفحه",
            type: "text",
            placeholder: "مثال: نهایت سرعت در دستان شما",
            required: false
          }
        ]
      }
    ]
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), "utf-8");
  return initialDB;
}

// Helper to write database
function writeDB(data: DB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function syncTaxonomies(prisma: PrismaClient | null) {
  if (!prisma) return;
  try {
    const { defaultTaxonomies } = await import("./src/lib/defaultTaxonomies.ts");
    let syncedCount = 0;
    for (const item of defaultTaxonomies) {
      const existing = await prisma.taxonomy.findFirst({
        where: { type: item.type, slug: item.slug },
      });
      if (!existing) {
        await prisma.taxonomy.create({
          data: {
            type: item.type,
            slug: item.slug,
            titleEn: item.titleEn,
            titleFa: item.titleFa,
            status: "active",
            popularity: 0.5,
          },
        });
        syncedCount++;
      }
    }
    if (syncedCount > 0) {
      console.log(`[DB] Taxonomy sync: ${syncedCount} new item(s) added.`);
    }
  } catch (err) {
    console.error("[DB] Taxonomy sync failed:", err);
  }
}

// Check admin and super admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@promty.ir";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE || "";
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "";

// Preserve only trusted persistent roles; identifiers never grant privileges.
function resolveUserRole(
  identifier: { email?: string | null; phone?: string | null },
  currentRole?: string | null
): "SUPER_ADMIN" | "ADMIN" | "USER" {
  const normalized = currentRole ? String(currentRole).toUpperCase() : "";
  if (normalized === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (normalized === "ADMIN") return "ADMIN";
  return "USER";
}

async function getPageMetadata(urlPath: string) {
  let title = "پرامپتی | مرجع و شخصی‌سازی پرامپت‌های آماده هوش مصنوعی";
  let description = "دانلود، بهینه‌سازی و کپی سریع پرامپت‌های مهندسی‌شده برای ابزارهای تصویرسازی و متنی مانند ChatGPT، Claude و Midjourney.";
  let imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";
  let jsonLd = "";

  const toolMatch = urlPath.match(/^\/tool\/([^/]+)/i);
  const domainMatch = urlPath.match(/^\/domain\/([^/]+)/i);
  const promptMatch = urlPath.match(/^\/prompts\/([^/]+)/i);

  const baseUrl = "https://promty.ir";
  const pageUrl = `${baseUrl}${urlPath}`;

  const TRANSLATIONS_LOCAL: Record<string, string> = {
    "chatgpt": "ChatGPT",
    "claude": "Claude",
    "gemini": "Gemini",
    "grok": "Grok",
    "midjourney": "Midjourney",
    "flux": "Flux",
    "stable-diffusion": "Stable Diffusion",
    "ideogram": "Ideogram",
    "veo": "Veo",
    "kling": "Kling",
    "runway": "Runway",
    "marketing": "بازاریابی (Marketing)",
    "programming": "برنامه‌نویسی (Programming)",
    "photography": "عکاسی (Photography)",
    "design": "طراحی و هنر (Design)",
    "business": "کسب‌وکار (Business)",
    "education": "آموزش (Education)"
  };

  if (toolMatch) {
    const slug = toolMatch[1].toLowerCase();
    const displayName = TRANSLATIONS_LOCAL[slug] || slug;
    title = `پرامپت‌های تخصصی ${displayName} | قالب آماده شخصی‌سازی - Promty`;
    description = `آرشیو جامع پرامپت‌های مهندسی‌شده و کاملاً متغیر برای ابزار هوش مصنوعی ${displayName}. دسترسی و کپی فوری در Promty.ir.`;
    
    // BreadcrumbList JSON-LD
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "خانه",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": `ابزار ${displayName}`,
          "item": pageUrl
        }
      ]
    };
    jsonLd = `<script type="application/ld+json">${safeJsonLd(breadcrumbs)}</script>`;

  } else if (domainMatch) {
    const slug = domainMatch[1].toLowerCase();
    const displayName = TRANSLATIONS_LOCAL[slug] || slug;
    title = `پرامپت‌های حوزه ${displayName} | مهندسی پرامپت آماده - Promty`;
    description = `مجموعه بهترین نمونه‌های پرامپت بهینه‌سازی شده در حوزه ${displayName} برای دریافت باکیفیت‌ترین خروجی‌ها در هوش مصنوعی.`;
    
    // BreadcrumbList JSON-LD
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "خانه",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": `حوزه ${displayName}`,
          "item": pageUrl
        }
      ]
    };
    jsonLd = `<script type="application/ld+json">${safeJsonLd(breadcrumbs)}</script>`;

  } else if (promptMatch) {
    const id = promptMatch[1];
    try {
      const prompt = await promptRepo.getById(id);
      if (prompt && prompt.isActive) {
        title = `${prompt.title} | قالب پرامپت آماده و شخصی‌سازی - Promty`;
        description = prompt.description || `دانلود، ویرایش و کپی سریع پرامپت مهندسی‌شده "${prompt.title}" مخصوص ${prompt.category || "هوش مصنوعی"} در وبسایت پرامپتی.`;
        if (prompt.sampleImage) {
          imageUrl = prompt.sampleImage;
        }

        // Schema Engine Injection
        // Structured content contains no inferred ratings or invented review counts.
        const mainEntitySchema: any = {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": prompt.title,
          "description": prompt.description || description,
          "image": imageUrl,
          "step": [
            {
              "@type": "HowToStep",
              "name": "شخصی‌سازی متغیرها",
              "text": "فیلدهای متغیر موجود در پرامپت را با مقادیر دلخواه پر کنید."
            },
            {
              "@type": "HowToStep",
              "name": "کپی و استفاده",
              "text": "دکمه کپی پرامپت را فشار دهید و در چت باکس هوش مصنوعی کپی کنید."
            }
          ],

        };

        const breadcrumbs = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "خانه",
              "item": baseUrl
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": prompt.category || "پرامپت‌ها",
              "item": `${baseUrl}/prompts/${prompt.id}`
            }
          ]
        };

        jsonLd = `
          <script type="application/ld+json">${safeJsonLd(breadcrumbs)}</script>
          <script type="application/ld+json">${safeJsonLd(mainEntitySchema)}</script>
        `;
      }
    } catch (e) {
      console.error("Failed to query prompt for SEO:", e);
    }
  } else {
    // General breadcrumbs for Homepage
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "خانه",
          "item": baseUrl
        }
      ]
    };
    jsonLd = `<script type="application/ld+json">${safeJsonLd(breadcrumbs)}</script>`;
  }

  // Generate complete HTML meta chunk
  const metaHtml = `
    <!-- Custom Meta Tags injected dynamically -->
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    ${jsonLd}
  `;

  return metaHtml;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3005);

  const hasDbUrl = !!process.env.DATABASE_URL;

  if (hasDbUrl) {
    try {
      prisma = new PrismaClient();
      await prisma.$connect();
      promptRepo = new PrismaPromptRepository(prisma);
      taxonomyRepo = new PrismaTaxonomyRepository(prisma);
      relationshipRepo = new PrismaRelationshipRepository(prisma);
      console.log("[DB] Using Prisma database backend.");
    } catch (dbError) {
      if (operationalProduction) throw dbError;
      console.error("[DB] Failed to initialize Prisma, falling back to JSON storage:", dbError);
      prisma = null;
    }
  }

  if (!prisma) {
    console.log("[DB] DATABASE_URL is not set or Prisma failed. Falling back to JSON storage.");
    promptRepo = new JsonPromptRepository();
    taxonomyRepo = new JsonTaxonomyRepository();
    relationshipRepo = new JsonRelationshipRepository();
  }

  await syncTaxonomies(prisma);

  // Clean and sanitize any potential negative/fake usage count values
  if (prisma) {
    try {
      await prisma.prompt.updateMany({
        where: {
          usageCount: {
            lt: 0
          }
        },
        data: {
          usageCount: 0
        }
      });
      console.log("Database usage count values sanitized successfully.");
    } catch (e) {
      console.error("Failed to sanitize usage count values:", e);
    }
  }

  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());

  const currentUser = async (req: express.Request): Promise<any | null> => {
    const token = req.cookies?.promty_session || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
    if (!token) return null;
    try {
      const claims = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as any;
      const user = prisma ? await prisma.user.findUnique({ where: { id: claims.id } }) : (readDB().users || []).find((u: any) => u.id === claims.id);
      if (claims.iat <= securityState.revokedAfter(claims.id)) return null;
      if (!user || String(user.role).toLowerCase() !== String(claims.role).toLowerCase()) return null;
      return { ...user, role: String(user.role).toLowerCase() };
    } catch { return null; }
  };
  const isManager = (user: any) => ["admin", "super_admin"].includes(user?.role);
  app.use(async (req, res, next) => {
    (req as any).user = await currentUser(req);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (operationalProduction) {
      const nonce = crypto.randomBytes(18).toString("base64");
      res.locals.cspNonce = nonce;
      res.setHeader("Content-Security-Policy", `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://accounts.google.com; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`);
    }
    if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      const allowed = new Set([process.env.APP_ORIGIN, ...(!operationalProduction ? ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3005"] : [])].filter(Boolean));
      if ((origin && !allowed.has(origin)) || (!origin && req.cookies?.promty_session) || req.headers["sec-fetch-site"] === "cross-site") return res.status(403).json({ success: false, message: "مبدأ درخواست مجاز نیست." });
    }
    next();
  });
  app.use("/api", (req, res, next) => {
    const costly = /auth\/(login|google|otp)|analyze-public|refine-prompt|prompts\/submit/.test(req.path);
    if (req.method !== "POST" || !costly) return next();
    try {
      const auth = /auth/.test(req.path);
      const allowed = securityState.consume(`${req.ip}:${req.path}`, auth ? 20 : 10, 3600000);
      const globalAllowed = auth || securityState.consume("global-ai-daily", Math.max(1, Number(process.env.AI_DAILY_REQUEST_LIMIT) || 100), 86400000);
      if (!allowed || !globalAllowed) return res.status(429).json({ success: false, message: "سقف درخواست مجاز رسیده است؛ بعداً تلاش کنید." });
      next();
    } catch { return res.status(503).json({ success: false, message: "کنترل مصرف موقتاً در دسترس نیست." }); }
  });
  // Draft content must never leak through detail, media, render, copy, or saved lists.
  app.use(async (req, res, next) => {
    const match = req.path.match(/^\/api\/prompts\/([^/]+)(?:\/|$)/) || req.path.match(/^\/dl\/prompts\/([^/]+)(?:\/|$)/) || req.path.match(/^\/prompts\/([^/]+)$/);
    const reserved = ["submit", "analyze-public", "facets"];
    const id = req.path === "/api/render-prompt" ? req.body?.promptId : match?.[1];
    if (id && !reserved.includes(id)) {
      try {
        const prompt = await promptRepo.getById(id);
        if (!prompt || (!prompt.isActive && !isManager((req as any).user))) return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
      } catch { return res.status(503).json({ success: false, message: "محتوا موقتاً در دسترس نیست." }); }
    }
    next();
  });
  const requireManager = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!isManager((req as any).user)) return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" });
    next();
  };
  app.use("/dl", (req, res, next) => {
    // Static serving normalizes dot segments; reject every alternate path before it can do so.
    if (req.path !== "/brand/logo.webp" && !/^\/prompts\/[a-zA-Z0-9_-]{1,80}\/[a-zA-Z0-9_-]+\.webp$/.test(req.path)) return res.status(404).end();
    next();
  });
  // Auth-aware media must not be cached after unpublishing.
  app.use("/dl", (_req, res, next) => { res.setHeader("Cache-Control", "private, no-store"); next(); }, express.static(path.join(process.cwd(), "dl"), { maxAge: 0 }));

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 6, fields: 2, parts: 8 } });

  // API - Process and upload media cover/gallery
  app.post("/api/upload/:promptId", requireManager, async (req, res, next) => {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(req.params.promptId)) return res.status(400).json({ success: false });
    try {
      if (!await promptRepo.getById(req.params.promptId)) return res.status(404).json({ success: false });
      next();
    } catch { res.status(503).json({ success: false }); }
  }, upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "gallery", maxCount: 5 }
  ]), async (req, res) => {
    try {
      const { promptId } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      const coverFile = files?.["cover"]?.[0];
      const galleryFiles = files?.["gallery"] || [];

      if (!coverFile && galleryFiles.length === 0) {
        return res.status(400).json({ success: false, message: "هیچ فایلی برای آپلود دریافت نشد." });
      }

      // Decode and validate every image before creating directories or writing files.
      for (const file of [coverFile, ...galleryFiles].filter(Boolean) as Express.Multer.File[]) {
        const metadata = await sharp(file.buffer, { limitInputPixels: 25000000 }).metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format || "") || !metadata.width || !metadata.height || metadata.width > 8000 || metadata.height > 8000 || (metadata.pages || 1) > 1) return res.status(400).json({ success: false, message: "تصویر معتبر JPEG/PNG/WebP با ابعاد مجاز لازم است." });
        await sharp(file.buffer, { limitInputPixels: 25000000 }).webp().toBuffer();
      }
      const targetDir = path.join(process.cwd(), "dl", "prompts", promptId);
      
      // Ensure directory exists recursively
      await fs.promises.mkdir(targetDir, { recursive: true });

      let coverUrl: string | undefined;
      const newGalleryUrls: string[] = [];

      // 1. Process cover image if present
      if (coverFile) {
        const fileName = "cover.webp";
        const filePath = path.join(targetDir, fileName);

        // Convert file buffer to webp using sharp and write to disk
        await sharp(coverFile.buffer)
          .webp({ quality: 85 })
          .toFile(filePath);

        coverUrl = `/dl/prompts/${promptId}/${fileName}`;
      }

      // 2. Process gallery images if present
      if (galleryFiles.length > 0) {
        const baseTimestamp = Date.now();
        for (let i = 0; i < galleryFiles.length; i++) {
          const file = galleryFiles[i];
          const timestamp = `${baseTimestamp}-${i}`;
          const galleryName = `gallery-${timestamp}.webp`;
          const thumbnailName = `thumbnail-${timestamp}.webp`;

          const galleryPath = path.join(targetDir, galleryName);
          const thumbnailPath = path.join(targetDir, thumbnailName);

          // Process main gallery image (compressed webp)
          await sharp(file.buffer)
            .webp({ quality: 80 })
            .toFile(galleryPath);

          // Process thumbnail (600x400 webp)
          await sharp(file.buffer)
            .resize(600, 400, { fit: "cover" })
            .webp({ quality: 75 })
            .toFile(thumbnailPath);

          newGalleryUrls.push(`/dl/prompts/${promptId}/${galleryName}`);
        }
      }

      // 3. Update database using promptRepo
      const existingPrompt = await promptRepo.getById(promptId);

      if (!existingPrompt) {
        return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
      }

      const currentGallery = Array.isArray(existingPrompt.mediaGallery) 
        ? (existingPrompt.mediaGallery as unknown as string[]) 
        : [];

      const updatedGallery = [...currentGallery, ...newGalleryUrls];

      const updateData: any = {};
      if (coverUrl) {
        updateData.coverImage = coverUrl;
      }
      if (newGalleryUrls.length > 0) {
        updateData.mediaGallery = updatedGallery as any;
      }

      const updatedPrompt = await promptRepo.update(promptId, updateData);

      return res.json({
        success: true,
        coverImage: updatedPrompt.coverImage,
        mediaGallery: updatedPrompt.mediaGallery,
        message: "فایل‌ها با موفقیت پردازش و در دیتابیس ثبت شدند."
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      return res.status(500).json({ success: false, message: "خطا در آپلود یا پردازش تصویر.", error: error.message });
    }
  });

  // API - Auth Login (Static Admin)
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (ADMIN_PASSWORD && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const initialRole = SUPER_ADMIN_EMAIL && ADMIN_EMAIL.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? "SUPER_ADMIN" : "ADMIN";
      let user: any;
      if (prisma) {
        user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
        if (!user) user = await prisma.user.create({ data: { email: ADMIN_EMAIL, name: "مدیر سیستم", role: initialRole } });
      } else {
        const db = readDB(); db.users ||= [];
        user = db.users.find((u: any) => u.email === ADMIN_EMAIL);
        if (!user) { user = { id: "admin_static", email: ADMIN_EMAIL, name: "مدیر سیستم", role: initialRole }; db.users.push(user); writeDB(db); }
      }
      const role = String(user.role).toLowerCase();
      const token = jwt.sign(
        { id: user.id, email: ADMIN_EMAIL, role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("promty_session", token, {
        httpOnly: true,
        secure: operationalProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        token,
        user: { email: ADMIN_EMAIL, role }
      });
    }
    return res.status(401).json({ success: false, message: "ایمیل یا رمز عبور اشتباه است." });
  });

  // API - Auth Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("promty_session", {
      httpOnly: true,
      secure: operationalProduction,
      sameSite: "lax"
    });
    return res.json({ success: true, message: "خروج موفقیت‌آمیز" });
  });

  // API - Google OAuth 2.0 Login
  app.post("/api/auth/google", async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: "توکن گوگل ارسال نشده است." });
    }
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ success: false, message: "توکن معتبر نیست." });
      }

      if (!payload.email || !payload.email_verified) return res.status(401).json({ success: false });
      const { email, name, picture } = payload;
      let user: any = null;

      if (prisma) {
        user = await prisma.user.findUnique({
          where: { email: email },
        });

        const targetRole = resolveUserRole({ email: email }, user?.role);

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name,
              avatar: picture,
              role: targetRole,
            },
          });
        } else {
          // If super admin override or info updated
          const shouldUpdateRole = user.role !== targetRole && (targetRole === "SUPER_ADMIN" || targetRole === "ADMIN");
          const shouldUpdateAvatar = picture && user.avatar !== picture;
          if (shouldUpdateRole || shouldUpdateAvatar) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                ...(shouldUpdateRole ? { role: targetRole } : {}),
                ...(shouldUpdateAvatar ? { avatar: picture } : {}),
              },
            });
          }
        }
      } else {
        const db = readDB(); db.users ||= [];
        user = db.users.find((u: any) => u.email === email);
        if (!user) { user = { id: "user_" + crypto.randomUUID(), email, name, avatar: picture, role: "USER" }; db.users.push(user); writeDB(db); }

      }

      const userRoleLower = String(user.role).toLowerCase();
      const token = jwt.sign(
        { id: user.id, email: user.email, phone: user.phone, role: userRoleLower },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("promty_session", token, {
        httpOnly: true,
        secure: operationalProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          role: userRoleLower,
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        const field = err.meta?.target?.[0] || "این مقدار";
        return res.status(409).json({
          success: false,
          message: field === "email" ? "این ایمیل قبلاً توسط حساب دیگری ثبت شده است." : "این شماره قبلاً ثبت شده است.",
        });
      }
      console.error("Google Auth error:", err);
      return res.status(500).json({ success: false, message: "احراز هویت گوگل ناموفق بود: " + err.message });
    }
  });

  // API - Get User Profile (Auth status check)
  app.get("/api/auth/me", async (req, res) => {
    const user = (req as any).user;
    return res.json({ success: !!user, user: user ? { id: user.id, email: user.email, phone: user.phone, name: user.name, avatar: user.avatar, role: user.role } : null });
  });

  // API - Public Configuration (Google Client ID)
  app.get("/api/config", (req, res) => {
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || ""
    });
  });

  // API - Send OTP Code via MeliPayamak SOAP Pattern Service
  app.post("/api/auth/otp/send", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, message: "شماره موبایل الزامی است." });
      }

      let sanitizedPhone: string;
      try {
        sanitizedPhone = sanitizeIranianMobile(phone);
      } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || "فرمت شماره موبایل نامعتبر است." });
      }

      const rateCheck = smsService.checkRateLimit(sanitizedPhone);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: `لطفاً ${rateCheck.remainingSeconds} ثانیه دیگر جهت درخواست مجدد کد تایید صبر کنید.`,
          remainingSeconds: rateCheck.remainingSeconds,
        });
      }

      const code = smsService.generateOtpCode();
      const result = await smsService.sendOtp(sanitizedPhone, code);

      return res.json({
        success: true,
        message: "کد تایید با موفقیت ارسال شد.",
        cooldownSeconds: result.cooldownSeconds || 120,
      });
    } catch (err: any) {
      console.error("[OTP Send Error]:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "خطا در ارسال پیامک کد تایید.",
      });
    }
  });

  // API - Verify OTP Code and Login / Register User
  app.post("/api/auth/otp/verify", async (req, res) => {
    try {
      const { phone, code } = req.body;
      if (!phone || !code) {
        return res.status(400).json({ success: false, message: "شماره موبایل و کد تایید الزامی است." });
      }

      let sanitizedPhone: string;
      try {
        sanitizedPhone = sanitizeIranianMobile(phone);
      } catch (e: any) {
        return res.status(400).json({ success: false, message: e.message || "فرمت شماره موبایل نامعتبر است." });
      }

      const isValid = smsService.verifyOtp(sanitizedPhone, code);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "کد تایید اشتباه است یا منقضی شده است (اعتبار کد ۲ دقیقه است).",
        });
      }

      // Find or create User
      let user: any = null;
      let isNewUser = false;

      if (prisma) {
        user = await prisma.user.findUnique({
          where: { phone: sanitizedPhone },
        });

        const targetRole: "SUPER_ADMIN" | "ADMIN" | "USER" = resolveUserRole({ phone: sanitizedPhone, email: user?.email }, user?.role);

        if (!user) {
          isNewUser = true;
          user = await prisma.user.create({
            data: {
              phone: sanitizedPhone,
              role: targetRole,
              name: `کاربر ${sanitizedPhone.slice(-4)}`,
            },
          });
        }
      } else {
        const dbPath = path.join(process.cwd(), "db.json");
        let db: any = {};
        if (fs.existsSync(dbPath)) {
          db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
        }
        if (!db.users) db.users = [];
        user = db.users.find((u: any) => u.phone === sanitizedPhone);

        const targetRole: "SUPER_ADMIN" | "ADMIN" | "USER" = resolveUserRole({ phone: sanitizedPhone, email: user?.email }, user?.role);

        if (!user) {
          isNewUser = true;
          user = {
            id: "user_" + Date.now(),
            phone: sanitizedPhone,
            name: `کاربر ${sanitizedPhone.slice(-4)}`,
            email: null,
            role: targetRole,
            createdAt: new Date().toISOString(),
          };
          db.users.push(user);
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
        }
      }

      const roleLower = String(user.role).toLowerCase();
      const token = jwt.sign(
        {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: roleLower,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("promty_session", token, {
        httpOnly: true,
        secure: operationalProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        token,
        isNewUser,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: roleLower,
        },
      });
    } catch (err: any) {
      console.error("[OTP Verify Error]:", err);
      return res.status(500).json({ success: false, message: "خطا در تایید کد و ورود." });
    }
  });

  app.post("/api/auth/otp-mock", (_req, res) => res.status(404).json({ success: false }));
  app.post("/api/auth/phone-register", async (req, res) => {
    const user = (req as any).user;
    if (!user?.phone) return res.status(401).json({ success: false, message: "ابتدا شماره خود را با کد تایید احراز کنید." });
    if (req.body.email && req.body.email !== user.email) return res.status(400).json({ success: false, message: "تغییر ایمیل نیازمند تایید است." });
    if (req.body.phone && sanitizeIranianMobile(req.body.phone) !== user.phone) return res.status(403).json({ success: false });
    const name = typeof req.body.name === "string" ? req.body.name.trim().slice(0, 120) : "";
    if (!name) return res.status(400).json({ success: false });
    if (prisma) await prisma.user.update({ where: { id: user.id }, data: { name } });
    else { const db = readDB(); const saved = db.users.find((u: any) => u.id === user.id); saved.name = name; writeDB(db); }
    res.json({ success: true, user: { ...user, name } });
  });

  // Helper to extract JWT token from cookies or Authorization header
  const extractAuthToken = (req: express.Request): string | null => {
    if (req.cookies?.promty_session) return req.cookies.promty_session;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const val = authHeader.slice(7).trim();
      if (val && val !== "active_jwt_session") return val;
    }
    return null;
  };

  const adminAuth = requireManager;
  const superAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if ((req as any).user?.role !== "super_admin") return res.status(403).json({ success: false, message: "نیاز به مدیر ارشد" });
    next();
  };

  app.use("/api/admin/users", async (req, res, next) => {
    if (["GET", "HEAD"].includes(req.method)) return next();
    const actor = (req as any).user;
    if (!isManager(actor)) return res.status(403).json({ success: false });
    if (req.body.role && actor.role !== "super_admin") return res.status(403).json({ success: false, message: "تغییر نقش فقط توسط مدیر ارشد ممکن است." });
    if (req.body.role && !["USER", "ADMIN", "SUPER_ADMIN"].includes(String(req.body.role).toUpperCase())) return res.status(400).json({ success: false });
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.path.split("/").filter(Boolean)[0]];
    if (actor.role !== "super_admin") {
      const users: any[] = prisma ? await prisma.user.findMany({ where: { id: { in: ids.filter((id: any) => typeof id === "string") } } }) : (readDB().users || []).filter((u: any) => ids.includes(u.id));
      if (users.some(u => String(u.role).toLowerCase() !== "user")) return res.status(403).json({ success: false });
    }
    if (req.body.role || req.method === "DELETE" || req.path === "/bulk-delete") securityState.revoke(ids.filter((id: any) => typeof id === "string"));
    next();
  });

  // API - Role Assignment (SUPER_ADMIN only)
  app.post("/api/admin/roles/assign", superAdminAuth, async (req, res) => {
    try {
      const { targetIdentifier, newRole } = req.body;
      if (!targetIdentifier || !newRole) {
        return res.status(400).json({ success: false, message: "شناسه کاربر و نقش الزامی است." });
      }

      const validRoles = ["SUPER_ADMIN", "ADMIN", "USER"];
      const normalizedRole = String(newRole).toUpperCase();
      if (!validRoles.includes(normalizedRole)) {
        return res.status(400).json({ success: false, message: "نقش نامعتبر است. مجاز: SUPER_ADMIN, ADMIN, USER" });
      }

      const cleanId = String(targetIdentifier).trim();
      let sanitizedCleanId: string | null = null;
      try {
        sanitizedCleanId = sanitizeIranianMobile(cleanId);
      } catch (_) {}

      let user: any = null;

      if (prisma) {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { id: cleanId },
              { phone: cleanId },
              ...(sanitizedCleanId ? [{ phone: sanitizedCleanId }] : []),
              { email: cleanId },
            ],
          },
        });

        if (!user) {
          return res.status(404).json({ success: false, message: "کاربر مورد نظر یافت نشد." });
        }

        // Prevent demoting protected Super Admin configured in environment
        if (
          normalizedRole !== "SUPER_ADMIN" &&
          ((SUPER_ADMIN_PHONE && user.phone === SUPER_ADMIN_PHONE) ||
           (SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL))
        ) {
          return res.status(403).json({ success: false, message: "امکان تغییر نقش مدیر ارشد سیستم (تنظیم‌شده در متغیرهای سرور) وجود ندارد." });
        }

        securityState.revoke([user.id]);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: normalizedRole as any },
        });
      } else {
        const dbPath = path.join(process.cwd(), "db.json");
        let db: any = {};
        if (fs.existsSync(dbPath)) {
          db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
        }
        if (!db.users) db.users = [];
        user = db.users.find((u: any) => u.id === cleanId || u.phone === cleanId || u.email === cleanId);

        if (!user) {
          return res.status(404).json({ success: false, message: "کاربر مورد نظر یافت نشد." });
        }

        securityState.revoke([user.id]);
        user.role = normalizedRole;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
      }

      return res.json({
        success: true,
        message: `نقش کاربر با موفقیت به ${normalizedRole} تغییر یافت.`,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          role: String(user.role).toLowerCase(),
        },
      });
    } catch (err: any) {
      console.error("[Assign Role Error]:", err);
      return res.status(500).json({ success: false, message: "خطا در تغییر سطح دسترسی کاربر." });
    }
  });

  // API - Get Users List for Administrative Delegation
  app.get("/api/admin/users", adminAuth, async (req, res) => {
    try {
      let usersList: any[] = [];
      if (prisma) {
        usersList = await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            phone: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            createdAt: true,
          },
        });
      } else {
        const dbPath = path.join(process.cwd(), "db.json");
        if (fs.existsSync(dbPath)) {
          const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
          usersList = (db.users || []).map((u: any) => ({
            id: u.id,
            phone: u.phone,
            email: u.email,
            name: u.name,
            avatar: u.avatar || null,
            role: u.role || "USER",
            createdAt: u.createdAt || new Date().toISOString(),
          }));
        }
      }

      return res.json({
        success: true,
        users: usersList.map((u) => ({
          ...u,
          role: String(u.role).toLowerCase(),
        })),
      });
    } catch (err: any) {
      console.error("[Get Users Error]:", err);
      return res.status(500).json({ success: false, message: "خطا در دریافت لیست کاربران." });
    }
  });

  // API - Delete Single User (admin/super_admin)
  app.delete("/api/admin/users/:id", adminAuth, async (req, res) => {
    try {
      const targetId = req.params.id;
      const actingUser = (req as any).user;
      if (actingUser?.id === targetId) {
        return res.status(400).json({ success: false, message: "امکان حذف حساب کاربری جاری خود وجود ندارد." });
      }

      if (prisma && !targetId.startsWith("mock") && !targetId.startsWith("user_")) {
        try {
          await (prisma as any).promptPreset?.deleteMany({ where: { userId: targetId } }).catch(() => {});
          await prisma.savedPrompt.deleteMany({ where: { userId: targetId } }).catch(() => {});
          await prisma.user.delete({ where: { id: targetId } });
        } catch (e: any) {
          console.warn("[Prisma user delete warning]:", e);
        }
      }

      const db = readDB();
      if (db.users) {
        db.users = db.users.filter((u: any) => u.id !== targetId);
        writeDB(db);
      }

      return res.json({ success: true, message: "کاربر با موفقیت از سیستم حذف شد." });
    } catch (err: any) {
      console.error("[Delete User Error]:", err);
      return res.status(500).json({ success: false, message: "خطا در حذف کاربر: " + err.message });
    }
  });

  // API - Edit User (Name, Email, Phone, Role) (admin/super_admin)
  app.put("/api/admin/users/:id", adminAuth, async (req, res) => {
    try {
      const targetId = req.params.id;
      const { name, email, phone, role } = req.body;
      const actingUser = (req as any).user;
      const actingRole = actingUser?.role?.toLowerCase();

      // Only SUPER_ADMIN can grant or revoke SUPER_ADMIN role
      if (role && String(role).toUpperCase() === "SUPER_ADMIN" && actingRole !== "super_admin") {
        return res.status(403).json({ success: false, message: "فقط مدیر ارشد مجاز به اعطای نقش SUPER_ADMIN است." });
      }

      let sanitizedPhone: string | null = null;
      if (phone) {
        try {
          sanitizedPhone = sanitizeIranianMobile(phone);
        } catch (pe: any) {
          return res.status(400).json({ success: false, message: pe.message || "فرمت شماره موبایل نامعتبر است." });
        }
      }

      let updatedUser: any = null;
      const targetRoleEnum = role ? (String(role).toUpperCase() as "SUPER_ADMIN" | "ADMIN" | "USER") : undefined;

      if (prisma && !targetId.startsWith("mock") && !targetId.startsWith("user_")) {
        try {
          updatedUser = await prisma.user.update({
            where: { id: targetId },
            data: {
              ...(name !== undefined ? { name: name ? String(name).trim() : null } : {}),
              ...(email !== undefined ? { email: email ? String(email).trim().toLowerCase() : null } : {}),
              ...(sanitizedPhone !== null ? { phone: sanitizedPhone } : {}),
              ...(targetRoleEnum ? { role: targetRoleEnum } : {}),
            },
          });
        } catch (e: any) {
          console.warn("[Prisma user update note]:", e);
        }
      }

      const db = readDB();
      if (!db.users) db.users = [];
      const userIdx = db.users.findIndex((u: any) => u.id === targetId);
      if (userIdx !== -1) {
        if (name !== undefined) db.users[userIdx].name = name ? String(name).trim() : null;
        if (email !== undefined) db.users[userIdx].email = email ? String(email).trim().toLowerCase() : null;
        if (sanitizedPhone !== null) db.users[userIdx].phone = sanitizedPhone;
        if (targetRoleEnum) db.users[userIdx].role = targetRoleEnum;
        writeDB(db);
        if (!updatedUser) updatedUser = db.users[userIdx];
      }

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "کاربر مورد نظر یافت نشد." });
      }

      return res.json({
        success: true,
        message: "اطلاعات کاربر با موفقیت ویرایش شد.",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: String(updatedUser.role).toLowerCase(),
        },
      });
    } catch (err: any) {
      console.error("[Edit User Error]:", err);
      return res.status(500).json({ success: false, message: "خطا در ویرایش اطلاعات کاربر: " + err.message });
    }
  });

  // API - Bulk Delete Users
  app.post("/api/admin/users/bulk-delete", adminAuth, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: "هیچ کاربری برای حذف انتخاب نشده است." });
      }

      const actingUser = (req as any).user;
      const targetIds = ids.filter((id: string) => id !== actingUser?.id);

      if (prisma) {
        await (prisma as any).promptPreset?.deleteMany({ where: { userId: { in: targetIds } } }).catch(() => {});
        await prisma.savedPrompt.deleteMany({ where: { userId: { in: targetIds } } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: targetIds } } }).catch(() => {});
      }

      const db = readDB();
      if (db.users) {
        db.users = db.users.filter((u: any) => !targetIds.includes(u.id));
        writeDB(db);
      }

      return res.json({
        success: true,
        message: `${targetIds.length} کاربر با موفقیت حذف شدند.`,
        deletedCount: targetIds.length,
      });
    } catch (err: any) {
      console.error("[Bulk Delete Users Error]:", err);
      return res.status(500).json({ success: false, message: "خطا در حذف دسته‌جمعی کاربران." });
    }
  });

  // API - Bulk Role Change
  app.post("/api/admin/users/bulk-role", adminAuth, async (req, res) => {
    try {
      const { ids, role } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || !role) {
        return res.status(400).json({ success: false, message: "اطلاعات انتخاب کاربران یا نقش نامعتبر است." });
      }

      const targetRole = String(role).toUpperCase() as "SUPER_ADMIN" | "ADMIN" | "USER";
      const actingUser = (req as any).user;
      const actingRole = actingUser?.role?.toLowerCase();

      if (targetRole === "SUPER_ADMIN" && actingRole !== "super_admin") {
        return res.status(403).json({ success: false, message: "تنها مدیر ارشد مجاز به اعطای نقش SUPER_ADMIN است." });
      }

      if (prisma) {
        await prisma.user.updateMany({
          where: { id: { in: ids } },
          data: { role: targetRole },
        }).catch(() => {});
      }

      const db = readDB();
      if (db.users) {
        db.users.forEach((u: any) => {
          if (ids.includes(u.id)) {
            u.role = targetRole;
          }
        });
        writeDB(db);
      }

      return res.json({
        success: true,
        message: `نقش ${ids.length} کاربر با موفقیت به ${targetRole} تغییر یافت.`,
      });
    } catch (err: any) {
      console.error("[Bulk Role Change Error]:", err);
      return res.status(500).json({ success: false, message: "خطا در تغییر دسته‌جمعی نقش‌ها." });
    }
  });

  const userAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req as any).user) return res.status(401).json({ success: false, message: "ابتدا وارد شوید." });
    next();
  };

  app.get("/api/prompts/:id/presets", userAuth, async (req, res) => {
    const { id: promptId } = req.params;
    const userId = (req as any).user.id;

    try {
      if (prisma) {
        const presets = await prisma.promptPreset.findMany({
          where: {
            promptId,
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        return res.json({ success: true, presets });
      } else {
        const db = readDB();
        if (!db.presets) db.presets = [];
        const userPresets = db.presets.filter(
          (p: any) => p.promptId === promptId && p.userId === userId
        );
        userPresets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return res.json({ success: true, presets: userPresets });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Save a new Preset for a specific Prompt (Auto-Bookmark)
  app.post("/api/prompts/:id/presets", userAuth, async (req, res) => {
    const { id: promptId } = req.params;
    const userId = (req as any).user.id;
    const { name, values } = req.body;

    if (!name || !values) {
      return res.status(400).json({ success: false, message: "نام نسخه و مقادیر فیلدها الزامی هستند." });
    }

    try {
      if (prisma) {
        const count = await prisma.promptPreset.count({
          where: {
            promptId,
            userId,
          },
        });

        if (count >= 10) {
          return res.status(400).json({
            success: false,
            message: "سقف ذخیره‌سازی نسخه برای هر پرامپت ۱۰ عدد است.",
          });
        }

        // Auto-Bookmark check
        const existingSaved = await prisma.savedPrompt.findUnique({
          where: {
            userId_promptId: {
              userId,
              promptId,
            },
          },
        });

        if (!existingSaved) {
          const userExists = await prisma.user.findUnique({
            where: { id: userId },
          });
          if (!userExists) {
            await prisma.user.create({
              data: {
                id: userId,
                email: (req as any).user.email || null,
                name: (req as any).user.name || `کاربر ${(req as any).user.phone || (req as any).user.id}`,
                role: "USER",
              },
            });
          }

          await prisma.savedPrompt.create({
            data: {
              userId,
              promptId,
            },
          });
        }

        const preset = await prisma.promptPreset.create({
          data: {
            name,
            values,
            userId,
            promptId,
          },
        });

        return res.status(201).json({ success: true, preset });
      } else {
        const db = readDB();
        if (!db.presets) db.presets = [];
        if (!db.savedPrompts) db.savedPrompts = [];

        const count = db.presets.filter(
          (p: any) => p.promptId === promptId && p.userId === userId
        ).length;

        if (count >= 10) {
          return res.status(400).json({
            success: false,
            message: "سقف ذخیره‌سازی نسخه برای هر پرامپت ۱۰ عدد است.",
          });
        }

        const isSaved = db.savedPrompts.some(
          (sp: any) => sp.userId === userId && sp.promptId === promptId
        );

        if (!isSaved) {
          db.savedPrompts.push({
            id: "sp_" + Date.now(),
            userId,
            promptId,
            createdAt: new Date().toISOString(),
          });
        }

        const newPreset = {
          id: "preset_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          name,
          values,
          userId,
          promptId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.presets.push(newPreset);
        writeDB(db);

        return res.status(201).json({ success: true, preset: newPreset });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Update a Preset
  app.put("/api/presets/:presetId", userAuth, async (req, res) => {
    const { presetId } = req.params;
    const userId = (req as any).user.id;
    const { name, values } = req.body;

    try {
      if (prisma) {
        const preset = await prisma.promptPreset.findUnique({
          where: { id: presetId },
        });

        if (!preset) {
          return res.status(404).json({ success: false, message: "نسخه مورد نظر پیدا نشد." });
        }

        if (preset.userId !== userId) {
          return res.status(403).json({ success: false, message: "شما مجاز به تغییر این نسخه نیستید." });
        }

        const updated = await prisma.promptPreset.update({
          where: { id: presetId },
          data: {
            ...(name && { name }),
            ...(values && { values }),
          },
        });

        return res.json({ success: true, preset: updated });
      } else {
        const db = readDB();
        if (!db.presets) db.presets = [];

        const presetIndex = db.presets.findIndex((p: any) => p.id === presetId);
        if (presetIndex === -1) {
          return res.status(404).json({ success: false, message: "نسخه مورد نظر پیدا نشد." });
        }

        const preset = db.presets[presetIndex];
        if (preset.userId !== userId) {
          return res.status(403).json({ success: false, message: "شما مجاز به تغییر این نسخه نیستید." });
        }

        if (name) preset.name = name;
        if (values) preset.values = values;
        preset.updatedAt = new Date().toISOString();

        writeDB(db);
        return res.json({ success: true, preset });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Delete a Preset
  app.delete("/api/presets/:presetId", userAuth, async (req, res) => {
    const { presetId } = req.params;
    const userId = (req as any).user.id;

    try {
      if (prisma) {
        const preset = await prisma.promptPreset.findUnique({
          where: { id: presetId },
        });

        if (!preset) {
          return res.status(404).json({ success: false, message: "نسخه مورد نظر پیدا نشد." });
        }

        if (preset.userId !== userId) {
          return res.status(403).json({ success: false, message: "شما مجاز به حذف این نسخه نیستید." });
        }

        await prisma.promptPreset.delete({
          where: { id: presetId },
        });

        return res.json({ success: true, message: "نسخه با موفقیت حذف شد." });
      } else {
        const db = readDB();
        if (!db.presets) db.presets = [];

        const presetIndex = db.presets.findIndex((p: any) => p.id === presetId);
        if (presetIndex === -1) {
          return res.status(404).json({ success: false, message: "نسخه مورد نظر پیدا نشد." });
        }

        const preset = db.presets[presetIndex];
        if (preset.userId !== userId) {
          return res.status(403).json({ success: false, message: "شما مجاز به حذف این نسخه نیستید." });
        }

        db.presets.splice(presetIndex, 1);
        writeDB(db);

        return res.json({ success: true, message: "نسخه با موفقیت حذف شد." });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Toggle Bookmark for a prompt
  app.post("/api/prompts/:id/bookmark", userAuth, async (req, res) => {
    const { id: promptId } = req.params;
    const userId = (req as any).user.id;

    try {
      if (prisma) {
        // 1. Check/Create User record in prisma
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!userExists) {
          await prisma.user.create({
            data: {
              id: userId,
              email: (req as any).user.email || null,
              name: (req as any).user.name || `کاربر ${(req as any).user.phone || (req as any).user.id}`,
              role: "USER",
            },
          });
        }

        // 2. Check if already bookmarked
        const existing = await prisma.savedPrompt.findUnique({
          where: {
            userId_promptId: {
              userId,
              promptId,
            },
          },
        });

        if (existing) {
          await prisma.savedPrompt.delete({
            where: {
              userId_promptId: {
                userId,
                promptId,
              },
            },
          });
          return res.json({ success: true, bookmarked: false, message: "پرامپت از نشان‌شده‌ها حذف شد." });
        } else {
          await prisma.savedPrompt.create({
            data: {
              userId,
              promptId,
            },
          });
          return res.json({ success: true, bookmarked: true, message: "پرامپت به نشان‌شده‌ها اضافه شد." });
        }
      } else {
        const db = readDB();
        if (!db.savedPrompts) db.savedPrompts = [];

        const index = db.savedPrompts.findIndex(
          (sp: any) => sp.userId === userId && sp.promptId === promptId
        );

        if (index > -1) {
          db.savedPrompts.splice(index, 1);
          writeDB(db);
          return res.json({ success: true, bookmarked: false, message: "پرامپت از نشان‌شده‌ها حذف شد." });
        } else {
          db.savedPrompts.push({
            id: "sp_" + Date.now(),
            userId,
            promptId,
            createdAt: new Date().toISOString(),
          });
          writeDB(db);
          return res.json({ success: true, bookmarked: true, message: "پرامپت به نشان‌شده‌ها اضافه شد." });
        }
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Get User Dashboard data (all saved / bookmarked prompts)
  app.get("/api/user/dashboard", userAuth, async (req, res) => {
    const userId = (req as any).user.id;

    try {
      if (prisma) {
        const savedPrompts = await prisma.savedPrompt.findMany({
          where: { userId },
          include: {
            prompt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const bookmarks = savedPrompts.filter(sp => sp.prompt.isActive || isManager((req as any).user)).map((sp) => ({
          id: sp.id,
          promptId: sp.promptId,
          createdAt: sp.createdAt,
          prompt: sp.prompt,
        }));

        return res.json({ success: true, bookmarks });
      } else {
        const db = readDB();
        if (!db.savedPrompts) db.savedPrompts = [];

        const userSaved = db.savedPrompts.filter((sp: any) => sp.userId === userId);
        userSaved.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const bookmarks = userSaved.map((sp: any) => {
          const prompt = db.prompts.find((p: any) => p.id === sp.promptId);
          return {
            id: sp.id,
            promptId: sp.promptId,
            createdAt: sp.createdAt,
            prompt,
          };
        }).filter((sp: any) => sp.prompt && (sp.prompt.isActive || isManager((req as any).user)));

        return res.json({ success: true, bookmarks });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Update User Profile
  app.put("/api/user/profile", userAuth, async (req, res) => {
    const userId = (req as any).user.id;
    const { name, email } = req.body;
    if (email !== undefined && email !== (req as any).user.email) return res.status(400).json({ success: false, message: "تغییر ایمیل نیازمند تایید است." });

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "نام و نام خانوادگی الزامی است." });
    }

    try {
      let updatedUser: any = null;
      const cleanName = name.trim();
      const cleanEmail = (req as any).user.email || null;

      if (prisma && !userId.startsWith("google_mock") && !userId.startsWith("mock")) {
        try {
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              name: cleanName,
              ...(cleanEmail ? { email: cleanEmail } : {}),
            },
          });
        } catch (dbErr: any) {
          console.warn("[Prisma user profile update]:", dbErr);
        }
      }

      // Update in JSON DB as well or as fallback
      const db = readDB();
      if (!db.users) db.users = [];
      const userIdx = db.users.findIndex((u: any) => u.id === userId);
      if (userIdx !== -1) {
        db.users[userIdx].name = cleanName;
        if (cleanEmail) db.users[userIdx].email = cleanEmail;
        writeDB(db);
        if (!updatedUser) {
          updatedUser = db.users[userIdx];
        }
      }

      const finalUser = {
        id: userId,
        name: cleanName,
        email: cleanEmail || updatedUser?.email || (req as any).user.email || null,
        phone: updatedUser?.phone || (req as any).user.phone || null,
        role: updatedUser?.role?.toLowerCase() || (req as any).user.role?.toLowerCase() || "user",
      };

      // Refresh cookie session token with updated info
      const token = jwt.sign(
        {
          id: finalUser.id,
          phone: finalUser.phone,
          email: finalUser.email,
          role: finalUser.role,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("promty_session", token, {
        httpOnly: true,
        secure: operationalProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ 
        success: true, 
        message: "پروفایل با موفقیت بروزرسانی شد.",
        token,
        user: finalUser,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Get Category list
  app.get("/api/categories", (req, res) => {
    const db = readDB();
    res.json({ categories: db.categories });
  });

  // API - Get Facets for progressive filtering
  app.get("/api/facets", async (req, res) => {
    try {
      const { q, tool, domain, intent, difficulty, language } = req.query;
      const filters = {
        q: typeof q === "string" ? q : undefined,
        tool: typeof tool === "string" ? tool : undefined,
        domain: typeof domain === "string" ? domain : undefined,
        intent: typeof intent === "string" ? intent : undefined,
        difficulty: typeof difficulty === "string" ? difficulty : undefined,
        language: typeof language === "string" ? language : undefined,
      };
      const facetsResult = await promptRepo.getFacets(filters);
      res.json({ success: true, facets: facetsResult });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Get Prompt list (all active, or with category filter)
  app.get("/api/prompts", async (req, res) => {
    try {
      const { category, page: pageQuery, limit: limitQuery } = req.query;
      
      const page = Math.max(1, Math.min(100000, parseInt(String(pageQuery), 10) || 1));
      const limit = Math.max(1, Math.min(100, parseInt(String(limitQuery), 10) || 20));

      // Non-admin users should only see active prompts by default
      const isAdmin = isManager((req as any).user);

      const filters: any = {
        page,
        limit,
      };
      if (!isAdmin) {
        filters.isActive = true;
      }
      if (category && typeof category === "string") {
        filters.category = category;
      }

      for (const key of ["q", "tool", "domain", "intent", "difficulty", "language", "sort"]) {
        if (typeof req.query[key] === "string") filters[key] = String(req.query[key]).slice(0, 300);
      }
      if (isAdmin && ["true", "false"].includes(String(req.query.isActive))) filters.isActive = req.query.isActive === "true";
      const { prompts, totalCount } = await promptRepo.getAll(filters);

      // Compute facets correctly across all matching records (without pagination limit)
      const allMatchingFilters = { ...filters };
      delete allMatchingFilters.page;
      delete allMatchingFilters.limit;
      const { prompts: allMatchingPrompts } = await promptRepo.getAll(allMatchingFilters);

      const facets = {
        tools: {} as Record<string, number>,
        intents: {} as Record<string, number>,
        domains: {} as Record<string, number>,
        difficulties: {} as Record<string, number>,
        languages: {} as Record<string, number>
      };

      for (const p of allMatchingPrompts) {
        if (p.tools && Array.isArray(p.tools)) {
          for (const t of p.tools) {
            if (t) {
              const key = t.toLowerCase();
              facets.tools[key] = (facets.tools[key] || 0) + 1;
            }
          }
        }
        if (p.intent) {
          const key = p.intent.toLowerCase();
          facets.intents[key] = (facets.intents[key] || 0) + 1;
        }
        if (p.domains && Array.isArray(p.domains)) {
          for (const d of p.domains) {
            if (d) {
              const key = d.toLowerCase();
              facets.domains[key] = (facets.domains[key] || 0) + 1;
            }
          }
        }
        if (p.difficulty) {
          const key = p.difficulty.toLowerCase();
          facets.difficulties[key] = (facets.difficulties[key] || 0) + 1;
        }
        if (p.language) {
          const key = p.language.toLowerCase();
          facets.languages[key] = (facets.languages[key] || 0) + 1;
        }
      }

      res.json({
        success: true,
        data: prompts,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        facets
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Get Stats (Admin dashboard)
  app.get("/api/stats", adminAuth, async (req, res) => {
    try {
      const stats = await promptRepo.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Get one Prompt by ID
  app.get("/api/prompts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const prompt = await promptRepo.getById(id);

      if (!prompt) {
        return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
      }

      res.json({ prompt });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Track copy count for a prompt
  app.post("/api/prompts/:id/track-copy", async (req, res) => {
    try {
      const { id } = req.params;
      const prompt = await promptRepo.getById(id);
      if (!prompt) {
        return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
      }
      await promptRepo.incrementUsageCount(id);
      const updatedPrompt = await promptRepo.getById(id);
      res.json({ success: true, usageCount: updatedPrompt ? updatedPrompt.usageCount : prompt.usageCount + 1 });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Create Prompt (admin only)
  app.post("/api/prompts", adminAuth, async (req, res) => {
    try {
      const promptData = req.body;
      if (!promptData.title || !promptData.body) {
        return res.status(400).json({ success: false, message: "فیلدهای اجباری ارسال نشده‌اند." });
      }

      const created = await promptRepo.create(promptData);
      res.status(201).json({ success: true, prompt: created });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Submit Prompt publicly (non-admin contribution)
  app.post("/api/prompts/submit", async (req, res) => {
    try {
      const promptData = req.body;
      if (!promptData.title || !promptData.body) {
        return res.status(400).json({ success: false, message: "عنوان و متن پرامپت الزامی هستند." });
      }

      // Must be approved by admin, so isActive is false
      promptData.isActive = false;

      const created = await promptRepo.create(promptData);
      res.status(201).json({ success: true, message: "پرامپت شما با موفقیت ثبت شد و پس از تایید مدیر منتشر خواهد شد.", prompt: created });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Public endpoint to analyze raw prompt source (Submission Assistance)
  app.post("/api/prompts/analyze-public", async (req, res) => {
    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ success: false, message: "متن پرامپت ارسال نشده است." });
    }

    const db = readDB();
    const settings = db.settings;
    const geminiKey = (settings?.geminiApiKey || "").trim();

    try {
      if (geminiKey.length > 0) {
        // We have a Gemini API key! Let's use Gemini to parse it.
        const { GoogleGenAI, Type } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const promptToModel = `Analyze the following raw prompt text and convert it into a structured JSON for public contribution. 
        Return fields in Persian (فارسی). 
        Determine appropriate fields:
        1. title: A short concise Persian title (3-5 words).
        2. description: A helpful 1-sentence Persian description guiding the user.
        3. tool: Primary AI tool (choose exactly one of: ChatGPT, Claude, Gemini, Grok, Midjourney, Flux, Stable Diffusion).
        4. domain: Primary domain (choose exactly one of: Business, Marketing, Education, Health, Programming, Design, AI, Travel).
        5. difficulty: (choose exactly one of: Beginner, Intermediate, Advanced, Expert).
        6. tags: Array of 3-5 keywords.

        Raw Prompt Text:
        """
        ${body}
        """`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: promptToModel,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                tool: { type: Type.STRING, enum: ["ChatGPT", "Claude", "Gemini", "Grok", "Midjourney", "Flux", "Stable Diffusion"] },
                domain: { type: Type.STRING, enum: ["Business", "Marketing", "Education", "Health", "Programming", "Design", "AI", "Travel"] },
                difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced", "Expert"] },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "description", "tool", "domain", "difficulty", "tags"]
            }
          }
        });

        const textResult = response.text || "{}";
        const structured = JSON.parse(textResult.trim());
        return res.json({ success: true, data: structured });
      }
    } catch (err) {
      console.warn("Gemini public analysis failed, falling back to heuristics:", err);
    }

    // Heuristics fallback: extremely fast, zero-delay, zero-error
    const text = body.toLowerCase();
    let tool = "ChatGPT";
    let domain = "Marketing";
    let difficulty = "Beginner";
    let tags = ["هوش_مصنوعی", "پرامپت"];
    let title = "پرامپت هوشمند کاربردی";
    let description = "پرامپت شخصی‌سازی شده برای تسریع در روند کاری روزمره.";

    if (text.includes("midjourney") || text.includes("mj ") || text.includes("--ar") || text.includes("photograph")) {
      tool = "Midjourney";
      domain = "Design";
      tags = ["طراحی", "تصویرسازی", "هنر", "midjourney"];
      title = "خلق تصویر هنری مینی‌مال";
      description = "تولید تصاویر خلاقانه هنری و عکاسی حرفه‌ای با تنظیمات پیشرفته.";
    } else if (text.includes("flux") || text.includes("fole")) {
      tool = "Flux";
      domain = "Design";
      tags = ["طراحی", "flux", "تصویرساز"];
      title = "تصویرسازی با کیفیت بالا با Flux";
      description = "تولید تصاویر با نورپردازی فوق‌العاده و وضوح بالا با هوش مصنوعی Flux.";
    } else if (text.includes("code") || text.includes("react") || text.includes("typescript") || text.includes("python") || text.includes("function")) {
      tool = "ChatGPT";
      domain = "Programming";
      difficulty = "Intermediate";
      tags = ["برنامه‌نویسی", "توسعه_وب", "کدنویسی"];
      title = "کدنویسی هوشمند و حل مسئله";
      description = "بهینه‌سازی کدها و ایجاد توابع تمیز به صورت گام‌به‌گام.";
    } else if (text.includes("seo") || text.includes("marketing") || text.includes("تبلیغ") || text.includes("مشتری")) {
      tool = "Claude";
      domain = "Marketing";
      tags = ["بازاریابی", "سئو", "دیجیتال_مارکتینگ"];
      title = "استراتژی بازاریابی و تولید سرنخ";
      description = "کمپین‌نویسی و سناریوپردازی تبلیغاتی منطبق با ترندهای روز.";
    }

    // Try to extract some title from first line
    const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines[0].length < 50 && lines[0].length > 5) {
      title = lines[0].replace(/[#*`[\]]/g, "").trim();
    }

    res.json({
      success: true,
      data: { title, description, tool, domain, difficulty, tags }
    });
  });

  // API - Update Prompt (admin only)
  app.put("/api/prompts/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const prompt = await promptRepo.getById(id);
      if (!prompt) {
        return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
      }

      const updated = await promptRepo.update(id, updates);
      res.json({ success: true, prompt: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Delete Prompt (admin only)
  app.delete("/api/prompts/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await promptRepo.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
      }
      res.json({ success: true, message: "پرامپت با موفقیت حذف شد." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Get Settings (admin only)
  app.get("/api/settings", adminAuth, (req, res) => {
    const db = readDB();
    const s: DBSettings = (db.settings || {}) as DBSettings;
    res.json({
      settings: {
        ...s,
        siteTitle: s.siteTitle || "پرامپتی | Promty",
        siteSubtitle: s.siteSubtitle || "موتور شخصی‌سازی و پرامپت مهندسی",
        heroTitle: s.heroTitle || "قلب تپنده نوآوری با پرامپتی",
        heroDescription: s.heroDescription || "مرجع جستجو و شخصی‌سازی پرامپت. با جستجو، فیلترها، ابزارها، قالب‌های خروجی و دسته‌بندی‌های معنایی را با یک کلیک کاوش کنید.",
        footerAbout: s.footerAbout || "پرامپتی مرجع تخصصی مهندسی پرامپت و گراف دانش هوش مصنوعی در ایران است. ما به شما کمک می‌کنیم تا با دقیق‌ترین پرامپت‌ها، به بهترین نتایج دست یابید.",
        footerCopyright: s.footerCopyright || "تمامی حقوق مادی و معنوی برای پرامپتی محفوظ است.",
        siteLogo: s.siteLogo || "",
        aiTimeoutSeconds: typeof s.aiTimeoutSeconds === "number" ? s.aiTimeoutSeconds : 60,
      }
    });
  });

  // API - Update Settings (admin only)
  app.post("/api/settings", adminAuth, (req, res) => {
    const {
      n8nAnalyzeWebhook,
      n8nRefineWebhook,
      geminiApiKey,
      openaiApiKey,
      siteTitle,
      siteSubtitle,
      heroTitle,
      heroDescription,
      footerAbout,
      footerCopyright,
      siteLogo,
      aiTimeoutSeconds,
    } = req.body;

    const db = readDB();
    const prev: DBSettings = (db.settings || {}) as DBSettings;

    const timeoutParsed = Number(aiTimeoutSeconds);
    const cleanTimeout = !isNaN(timeoutParsed) ? Math.max(10, Math.min(300, timeoutParsed)) : (prev.aiTimeoutSeconds || 60);

    db.settings = {
      ...prev,
      n8nWebhookUrl: n8nRefineWebhook !== undefined ? (n8nRefineWebhook || "") : (prev.n8nRefineWebhook || prev.n8nWebhookUrl || ""),
      n8nAnalyzeWebhook: n8nAnalyzeWebhook !== undefined ? (n8nAnalyzeWebhook || "") : (prev.n8nAnalyzeWebhook || ""),
      n8nRefineWebhook: n8nRefineWebhook !== undefined ? (n8nRefineWebhook || "") : (prev.n8nRefineWebhook || ""),
      geminiApiKey: geminiApiKey !== undefined ? (geminiApiKey || "") : (prev.geminiApiKey || ""),
      openaiApiKey: openaiApiKey !== undefined ? (openaiApiKey || "") : (prev.openaiApiKey || ""),
      siteTitle: siteTitle !== undefined ? (siteTitle || "پرامپتی | Promty") : (prev.siteTitle || "پرامپتی | Promty"),
      siteSubtitle: siteSubtitle !== undefined ? (siteSubtitle || "") : (prev.siteSubtitle || "موتور شخصی‌سازی و پرامپت مهندسی"),
      heroTitle: heroTitle !== undefined ? (heroTitle || "") : (prev.heroTitle || "قلب تپنده نوآوری با پرامپتی"),
      heroDescription: heroDescription !== undefined ? (heroDescription || "") : (prev.heroDescription || "مرجع جستجو و شخصی‌سازی پرامپت. با جستجو، فیلترها، ابزارها، قالب‌های خروجی و دسته‌بندی‌های معنایی را با یک کلیک کاوش کنید."),
      footerAbout: footerAbout !== undefined ? (footerAbout || "") : (prev.footerAbout || "پرامپتی مرجع تخصصی مهندسی پرامپت و گراف دانش هوش مصنوعی در ایران است. ما به شما کمک می‌کنیم تا با دقیق‌ترین پرامپت‌ها، به بهترین نتایج دست یابید."),
      footerCopyright: footerCopyright !== undefined ? (footerCopyright || "") : (prev.footerCopyright || "تمامی حقوق مادی و معنوی برای پرامپتی محفوظ است."),
      siteLogo: siteLogo !== undefined ? siteLogo : (prev.siteLogo || ""),
      aiTimeoutSeconds: cleanTimeout,
    };
    writeDB(db);
    res.json({ success: true, settings: db.settings });
  });

  // API - Upload Logo for Platform Branding (admin only)
  app.post("/api/admin/settings/logo", adminAuth, upload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "فایل لوگو ارسال نشده است." });
      }

      const image = sharp(req.file.buffer, { limitInputPixels: 20000000 });
      const meta = await image.metadata();
      if (!["png", "jpeg", "webp"].includes(meta.format || "") || (meta.pages || 1) !== 1 || !meta.width || !meta.height || meta.width > 8192 || meta.height > 8192) return res.status(400).json({ success: false, message: "لوگو باید تصویر PNG، JPEG یا WebP معتبر باشد." });
      const encoded = await image.webp({ quality: 90 }).toBuffer();
      const brandDir = path.join(process.cwd(), "dl", "brand");
      fs.mkdirSync(brandDir, { recursive: true });
      fs.writeFileSync(path.join(brandDir, "logo.webp"), encoded);
      const logoUrl = "/dl/brand/logo.webp?v=" + Date.now();

      const db = readDB();
      if (!db.settings) db.settings = {} as any;
      db.settings.siteLogo = logoUrl;
      writeDB(db);

      return res.json({ success: true, siteLogo: logoUrl, message: "لوگوی پلتفرم با موفقیت ذخیره شد." });
    } catch (err: any) {
      console.error("[Logo Upload Error]:", err);
      return res.status(500).json({ success: false, message: "خطا در آپلود لوگو: " + err.message });
    }
  });

  // API - Get Public settings to know branding and configuration
  app.get("/api/settings/public", (req, res) => {
    const db = readDB();
    const s: DBSettings = (db.settings || {}) as DBSettings;
    res.json({
      isWebhookConfigured: !!(s.n8nRefineWebhook || s.n8nWebhookUrl),
      siteTitle: s.siteTitle || "پرامپتی | Promty",
      siteSubtitle: s.siteSubtitle || "موتور شخصی‌سازی و پرامپت مهندسی",
      heroTitle: s.heroTitle || "قلب تپنده نوآوری با پرامپتی",
      heroDescription: s.heroDescription || "مرجع جستجو و شخصی‌سازی پرامپت. با جستجو، فیلترها، ابزارها، قالب‌های خروجی و دسته‌بندی‌های معنایی را با یک کلیک کاوش کنید.",
      footerAbout: s.footerAbout || "پرامپتی مرجع تخصصی مهندسی پرامپت و گراف دانش هوش مصنوعی در ایران است. ما به شما کمک می‌کنیم تا با دقیق‌ترین پرامپت‌ها، به بهترین نتایج دست یابید.",
      footerCopyright: s.footerCopyright || "تمامی حقوق مادی و معنوی برای پرامپتی محفوظ است.",
      siteLogo: s.siteLogo || "",
      aiTimeoutSeconds: typeof s.aiTimeoutSeconds === "number" ? s.aiTimeoutSeconds : 60,
    });
  });

  // API - Analyze Raw Prompt Source using n8n Webhook or Gemini API direct fallback
  app.post("/api/analyze-source", adminAuth, async (req, res) => {
    const { sourceText } = req.body;
    if (!sourceText) {
      return res.status(400).json({ success: false, message: "متن خام پرامپت ارسال نشده است." });
    }

    const db = readDB();
    const settings = db.settings;
    
    // Strict validation
    const analyzeUrl = (settings?.n8nAnalyzeWebhook || "").trim();
    const geminiKey = (settings?.geminiApiKey || "").trim();

    try {
      // Dynamic Taxonomies fetching
      const terms = await taxonomyRepo.getAll();
      
      const intents = terms.filter((t: any) => t.type?.toLowerCase() === "intent").map((t: any) => t.slug);
      const intentList = intents.length > 0 ? intents : [...INTENT_OPTIONS];
      
      const domains = terms.filter((t: any) => t.type?.toLowerCase() === "domain").map((t: any) => t.slug);
      const domainList = domains.length > 0 ? domains : [...DOMAIN_OPTIONS];
      
      const tools = terms.filter((t: any) => t.type?.toLowerCase() === "tool").map((t: any) => t.slug);
      const toolList = tools.length > 0 ? tools : [...TOOL_OPTIONS];
      
      const languages = terms.filter((t: any) => t.type?.toLowerCase() === "language").map((t: any) => t.slug);
      const languageList = languages.length > 0 ? languages : [...LANGUAGE_OPTIONS];
      
      const difficulties = terms.filter((t: any) => t.type?.toLowerCase() === "difficulty").map((t: any) => t.slug);
      const difficultyList = difficulties.length > 0 ? difficulties : [...DIFFICULTY_OPTIONS];
      
      const outputFormats = terms.filter((t: any) => t.type?.toLowerCase() === "outputformat").map((t: any) => t.slug);
      const outputFormatList = outputFormats.length > 0 ? outputFormats : [...OUTPUT_FORMAT_OPTIONS];

      if (analyzeUrl.length > 0) {
        // Fetch active taxonomies from the database for n8n Webhook context
        const allTaxonomies = await taxonomyRepo.getAll();
        const activeTaxonomies = allTaxonomies.filter((t: any) => t.status === "active");

        const tIntents = activeTaxonomies.filter(t => t.type?.toLowerCase() === "intent").map(t => t.slug);
        const intentsStr = tIntents.length > 0 ? tIntents.join(", ") : INTENT_OPTIONS.join(", ");

        const tDomains = activeTaxonomies.filter(t => t.type?.toLowerCase() === "domain").map(t => t.slug);
        const domainsStr = tDomains.length > 0 ? tDomains.join(", ") : DOMAIN_OPTIONS.join(", ");

        const tTools = activeTaxonomies.filter(t => t.type?.toLowerCase() === "tool").map(t => t.slug);
        const toolsStr = tTools.length > 0 ? tTools.join(", ") : TOOL_OPTIONS.join(", ");

        const tLanguages = activeTaxonomies.filter(t => t.type?.toLowerCase() === "language").map(t => t.slug);
        const languagesStr = tLanguages.length > 0 ? tLanguages.join(", ") : LANGUAGE_OPTIONS.join(", ");

        const tDifficulties = activeTaxonomies.filter(t => t.type?.toLowerCase() === "difficulty").map(t => t.slug);
        const difficultiesStr = tDifficulties.length > 0 ? tDifficulties.join(", ") : DIFFICULTY_OPTIONS.join(", ");

        const tOutputFormats = activeTaxonomies.filter(t => t.type?.toLowerCase() === "outputformat").map(t => t.slug);
        const outputFormatsStr = tOutputFormats.length > 0 ? tOutputFormats.join(", ") : OUTPUT_FORMAT_OPTIONS.join(", ");

        // Send raw text and allowed taxonomies to n8n Webhook with configurable timeout
        const timeoutSeconds = Math.max(10, Math.min(300, Number(settings?.aiTimeoutSeconds) || 60));
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeoutSeconds * 1000);

        let response: Response;
        try {
          response = await fetch(analyzeUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              sourceText,
              allowedTaxonomies: {
                intents: intentsStr,
                domains: domainsStr,
                tools: toolsStr,
                languages: languagesStr,
                difficulties: difficultiesStr,
                outputFormats: outputFormatsStr
              },
              action: "analyze_source",
              timestamp: new Date().toISOString()
            }),
            signal: abortController.signal
          });
        } catch (fetchErr: any) {
          if (fetchErr.name === "AbortError" || fetchErr.message?.includes("aborted")) {
            throw new Error(`زمان پاسخگویی ایجنت هوش مصنوعی بیش از ${timeoutSeconds} ثانیه به طول انجامید (Timeout). لطفاً وب‌هوک n8n را بررسی نمایید.`);
          }
          throw fetchErr;
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          throw new Error(`خطا در ارتباط با سرویس n8n: وضعیت ${response.status}`);
        }

        const responseData = await response.json();
        
        let structuredJSON = responseData;
        if (Array.isArray(responseData) && responseData.length > 0) {
          structuredJSON = responseData[0];
        }
        
        if (structuredJSON.output && typeof structuredJSON.output === "object") {
          structuredJSON = structuredJSON.output;
        } else if (structuredJSON.output && typeof structuredJSON.output === "string") {
           try { structuredJSON = JSON.parse(structuredJSON.output); } catch(e) {}
        } else if (structuredJSON.text && typeof structuredJSON.text === "string") {
           try { structuredJSON = JSON.parse(structuredJSON.text); } catch(e) {}
        }

        // Soft-normalize in case the n8n agent still returns legacy singular fields
        if (structuredJSON && typeof structuredJSON === "object") {
          if (!Array.isArray(structuredJSON.tools) && structuredJSON.tool) {
            structuredJSON.tools = [structuredJSON.tool];
          }
          if (!Array.isArray(structuredJSON.domains) && structuredJSON.domain) {
            structuredJSON.domains = [structuredJSON.domain];
          }
          if (!Array.isArray(structuredJSON.outputFormats) && structuredJSON.outputFormat) {
            structuredJSON.outputFormats = [structuredJSON.outputFormat];
          }
        }

        if (structuredJSON && structuredJSON.body) {
          structuredJSON.body = structuredJSON.body.replace(/\[\[(.*?)\]\]/g, "{{$1}}");
        }

        return res.json({
          success: true,
          data: structuredJSON
        });

      } else if (geminiKey.length > 0) {
        // Direct Gemini API fallback
        const { GoogleGenAI, Type } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const promptToModel = `Analyze the following raw prompt text and convert it into a structured, highly optimized JSON format according to these rules:
1. Translate or keep title, description, and UI field labels in Persian (فارسی).
2. Identify variable parts in the prompt (e.g., product names, colors, sizes) and replace them with {{placeholder_key}}. Placeholder keys MUST be lowercase ASCII snake_case (letters, digits, underscore only — matching regex ^[a-z][a-z0-9_]*$), because the rendering engine only recognizes \\w+ inside {{...}}.
3. For every {{placeholder_key}} generated, create a corresponding FieldSchema object to determine how the user will interact with it in the UI.
4. UI Field Types allowed: ${FIELD_TYPE_OPTIONS.join(", ")}. If select/radio/multiselect is chosen, you must supply options in Persian. If slider is chosen, specify min and max.
5. Categorize the prompt using ONLY the following metadata options (do not invent new values):
   - برای فیلد Intent فقط از این لیست استفاده کن: [${intentList.join(", ")}]
   - برای فیلد Domains فقط از این لیست استفاده کن: [${domainList.join(", ")}]
   - برای فیلد Tools فقط از این لیست استفاده کن: [${toolList.join(", ")}]
   - برای فیلد Language فقط از این لیست استفاده کن: [${languageList.join(", ")}]
   - برای فیلد Difficulty فقط از این لیست استفاده کن: [${difficultyList.join(", ")}]
   - برای فیلد Output Formats فقط از این لیست استفاده کن: [${outputFormatList.join(", ")}]
6. Set the final optimized body with {{placeholders}} inside.

Raw Prompt Text to Analyze:
"""
${sourceText}
"""`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: promptToModel,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                intent: { type: Type.STRING, enum: intentList },
                domains: { type: Type.ARRAY, items: { type: Type.STRING, enum: domainList } },
                tools: { type: Type.ARRAY, items: { type: Type.STRING, enum: toolList } },
                task: { type: Type.STRING },
                language: { type: Type.STRING, enum: languageList },
                difficulty: { type: Type.STRING, enum: difficultyList },
                outputFormats: { type: Type.ARRAY, items: { type: Type.STRING, enum: outputFormatList } },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                body: { type: Type.STRING },
                fieldsSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      label: { type: Type.STRING },
                      type: { type: Type.STRING, enum: [...FIELD_TYPE_OPTIONS] },
                      placeholder: { type: Type.STRING },
                      required: { type: Type.BOOLEAN },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      min: { type: Type.INTEGER },
                      max: { type: Type.INTEGER }
                    },
                    required: ["key", "label", "type"]
                  }
                }
              },
              required: ["title", "description", "intent", "domains", "tools", "task", "language", "difficulty", "outputFormats", "tags", "body", "fieldsSchema"]
            }
          }
        });

        const textResult = response.text || "{}";
        const structuredJSON = JSON.parse(textResult.trim());

        if (structuredJSON && structuredJSON.body) {
          structuredJSON.body = structuredJSON.body.replace(/\[\[(.*?)\]\]/g, "{{$1}}");
        }

        return res.json({ success: true, data: structuredJSON });

      } else {
        return res.status(400).json({ 
          success: false, 
          message: "تنظیمات هوش مصنوعی خالی است. لطفاً آدرس وبهوک n8n یا کلید Gemini را وارد کنید." 
        });
      }

    } catch (err: any) {
      console.error("Source analysis failed:", err);
      return res.status(500).json({ success: false, message: "ارتباط با هوش مصنوعی با خطا مواجه شد: " + err.message });
    }
  });

  // API - Refine Prompt with n8n Webhook or high fidelity fallback
  app.post("/api/refine-prompt", async (req, res) => {
    const { promptId, originalPrompt } = req.body;
    if (!originalPrompt) {
      return res.status(400).json({ success: false, message: "متن پرامپت ارسال نشده است." });
    }

    const db = readDB();
    const n8nUrl = (db.settings?.n8nRefineWebhook || db.settings?.n8nWebhookUrl || "").trim();

    // High fidelity template-based or local refinement fallback
    const mockRefine = (text: string) => text;

    if (n8nUrl.length === 0) {
      return res.json({
        success: true,
        refinedPrompt: mockRefine(originalPrompt),
        fallbackUsed: true,
        message: "تنظیمات وبهوک n8n خالی است. متن بدون تغییر بازگردانده شد."
      });
    }

    const timeoutSeconds = Math.max(10, Math.min(300, Number(db.settings?.aiTimeoutSeconds) || 60));
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeoutSeconds * 1000);

    try {
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          promptId,
          originalPrompt,
          action: "refine_prompt",
          timestamp: new Date().toISOString()
        }),
        signal: abortController.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`مشکل در اتصال به منبع وب‌هوک کلاس n8n: وضعیت ${response.status}`);
      }

      const responseData = await response.json();
      let refinedPrompt = "";

      if (typeof responseData === "string") {
        refinedPrompt = responseData;
      } else if (Array.isArray(responseData) && responseData.length > 0) {
        const item = responseData[0];
        refinedPrompt = item.refinedPrompt || item.output || item.text || JSON.stringify(item);
      } else if (responseData && typeof responseData === "object") {
        refinedPrompt = responseData.refinedPrompt || responseData.output || responseData.text || responseData.refined || JSON.stringify(responseData);
      }

      if (!refinedPrompt) {
        throw new Error("پاسخ وب‌هوک n8n خالی یا فاقد فیلد متنی بود.");
      }

      return res.json({
         success: true,
         refinedPrompt,
         fallbackUsed: false
      });

    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === "AbortError" || err.message?.includes("aborted");
      const errMsg = isTimeout
        ? `زمان پاسخگویی ایجنت هوش مصنوعی بیش از ${timeoutSeconds} ثانیه به طول انجامید (Timeout).`
        : err.message;
      console.warn("n8n call failed, falling back gracefully:", err);
      return res.json({
        success: true,
        refinedPrompt: mockRefine(originalPrompt),
        fallbackUsed: true,
        message: `خطا در فراخوانی وب‌هوک n8n (${errMsg}). متن اصلی بدون تغییر بازگردانده شد.`
      });
    }
  });

  // API - Render Prompt (substitutes values dynamically)
  app.post("/api/render-prompt", async (req, res) => {
    try {
      const { promptId, values } = req.body;
      if (!promptId || !values) {
        return res.status(400).json({ success: false, message: "اطلاعات ناکافی" });
      }

      const prompt = await promptRepo.getById(promptId);

      if (!prompt) {
        return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
      }

      // Substitute values using regex
      const rendered = prompt.body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return values[key] !== undefined && values[key] !== "" ? values[key] : match;
      });

      res.json({ rendered });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Taxonomy repository is instantiated at the beginning of startServer

  // API - Get Taxonomy Terms
  app.get("/api/taxonomies", async (req, res) => {
    try {
      const { type } = req.query;
      const terms = await taxonomyRepo.getAll(type as any);
      res.json({ success: true, terms });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Create Taxonomy Term (Admin only)
  app.post("/api/taxonomies", adminAuth, async (req, res) => {
    try {
      const { type, slug, titleEn, titleFa, descriptionFa, descriptionEn, aliases, synonyms, popularity } = req.body;
      if (!type || !slug || !titleEn || !titleFa) {
        return res.status(400).json({ success: false, message: "اطلاعات فیلدهای اجباری فرستاده نشده است." });
      }

      const existing = await taxonomyRepo.getBySlug(slug, type);
      if (existing) {
        return res.status(400).json({ success: false, message: "این اسلاگ در این طبقه‌بندی قبلا ثبت شده است." });
      }

      const created = await taxonomyRepo.create({
        type,
        slug,
        titleEn,
        titleFa,
        descriptionFa: descriptionFa || "",
        descriptionEn: descriptionEn || "",
        aliases: aliases || [],
        synonyms: synonyms || [],
        popularity: Number(popularity) || 0.5,
        status: "active"
      });

      res.status(201).json({ success: true, term: created });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Update Taxonomy Term (Admin only)
  app.put("/api/taxonomies/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await taxonomyRepo.update(id, updates);
      res.json({ success: true, term: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Delete Taxonomy Term (Admin only)
  app.delete("/api/taxonomies/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await taxonomyRepo.delete(id);
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Relationship repository is instantiated at the beginning of startServer

  // API - Get All Relationships (Admin only)
  app.get("/api/relationships", adminAuth, async (req, res) => {
    try {
      const { entityId, entityType } = req.query;
      let list;
      if (entityId && entityType) {
        list = await relationshipRepo.getRelationships(entityId as string, entityType as any);
      } else {
        // Read full DB list
        const db = readDB();
        list = db.relationships || [];
      }
      res.json({ success: true, relationships: list });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Create Relationship (Admin only)
  app.post("/api/relationships", adminAuth, async (req, res) => {
    try {
      const { sourceId, sourceType, targetId, targetType, relationType, confidenceScore, priority, weight } = req.body;
      if (!sourceId || !sourceType || !targetId || !targetType || !relationType) {
        return res.status(400).json({ success: false, message: "فیلدهای اجباری ارسال نشده است." });
      }

      const created = await relationshipRepo.create({
        sourceId,
        sourceType,
        targetId,
        targetType,
        relationType,
        confidenceScore: confidenceScore !== undefined ? Number(confidenceScore) : 1.0,
        priority: priority !== undefined ? Number(priority) : 0,
        weight: weight !== undefined ? Number(weight) : 1.0,
        recommendationScore: 0,
        similarityScore: 0
      });

      res.status(201).json({ success: true, relationship: created });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Update Relationship Weights (Admin only)
  app.put("/api/relationships/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await relationshipRepo.updateWeights(id, updates);
      res.json({ success: true, relationship: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Delete Relationship (Admin only)
  app.delete("/api/relationships/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await relationshipRepo.delete(id);
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Universal Natural Language Search
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      const queryStr = typeof q === "string" ? q : "";
      
      // Non-admin users only search active prompts
      const isAdmin = isManager((req as any).user);

      const filters: any = {};
      if (!isAdmin) {
        filters.isActive = true;
      }

      const { prompts } = await promptRepo.getAll(filters);

      const searchResult = SearchService.search(prompts, queryStr);
      


      res.json({
        success: true,
        query: queryStr,
        ...searchResult,
        history: []
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Search history and trends
  app.get("/api/search/history", (req, res) => {
    res.json({
      success: true,
      history: [],
      trending: []
    });
  });

  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) return res.status(413).json({ success: false, message: "حجم یا تعداد فایل بیشتر از حد مجاز است." });
    next(err);
  });

  // Serve index.html with server-side injected SEO metadata
  app.get("*", async (req, res, next) => {
    // If it's an API route or static asset/file, let it pass through
    if (req.path.startsWith("/api") || req.path.includes(".")) {
      return next();
    }

    try {
      const isProd = process.env.NODE_ENV === "production";
      const indexPath = isProd 
        ? path.join(process.cwd(), "dist", "index.html")
        : path.join(process.cwd(), "index.html");

      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, "utf-8");
        
        // Fetch dynamic page SEO & Schema meta
        const metaTags = await getPageMetadata(req.path);
        
        // Remove standard title tag first if exists to prevent duplication
        html = html.replace(/<title>.*?<\/title>/gi, "");
        
        // Inject right before </head>
        html = html.replace("</head>", `${metaTags}\n  </head>`);
        
        if (res.locals.cspNonce) html = html.replace(/<script\b/g, `<script nonce="${res.locals.cspNonce}"`);
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("Content-Type", "text/html");
        return res.status(200).send(html);
      }
    } catch (err) {
      console.error("SEO Metadata Injection failed:", err);
    }
    next();
  });

  // Vite development integration or static files production build integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, process.env.HOST || "127.0.0.1", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start fullstack server:", err);
  process.exitCode = 1;
  if (prisma) void prisma.$disconnect();
  process.exitCode = 1;
});

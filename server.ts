import "dotenv/config";
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

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing. Stopping server...");
  process.exit(1);
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

let prisma: PrismaClient | null = null;
let promptRepo: IPromptRepository;
let taxonomyRepo: ITaxonomyRepository;
let relationshipRepo: IRelationshipRepository;

const FIELD_TYPE_OPTIONS = ["text", "textarea", "color", "select", "radio", "switch", "slider", "multiselect", "url"];
const INTENT_OPTIONS = ["Create", "Write", "Code", "Design", "Market", "Analyze", "Learn", "Automate", "Research", "Productivity"];
const DOMAIN_OPTIONS = ["Business", "Marketing", "Education", "Medical", "Health", "Legal", "Finance", "Programming", "Gaming", "Food", "Travel", "Architecture", "Photography", "Real Estate", "Sports", "AI", "Robotics", "Science", "Religion", "History"];
const TOOL_OPTIONS = ["ChatGPT", "Claude", "Gemini", "Grok", "Midjourney", "Flux", "Stable Diffusion", "Ideogram", "Veo", "Kling", "Runway", "ElevenLabs", "Suno", "n8n AI Agent"];
const LANGUAGE_OPTIONS = ["Persian", "English"];
const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const OUTPUT_FORMAT_OPTIONS = ["Text", "Markdown", "JSON", "CSV", "HTML", "CSS", "JavaScript", "Python", "React", "TypeScript", "SQL", "XML", "PDF", "Image", "Video", "Table", "Checklist", "Roadmap", "Presentation"];
const INDUSTRY_OPTIONS = ["Ecommerce", "Startup", "Healthcare", "Education", "Restaurant", "Construction", "Law", "Bank", "Crypto", "Fashion", "Fitness", "Agriculture", "Tourism", "Insurance", "NGO"];

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
  industry?: string;
  tags: string[];
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
}

interface DB {
  prompts: Prompt[];
  categories: { id: string; name: string; slug: string; icon: string }[];
  settings: DBSettings;
  relationships?: any[];
  taxonomies?: any[];
  presets?: any[];
  savedPrompts?: any[];
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
      siteTitle: "Promty.ir"
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
        intent: "Design",
        domains: ["Photography"],
        tools: ["Midjourney"],
        task: "Product Commercial Portrait",
        language: "Persian",
        difficulty: "Beginner",
        outputFormats: ["Presentation"],
        industry: "Ecommerce",
        tags: ["جواهرات", "تبلیغات", "Midjourney", "طلا"],
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
        intent: "Code",
        domains: ["Programming"],
        tools: ["ChatGPT"],
        task: "React Component Coding",
        language: "English",
        difficulty: "Intermediate",
        outputFormats: ["React"],
        industry: "Startup",
        tags: ["برنامه‌نویسی", "کد", "React", "Tailwind"],
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
        intent: "Create",
        domains: ["Marketing"],
        tools: ["Runway"],
        task: "Video Teaser Creation",
        language: "Persian",
        difficulty: "Advanced",
        outputFormats: ["Markdown"],
        industry: "Restaurant",
        tags: ["تیزر", "ویدیو", "Kling", "Sora", "اینستاگرام"],
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

async function seedDatabaseIfEmpty(prisma: PrismaClient | null) {
  if (!prisma) return;
  try {
    const count = await prisma.taxonomy.count();
    if (count === 0) {
      console.log("[DB] Taxonomy table is empty. Auto-seeding initial data...");
      const { defaultTaxonomies } = await import("./src/lib/defaultTaxonomies.ts");
      for (const item of defaultTaxonomies) {
        await prisma.taxonomy.create({
          data: {
            type: item.type,
            slug: item.slug,
            titleEn: item.titleEn,
            titleFa: item.titleFa,
            status: "active",
            popularity: 0.5
          }
        });
      }
      console.log("[DB] Auto-seeding completed successfully.");
    }
  } catch (error) {
    console.error("[DB] Auto-seeding failed:", error);
  }
}

// Check admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@promty.ir";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

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
    jsonLd = `<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>`;

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
    jsonLd = `<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>`;

  } else if (promptMatch) {
    const id = promptMatch[1];
    try {
      const prompt = await promptRepo.getById(id);
      if (prompt) {
        title = `${prompt.title} | قالب پرامپت آماده و شخصی‌سازی - Promty`;
        description = prompt.description || `دانلود، ویرایش و کپی سریع پرامپت مهندسی‌شده "${prompt.title}" مخصوص ${prompt.category || "هوش مصنوعی"} در وبسایت پرامپتی.`;
        if (prompt.sampleImage) {
          imageUrl = prompt.sampleImage;
        }

        // Schema Engine Injection
        // BreadcrumbList, SoftwareApplication/HowTo, and aggregateRating connected to database usageCount
        const ratingValue = 4.8;
        const reviewCount = Math.max(5, Math.floor((prompt.usageCount || 0) / 10) + 1);
        
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
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": ratingValue.toString(),
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": reviewCount.toString()
          }
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
          <script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>
          <script type="application/ld+json">${JSON.stringify(mainEntitySchema)}</script>
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
    jsonLd = `<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>`;
  }

  // Generate complete HTML meta chunk
  const metaHtml = `
    <!-- Custom Meta Tags injected dynamically -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    ${jsonLd}
  `;

  return metaHtml;
}

async function startServer() {
  const app = express();
  const PORT = 3005;

  const hasDbUrl = !!process.env.DATABASE_URL;

  if (hasDbUrl) {
    try {
      prisma = new PrismaClient();
      promptRepo = new PrismaPromptRepository(prisma);
      taxonomyRepo = new PrismaTaxonomyRepository(prisma);
      relationshipRepo = new PrismaRelationshipRepository(prisma);
      console.log("[DB] Using Prisma database backend.");
    } catch (dbError) {
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

  await seedDatabaseIfEmpty(prisma);

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

  app.use(express.json());
  app.use(cookieParser());

  // Serve processed media uploads with 1-month Cache-Control
  app.use("/dl", express.static(path.join(process.cwd(), "dl"), { maxAge: "30d" }));

  const upload = multer({ storage: multer.memoryStorage() });

  // API - Process and upload media cover/gallery
  app.post("/api/upload/:promptId", upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "gallery", maxCount: 15 }
  ]), async (req, res) => {
    try {
      const { promptId } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      const coverFile = files?.["cover"]?.[0];
      const galleryFiles = files?.["gallery"] || [];

      if (!coverFile && galleryFiles.length === 0) {
        return res.status(400).json({ success: false, message: "هیچ فایلی برای آپلود دریافت نشد." });
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

  // API - Auth Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { id: "admin_static", email: ADMIN_EMAIL, role: "admin" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("promty_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        token, // Backwards compatibility for old clients if any
        user: { email: ADMIN_EMAIL, role: "admin" }
      });
    }
    return res.status(401).json({ success: false, message: "ایمیل یا رمز عبور اشتباه است." });
  });

  // API - Auth Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("promty_session", {
      httpOnly: true,
      secure: true,
      sameSite: "none"
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

      const { email, name, picture } = payload;

      let user = null;
      if (prisma) {
        user = await prisma.user.findUnique({
          where: { email: email },
        });

        if (!user) {
          const role = email === ADMIN_EMAIL ? "ADMIN" : "USER";
          user = await prisma.user.create({
            data: {
              email,
              name,
              avatar: picture,
              role,
            },
          });
        }
      } else {
        user = {
          id: "google_mock_" + Date.now(),
          email,
          name,
          avatar: picture,
          role: email === ADMIN_EMAIL ? "ADMIN" : "USER",
        };
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role === "ADMIN" ? "admin" : "user" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("promty_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role.toLowerCase() },
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
    const token = req.cookies.promty_session;
    if (!token) {
      return res.json({ success: false, user: null });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded) {
        return res.json({ success: false, user: null });
      }

      let user = null;
      if (prisma && decoded.id && !decoded.id.startsWith("google_mock") && !decoded.id.startsWith("mock")) {
        user = await prisma.user.findUnique({
          where: { id: decoded.id },
        });
      }

      if (!user) {
        user = {
          id: decoded.id || "admin",
          email: decoded.email,
          name: decoded.role === "admin" ? "مدیر سیستم" : "کاربر",
          avatar: null,
          role: decoded.role === "admin" ? "ADMIN" : "USER",
        };
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phone: (user as any).phone,
          name: user.name,
          avatar: user.avatar,
          role: user.role.toLowerCase(),
        },
      });
    } catch (err) {
      return res.json({ success: false, user: null });
    }
  });

  // API - Public Configuration (Google Client ID)
  app.get("/api/config", (req, res) => {
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || ""
    });
  });

  // API - Mock OTP Login for user verification
  app.post("/api/auth/otp-mock", (req, res) => {
    const { phone, code } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: "شماره تلفن الزامی است." });
    }
    if (code === "1234") {
      const mockId = "mock_otp_" + Date.now();
      const token = jwt.sign(
        { id: mockId, email: `${phone}@promty.ir`, phone, role: "user" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("promty_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user: { id: mockId, email: `${phone}@promty.ir`, phone, name: `کاربر ${phone}`, role: "user" }
      });
    }
    return res.status(400).json({ success: false, message: "کد تایید اشتباه است. (کد پیش‌فرض ۱۲۳۴ است)" });
  });

  // API - Complete registration / Phone registration
  app.post("/api/auth/phone-register", async (req, res) => {
    const { phone, name, email } = req.body;
    if (!phone || !name || !email) {
      return res.status(400).json({ success: false, message: "شماره، نام و ایمیل الزامی است." });
    }
    try {
      let user = null;
      if (prisma) {
        user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({
            data: { phone, name, email, role: "USER" },
          });
        } else if (!user.name || !user.email) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name, email },
          });
        }
      } else {
        const dbPath = path.join(process.cwd(), "db.json");
        let db: any = {};
        if (fs.existsSync(dbPath)) {
          db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
        }
        if (!db.users) db.users = [];
        user = db.users.find((u: any) => u.phone === phone);
        if (!user) {
          user = {
            id: "phone_mock_" + Date.now(),
            phone,
            name,
            email,
            role: "USER"
          };
          db.users.push(user);
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
        } else {
          user.name = name;
          user.email = email;
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
        }
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, phone: user.phone, role: "user" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("promty_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user: { id: user.id, phone: user.phone, name: user.name, email: user.email, role: String(user.role).toLowerCase() },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        const field = err.meta?.target?.[0] || "این مقدار";
        return res.status(409).json({
          success: false,
          message: field === "email" ? "این ایمیل قبلاً توسط حساب دیگری ثبت شده است." : "این شماره قبلاً ثبت شده است.",
        });
      }
      console.error("Phone register error:", err);
      return res.status(500).json({ success: false, message: "خطایی در ثبتنام رخ داد. دوباره تلاش کنید." });
    }
  });

  // Admin middleware
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.promty_session;
    if (!token) {
      return res.status(403).json({ success: false, message: "دسترسی غیرمجاز (کوکی یافت نشد)" });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.role === "admin") {
        (req as any).user = decoded;
        next();
      } else {
        res.status(403).json({ success: false, message: "دسترسی غیرمجاز" });
      }
    } catch (err) {
      res.status(403).json({ success: false, message: "توکن نامعتبر است" });
    }
  };

  // User middleware for authenticated routes
  const userAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.promty_session;
    if (!token) {
      return res.status(401).json({ success: false, message: "لطفاً ابتدا وارد حساب کاربری خود شوید." });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) {
        (req as any).user = decoded;
        next();
      } else {
        res.status(401).json({ success: false, message: "توکن نامعتبر است." });
      }
    } catch (err) {
      res.status(401).json({ success: false, message: "نشست شما منقضی شده است. لطفا مجدد وارد شوید." });
    }
  };

  // API - Get Presets of user for a specific Prompt
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

        const bookmarks = savedPrompts.map((sp) => ({
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
        }).filter((sp: any) => sp.prompt);

        return res.json({ success: true, bookmarks });
      }
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
      
      const page = pageQuery ? parseInt(pageQuery as string, 10) : 1;
      const limit = limitQuery ? parseInt(limitQuery as string, 10) : 20;

      // Non-admin users should only see active prompts by default
      let isAdmin = false;
      const token = req.cookies.promty_session;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded && decoded.role === "admin") {
            isAdmin = true;
          }
        } catch (e) {}
      }

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
    res.json({ settings: db.settings });
  });

  // API - Update Settings (admin only)
  app.post("/api/settings", adminAuth, (req, res) => {
    const { n8nAnalyzeWebhook, n8nRefineWebhook, geminiApiKey, openaiApiKey, siteTitle } = req.body;
    const db = readDB();
    db.settings = {
      n8nWebhookUrl: n8nRefineWebhook || "",
      n8nAnalyzeWebhook: n8nAnalyzeWebhook || "",
      n8nRefineWebhook: n8nRefineWebhook || "",
      geminiApiKey: geminiApiKey || "",
      openaiApiKey: openaiApiKey || "",
      siteTitle: siteTitle || "Promty.ir"
    };
    writeDB(db);
    res.json({ success: true, settings: db.settings });
  });

  // API - Get Public settings to know if n8n is configured
  app.get("/api/settings/public", (req, res) => {
    const db = readDB();
    res.json({
      isWebhookConfigured: !!(db.settings && (db.settings.n8nRefineWebhook || db.settings.n8nWebhookUrl)),
      siteTitle: db.settings?.siteTitle || "Promty.ir"
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
      
      const industries = terms.filter((t: any) => t.type?.toLowerCase() === "industry").map((t: any) => t.slug);
      const industryList = industries.length > 0 ? industries : [...INDUSTRY_OPTIONS];

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

        const tIndustries = activeTaxonomies.filter(t => t.type?.toLowerCase() === "industry").map(t => t.slug);
        const industriesStr = tIndustries.length > 0 ? tIndustries.join(", ") : INDUSTRY_OPTIONS.join(", ");

        // Send raw text and allowed taxonomies to n8n Webhook
        const response = await fetch(analyzeUrl, {
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
              outputFormats: outputFormatsStr,
              industries: industriesStr
            },
            action: "analyze_source",
            timestamp: new Date().toISOString()
          })
        });

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
   - برای فیلد Industry فقط از این لیست استفاده کن: [${industryList.join(", ")}]
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
                industry: { type: Type.STRING, enum: industryList },
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
              required: ["title", "description", "intent", "domains", "tools", "task", "language", "difficulty", "outputFormats", "industry", "tags", "body", "fieldsSchema"]
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

    // Increment usage count if tracked
    if (promptId) {
      await promptRepo.incrementUsageCount(promptId);
    }

    // High fidelity template-based or local refinement fallback
    const mockRefine = (text: string) => {
      // Enhance with professional prompt directives for incredible outputs
      let output = text;
      // English-friendly addition for detailed generative results
      output += "\n\n--ar 16:9 --v 6.0 --style raw --stylize 250 --quality 2.0 --fast";
      output += "\n\n/* Enhanced with Promty AI Refined System: High resolution details, volumetric light, professional cinematic color grading, hyper-detailed photography style, dynamic focal blur */";
      return output;
    };

    if (n8nUrl.length === 0) {
      return res.json({
        success: true,
        refinedPrompt: mockRefine(originalPrompt),
        fallbackUsed: true,
        message: "تنظیمات وبهوک n8n خالی است. یک بهبود آزمایشی تولید شد."
      });
    }

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
        })
      });

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
      console.warn("n8n call failed, falling back gracefully:", err);
      return res.json({
        success: true,
        refinedPrompt: mockRefine(originalPrompt),
        fallbackUsed: true,
        message: `خطا در فراخوانی وب‌هوک n8n (${err.message}). از الگوی بهبود محلی سیستم استفاده شد.`
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
      let isAdmin = false;
      const token = req.cookies.promty_session;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded && decoded.role === "admin") {
            isAdmin = true;
          }
        } catch (e) {}
      }

      const filters: any = {};
      if (!isAdmin) {
        filters.isActive = true;
      }

      const { prompts } = await promptRepo.getAll(filters);

      const searchResult = SearchService.search(prompts, queryStr);
      
      if (queryStr) {
        SearchService.recordSearch(queryStr);
      }

      res.json({
        success: true,
        query: queryStr,
        ...searchResult,
        history: SearchService.getSearchHistory()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // API - Search history and trends
  app.get("/api/search/history", (req, res) => {
    res.json({
      success: true,
      history: SearchService.getSearchHistory(),
      trending: ["طراحی لوگو", "Midjourney", "کدنویسی React", "تولید تیزر", "ChatGPT"]
    });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start fullstack server:", err);
});

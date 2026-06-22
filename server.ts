// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface FieldSchema {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

interface Prompt {
  id: string;
  title: string;
  description: string;
  body: string;
  fieldsSchema: FieldSchema[];
  category: string;
  tags: string[];
  sampleImage?: string;
  isPremium: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DB {
  prompts: Prompt[];
  categories: { id: string; name: string; slug: string; icon: string }[];
}

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to read database
function readDB(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading database file, using fallback:", error);
  }

  // Fallback / Initial Seed Data
  const initialDB: DB = {
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
        category: "تبلیغات",
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
        category: "وبسایت",
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
        category: "ویدیو",
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

// Check admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@promty.ir";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const AUTH_TOKEN_SECRET = "promty_super_secret_session_token_123";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API - Auth Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return res.json({
        success: true,
        token: AUTH_TOKEN_SECRET,
        user: { email: ADMIN_EMAIL, role: "admin" }
      });
    }
    return res.status(401).json({ success: false, message: "ایمیل یا رمز عبور اشتباه است." });
  });

  // Admin middleware
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${AUTH_TOKEN_SECRET}`) {
      next();
    } else {
      res.status(403).json({ success: false, message: "دسترسی غیرمجاز" });
    }
  };

  // API - Get Category list
  app.get("/api/categories", (req, res) => {
    const db = readDB();
    res.json({ categories: db.categories });
  });

  // API - Get Prompt list (all active, or with category filter)
  app.get("/api/prompts", (req, res) => {
    const { category } = req.query;
    const db = readDB();
    
    let list = db.prompts;
    
    // Non-admin users should only see active prompts by default
    const authHeader = req.headers.authorization;
    const isAdmin = authHeader === `Bearer ${AUTH_TOKEN_SECRET}`;

    if (!isAdmin) {
      list = list.filter(p => p.isActive);
    }

    if (category) {
      list = list.filter(p => p.category === category);
    }

    res.json({ prompts: list });
  });

  // API - Get Stats (Admin dashboard)
  app.get("/api/stats", adminAuth, (req, res) => {
    const db = readDB();
    const totalPrompts = db.prompts.length;
    const totalUsages = db.prompts.reduce((sum, p) => sum + p.usageCount, 0);
    const sorted = [...db.prompts].sort((a, b) => b.usageCount - a.usageCount);
    const mostPopular = sorted.length > 0 ? sorted[0].title : "هیچ پرامپتی ثبت نشده";

    res.json({
      totalPrompts,
      totalUsages,
      mostPopular
    });
  });

  // API - Get one Prompt by ID (increments usageCount)
  app.get("/api/prompts/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const promptIndex = db.prompts.findIndex(p => p.id === id);

    if (promptIndex === -1) {
      return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
    }

    // Increment count
    db.prompts[promptIndex].usageCount += 1;
    writeDB(db);

    res.json({ prompt: db.prompts[promptIndex] });
  });

  // API - Create Prompt (admin only)
  app.post("/api/prompts", adminAuth, (req, res) => {
    const { title, description, body, fieldsSchema, category, tags, isPremium, sampleImage, isActive } = req.body;
    
    if (!title || !body || !category) {
      return res.status(400).json({ success: false, message: "فیلدهای اجباری ارسال نشده‌اند." });
    }

    const db = readDB();
    const newPrompt: Prompt = {
      id: "p_" + Date.now(),
      title,
      description: description || "",
      body,
      fieldsSchema: fieldsSchema || [],
      category,
      tags: tags || [],
      sampleImage: sampleImage || "",
      isPremium: !!isPremium,
      isActive: isActive !== undefined ? !!isActive : true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.prompts.push(newPrompt);
    writeDB(db);

    res.status(201).json({ success: true, prompt: newPrompt });
  });

  // API - Update Prompt (admin only)
  app.put("/api/prompts/:id", adminAuth, (req, res) => {
    const { id } = req.params;
    const { title, description, body, fieldsSchema, category, tags, isPremium, sampleImage, isActive } = req.body;

    const db = readDB();
    const index = db.prompts.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
    }

    db.prompts[index] = {
      ...db.prompts[index],
      title: title !== undefined ? title : db.prompts[index].title,
      description: description !== undefined ? description : db.prompts[index].description,
      body: body !== undefined ? body : db.prompts[index].body,
      fieldsSchema: fieldsSchema !== undefined ? fieldsSchema : db.prompts[index].fieldsSchema,
      category: category !== undefined ? category : db.prompts[index].category,
      tags: tags !== undefined ? tags : db.prompts[index].tags,
      sampleImage: sampleImage !== undefined ? sampleImage : db.prompts[index].sampleImage,
      isPremium: isPremium !== undefined ? !!isPremium : db.prompts[index].isPremium,
      isActive: isActive !== undefined ? !!isActive : db.prompts[index].isActive,
      updatedAt: new Date().toISOString()
    };

    writeDB(db);
    res.json({ success: true, prompt: db.prompts[index] });
  });

  // API - Delete Prompt (admin only)
  app.delete("/api/prompts/:id", adminAuth, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const filtered = db.prompts.filter(p => p.id !== id);

    if (filtered.length === db.prompts.length) {
      return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
    }

    db.prompts = filtered;
    writeDB(db);

    res.json({ success: true, message: "پرامپت با موفقیت حذف شد." });
  });

  // API - Render Prompt (substitutes values dynamically)
  app.post("/api/render-prompt", (req, res) => {
    const { promptId, values } = req.body;
    if (!promptId || !values) {
      return res.status(400).json({ success: false, message: "اطلاعات ناکافی" });
    }

    const db = readDB();
    const prompt = db.prompts.find(p => p.id === promptId);

    if (!prompt) {
      return res.status(404).json({ success: false, message: "پرامپت پیدا نشد." });
    }

    // Substitute values using regex
    const rendered = prompt.body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return values[key] !== undefined && values[key] !== "" ? values[key] : match;
    });

    res.json({ rendered });
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

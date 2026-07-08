// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

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
  domain?: string;
  tool?: string;
  task?: string;
  language?: string;
  difficulty?: string;
  outputFormat?: string;
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
}

interface DB {
  prompts: Prompt[];
  categories: { id: string; name: string; slug: string; icon: string }[];
  settings: DBSettings;
}

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to read database
function readDB(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data) as any;
      
      // Ensure settings exists and has all keys
      if (!parsed.settings) {
        parsed.settings = {
          n8nWebhookUrl: "",
          n8nAnalyzeWebhook: "",
          n8nRefineWebhook: "",
          geminiApiKey: "",
          openaiApiKey: ""
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
      } else {
        let changed = false;
        if (parsed.settings.n8nWebhookUrl === undefined) {
          parsed.settings.n8nWebhookUrl = "";
          changed = true;
        }
        if (parsed.settings.n8nAnalyzeWebhook === undefined) {
          parsed.settings.n8nAnalyzeWebhook = "";
          changed = true;
        }
        if (parsed.settings.n8nRefineWebhook === undefined) {
          parsed.settings.n8nRefineWebhook = "";
          changed = true;
        }
        if (parsed.settings.geminiApiKey === undefined) {
          parsed.settings.geminiApiKey = "";
          changed = true;
        }
        if (parsed.settings.openaiApiKey === undefined) {
          parsed.settings.openaiApiKey = "";
          changed = true;
        }
        if (changed) {
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
        }
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
      openaiApiKey: ""
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
        domain: "Photography",
        tool: "Midjourney",
        task: "Product Commercial Portrait",
        language: "Persian",
        difficulty: "Beginner",
        outputFormat: "Presentation",
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
        domain: "Programming",
        tool: "ChatGPT",
        task: "React Component Coding",
        language: "English",
        difficulty: "Intermediate",
        outputFormat: "React",
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
        domain: "Marketing",
        tool: "Runway",
        task: "Video Teaser Creation",
        language: "Persian",
        difficulty: "Advanced",
        outputFormat: "Markdown",
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

// Check admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@promty.ir";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const AUTH_TOKEN_SECRET = "promty_super_secret_session_token_123";

async function startServer() {
  const app = express();
  const PORT = 3005;

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
    const { 
      title, 
      description, 
      body, 
      fieldsSchema, 
      category, 
      intent, 
      domain, 
      tool, 
      task, 
      language, 
      difficulty, 
      outputFormat, 
      industry, 
      tags, 
      isPremium, 
      sampleImage, 
      isActive 
    } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ success: false, message: "فیلدهای اجباری ارسال نشده‌اند." });
    }

    const db = readDB();
    const newPrompt: Prompt = {
      id: "p_" + Date.now(),
      title,
      description: description || "",
      body,
      fieldsSchema: fieldsSchema || [],
      category: category || tool || domain || "عمومی",
      intent: intent || "",
      domain: domain || "",
      tool: tool || "",
      task: task || "",
      language: language || "Persian",
      difficulty: difficulty || "Beginner",
      outputFormat: outputFormat || "Text",
      industry: industry || "",
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
    const { 
      title, 
      description, 
      body, 
      fieldsSchema, 
      category, 
      intent, 
      domain, 
      tool, 
      task, 
      language, 
      difficulty, 
      outputFormat, 
      industry, 
      tags, 
      isPremium, 
      sampleImage, 
      isActive 
    } = req.body;

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
      category: category !== undefined ? category : (db.prompts[index].category || tool || domain || "عمومی"),
      intent: intent !== undefined ? intent : db.prompts[index].intent,
      domain: domain !== undefined ? domain : db.prompts[index].domain,
      tool: tool !== undefined ? tool : db.prompts[index].tool,
      task: task !== undefined ? task : db.prompts[index].task,
      language: language !== undefined ? language : db.prompts[index].language,
      difficulty: difficulty !== undefined ? difficulty : db.prompts[index].difficulty,
      outputFormat: outputFormat !== undefined ? outputFormat : db.prompts[index].outputFormat,
      industry: industry !== undefined ? industry : db.prompts[index].industry,
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

  // API - Get Settings (admin only)
  app.get("/api/settings", adminAuth, (req, res) => {
    const db = readDB();
    res.json({ settings: db.settings });
  });

  // API - Update Settings (admin only)
  app.post("/api/settings", adminAuth, (req, res) => {
    const { n8nAnalyzeWebhook, n8nRefineWebhook, geminiApiKey, openaiApiKey } = req.body;
    const db = readDB();
    db.settings = {
      n8nWebhookUrl: n8nRefineWebhook || "",
      n8nAnalyzeWebhook: n8nAnalyzeWebhook || "",
      n8nRefineWebhook: n8nRefineWebhook || "",
      geminiApiKey: geminiApiKey || "",
      openaiApiKey: openaiApiKey || ""
    };
    writeDB(db);
    res.json({ success: true, settings: db.settings });
  });

  // API - Get Public settings to know if n8n is configured
  app.get("/api/settings/public", (req, res) => {
    const db = readDB();
    res.json({
      isWebhookConfigured: !!(db.settings && (db.settings.n8nRefineWebhook || db.settings.n8nWebhookUrl))
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
      if (analyzeUrl.length > 0) {
        // Send raw text to n8n Webhook
        const response = await fetch(analyzeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sourceText,
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
2. Identify variable parts in the prompt (e.g., product names, colors, sizes) and replace them with {{placeholder_key}}.
3. For every {{placeholder_key}} generated, create a corresponding FieldSchema object to determine how the user will interact with it in the UI.
4. UI Field Types allowed: 'text', 'textarea', 'color', 'select', 'radio', 'switch', 'slider', 'multiselect', 'url'. If select/radio/multiselect is chosen, you must supply options in Persian/English. If slider is chosen, specify min and max.
5. Strictly categorize the prompt into one of the following metadata options if possible:
   - intent: Create, Write, Code, Design, Market, Analyze, Learn, Automate, Research, Productivity
   - domain: Business, Marketing, Education, Medical, Health, Legal, Finance, Programming, Gaming, Food, Travel, Architecture, Photography, Real Estate, Sports, AI, Robotics, Science, Religion, History
   - tool: ChatGPT, Claude, Gemini, Grok, Midjourney, Flux, Stable Diffusion, Ideogram, Veo, Runway, ElevenLabs, Suno, n8n AI Agent
   - language: Persian, English
   - difficulty: Beginner, Intermediate, Advanced, Expert
   - outputFormat: Text, Markdown, JSON, CSV, HTML, CSS, JavaScript, Python, React, TypeScript, SQL, XML, PDF, Table, Checklist, Roadmap, Presentation
   - industry: Ecommerce, Startup, Healthcare, Education, Restaurant, Construction, Law, Bank, Crypto, Fashion, Fitness, Agriculture, Tourism, Insurance, NGO
6. Set the final optimized body with {{placeholders}} inside.

Raw Prompt Text to Analyze:
"""
${sourceText}
"""`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash", // BUG FIXED HERE
          contents: promptToModel,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                intent: { type: Type.STRING },
                domain: { type: Type.STRING },
                tool: { type: Type.STRING },
                task: { type: Type.STRING },
                language: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                outputFormat: { type: Type.STRING },
                industry: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                body: { type: Type.STRING },
                fieldsSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      label: { type: Type.STRING },
                      type: { type: Type.STRING },
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
              required: ["title", "description", "intent", "domain", "tool", "task", "language", "difficulty", "outputFormat", "industry", "tags", "body", "fieldsSchema"]
            }
          }
        });

        const textResult = response.text || "{}";
        const structuredJSON = JSON.parse(textResult.trim());

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
      const index = db.prompts.findIndex(p => p.id === promptId);
      if (index !== -1) {
        db.prompts[index].usageCount += 1;
        writeDB(db);
      }
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

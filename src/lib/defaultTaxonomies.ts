// src/lib/defaultTaxonomies.ts

export interface DefaultTaxonomyItem {
  type: string;
  slug: string;
  titleEn: string;
  titleFa: string;
}

export const defaultTaxonomies: DefaultTaxonomyItem[] = [
  // INTENTS
  { type: "intent", slug: "visual-generation", titleEn: "Visual Generation", titleFa: "تولید تصویر یا ویدیو" },
  { type: "intent", slug: "writing", titleEn: "Writing", titleFa: "نوشتن و تولید متن" },
  { type: "intent", slug: "coding", titleEn: "Coding", titleFa: "ساخت و برنامه‌نویسی" },
  { type: "intent", slug: "analysis", titleEn: "Analysis", titleFa: "تحلیل و خلاصهسازی" },
  { type: "intent", slug: "planning", titleEn: "Planning", titleFa: "برنامه‌ریزی و استراتژی" },
  { type: "intent", slug: "automation", titleEn: "Automation", titleFa: "اتوماسیون یک وظیفه" },
  { type: "intent", slug: "teaching", titleEn: "Teaching", titleFa: "یادگیری و آموزش" },
  { type: "intent", slug: "research", titleEn: "Research", titleFa: "تحقیق و پژوهش" },
  { type: "intent", slug: "persona", titleEn: "Persona", titleFa: "ایفای نقش تخصصی" },

  // TOOLS
  { type: "tool", slug: "chatgpt", titleEn: "ChatGPT", titleFa: "چت‌جی‌پی‌تی (ChatGPT)" },
  { type: "tool", slug: "claude", titleEn: "Claude", titleFa: "کلود (Claude)" },
  { type: "tool", slug: "gemini", titleEn: "Gemini", titleFa: "جمینای (Gemini)" },
  { type: "tool", slug: "grok", titleEn: "Grok", titleFa: "گراک (Grok)" },
  { type: "tool", slug: "midjourney", titleEn: "Midjourney", titleFa: "میدجورنی (Midjourney)" },
  { type: "tool", slug: "flux", titleEn: "Flux", titleFa: "فلاکس (Flux)" },
  { type: "tool", slug: "stable-diffusion", titleEn: "Stable Diffusion", titleFa: "استیبل دیفیوژن" },
  { type: "tool", slug: "ideogram", titleEn: "Ideogram", titleFa: "ایدیوگرام (Ideogram)" },
  { type: "tool", slug: "veo", titleEn: "Veo", titleFa: "ویو (Veo)" },
  { type: "tool", slug: "kling", titleEn: "Kling", titleFa: "کلینگ (Kling)" },
  { type: "tool", slug: "runway", titleEn: "Runway", titleFa: "رانوی (Runway)" },
  { type: "tool", slug: "elevenlabs", titleEn: "ElevenLabs", titleFa: "الون‌لبز (ElevenLabs)" },
  { type: "tool", slug: "suno", titleEn: "Suno", titleFa: "سونو (Suno)" },
  { type: "tool", slug: "n8n", titleEn: "n8n AI Agent", titleFa: "عامل هوش مصنوعی n8n" },

  // DOMAINS
  { type: "domain", slug: "business", titleEn: "Business", titleFa: "کسب و کار" },
  { type: "domain", slug: "marketing", titleEn: "Marketing", titleFa: "بازاریابی" },
  { type: "domain", slug: "social-media", titleEn: "Social Media", titleFa: "شبکه‌های اجتماعی" },
  { type: "domain", slug: "education", titleEn: "Education", titleFa: "آموزش و تحصیلات" },
  { type: "domain", slug: "health", titleEn: "Health & Medical", titleFa: "سلامت و پزشکی" },
  { type: "domain", slug: "legal", titleEn: "Legal", titleFa: "حقوقی و قانونی" },
  { type: "domain", slug: "finance", titleEn: "Finance & Banking", titleFa: "مالی، بانکداری و سرمایه‌گذاری" },
  { type: "domain", slug: "programming", titleEn: "Programming", titleFa: "برنامه‌نویسی" },
  { type: "domain", slug: "gaming", titleEn: "Gaming", titleFa: "بازی و سرگرمی" },
  { type: "domain", slug: "food", titleEn: "Food & Restaurant", titleFa: "غذایی، آشپزی و رستوران" },
  { type: "domain", slug: "travel", titleEn: "Travel & Tourism", titleFa: "گردشگری و سفر" },
  { type: "domain", slug: "architecture", titleEn: "Architecture & Construction", titleFa: "معماری، دکوراسیون و ساخت‌وساز" },
  { type: "domain", slug: "photography", titleEn: "Photography", titleFa: "عکاسی و فیلمبرداری" },
  { type: "domain", slug: "real-estate", titleEn: "Real Estate", titleFa: "املاک و مستغلات" },
  { type: "domain", slug: "sports", titleEn: "Sports & Fitness", titleFa: "ورزش، بدنسازی و تناسب اندام" },
  { type: "domain", slug: "ai", titleEn: "AI", titleFa: "هوش مصنوعی و داده" },
  { type: "domain", slug: "robotics", titleEn: "Robotics", titleFa: "رباتیک و سخت‌افزار" },
  { type: "domain", slug: "science", titleEn: "Science", titleFa: "علوم پایه و پژوهش" },
  { type: "domain", slug: "religion", titleEn: "Religion", titleFa: "ادیان و فلسفه" },
  { type: "domain", slug: "history", titleEn: "History", titleFa: "تاریخ و فرهنگ" },
  { type: "domain", slug: "ecommerce", titleEn: "Ecommerce", titleFa: "تجارت الکترونیک و فروشگاه" },
  { type: "domain", slug: "startup", titleEn: "Startup", titleFa: "استارتاپ و کارآفرینی" },
  { type: "domain", slug: "fashion", titleEn: "Fashion", titleFa: "مد و پوشاک" },
  { type: "domain", slug: "agriculture", titleEn: "Agriculture", titleFa: "کشاورزی و دامداری" },
  { type: "domain", slug: "crypto", titleEn: "Crypto", titleFa: "رمزارز و بلاکچین" },
  { type: "domain", slug: "insurance", titleEn: "Insurance", titleFa: "بیمه" },
  { type: "domain", slug: "ngo", titleEn: "NGO", titleFa: "سازمان‌های خیریه و مردم‌نهاد" },

  // LANGUAGES
  { type: "language", slug: "persian", titleEn: "Persian", titleFa: "فارسی" },
  { type: "language", slug: "english", titleEn: "English", titleFa: "انگلیسی" },

  // DIFFICULTIES
  { type: "difficulty", slug: "beginner", titleEn: "Beginner", titleFa: "مبتدی (ساده)" },
  { type: "difficulty", slug: "intermediate", titleEn: "Intermediate", titleFa: "متوسط (کاربردی)" },
  { type: "difficulty", slug: "advanced", titleEn: "Advanced", titleFa: "پیشرفته" },
  { type: "difficulty", slug: "expert", titleEn: "Expert", titleFa: "فوق تخصصی (Expert)" },

  // OUTPUT FORMATS
  { type: "outputFormat", slug: "text", titleEn: "Text", titleFa: "متن ساده" },
  { type: "outputFormat", slug: "markdown", titleEn: "Markdown", titleFa: "فرمت Markdown" },
  { type: "outputFormat", slug: "json", titleEn: "JSON", titleFa: "ساختار یافته JSON" },
  { type: "outputFormat", slug: "csv", titleEn: "CSV", titleFa: "جدول CSV" },
  { type: "outputFormat", slug: "html", titleEn: "HTML", titleFa: "کد HTML" },
  { type: "outputFormat", slug: "css", titleEn: "CSS", titleFa: "استایل CSS" },
  { type: "outputFormat", slug: "javascript", titleEn: "JavaScript", titleFa: "جاوا اسکریپت" },
  { type: "outputFormat", slug: "python", titleEn: "Python", titleFa: "پایتون (Python)" },
  { type: "outputFormat", slug: "react", titleEn: "React", titleFa: "کامپوننت React" },
  { type: "outputFormat", slug: "typescript", titleEn: "TypeScript", titleFa: "تایپ‌اسکریپت" },
  { type: "outputFormat", slug: "sql", titleEn: "SQL", titleFa: "کوئری SQL" },
  { type: "outputFormat", slug: "xml", titleEn: "XML", titleFa: "سند XML" },
  { type: "outputFormat", slug: "pdf", titleEn: "PDF", titleFa: "سند PDF" },
  { type: "outputFormat", slug: "image", titleEn: "Image", titleFa: "تصویر خروجی" },
  { type: "outputFormat", slug: "video", titleEn: "Video", titleFa: "ویدیو" },
  { type: "outputFormat", slug: "table", titleEn: "Table", titleFa: "جدول اطلاعاتی" },
  { type: "outputFormat", slug: "checklist", titleEn: "Checklist", titleFa: "چک‌لیست کارها" },
  { type: "outputFormat", slug: "roadmap", titleEn: "Roadmap", titleFa: "مسیر راه (Roadmap)" },
  { type: "outputFormat", slug: "presentation", titleEn: "Presentation", titleFa: "فایل ارائه" },
];

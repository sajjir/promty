// src/lib/defaultTaxonomies.ts

export interface DefaultTaxonomyItem {
  type: string;
  slug: string;
  titleEn: string;
  titleFa: string;
}

export const defaultTaxonomies: DefaultTaxonomyItem[] = [
  // INTENTS
  { type: "intent", slug: "create", titleEn: "Create", titleFa: "خلق و ایده‌پردازی" },
  { type: "intent", slug: "write", titleEn: "Write", titleFa: "نگارش و نویسندگی" },
  { type: "intent", slug: "code", titleEn: "Code", titleFa: "برنامه‌نویسی و توسعه" },
  { type: "intent", slug: "design", titleEn: "Design", titleFa: "طراحی و گرافیک" },
  { type: "intent", slug: "market", titleEn: "Market", titleFa: "بازاریابی و فروش" },
  { type: "intent", slug: "analyze", titleEn: "Analyze", titleFa: "تحلیل و آنالیز" },
  { type: "intent", slug: "learn", titleEn: "Learn", titleFa: "آموزش و یادگیری" },
  { type: "intent", slug: "automate", titleEn: "Automate", titleFa: "اتوماسیون و خودکارسازی" },
  { type: "intent", slug: "research", titleEn: "Research", titleFa: "تحقیق و جستجو" },
  { type: "intent", slug: "productivity", titleEn: "Productivity", titleFa: "افزایش بهره‌وری" },

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
  { type: "domain", slug: "education", titleEn: "Education", titleFa: "آموزش و تحصیلات" },
  { type: "domain", slug: "health", titleEn: "Health & Medical", titleFa: "سلامت و پزشکی" },
  { type: "domain", slug: "legal", titleEn: "Legal", titleFa: "حقوقی و قانونی" },
  { type: "domain", slug: "finance", titleEn: "Finance", titleFa: "مالی و سرمایه‌گذاری" },
  { type: "domain", slug: "programming", titleEn: "Programming", titleFa: "برنامه‌نویسی" },
  { type: "domain", slug: "gaming", titleEn: "Gaming", titleFa: "بازی و سرگرمی" },
  { type: "domain", slug: "food", titleEn: "Food", titleFa: "غذایی و آشپزی" },
  { type: "domain", slug: "travel", titleEn: "Travel", titleFa: "گردشگری و سفر" },
  { type: "domain", slug: "architecture", titleEn: "Architecture", titleFa: "معماری و دکوراسیون" },
  { type: "domain", slug: "photography", titleEn: "Photography", titleFa: "عکاسی و فیلمبرداری" },
  { type: "domain", slug: "real-estate", titleEn: "Real Estate", titleFa: "املاک و مستقلات" },
  { type: "domain", slug: "sports", titleEn: "Sports", titleFa: "ورزش و بدنسازی" },
  { type: "domain", slug: "ai", titleEn: "AI", titleFa: "هوش مصنوعی و داده" },
  { type: "domain", slug: "robotics", titleEn: "Robotics", titleFa: "رباتیک و سخت‌افزار" },
  { type: "domain", slug: "science", titleEn: "Science", titleFa: "علوم پایه و پژوهش" },
  { type: "domain", slug: "religion", titleEn: "Religion", titleFa: "ادیان و فلسفه" },
  { type: "domain", slug: "history", titleEn: "History", titleFa: "تاریخ و فرهنگ" },

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

  // INDUSTRIES
  { type: "industry", slug: "ecommerce", titleEn: "Ecommerce", titleFa: "تجارت الکترونیک" },
  { type: "industry", slug: "startup", titleEn: "Startup", titleFa: "استارتاپ و تکنولوژی" },
  { type: "industry", slug: "healthcare", titleEn: "Healthcare", titleFa: "سلامت و درمان" },
  { type: "industry", slug: "education", titleEn: "Education", titleFa: "آموزش و مدارس" },
  { type: "industry", slug: "restaurant", titleEn: "Restaurant", titleFa: "رستوران و کافه" },
  { type: "industry", slug: "construction", titleEn: "Construction", titleFa: "ساخت و ساز" },
  { type: "industry", slug: "law", titleEn: "Law", titleFa: "وکالت و امور حقوقی" },
  { type: "industry", slug: "bank", titleEn: "Bank", titleFa: "بانکداری و فین‌تک" },
  { type: "industry", slug: "crypto", titleEn: "Crypto", titleFa: "رمزارز و بلاکچین" },
  { type: "industry", slug: "fashion", titleEn: "Fashion", titleFa: "مد و پوشاک" },
  { type: "industry", slug: "fitness", titleEn: "Fitness", titleFa: "فیتنس و تناسب اندام" },
  { type: "industry", slug: "agriculture", titleEn: "Agriculture", titleFa: "کشاورزی و دامداری" },
  { type: "industry", slug: "tourism", titleEn: "Tourism", titleFa: "گردشگری و آژانس مسافرتی" },
  { type: "industry", slug: "insurance", titleEn: "Insurance", titleFa: "بیمه و خدمات مالی" },
  { type: "industry", slug: "ngo", titleEn: "NGO", titleFa: "سازمان‌های خیریه و NGO" },
];

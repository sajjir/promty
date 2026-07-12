import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Prompt } from "../types";
import PromptWizard from "../components/PromptWizard";
import CopyButton from "../components/CopyButton";
import PromptCard from "../components/PromptCard";
import { 
  ChevronRight, Megaphone, Globe, Video, Camera, Sparkles, 
  Wand2, PlayCircle, Loader2, Copy, Layers, Eye, Compass, 
  HelpCircle, MessageSquare, BookOpen, Search, Share2, Tag, 
  Info, Cpu, Check, FileCode, CheckCircle2, ChevronLeft
} from "lucide-react";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "تبلیغات": Megaphone,
  "وبسایت": Globe,
  "ویدیو": Video,
  "عکاسی": Camera,
};

const TRANSLATIONS: Record<string, string> = {
  "create": "ایجاد محتوا", 
  "write": "نگارش و ادبیات", 
  "code": "کدنویسی", 
  "design": "طراحی و هنر", 
  "market": "بازاریابی",
  "analyze": "تحلیل و آنالیز", 
  "learn": "آموزش", 
  "automate": "اتوماسیون", 
  "research": "پژوهش", 
  "productivity": "بهره‌وری فردی",
  "business": "کسب‌وکار", 
  "marketing": "مارکتینگ", 
  "education": "آموزش", 
  "medical": "پزشکی", 
  "health": "سلامت", 
  "legal": "حقوقی",
  "finance": "مالی", 
  "programming": "برنامه‌نویسی", 
  "gaming": "بازی", 
  "photography": "عکاسی", 
  "ai": "هوش مصنوعی",
  "beginner": "مبتدی", 
  "intermediate": "متوسط", 
  "advanced": "پیشرفته", 
  "expert": "حرفه‌ای",
  "persian": "فارسی", 
  "english": "انگلیسی",
  "Create": "ایجاد محتوا", 
  "Write": "نگارش و ادبیات", 
  "Code": "کدنویسی", 
  "Design": "طراحی و هنر", 
  "Market": "بازاریابی",
  "Analyze": "تحلیل و آنالیز", 
  "Learn": "آموزش", 
  "Automate": "اتوماسیون", 
  "Research": "پژوهش", 
  "Productivity": "بهره‌وری فردی",
  "Business": "کسب‌وکار", 
  "Marketing": "مارکتینگ", 
  "Education": "آموزش", 
  "Medical": "پزشکی", 
  "Health": "سلامت", 
  "Legal": "حقوقی",
  "Finance": "مالی", 
  "Programming": "برنامه‌نویسی", 
  "Gaming": "بازی", 
  "Photography": "عکاسی", 
  "AI": "هوش مصنوعی",
  "Beginner": "مبتدی", 
  "Intermediate": "متوسط", 
  "Advanced": "پیشرفته", 
  "Expert": "حرفه‌ای",
  "Persian": "فارسی", 
  "English": "انگلیسی"
};

const RUN_URLS: Record<string, string> = {
  chatgpt: "https://chatgpt.com/?q=",
  claude: "https://claude.ai/new?q=",
  gemini: "https://gemini.google.com/",
  midjourney: "https://www.midjourney.com/",
  flux: "https://fal.ai/",
  "stable diffusion": "https://dreamstudio.ai/"
};

function TaxonomyBlock({ prompt }: { prompt: Prompt }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-right" dir="rtl">
      <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-50">
        <Tag className="w-4 h-4 text-[#6C47FF]" />
        <h4 className="text-xs font-black text-slate-800">شناسنامه پرامپت</h4>
      </div>

      <div className="grid grid-cols-2 gap-3.5 text-xs text-slate-600">
        {prompt.tools && prompt.tools.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">🛠️ ابزار هوش مصنوعی:</span>
            <div className="flex flex-wrap gap-1">
              {prompt.tools.map(t => (
                <Link 
                  key={t} 
                  to={`/?tool=${t}`}
                  className="bg-indigo-50 text-[#6C47FF] px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100/50 hover:ring-2 hover:ring-[#6C47FF]/50 transition-all cursor-pointer block"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        )}

        {prompt.domains && prompt.domains.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">🌐 حوزه کاری (Domain):</span>
            <div className="flex flex-wrap gap-1">
              {prompt.domains.map(d => (
                <Link 
                  key={d} 
                  to={`/?domain=${d}`}
                  className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold hover:ring-2 hover:ring-[#6C47FF]/50 transition-all cursor-pointer block"
                >
                  {TRANSLATIONS[d] || TRANSLATIONS[d.toLowerCase()] || d}
                </Link>
              ))}
            </div>
          </div>
        )}

        {prompt.intent && (
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">🎯 قصد و هدف پرامپت:</span>
            <Link 
              to={`/?intent=${prompt.intent}`}
              className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100/30 inline-block hover:ring-2 hover:ring-[#6C47FF]/50 transition-all cursor-pointer"
            >
              {TRANSLATIONS[prompt.intent] || TRANSLATIONS[prompt.intent.toLowerCase()] || prompt.intent}
            </Link>
          </div>
        )}

        {prompt.language && (
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">💬 زبان پرامپت:</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold inline-block">
              {TRANSLATIONS[prompt.language] || TRANSLATIONS[prompt.language.toLowerCase()] || prompt.language}
            </span>
          </div>
        )}

        {prompt.difficulty && (
          <div className="space-y-1 col-span-2">
            <span className="text-[10px] text-slate-400 font-bold block">⚡ سطح تخصص مورد نیاز:</span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold inline-block border ${
              prompt.difficulty.toLowerCase() === "beginner" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
              prompt.difficulty.toLowerCase() === "intermediate" ? "bg-blue-50 text-blue-700 border-blue-100" :
              prompt.difficulty.toLowerCase() === "advanced" ? "bg-amber-50 text-amber-700 border-amber-100" :
              "bg-rose-50 text-rose-700 border-rose-100"
            }`}>
              {TRANSLATIONS[prompt.difficulty] || TRANSLATIONS[prompt.difficulty.toLowerCase()] || prompt.difficulty}
            </span>
          </div>
        )}
      </div>

      {prompt.tags && prompt.tags.length > 0 && (
        <div className="pt-3 border-t border-slate-50 space-y-1.5">
          <span className="text-[10px] text-slate-400 font-bold block">برچسب‌ها:</span>
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <Link 
                key={tag} 
                to={`/?tag=${tag}`}
                className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-medium rounded border border-slate-100 hover:ring-2 hover:ring-[#6C47FF]/50 transition-all cursor-pointer block"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [renderedBody, setRenderedBody] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const isAdmin = !!localStorage.getItem("promty_admin_token");

  const handleRunExternal = async (textToRun: string) => {
    if (!textToRun) return;

    // 1. Copy to clipboard
    try {
      await navigator.clipboard.writeText(textToRun);
      // Track copy count in database
      handleTrackCopy();
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }

    // 2. Determine target tool and URL
    const firstTool = prompt?.tools && prompt.tools.length > 0 ? prompt.tools[0] : "";
    const toolLower = firstTool.toLowerCase();

    let baseUrl = "https://chatgpt.com/?q="; // Default
    if (firstTool) {
      const matchedKey = Object.keys(RUN_URLS).find(k => toolLower.includes(k) || k.includes(toolLower));
      if (matchedKey) {
        baseUrl = RUN_URLS[matchedKey];
      } else if (["midjourney", "flux", "stable diffusion", "stable-diffusion", "ideogram", "mj", "عکاسی", "تصویر سازی"].some(x => toolLower.includes(x))) {
        baseUrl = "https://fal.ai/";
      }
    }

    // 3. Construct URL and open in new tab
    const finalUrl = baseUrl.includes("?q=")
      ? `${baseUrl}${encodeURIComponent(textToRun)}`
      : baseUrl;

    window.open(finalUrl, "_blank");
  };

  // Accordion states
  const [showSeoAccordion, setShowSeoAccordion] = useState(false);
  const [showOutputAccordion, setShowOutputAccordion] = useState(false);

  // Track copy count in database
  const handleTrackCopy = async () => {
    try {
      const res = await fetch(`/api/prompts/${id}/track-copy`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.usageCount !== undefined) {
          setPrompt(prev => prev ? { ...prev, usageCount: data.usageCount } : null);
        }
      }
    } catch (err) {
      console.error("Failed to track copy count:", err);
    }
  };

  // Versioning state
  const [selectedVersion, setSelectedVersion] = useState<"v1" | "v2" | "v3">("v1");
  const [refineHistory, setRefineHistory] = useState<Array<{
    timestamp: string;
    versionName: string;
    body: string;
  }>>([]);

  // Related Prompts state
  const [relatedPrompts, setRelatedPrompts] = useState<Prompt[]>([]);

  // States for AI Refinement MVP
  const [refineLoading, setRefineLoading] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null);
  const [originalBeforeRefining, setOriginalBeforeRefining] = useState<string>("");
  const [isn8nConfigured, setIsn8nConfigured] = useState(false);
  const [refineMessage, setRefineMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState("درحال برقراری ارتباط با وب‌هوک n8n...");

  useEffect(() => {
    async function checkn8n() {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          setIsn8nConfigured(data.isWebhookConfigured);
        }
      } catch (err) {
        console.error("Failed to query public settings:", err);
      }
    }
    checkn8n();
  }, []);

  const handleRefinePrompt = async () => {
    try {
      setRefineLoading(true);
      setRefinedPrompt(null);
      setRefineMessage(null);
      setOriginalBeforeRefining(renderedBody);
      
      const steps = [
        "در حال فراخوانی عامل هوش مصنوعی (AI Agent)...",
        "در حال مهندسی و بازنویسی متغیرها تحت گایدلاین‌ها...",
        "بهینه‌سازی کلمات کلیدی، پرسپکتیو و فریم‌ورک‌های رندر...",
        "افزودن تنظیمات کیفیت بالا (Photorealistic & 8K Directives)...",
        "اعمال ویژگی‌های اختصاصی سبک و نورپردازی حرفه‌ای سینمایی..."
      ];
      
      let stepIndex = 0;
      setLoadingStep(steps[0]);
      const interval = setInterval(() => {
        if (stepIndex < steps.length - 1) {
          stepIndex++;
          setLoadingStep(steps[stepIndex]);
        }
      }, 1500);

      const res = await fetch("/api/refine-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          promptId: id,
          originalPrompt: renderedBody
        })
      });

      clearInterval(interval);

      if (res.ok) {
        const data = await res.json();
        setRefinedPrompt(data.refinedPrompt);
        if (data.refinedPrompt) {
          setRefineHistory((prev) => [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString("fa-IR"),
              versionName: `ارتقا یافته هوشمند #${prev.length}`,
              body: data.refinedPrompt
            }
          ]);
        }
        if (data.message) {
          setRefineMessage(data.message);
        }
      } else {
        setRefineMessage("خطایی در نهایی‌سازی ارتباط با دستیار هوشمند به وجود آمد.");
      }
    } catch (err: any) {
      setRefineMessage("سیستم هوش مصنوعی موقتاً با اخلال مواجه شد. بعداً تلاش کنید.");
    } finally {
      setRefineLoading(false);
    }
  };

  useEffect(() => {
    async function loadPromptAndRelated() {
      try {
        setLoading(true);
        // Fetch current prompt details
        const res = await fetch(`/api/prompts/${id}`);
        let currentPrompt: Prompt | null = null;
        if (res.ok) {
          const data = await res.json();
          currentPrompt = data.prompt;
          setPrompt(data.prompt);
          setRenderedBody(data.prompt.body);
          setSelectedVersion("v1"); // Reset version on prompt change
          setRefineHistory([
            {
              timestamp: new Date().toLocaleTimeString("fa-IR"),
              versionName: "نسخه اصلی اولیه (V1)",
              body: data.prompt.body
            }
          ]);
        }

        // Fetch all prompts to extract related prompts matching tags, category, tools, or domains
        const allRes = await fetch("/api/prompts");
        if (allRes.ok) {
          const allData = await allRes.json();
          const list = allData.prompts || [];
          setAllPrompts(list);

          if (currentPrompt) {
            // Find related prompts: same category or sharing tags/tools/domains, excluding current prompt
            const related = list
              .filter((p: Prompt) => p.id !== currentPrompt?.id && p.isActive)
              .map((p: Prompt) => {
                let score = 0;
                if (p.category === currentPrompt?.category) score += 5;
                if (currentPrompt?.tools?.some(t => p.tools?.includes(t))) score += 4;
                if (currentPrompt?.domains?.some(d => p.domains?.includes(d))) score += 3;
                if (p.tags.some(t => currentPrompt?.tags.includes(t))) score += 2;
                return { prompt: p, score };
              })
              .filter(item => item.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .map(item => item.prompt);

            setRelatedPrompts(related);
          }
        }
      } catch (error) {
        console.error("Error fetching prompt details:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadPromptAndRelated();
    }
  }, [id]);

  // Version body generator based on base body
  const getVersionedBody = (v: "v1" | "v2" | "v3") => {
    if (!prompt) return "";
    if (v === "v1") {
      return prompt.body;
    } else if (v === "v2") {
      // Cinematic/Detailed variant
      if (prompt.category === "عکاسی" || prompt.category === "ویدیو" || prompt.tools?.includes("Midjourney") || prompt.tools?.includes("Flux")) {
        return `${prompt.body} --ar 16:9 --style raw --v 6.0 --stylize 250 --quality 2 --contrast high --cinematic-lighting --focal-length 85mm`;
      }
      return `${prompt.body}\n\n[Note: Please focus on extreme photorealism, detailed volumetric rendering, cinematic shadows, 8K textures, depth of field, and volumetric fog elements to make the outcome stand out.]`;
    } else {
      // Dev & Production structure variant
      return `/* System: Output structured JSON exclusively. Bypassing greeting. */\n{\n  "instruction": "${prompt.title}",\n  "prompt": "${prompt.body.replace(/"/g, '\\"')}",\n  "parameters": {\n    "temperature": 0.3,\n    "top_p": 0.95,\n    "system_anchor": "Act as an expert AI consultant targeting extreme accuracy and formatting output directly in valid clean syntax."\n  }\n}`;
    }
  };

  const handleVersionChange = (v: "v1" | "v2" | "v3") => {
    setSelectedVersion(v);
    const body = getVersionedBody(v);
    setRenderedBody(body);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C47FF]" />
        <p className="text-xs font-semibold">در حال بارگذاری ایمن جزئیات پرامپت مهندسی‌شده...</p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-4 max-w-lg mx-auto shadow-sm">
        <Sparkles className="w-8 h-8 text-[#6C47FF] mx-auto animate-pulse" />
        <p className="text-sm font-semibold text-slate-600">پرامپت مورد نظر پیدا نشد.</p>
        <Link to="/" className="inline-block text-xs bg-[#6C47FF] text-white px-4 py-2.5 rounded-xl hover:bg-opacity-90 font-bold transition">
          بازگشت به خانه
        </Link>
      </div>
    );
  }

  const IconComponent = categoryIcons[prompt.category || ""] || Sparkles;

  // Render a mock preview of textual output (for ChatGPT, Claude, etc)
  const IMAGE_TOOLS = ['midjourney', 'flux', 'stable-diffusion', 'dalle', 'runway', 'kling'];
  const isImagePrompt = prompt.tools ? prompt.tools.some(tool => IMAGE_TOOLS.includes(tool.toLowerCase())) : false;

  const isCoding = 
    prompt.tools?.some(t => ["chatgpt", "claude", "gemini", "grok"].includes(t.toLowerCase())) || 
    prompt.domains?.some(d => ["programming", "code", "development"].includes(d.toLowerCase())) ||
    prompt.intent?.toLowerCase() === "code" ||
    prompt.tags?.some(tag => ["کد", "برنامه‌نویسی", "react", "programming", "code"].includes(tag.toLowerCase()));

  const mediaGalleryArray = Array.isArray(prompt.mediaGallery) 
    ? (prompt.mediaGallery as unknown as string[]) 
    : [];

  const allMedia: string[] = [];
  if (prompt.coverImage) {
    allMedia.push(prompt.coverImage);
  }
  mediaGalleryArray.forEach((url) => {
    if (url && !allMedia.includes(url)) {
      allMedia.push(url);
    }
  });

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-right" dir="rtl">
      
      {/* Top Breadcrumb Nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
          <Link to="/" className="hover:text-slate-600 transition">خانه</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{prompt.category || "عمومی"}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 truncate max-w-[150px]">{prompt.title}</span>
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to={`/admin/prompts/new?forkedFrom=${prompt.id}`}
              className="flex items-center gap-1.5 text-xs font-black text-amber-600 bg-amber-50 border border-amber-200/50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition"
            >
              <span>🔄 ایجاد انشعاب (Fork)</span>
            </Link>
          )}

          <Link
            to="/"
            className="flex items-center gap-1 text-xs font-bold text-[#6C47FF] hover:bg-[#6C47FF]/5 px-3 py-1.5 rounded-lg transition"
          >
            <span>بازگشت به آرشیو پرامپت‌ها</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {prompt.parent && (
        <div className="bg-amber-50/40 border border-amber-200/50 text-amber-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs">
          <span>🔗 این پرامپت انشعابی از</span>
          <Link to={`/prompts/${prompt.parent.id}`} className="underline hover:text-amber-900 transition font-black">
            {prompt.parent.title}
          </Link>
          <span>است</span>
        </div>
      )}

      {/* Grid: Main Prompt Body Content & Customization Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Metadata, Taxonomy Badges, Sample Output Visuals, SEO Simulation */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Visual/Image Card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-[#6C47FF] font-black">
                <IconComponent className="w-4 h-4" />
                <span>دسته‌بندی: {prompt.category || "عمومی"}</span>
              </div>

              <h1 className="text-lg md:text-xl font-black text-slate-800 leading-tight">
                {prompt.title}
              </h1>

              <p className="text-slate-500 text-xs leading-relaxed">
                {prompt.description || "توضیحی برای این پرامپت مهندسی شده ثبت نشده است."}
              </p>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
              {prompt.coverImage ? (
                <img
                  src={prompt.coverImage}
                  alt={prompt.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover animate-fade-in"
                />
              ) : prompt.sampleImage ? (
                <img
                  src={prompt.sampleImage}
                  alt={prompt.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover animate-fade-in"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 gap-2">
                  <PlayCircle className="w-12 h-12 text-[#6C47FF]/30" />
                  <span className="text-[10px] font-bold text-slate-400">بدون تصویر خروجی مستقیم</span>
                </div>
              )}
              {prompt.isPremium && (
                <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-md border border-amber-400/20">
                  پرامپت ویژه 🛡️
                </span>
              )}
            </div>
          </div>

          {/* Smart Media Gallery Section */}
          {mediaGalleryArray.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-50">
                <Camera className="w-4.5 h-4.5 text-[#6C47FF]" />
                <h4 className="text-xs font-black text-slate-800">📸 نمونه خروجی‌ها</h4>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {mediaGalleryArray.map((url, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      const originalUrl = url.replace("thumbnail-", "gallery-");
                      setLightboxImage(originalUrl);
                    }}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs cursor-pointer block"
                  >
                    <img 
                      src={url} 
                      alt={`${prompt.title} - نمونه خروجی ${index + 1}`} 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 cursor-pointer hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                        🔍 بزرگنمایی
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Taxonomy Block */}
          <div className="hidden lg:block">
            <TaxonomyBlock prompt={prompt} />
          </div>

          {/* SEO Performance Visual Card Accordion */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all duration-300">
            <button
              onClick={() => setShowSeoAccordion(!showSeoAccordion)}
              className="w-full flex items-center justify-between p-5 text-right font-sans focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-[#6C47FF]" />
                <h4 className="text-xs font-black text-slate-300">نمایه‌سازی موتورهای جستجو (SEO Preview)</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-emerald-400 font-black px-2 py-0.5 bg-emerald-500/10 rounded">فعال و بهینه</span>
                <span className="text-slate-400 text-xs">{showSeoAccordion ? "▲" : "▼"}</span>
              </div>
            </button>

            {showSeoAccordion && (
              <div className="p-5 pt-0 border-t border-slate-800 space-y-4 text-left font-mono" style={{ direction: "ltr" }}>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block text-right" style={{ direction: "rtl" }}>Google SERP Title (بهینه شده):</span>
                    <p className="text-xs text-sky-400 font-bold hover:underline cursor-pointer leading-tight">
                      {prompt.title} | قالب آماده هوش مصنوعی Promty.ir
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block text-right" style={{ direction: "rtl" }}>SEO Meta Description:</span>
                    <p className="text-[11px] text-slate-400 leading-normal text-right" style={{ direction: "rtl" }}>
                      دانلود، ویرایش و کپی سریع پرامپت مهندسی‌شده "{prompt.title}" مخصوص {prompt.tools?.join("، ") || "هوش مصنوعی"}. {prompt.description || "بهترین نتایج خروجی در کوتاهترین زمان."}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block text-right" style={{ direction: "rtl" }}>URL Slug:</span>
                    <p className="text-[10px] text-[#6C47FF] hover:underline cursor-pointer">
                      https://promty.ir/prompts/{prompt.id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Core Interactive Textbox, Versioning, Dynamic Wizard, Mock Outputs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main prompt code block */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            
            {/* Version select tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#6C47FF]" />
                  <span>نسخه‌های مهندسی‌شده این پرامپت</span>
                </span>
                <p className="text-[10px] text-slate-400 font-semibold">متناسب با معماری یا خروجی مد نظرتان نسخه مناسب را انتخاب کنید</p>
              </div>

              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-1 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => handleVersionChange("v1")}
                  className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    selectedVersion === "v1"
                      ? "bg-white text-[#6C47FF] shadow-sm border border-slate-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  نسخه اصلی (V1)
                </button>
                {isImagePrompt && (
                  <button
                    onClick={() => handleVersionChange("v2")}
                    className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-xs font-black transition ${
                      selectedVersion === "v2"
                        ? "bg-white text-[#6C47FF] shadow-sm border border-slate-100"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    نسخه سینمایی (V2)
                  </button>
                )}
                {isCoding && (
                  <button
                    onClick={() => handleVersionChange("v3")}
                    className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-xs font-black transition ${
                      selectedVersion === "v3"
                        ? "bg-white text-[#6C47FF] shadow-sm border border-slate-100"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    قالب توسعه (V3)
                  </button>
                )}
              </div>
            </div>

            {/* Prompt Textbox */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="prompt-box-area" className="text-xs font-black text-slate-400">متن پرامپت نهایی:</label>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                  {prompt.usageCount} کپی و بررسی موفقیت‌آمیز
                </span>
              </div>
              <textarea
                id="prompt-box-area"
                rows={9}
                value={renderedBody}
                onChange={(e) => setRenderedBody(e.target.value)}
                className="w-full p-4.5 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed rounded-2xl ring-4 ring-slate-900/5 focus:outline-none focus:ring-4 focus:ring-[#6C47FF]/20 text-left"
                style={{ direction: "ltr" }}
                placeholder="متن کامل پرامپت در این قسمت بارگذاری می‌شود..."
              />
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <CopyButton text={renderedBody} onCopy={handleTrackCopy} className="flex-1 text-sm py-4" />

              <button
                onClick={() => handleRunExternal(renderedBody)}
                className="flex items-center justify-center gap-2 px-5 py-4 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer transition-all duration-300 shadow-md shadow-emerald-600/10 flex-1"
              >
                <span>▶️ اجرا در {prompt.tools && prompt.tools.length > 0 ? prompt.tools[0] : "ابزار هوش مصنوعی"}</span>
              </button>
              
              {prompt.fieldsSchema && prompt.fieldsSchema.length > 0 && (
                <button
                  id="toggle-wizard-btn"
                  onClick={() => setShowWizard(!showWizard)}
                  className={`flex items-center justify-center gap-2 px-5 py-4 text-sm font-black rounded-xl cursor-pointer transition-all duration-300 shadow-sm shrink-0 ${
                    showWizard
                      ? "bg-slate-800 text-white"
                      : "bg-[#6C47FF] hover:bg-[#5935e6] text-white shadow-md shadow-[#6C47FF]/20"
                  }`}
                >
                  <Wand2 className="w-5 h-5" />
                  <span>شخصی‌سازی مقادیر متغیر پرامپت ✏️</span>
                </button>
              )}
            </div>

            {/* Live Wizard Form (Toggleable Section) */}
            {showWizard && prompt.fieldsSchema && prompt.fieldsSchema.length > 0 && (
              <div className="pt-2">
                <PromptWizard
                  fields={prompt.fieldsSchema}
                  promptBody={renderedBody}
                  onRendered={(rendered) => setRenderedBody(rendered)}
                />
              </div>
            )}
          </div>

          {/* Mobile Taxonomy block */}
          <div className="block lg:hidden mt-6">
            <TaxonomyBlock prompt={prompt} />
          </div>

          {/* AI Refinement Panel */}
          <div className="bg-gradient-to-r from-[#6C47FF]/10 to-indigo-50/20 border border-[#6C47FF]/20 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#6C47FF] animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-slate-800">ارتقای هوشمند پرامپت با Agentیک n8n</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">افزودن خودکار متغیرهای حرفه‌ای، عکاسی ۳ بعدی و دستورالعمل‌های نهایی‌سازی موتور هوش مصنوعی</p>
                </div>
              </div>
              
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isn8nConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {isn8nConfigured ? "عامل متصل" : "محلی فعال"}
              </span>
            </div>

            <button
              onClick={handleRefinePrompt}
              disabled={refineLoading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-[#6C47FF] hover:text-[#5935e6] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition border-2 border-[#6C47FF]/30 cursor-pointer shadow-sm"
            >
              {refineLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#6C47FF]" />
              ) : (
                <Wand2 className="w-4 h-4 text-[#6C47FF]" />
              )}
              <span>ارتقا و بهبود فوری این پرامپت با عامل n8n 🤖✨</span>
            </button>
          </div>

          {/* Incremental Version Timeline / History Log */}
          {refineHistory.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-50">
                <Layers className="w-4 h-4 text-[#6C47FF]" />
                <h4 className="text-xs font-black text-slate-800">تاریخچه و سوابق تغییرات پرامپت (Version Log)</h4>
              </div>

              <div className="space-y-3">
                {refineHistory.map((historyItem, idx) => {
                  const isCurrent = renderedBody === historyItem.body;
                  return (
                    <div 
                      key={idx}
                      onClick={() => setRenderedBody(historyItem.body)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer text-right flex items-center justify-between gap-3 ${
                        isCurrent 
                          ? "bg-indigo-50/50 border-[#6C47FF] ring-2 ring-[#6C47FF]/10" 
                          : "bg-slate-50 border-slate-200/60 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="space-y-1">
                        <p className={`text-xs font-black ${isCurrent ? "text-[#6C47FF]" : "text-slate-700"}`}>
                          {historyItem.versionName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold">{historyItem.timestamp}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="bg-[#6C47FF]/10 text-[#6C47FF] text-[9px] font-black px-2 py-0.5 rounded-lg border border-[#6C47FF]/20">
                            فعال در ادیتور
                          </span>
                        )}
                        <span className="text-[10px] text-[#6C47FF] hover:underline transition font-bold">
                          بازیابی نسخه 🔄
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Processing Feedback */}
          {refineLoading && (
            <div className="bg-slate-900 text-slate-200 border border-[#6C47FF]/30 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 text-center animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-[#6C47FF]" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">در حال پردازش پرامپت و همگام‌سازی با n8n...</p>
                <p className="text-xs text-slate-400 font-mono mt-1">{loadingStep}</p>
              </div>
            </div>
          )}

          {/* Side by side comparison (Before & After) */}
          {refinedPrompt && (
            <div className="bg-white border border-[#6C47FF]/20 rounded-3xl p-6 space-y-6 shadow-sm animate-fade-in text-right">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <span>🔮</span>
                    <span>مقایسه نهایی قبل و بعد پرامپت هوشمند</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">دستیار هوشمند کلمات کلیدی، جزئیات پس‌زمینه و ابزارهای حرفه‌ای عکاسی را به پرامپت شما افزوده است</p>
                </div>
                <span className="text-[10px] text-[#6C47FF] bg-[#6C47FF]/10 px-2.5 py-1 rounded-full font-bold shrink-0">
                  عامل بهینه‌سازی فعال
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-slate-500 text-xs font-bold bg-slate-200/50 px-2.5 py-0.5 rounded inline-block">پرامپت خام اولیه (قبل)</span>
                    <div className="text-xs text-slate-600 bg-white border border-slate-100 p-3.5 rounded-xl font-mono leading-relaxed overflow-y-auto max-h-[140px] text-left" style={{ direction: "ltr" }}>
                      {originalBeforeRefining}
                    </div>
                  </div>
                  <CopyButton text={originalBeforeRefining} label="کپی پرامپت اولیه" className="w-full text-xs py-2 bg-slate-200 hover:bg-slate-300 text-slate-700" />
                </div>

                <div className="bg-slate-900 border-2 border-[#6C47FF]/30 rounded-2xl p-4 space-y-3 flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <div className="space-y-2 z-10 w-full">
                    <span className="text-white text-xs font-bold bg-[#6C47FF]/20 border border-[#6C47FF]/30 px-2.5 py-0.5 rounded inline-flex items-center gap-1">
                      <span>🚀</span>
                      <span>پرامپت ارتقا یافته با هوش مصنوعی (بعد)</span>
                    </span>
                    <div className="text-xs text-emerald-300 bg-slate-950/80 border border-[#6C47FF]/20 p-3.5 rounded-xl font-mono leading-relaxed overflow-y-auto max-h-[140px] text-left" style={{ direction: "ltr" }}>
                      {refinedPrompt}
                    </div>
                  </div>
                  <CopyButton text={refinedPrompt} label="کپی پرامپت بهبودیافته" className="w-full text-xs py-2.5 bg-[#6C47FF] hover:bg-[#5935e6] text-white shadow-md font-bold" />
                </div>
              </div>
            </div>
          )}

          {/* Sample Output Mocking container Accordion */}
          {!isImagePrompt && (
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300">
              <button
                onClick={() => setShowOutputAccordion(!showOutputAccordion)}
                className="w-full flex items-center justify-between p-6 text-right font-sans focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4.5 h-4.5 text-[#6C47FF]" />
                  <h4 className="text-xs font-black text-slate-800">پیش‌نمایش خروجی نمونه (Sample Output Mock)</h4>
                </div>
                <span className="text-slate-400 text-xs">{showOutputAccordion ? "▲" : "▼"}</span>
              </button>

              {showOutputAccordion && (
                <div className="p-6 pt-0 border-t border-slate-50 space-y-4">
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">شبیه‌سازی گفت‌وگو و نمونه پاسخ دریافتی از مدل‌های متنی (مانند ChatGPT / Claude):</p>
                    
                    <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-100 space-y-4">
                      {/* User message */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">شما</div>
                        <div className="bg-slate-100 text-slate-700 text-xs p-3 rounded-2xl rounded-tr-none leading-relaxed shadow-xs flex-1">
                          {prompt.description || "درخواست تولید محتوا..."}
                        </div>
                      </div>

                      {/* AI message */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#6C47FF] text-white flex items-center justify-center font-bold text-xs shrink-0">AI</div>
                        <div className="bg-slate-900 text-slate-100 text-xs p-4 rounded-2xl rounded-tl-none leading-relaxed shadow-md flex-1 space-y-2 font-sans">
                          <p className="font-bold text-indigo-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>پاسخ شبیه‌سازی شده مدل هوشمند:</span>
                          </p>
                          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                            به عنوان یک مدل پردازش متن هوشمند، پاسخ این پرامپت دارای ساختار زیر است:{"\n"}
                            ۱. بهینه‌سازی ادبی متناسب با کلمات کلیدی مشخص شده{"\n"}
                            ۲. دسته‌بندی و فرمت خروجی به صورت بخش‌بندی منظم یا جدول{"\n"}
                            ۳. رعایت لحن و فریم‌ورک‌های مهندسی پرامپت جهت کپی مستقیم در پروژه‌های نهایی شما.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Operational Guidance Block */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3.5">
            <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-50">
              <BookOpen className="w-4.5 h-4.5 text-[#6C47FF]" />
              <h4 className="text-xs font-black text-slate-800">راهنمای استفاده و فوت‌وفن مهندسی پرامپت</h4>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 leading-relaxed font-sans">
              <li className="flex items-start gap-2">
                <span className="text-[#6C47FF] font-black mt-0.5">•</span>
                <span>همواره متغیرها را با علامت‌های مشخص شده مانند <code className="bg-slate-100 text-slate-700 px-1 rounded font-mono">[ ]</code> با جزئیات واقعی و فارسی روان جایگزین نمایید.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6C47FF] font-black mt-0.5">•</span>
                <span>در مدل‌های تصویرساز نظیر Midjourney، پارامترهای پایانی مانند <code className="bg-slate-100 text-slate-700 px-1 rounded font-mono">--ar 16:9</code> نسبت طول به عرض تصویر را مشخص می‌کنند که به سلیقه خودتان قابل ویرایش است.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6C47FF] font-black mt-0.5">•</span>
                <span>شخصی‌ساز هوشمند پرامپتی این امکان را به شما می‌دهد که مقادیر را بدون به هم ریختن ساختار کلی پرامپت کپی کنید.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Related Prompts Grid Section */}
      {relatedPrompts.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#6C47FF]" />
                <span>پرامپت‌های مکمل و پیشنهادی</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">پرامپت‌هایی با ابزارها یا موضوعات طبقه‌بندی شده مشابه که مکمل تسک فعلی شما هستند</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPrompts.map((p) => (
              <div key={p.id} className="transition duration-300 hover:-translate-y-1">
                <PromptCard prompt={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 cursor-pointer transition focus:outline-none"
            onClick={() => setLightboxImage(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Central Image */}
          <img 
            src={lightboxImage} 
            alt="نمای بزرگ تصویر" 
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}

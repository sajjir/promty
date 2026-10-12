import { getUseCase, resourceTypes, outputLabels } from "../lib/archiveCatalog";
import { getPromptCopyError } from "./PromptWizard";
import { usePromptLanguage } from "../lib/usePromptLanguage";
import React from "react";
import { Link } from "react-router-dom";
import { Prompt } from "../types";
import { Megaphone, Globe, Video, Camera, Sparkles, ArrowLeft, Bookmark, Copy } from "lucide-react";
import { getToolIcon, getDomainGradient } from "../lib/toolIcons";
import { useAuth } from "./AuthContext";

interface PromptCardProps {
  prompt: Prompt;
  isInitiallyBookmarked?: boolean;
  key?: any;
}

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
  "chatgpt": "ChatGPT",
  "claude": "Claude",
  "gemini": "Gemini",
  "grok": "Grok",
  "midjourney": "Midjourney",
  "flux": "Flux",
  "stable diffusion": "Stable Diffusion",
  "stable-diffusion": "Stable Diffusion",
  "ideogram": "Ideogram",
  "veo": "Veo",
  "kling": "Kling",
  "runway": "Runway",
  "elevenlabs": "ElevenLabs",
  "suno": "Suno",
  "n8n ai agent": "اتوماسیون n8n"
};

export default function PromptCard({ prompt, isInitiallyBookmarked }: PromptCardProps) {
  const { user, setPhoneModalOpen } = useAuth();
  const [isBookmarked, setIsBookmarked] = React.useState(isInitiallyBookmarked || false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [language] = usePromptLanguage();
  const [feedback, setFeedback] = React.useState("");
  React.useEffect(() => { if (!feedback) return; const timer = setTimeout(() => setFeedback(""), 2500); return () => clearTimeout(timer); }, [feedback]);

  React.useEffect(() => {
    if (isInitiallyBookmarked !== undefined) {
      setIsBookmarked(isInitiallyBookmarked);
    }
  }, [isInitiallyBookmarked]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setPhoneModalOpen(true, "برای نشان‌کردن پرامپت‌ها وارد شوید");
      return;
    }

    try {
      const res = await fetch(`/api/prompts/${prompt.id}/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsBookmarked(data.bookmarked);
        setFeedback(data.bookmarked ? "پرامپت نشان شد" : "پرامپت از نشان‌ها حذف شد");
      } else { setFeedback("نشان‌کردن انجام نشد؛ دوباره تلاش کنید"); }
    } catch (err) {
      setFeedback("خطا در نشان‌کردن پرامپت");
      console.error("Bookmark error:", err);
    }
  };

  const handleQuickCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const text = language === "fa" && prompt.bodyFa ? prompt.bodyFa : prompt.body;
      const error = getPromptCopyError(text);
      if (error) { setFeedback(error + " صفحه پرامپت را باز کنید."); return; }
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setFeedback("پرامپت کپی شد");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setFeedback("کپی انجام نشد؛ دوباره تلاش کنید");
      console.error("Failed to copy prompt body:", err);
    }
  };

  const categoryLabel = getUseCase(prompt.useCase)?.title || 'کاربرد تعیین نشده';
  const IconComponent = categoryIcons[categoryLabel] || Sparkles;

  // Three-level cover rendering waterfall
  let coverElement = null;

  if (prompt.coverImage) {
    coverElement = (
      <img
        src={prompt.coverImage}
        alt={prompt.title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  } else if (Array.isArray(prompt.mediaGallery) && prompt.mediaGallery.length > 0) {
    const firstGalleryUrl = prompt.mediaGallery[0];
    const thumbnailUrl = firstGalleryUrl.replace("gallery-", "thumbnail-");
    coverElement = (
      <img
        src={thumbnailUrl}
        alt={prompt.title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  } else {
    // Dynamic Fallback
    const firstDomain = prompt.domains && prompt.domains.length > 0 ? prompt.domains[0] : undefined;
    const gradientClasses = getDomainGradient(firstDomain);
    const firstTool = prompt.tools && prompt.tools.length > 0 ? prompt.tools[0] : undefined;
    const ToolIcon = getToolIcon(firstTool);

    coverElement = (
      <div className={`w-full h-48 bg-gradient-to-tr ${gradientClasses} flex items-center justify-center transition-all duration-500 group-hover:scale-105`}>
        <ToolIcon className="w-16 h-16 text-white opacity-50" />
      </div>
    );
  }

  return (
    <div
      id={`prompt-card-${prompt.id}`}
      className="bg-surface rounded-xl overflow-hidden border border-line hover:border-line transition-all duration-300 hover:shadow-md flex flex-col h-full group"
    >
      <div role="status" aria-live="polite" className={feedback ? "bg-surface-elevated text-primary px-3 py-2 text-xs font-bold border-b border-line" : "sr-only"}>{feedback}</div>
      {/* Sample Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-soft">
        <Link to={`/prompts/${prompt.id}`} className="block w-full h-full">
          {coverElement}
        </Link>

        {/* Bookmark Toggle Button */}
        <button
          onClick={handleBookmarkClick}
          className="absolute top-3 left-3 p-1.5 rounded-lg bg-surface/90 hover:bg-surface text-secondary hover:text-brand backdrop-blur-xs shadow-sm hover:shadow-md transition cursor-pointer z-10"
          title={isBookmarked ? "حذف از نشان‌شده‌ها" : "نشان کردن پرامپت"}
        >
          <Bookmark className={`w-4 h-4 transition-colors ${isBookmarked ? "fill-amber-500 text-caution-text" : ""}`} />
        </button>

        {/* Quick Copy Button */}
        <button
          onClick={handleQuickCopy}
          className={`absolute top-3 left-12 p-1.5 rounded-lg bg-surface/90 hover:bg-surface text-secondary backdrop-blur-xs shadow-sm hover:shadow-md transition cursor-pointer z-10 ${isCopied ? "text-success-text" : "hover:text-brand"}`}
          title={isCopied ? "کپی شد!" : "کپی سریع پرامپت"}
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Premium / Free Badge */}
        <span
          className={`absolute top-3 right-3 px-2 py-1 text-xs font-bold rounded-lg shadow-sm ${
            prompt.isPremium
              ? "bg-brand-solid text-white"
              : "bg-emerald-500 text-white"
          }`}
        >
          {prompt.isPremium ? "ویژه" : "رایگان"}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2 text-xs text-muted mb-2"><span>{resourceTypes[prompt.resourceType || 'prompt']}</span>{prompt.isDemo && <span className="text-brand">نمونه آزمایشی</span>}</div>
        {/* Main use case */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-muted text-xs">
            <IconComponent className="w-3.5 h-3.5 text-brand" />
            <span className="font-bold">{categoryLabel}</span>

          </div>
          {prompt.difficulty && (
            <span className="text-[10px] text-muted font-bold px-2 py-0.5 bg-surface-soft rounded">
              {TRANSLATIONS[prompt.difficulty.toLowerCase()] || prompt.difficulty}
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/prompts/${prompt.id}`} className="block">
          <h3 className="text-lg font-bold text-primary line-clamp-1 group-hover:text-brand transition-colors mb-2 flex items-center gap-1.5">
            {prompt.parentId && (
              <span className="text-xs bg-caution-soft text-caution-text border border-caution-text/50 px-1.5 py-0.5 rounded-md font-black shrink-0" title="نسخه انشعاب یافته">
                🔄 انشعاب
              </span>
            )}
            <span>{prompt.title}</span>
          </h3>
        </Link>

        {/* Description */}
        <p className="text-muted text-sm line-clamp-2 leading-relaxed mb-4 flex-1 text-right">
          {prompt.description || "توضیحی برای این پرامپت ثبت نشده است."}
        </p>

        {/* Metadata Badges tag */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {!!prompt.tools?.length && <span className="text-[10px] text-muted font-medium bg-surface-soft px-2 py-0.5 rounded">ابزار: {prompt.tools.slice(0, 2).join('، ')}{prompt.tools.length > 2 ? ` +${prompt.tools.length - 2}` : ''}</span>}
          {(prompt.outputFormats && prompt.outputFormats.length > 0) && (
            <span className="text-[10px] text-muted font-medium bg-surface-soft px-2 py-0.5 rounded">
              خروجی: {prompt.outputFormats.slice(0, 2).map(value => outputLabels[value] || value).join('، ')}
            </span>
          )}
          {prompt.language && (
            <span className="text-[10px] text-muted font-medium bg-surface-soft px-2 py-0.5 rounded">
              زبان: {TRANSLATIONS[prompt.language?.toLowerCase()] || prompt.language}
            </span>
          )}
        </div>

        {/* Footer info & Button */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-line">
          <span className="text-muted text-xs font-mono">
            {prompt.usageCount} استفاده
          </span>

          <Link
            id={`view-btn-${prompt.id}`}
            to={`/prompts/${prompt.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-brand hover:translate-x-[-4px] transition-transform duration-200"
          >
            <span>مشاهده و استفاده</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

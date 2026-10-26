import { promptImageAlt } from '../lib/promptImages';
import { getUseCase, resourceTypes, outputLabels } from "../lib/archiveCatalog";
import { getPromptCopyError } from "./PromptWizard";
import { usePromptLanguage } from "../lib/usePromptLanguage";
import React from "react";
import { Link } from "react-router-dom";
import { Prompt } from "../types";
import { Megaphone, Globe, Video, Camera, Sparkles, ArrowLeft, Bookmark, Copy, Check, ImagePlus } from "lucide-react";
import { getToolIcon, getDomainGradient } from "../lib/toolIcons";
import { useAuth } from "./AuthContext";
import { resourceTypeIcons } from "../lib/resourceTypeIcons";

interface PromptCardProps {
  prompt: Prompt;
  isInitiallyBookmarked?: boolean;
  key?: any;
  variant?: "grid" | "fan";
  idPrefix?: string;
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

export default function PromptCard({ prompt, isInitiallyBookmarked, variant = "grid", idPrefix }: PromptCardProps) {
  const { user, setPhoneModalOpen } = useAuth();
  const [isBookmarked, setIsBookmarked] = React.useState(isInitiallyBookmarked || false);
  const [usageCount, setUsageCount] = React.useState(prompt.usageCount || 0);
  React.useEffect(() => setUsageCount(prompt.usageCount || 0), [prompt.usageCount]);
  React.useEffect(() => {
    const syncCopy = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.id === prompt.id && typeof detail.usageCount === 'number') setUsageCount(detail.usageCount);
    };
    window.addEventListener('promty:prompt-copied', syncCopy);
    return () => window.removeEventListener('promty:prompt-copied', syncCopy);
  }, [prompt.id]);
  const cardId = idPrefix ? `${idPrefix}-${prompt.id}` : prompt.id;
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
        window.dispatchEvent(new CustomEvent('promty:bookmark-changed', { detail: { id: prompt.id, bookmarked: data.bookmarked } }));
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
      void fetch(`/api/prompts/${prompt.id}/track-copy`, { method: 'POST' }).then(res => res.ok ? res.json() : null).then(data => {
        if (data?.success && typeof data.usageCount === 'number') {
          setUsageCount(data.usageCount);
          window.dispatchEvent(new CustomEvent('promty:prompt-copied', { detail: { id: prompt.id, usageCount: data.usageCount } }));
        }
      }).catch(() => {});
      setIsCopied(true);
      setFeedback("پرامپت کپی شد");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setFeedback("کپی انجام نشد؛ دوباره تلاش کنید");
      console.error("Failed to copy prompt body:", err);
    }
  };

  const ResourceIcon = resourceTypeIcons[prompt.resourceType || 'prompt'];
  const categoryLabel = getUseCase(prompt.useCase)?.title || 'کاربرد تعیین نشده';
  const IconComponent = categoryIcons[categoryLabel] || Sparkles;

  if (variant === 'fan') {
    const tones = [['#b88b57','#71502f'],['#be7952','#73472f'],['#8696b1','#414d68'],['#b65d53','#732e2a'],['#a69b7c','#625a45'],['#8b6aac','#4c366b'],['#69978c','#354f4b']];
    const toneIndex = Array.from(prompt.id).reduce((sum, char) => sum + char.charCodeAt(0),0) % tones.length;
    const [tone,dark] = tones[toneIndex];
    const cover = prompt.coverImage || prompt.mediaGallery?.[0]?.replace('gallery-','thumbnail-');
    const Symbol = getToolIcon(prompt.tools?.[0]);
    return <article id={`prompt-card-${cardId}`} className="prompt-fan-card"
      style={{'--fan-tone':tone,'--fan-dark':dark} as React.CSSProperties}>
      {cover && <img className="prompt-fan-cover" src={cover} alt={promptImageAlt(prompt)} width={600} height={800} loading="lazy" draggable={false} referrerPolicy="no-referrer" />}
      <div className="prompt-fan-scrim" aria-hidden="true" />
      {!cover && <Symbol className="prompt-fan-symbol" aria-hidden="true" />}
      <div className="prompt-fan-content">
        <div className="prompt-fan-topline">
          <span className="prompt-fan-resource"><ResourceIcon size={13} aria-hidden="true" />{resourceTypes[prompt.resourceType || 'prompt'].split(' · ')[0]}</span>
          <span className="prompt-fan-badge">{prompt.isPremium ? 'ویژه' : 'رایگان'}</span>
        </div>
        <h3 className="prompt-fan-title line-clamp-3">{prompt.title}</h3>
        <Link to={prompt.useCase?`/use-case/${prompt.useCase}`:'/'} className="prompt-fan-category line-clamp-2" onClick={e=>e.stopPropagation()}>{categoryLabel}</Link>
        {prompt.requiresReferenceImage === true && <span data-reference-image="required" className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-white/30 bg-black/20 px-2 py-1 text-[10px] text-white">
          <ImagePlus className="h-3 w-3 shrink-0" aria-hidden="true" />نیازمند تصویر ورودی
        </span>}
        <div className="prompt-fan-bottom">
          <p className="prompt-fan-description line-clamp-2">{prompt.description || 'پرامپت را باز کنید و برای کار خود شخصی‌سازی کنید.'}</p>
          <div className="prompt-fan-meta">
            {Array.from(new Set(prompt.tools || [])).slice(0,3).map(tool => {
              const Tool = getToolIcon(tool); const name = TRANSLATIONS[tool.toLowerCase()] || tool;
              return <span key={tool} role="img" aria-label={name} title={name}><Tool aria-hidden="true" /></span>;
            })}
            <span>{(prompt.outputFormats || []).slice(0,2).map(v => outputLabels[v] || v).join('، ')}</span>
            <span className="mr-auto">{usageCount.toLocaleString('fa-IR')} کپی</span>
          </div>
          <div className="prompt-fan-footer">
            <Link id={`view-btn-${cardId}`} to={`/prompts/${prompt.id}`} className="prompt-fan-open" draggable={false} aria-label={`مشاهده و استفاده از ${prompt.title}`}>
              مشاهده و استفاده <ArrowLeft size={14} aria-hidden="true" />
            </Link>
            <div className="prompt-fan-actions">
              <button type="button" className="prompt-fan-action" onClick={handleBookmarkClick}
                aria-label={isBookmarked ? 'حذف از نشان‌شده‌ها' : 'نشان کردن پرامپت'} aria-pressed={isBookmarked}>
                <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} aria-hidden="true" />
              </button>
              <button type="button" className="prompt-fan-action" onClick={handleQuickCopy} aria-label={isCopied ? 'کپی شد!' : 'کپی سریع پرامپت'}>
                {isCopied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className={feedback ? 'prompt-fan-feedback' : 'sr-only'} role="status" aria-live="polite">{feedback}</div>
    </article>;
  }

  // Three-level cover rendering waterfall
  let coverElement = null;

  if (prompt.coverImage) {
    coverElement = (
      <img
        src={prompt.coverImage}
        alt={promptImageAlt(prompt)}
        width={1600} height={900}
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
        alt={promptImageAlt(prompt)}
        width={1600} height={900}
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
      id={`prompt-card-${cardId}`}
      className="relative isolate bg-surface rounded-xl overflow-hidden border border-line hover:border-line transition-all duration-300 hover:shadow-md flex flex-col h-full group"
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
        <div className="flex flex-wrap gap-2 text-xs text-muted mb-2"><span className="inline-flex items-center gap-1"><ResourceIcon className="h-3.5 w-3.5" aria-hidden="true" />{resourceTypes[prompt.resourceType || 'prompt']}</span>{prompt.isDemo && <span className="text-brand">نمونه آزمایشی</span>}</div>
        {/* Main use case */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-muted text-xs">
            <IconComponent className="w-3.5 h-3.5 text-brand" />
            <Link to={prompt.useCase?`/use-case/${prompt.useCase}`:'/'} className="font-bold hover:text-brand">{categoryLabel}</Link>

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
          {prompt.requiresReferenceImage === true && <span data-reference-image="required" className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">
            <ImagePlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />نیازمند تصویر ورودی
          </span>}
          {!!prompt.tools?.length && <span className="flex flex-wrap items-center gap-1" role="group" aria-label="ابزارهای سازگار">
            {Array.from(new Set(prompt.tools)).map(tool => {
              const ToolIcon = getToolIcon(tool);
              const name = TRANSLATIONS[tool.toLowerCase()] || tool;
              return <span key={tool} role="img" aria-label={name} title={name} className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-soft text-secondary">
                <ToolIcon className="h-4 w-4" aria-hidden="true" />
              </span>;
            })}
          </span>}
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
            {usageCount} کپی
          </span>

          <Link
            id={`view-btn-${cardId}`}
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

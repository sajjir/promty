import IranIcon from "../components/IranIcon";
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Prompt } from "../types";
import PromptWizard from "../components/PromptWizard";
import { renderPrompt } from "../lib/renderPrompt";
import CopyButton from "../components/CopyButton";
import PromptCard from "../components/PromptCard";
import { useAuth } from "../components/AuthContext";
import { Z } from "../lib/zIndex";
import {
  ChevronRight, Megaphone, Globe, Video, Camera, Sparkles,
  Wand2, PlayCircle, Loader2, Copy, Layers, Eye, Compass,
  HelpCircle, MessageSquare, BookOpen, Search, Share2, Tag,
  Info, Cpu, Check, FileCode, CheckCircle2, ChevronLeft, Trash2,
  Pencil, X, Bookmark
} from "lucide-react";

function parseOption(opt: string) {
  const parts = opt.split("|");
  if (parts.length > 1) {
    return {
      value: parts[0].trim(),
      label: parts[1].trim()
    };
  }
  return {
    value: opt.trim(),
    label: opt.trim()
  };
}

function renderHighlightedNodes(body: string, values: Record<string, string>): React.ReactNode[] {
  const regex = /\{\{(\w+)\}\}|\[\[(\w+)\]\]/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(body)) !== null) {
    const placeholderKey = match[1] || match[2];
    if (match.index > lastIndex) {
      nodes.push(<React.Fragment key={key++}>{body.slice(lastIndex, match.index)}</React.Fragment>);
    }
    const value = values[placeholderKey];
    if (value !== undefined && value !== "") {
      nodes.push(
        <span
          key={key++}
          className="text-caution-text border-b border-dashed border-caution-text/70"
          title="این بخش قابل شخصی‌سازی است"
        >
          {value}
        </span>
      );
    } else {
      nodes.push(<React.Fragment key={key++}>{match[0]}</React.Fragment>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < body.length) {
    nodes.push(<React.Fragment key={key++}>{body.slice(lastIndex)}</React.Fragment>);
  }
  return nodes;
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
  "medical": "سلامت و پزشکی",
  "health": "سلامت و پزشکی",
  "health & medical": "سلامت و پزشکی",
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
  "Medical": "سلامت و پزشکی",
  "Health": "سلامت و پزشکی",
  "Health & Medical": "سلامت و پزشکی",
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
    <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm space-y-4 text-right" dir="rtl">
      <div className="flex items-center gap-1.5 pb-2.5 border-b border-line">
        <Tag className="w-4 h-4 text-brand" />
        <h4 className="text-xs font-black text-primary">شناسنامه پرامپت</h4>
      </div>

      <div className="grid grid-cols-2 gap-3.5 text-xs text-secondary">
        {prompt.tools && prompt.tools.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted font-bold block">🛠️ ابزار هوش مصنوعی:</span>
            <div className="flex flex-wrap gap-1">
              {prompt.tools.map(t => (
                <Link
                  key={t}
                  to={`/?tool=${t}`}
                  className="bg-brand-soft text-brand px-2 py-0.5 rounded text-[10px] font-bold border border-brand/50 hover:ring-2 hover:ring-brand/50 transition-all cursor-pointer block"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        )}

        {prompt.domains && prompt.domains.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted font-bold block">🌐 حوزه کاری (Domain):</span>
            <div className="flex flex-wrap gap-1">
              {prompt.domains.map(d => (
                <Link
                  key={d}
                  to={`/?domain=${d}`}
                  className="bg-surface-soft text-secondary px-2 py-0.5 rounded text-[10px] font-bold hover:ring-2 hover:ring-brand/50 transition-all cursor-pointer block"
                >
                  {TRANSLATIONS[d] || TRANSLATIONS[d.toLowerCase()] || d}
                </Link>
              ))}
            </div>
          </div>
        )}

        {prompt.intent && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted font-bold block">🎯 قصد و هدف پرامپت:</span>
            <Link
              to={`/?intent=${prompt.intent}`}
              className="bg-success-soft text-success-text px-2 py-0.5 rounded text-[10px] font-bold border border-success-text/30 inline-block hover:ring-2 hover:ring-brand/50 transition-all cursor-pointer"
            >
              {TRANSLATIONS[prompt.intent] || TRANSLATIONS[prompt.intent.toLowerCase()] || prompt.intent}
            </Link>
          </div>
        )}

        {prompt.language && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted font-bold block">💬 زبان پرامپت:</span>
            <span className="bg-surface-soft text-secondary px-2 py-0.5 rounded text-[10px] font-bold inline-block">
              {TRANSLATIONS[prompt.language] || TRANSLATIONS[prompt.language.toLowerCase()] || prompt.language}
            </span>
          </div>
        )}

        {prompt.difficulty && (
          <div className="space-y-1 col-span-2">
            <span className="text-[10px] text-muted font-bold block">⚡ سطح تخصص مورد نیاز:</span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold inline-block border ${
              prompt.difficulty.toLowerCase() === "beginner" ? "bg-success-soft text-success-text border-success-text" :
              prompt.difficulty.toLowerCase() === "intermediate" ? "bg-info-soft text-info-text border-info-text" :
              prompt.difficulty.toLowerCase() === "advanced" ? "bg-caution-soft text-caution-text border-caution-text" :
              "bg-danger-soft text-danger-text border-danger-text"
            }`}>
              {TRANSLATIONS[prompt.difficulty] || TRANSLATIONS[prompt.difficulty.toLowerCase()] || prompt.difficulty}
            </span>
          </div>
        )}
      </div>

      {prompt.tags && prompt.tags.length > 0 && (
        <div className="pt-3 border-t border-line space-y-1.5">
          <span className="text-[10px] text-muted font-bold block">برچسب‌ها:</span>
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <Link
                key={tag}
                to={`/?tag=${tag}`}
                className="px-2 py-0.5 bg-surface-soft text-muted text-[10px] font-medium rounded border border-line hover:ring-2 hover:ring-brand/50 transition-all cursor-pointer block"
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
  const { user, setPhoneModalOpen } = useAuth();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [renderedBody, setRenderedBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [promptLang, setPromptLang] = useState<"en" | "fa">("fa");
  const [selectedRunTool, setSelectedRunTool] = useState<string>("");
  const [isManualEditMode, setIsManualEditMode] = useState(false);
  const [boxCopied, setBoxCopied] = useState(false);
  const [mobileCopied, setMobileCopied] = useState(false);

  useEffect(() => {
    if (prompt?.tools && prompt.tools.length > 0) {
      setSelectedRunTool(prompt.tools[0]);
    }
  }, [prompt]);

  useEffect(() => {
    if (!user || !id) {
      setIsBookmarked(false);
      return;
    }
    fetch("/api/user/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.bookmarks)) {
          const found = data.bookmarks.some((b: any) => b.promptId === id);
          setIsBookmarked(found);
        }
      })
      .catch((err) => console.error("Error fetching bookmark status:", err));
  }, [id, user]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      setPhoneModalOpen(true, "برای نشان‌کردن این پرامپت وارد شوید");
      return;
    }
    try {
      const res = await fetch(`/api/prompts/${id}/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsBookmarked(data.bookmarked);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  // Custom Prompt Presets (My Saved Presets) states
  const [presets, setPresets] = useState<any[]>([]);
  const [wizardValues, setWizardValues] = useState<Record<string, string>>({});
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Step 2: Live Preview State
  const [liveValues, setLiveValues] = useState<Record<string, string>>({});

  // Inline editing presets name states
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdatingPresetName, setIsUpdatingPresetName] = useState(false);

  // Wizard Ref for Smooth Scrolling
  const wizardRef = useRef<HTMLDivElement>(null);

  const fetchPresets = async () => {
    if (!user || !id) return;
    try {
      const res = await fetch(`/api/prompts/${id}/presets`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPresets(data.presets);
        }
      }
    } catch (err) {
      console.error("Failed to fetch presets:", err);
    }
  };

  const handleUpdatePresetNameSubmit = async (presetId: string) => {
    if (!editingName.trim()) return;
    try {
      setIsUpdatingPresetName(true);
      const res = await fetch(`/api/presets/${presetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: editingName.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPresets((prev) =>
            prev.map((p) => (p.id === presetId ? { ...p, name: data.preset.name } : p))
          );
          setEditingPresetId(null);
          setEditingName("");
        }
      }
    } catch (err) {
      console.error("Failed to update preset name:", err);
    } finally {
      setIsUpdatingPresetName(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, [id, user]);

  // Initialize wizardValues dictionary with appropriate defaults when prompt changes
  useEffect(() => {
    if (prompt && prompt.fieldsSchema) {
      const initial: Record<string, string> = {};
      prompt.fieldsSchema.forEach((field) => {
        if (field.type === "switch") {
          initial[field.key] = "خیر";
        } else if (field.type === "slider") {
          initial[field.key] = String(field.min ?? 10);
        } else if ((field.type === "select" || field.type === "radio") && field.options && field.options.length > 0) {
          initial[field.key] = parseOption(field.options[0]).value;
        } else {
          initial[field.key] = "";
        }
      });
      setWizardValues(initial);
      setLiveValues(initial);
      setActivePresetId(null);
    }
  }, [prompt]);

  const handleLoadPreset = (preset: any) => {
    setActivePresetId(preset.id);
    setWizardValues(preset.values);
    setLiveValues(preset.values);

    // Smooth Scroll to Wizard Form
    setTimeout(() => {
      wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("آیا از حذف این نسخه شخصی مطمئن هستید؟")) return;

    try {
      const res = await fetch(`/api/presets/${presetId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPresets(prev => prev.filter(p => p.id !== presetId));
          if (activePresetId === presetId) {
            setActivePresetId(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to delete preset:", err);
    }
  };

  const renderPresetsSection = () => {
    if (!user) return null;
    return (
      <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm space-y-4 text-right" dir="rtl">
        <div className="flex items-center gap-1.5 pb-2.5 border-b border-line">
          <Sparkles className="w-4 h-4 text-brand" />
          <h4 className="text-xs font-black text-primary">نسخه‌های شخصی من (My Presets)</h4>
        </div>

        {presets.length === 0 ? (
          <p className="text-[10px] text-muted font-semibold leading-relaxed">
            هنوز هیچ نسخه‌ای برای این پرامپت ذخیره نکرده‌اید. برای شروع مقادیر دلخواه خود را در فرم شخصی‌سازی وارد کرده و دکمه ذخیره نسخه را بزنید.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {presets.map((preset) => {
              const isActive = activePresetId === preset.id;
              const isEditing = editingPresetId === preset.id;
              const dateStr = new Date(preset.createdAt).toLocaleDateString("fa-IR", {
                month: "long",
                day: "numeric"
              });
              return (
                <div
                  key={preset.id}
                  onClick={() => !isEditing && handleLoadPreset(preset)}
                  className={`group relative p-3 rounded-2xl border transition-all cursor-pointer text-right flex items-center justify-between gap-2 ${
                    isActive
                      ? "bg-brand-soft/40 border-brand shadow-xs"
                      : "bg-surface-soft hover:bg-surface-soft/70 border-line"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          disabled={isUpdatingPresetName}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdatePresetNameSubmit(preset.id);
                            } else if (e.key === "Escape") {
                              setEditingPresetId(null);
                            }
                          }}
                          className="w-full text-xs p-1.5 bg-surface border border-brand rounded-lg outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdatePresetNameSubmit(preset.id)}
                          disabled={isUpdatingPresetName}
                          className="p-1.5 bg-success-soft text-success-text hover:bg-success-soft rounded-lg transition disabled:opacity-50 shrink-0"
                          title="تایید"
                        >
                          {isUpdatingPresetName ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPresetId(null)}
                          disabled={isUpdatingPresetName}
                          className="p-1.5 bg-surface-soft text-muted hover:bg-surface-inset rounded-lg transition disabled:opacity-50 shrink-0"
                          title="انصراف"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`text-[11px] font-black block truncate ${isActive ? 'text-brand' : 'text-primary'}`}>
                          {preset.name}
                        </span>
                        <span className="text-[9px] text-muted block">
                          تاریخ ثبت: {dateStr}
                        </span>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPresetId(preset.id);
                          setEditingName(preset.name);
                        }}
                        className="p-1.5 hover:bg-brand-soft text-muted hover:text-brand rounded-lg transition"
                        title="ویرایش نام"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePreset(preset.id, e)}
                        className="p-1.5 hover:bg-danger-soft text-muted hover:text-danger-text rounded-lg transition"
                        title="حذف نسخه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const isAdmin = !!localStorage.getItem("promty_admin_token");

  const handleRunExternal = async (textToRun: string, overrideTool?: string) => {
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
    const targetTool = overrideTool || (prompt?.tools && prompt.tools.length > 0 ? prompt.tools[0] : "");
    const toolLower = targetTool.toLowerCase();

    let baseUrl = "https://chatgpt.com/?q="; // Default
    if (targetTool) {
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
          const initialLang = "en";
          setPromptLang(initialLang);
          const initialBody = data.prompt.body;
          setRenderedBody(initialBody);
          setRefineHistory([
            {
              timestamp: new Date().toLocaleTimeString("fa-IR"),
              versionName: "نسخه اصلی اولیه (V1)",
              body: initialBody
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

  const displayValues = { ...liveValues };
  if (promptLang === 'fa') {
    for (const field of prompt?.fieldsSchema || []) {
      const option = field.options?.find(value => value.split('|')[0].trim() === liveValues[field.key]);
      if (option?.includes('|') && !/^\d+(?::\d+)?$/.test(liveValues[field.key] || '')) displayValues[field.key] = option.split('|')[1].trim();
    }
  }

  // Sync final rendered body with live template and wizard inputs
  useEffect(() => {
    if (prompt) {
      const baseTemplate = refinedPrompt || ((promptLang === "fa" && prompt.bodyFa) ? prompt.bodyFa : prompt.body);
      const finalRenderedText = renderPrompt(baseTemplate, displayValues);
      setRenderedBody(finalRenderedText);
    }
  }, [liveValues, refinedPrompt, prompt, promptLang]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-semibold">در حال بارگذاری ایمن جزئیات پرامپت مهندسی‌شده...</p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="bg-surface border border-line rounded-3xl p-12 text-center text-muted space-y-4 max-w-lg mx-auto shadow-sm">
        <Sparkles className="w-8 h-8 text-brand mx-auto animate-pulse" />
        <p className="text-sm font-semibold text-secondary">پرامپت مورد نظر پیدا نشد.</p>
        <Link to="/" className="inline-block text-xs bg-brand-solid text-white px-4 py-2.5 rounded-xl hover:bg-opacity-90 font-bold transition">
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
    <div className="space-y-8 pb-32 lg:pb-16 animate-fade-in text-right" dir="rtl">

      {/* Top Breadcrumb Nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-4 border border-line rounded-2xl shadow-xs">
        <nav className="flex items-center gap-1.5 text-xs text-muted font-bold">
          <Link to="/" className="hover:text-secondary transition">خانه</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-muted bg-surface-soft px-2 py-0.5 rounded-md border border-line">{prompt.category || "عمومی"}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary truncate max-w-[150px]">{prompt.title}</span>
        </nav>

        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkToggle}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              isBookmarked
                ? "bg-caution-soft text-caution-text border-caution-text"
                : "bg-surface text-secondary border-line hover:bg-surface-soft"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-500 text-caution-text" : ""}`} />
            <span>{isBookmarked ? "نشان شده" : "نشان کردن"}</span>
          </button>

          {isAdmin && (
            <Link
              to={`/admin/prompts/new?forkedFrom=${prompt.id}`}
              className="flex items-center gap-1.5 text-xs font-black text-caution-text bg-caution-soft border border-caution-text/50 hover:bg-caution-soft px-3 py-1.5 rounded-lg transition"
            >
              <span>🔄 ایجاد انشعاب (Fork)</span>
            </Link>
          )}

          <Link
            to="/"
            className="flex items-center gap-1 text-xs font-bold text-brand hover:bg-brand-solid/5 px-3 py-1.5 rounded-lg transition"
          >
            <span>بازگشت به آرشیو پرامپت‌ها</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {prompt.parent && (
        <div className="bg-caution-soft/40 border border-caution-text/50 text-caution-text px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs">
          <span>🔗 این پرامپت انشعابی از</span>
          <Link to={`/prompts/${prompt.parent.id}`} className="underline hover:text-caution-text transition font-black">
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
          <div className="bg-surface rounded-3xl overflow-hidden border border-line shadow-sm p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-brand font-black">
                <IconComponent className="w-4 h-4" />
                <span>دسته‌بندی: {prompt.category || "عمومی"}</span>
              </div>

              <h1 className="text-lg md:text-xl font-black text-primary leading-tight">
                {prompt.title}
              </h1>

              {/* Requires Reference Image Badge */}
              {prompt.requiresReferenceImage && (
                <div className="flex items-center gap-2 bg-danger-soft border border-danger-text text-danger-text px-3 py-2 rounded-xl text-xs font-black">
                  <span className="animate-pulse">⚠️</span>
                  <span>نیاز به تصویر منبع: این پرامپت به بارگذاری تصویر ورودی/منبع نیاز دارد.</span>
                </div>
              )}

              <p className="text-muted text-xs leading-relaxed">
                {prompt.description || "توضیحی برای این پرامپت مهندسی شده ثبت نشده است."}
              </p>
            </div>

            {(prompt.coverImage || prompt.sampleImage) && (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-surface-soft border border-line">
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
                <div className="w-full h-full flex flex-col items-center justify-center text-muted bg-gradient-to-br from-brand-soft/50 to-brand-soft/50 gap-2">
                  <PlayCircle className="w-12 h-12 text-brand/30" />
                  <span className="text-[10px] font-bold text-muted">بدون تصویر خروجی مستقیم</span>
                </div>
              )}
              {prompt.isPremium && (
                <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-md border border-caution-text/20">
                  پرامپت ویژه 🛡️
                </span>
              )}
            </div>
            )}
          </div>

          {/* Smart Media Gallery Section */}
          {mediaGalleryArray.length > 0 && (
            <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-line">
                <Camera className="w-4.5 h-4.5 text-brand" />
                <h4 className="text-xs font-black text-primary">📸 نمونه خروجی‌ها</h4>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {mediaGalleryArray.map((url, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      const originalUrl = url.replace("thumbnail-", "gallery-");
                      setLightboxImage(originalUrl);
                    }}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-surface-soft border border-line shadow-xs cursor-pointer block"
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


        </div>

        {/* Right Side: Core Interactive Textbox, Versioning, Dynamic Wizard, Mock Outputs */}
        <div className="lg:col-span-7 space-y-6">

          {/* Main prompt code block */}
          <div className="bg-surface rounded-3xl p-6 border border-line shadow-sm flex flex-col gap-5 z-10">

            {/* Live Wizard Form */}
            {prompt.fieldsSchema && prompt.fieldsSchema.length > 0 && (
              <div className="order-1 lg:order-3 pt-2" ref={wizardRef}>
                <PromptWizard
                  showCopyButton={false}
                  fields={prompt.fieldsSchema}
                  promptBody={refinedPrompt || ((promptLang === "fa" && prompt.bodyFa) ? prompt.bodyFa : prompt.body)}
                  onRendered={() => { /* Page renders the selected language centrally. */ }}
                  promptId={prompt.id}
                  activePresetId={activePresetId}
                  setActivePresetId={setActivePresetId}
                  values={wizardValues}
                  setValues={setWizardValues}
                  onPresetSavedOrUpdated={fetchPresets}
                  onValuesChange={setLiveValues}
                />
              </div>
            )}
            {/* Prompt Textbox */}
            <div className="order-2 lg:order-1 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <label htmlFor="prompt-box-area" className="text-xs font-black text-muted">متن پرامپت نهایی:</label>
                </div>
                <span className="text-[10px] font-mono text-muted bg-surface-soft px-2.5 py-1 rounded-md">
                  {prompt.usageCount} کپی و بررسی موفقیت‌آمیز
                </span>
              </div>

              <div role="group" aria-label="زبان نسخه پرامپت" className="grid grid-cols-2 gap-2 rounded-xl bg-surface-soft p-1 border border-line">
                <button type="button" aria-pressed={promptLang === 'fa'} disabled={!prompt.bodyFa} title={!prompt.bodyFa ? 'نسخه پارسی هنوز ثبت نشده است' : 'نسخه پارسی'} onClick={() => { setPromptLang('fa'); setRefinedPrompt(null); setIsManualEditMode(false); }} className={`flex min-h-11 items-center justify-center gap-1 rounded-lg px-1 text-xs font-bold disabled:opacity-40 ${promptLang === 'fa' ? 'bg-brand-solid text-white' : 'text-secondary'}`}>
                  <IranIcon /><span>نسخه پارسی</span>
                </button>
                <button type="button" aria-pressed={promptLang === 'en'} onClick={() => { setPromptLang('en'); setRefinedPrompt(null); setIsManualEditMode(false); }} className={`flex min-h-11 flex-wrap items-center justify-center gap-1 rounded-lg px-1 text-xs font-bold ${promptLang === 'en' ? 'bg-brand-solid text-white' : 'text-secondary'}`}><span aria-hidden="true">EN</span><span>English</span><small className="text-[9px]">(نسخه پیشنهادی)</small></button>
              </div>
              {!prompt.bodyFa && <p className="text-[11px] text-muted">نسخه پارسی هنوز ثبت نشده است.</p>}
              <div className="relative">
                {isManualEditMode ? (
                  <textarea
                    id="prompt-box-area"
                    rows={9}
                    value={renderedBody}
                    onChange={(e) => setRenderedBody(e.target.value)}
                    className={`w-full p-4.5 pt-11 bg-slate-900 text-muted text-[13px] leading-relaxed rounded-2xl ring-4 ring-line-strong/5 focus:outline-none focus:ring-4 focus:ring-brand/20 ${
                      promptLang === "fa" ? "text-right font-sans" : "text-left font-mono"
                    }`}
                    style={{ direction: promptLang === "fa" ? "rtl" : "ltr" }}
                  />
                ) : (
                  <div
                    id="prompt-display"
                    className={`w-full p-4 pt-12 bg-surface-inset text-primary text-sm leading-7 rounded-2xl whitespace-pre-wrap ${showFullPrompt ? "" : "max-h-[240px] overflow-hidden"} ${
                      promptLang === "fa" ? "text-right font-sans" : "text-left font-mono"
                    }`}
                    style={{ direction: promptLang === "fa" ? "rtl" : "ltr" }}
                  >
                    {renderHighlightedNodes(refinedPrompt || ((promptLang === "fa" && prompt.bodyFa) ? prompt.bodyFa : prompt.body), displayValues)}
                  </div>
                )}

                {/* دکمه کپی داخل خود باکس، بالا-گوشه (استاندارد گیت‌هاب/ChatGPT) */}
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(renderedBody);
                    handleTrackCopy?.();
                    setBoxCopied(true);
                    setTimeout(() => setBoxCopied(false), 2000);
                  }}
                  className={`hidden lg:flex absolute top-3 ${promptLang === "fa" ? "left-3" : "right-3"} flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-muted text-[10px] font-bold rounded-lg transition cursor-pointer z-20`}
                >
                  <Copy className="w-3 h-3" />
                  <span>{boxCopied ? "کپی شد! 🎉" : "کپی"}</span>
                </button>

                {/* دکمه سوئیچ حالت ویرایش دستی */}
                <button
                  type="button"
                  onClick={() => setIsManualEditMode(v => !v)}
                  className={`absolute top-3 ${promptLang === "fa" ? "right-3" : "left-3"} text-[10px] text-muted hover:text-muted font-bold transition cursor-pointer z-20`}
                >
                  {isManualEditMode ? "پایان ویرایش دستی" : "✏️ ویرایش دستی متن"}
                </button>
              </div>
              {!isManualEditMode && <button type="button" aria-expanded={showFullPrompt} aria-controls="prompt-display" className="text-xs font-bold text-brand min-h-11" onClick={() => setShowFullPrompt(v => !v)}>{showFullPrompt ? 'نمایش خلاصه' : 'نمایش کامل متن پرامپت'}</button>}
            </div>

             {/* Buttons Row */}
             <div className="order-3 lg:order-2 flex items-center justify-between pt-2">
               <div>
                 {/* Left side empty or metadata */}
               </div>

               {prompt.tools && prompt.tools.length > 1 ? (
                 <div className="flex items-center bg-surface-soft hover:bg-surface-inset rounded-lg text-secondary overflow-hidden transition-all text-xs shrink-0 border border-line shadow-xs">
                   <button
                     onClick={() => handleRunExternal(renderedBody, selectedRunTool)}
                     className="flex items-center gap-1 px-3 py-2 font-bold cursor-pointer border-l border-line-strong"
                   >
                     <span>▶️ {selectedRunTool}</span>
                   </button>
                   <select
                     value={selectedRunTool}
                     onChange={(e) => setSelectedRunTool(e.target.value)}
                     className="bg-transparent text-muted text-[10px] font-bold py-2 px-2 outline-none cursor-pointer border-none"
                   >
                     {prompt.tools.map((t) => (<option key={t} value={t}>{t}</option>))}
                   </select>
                 </div>
               ) : (
                 <button onClick={() => handleRunExternal(renderedBody)} className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-secondary bg-surface-soft hover:bg-surface-inset rounded-lg border border-line shadow-xs cursor-pointer shrink-0">
                   <span>▶️ {prompt.tools?.[0] || "اجرا"}</span>
                 </button>
               )}
             </div>


          </div>

          {/* My Saved Presets Section */}
          {renderPresetsSection()}

          {/* Mobile Taxonomy block */}
          <div className="block lg:hidden mt-6">
            <TaxonomyBlock prompt={prompt} />
          </div>

          <details className="rounded-3xl border border-line bg-surface p-4">
            <summary className="cursor-pointer text-sm font-bold text-secondary">گزینه‌های پیشرفته و تاریخچه</summary>
            <div className="space-y-6 pt-4">
          {/* SEO Performance Visual Card Accordion */}
          {isAdmin && (
            <div className="bg-slate-900 border border-line-strong rounded-3xl overflow-hidden shadow-lg transition-all duration-300">
              <button
                onClick={() => setShowSeoAccordion(!showSeoAccordion)}
                className="w-full flex items-center justify-between p-5 text-right font-sans focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-brand" />
                  <h4 className="text-xs font-black text-muted">نمایه‌سازی موتورهای جستجو (SEO Preview)</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-success-text font-black px-2 py-0.5 bg-emerald-500/10 rounded">فعال و بهینه</span>
                  <span className="text-muted text-xs">{showSeoAccordion ? "▲" : "▼"}</span>
                </div>
              </button>

              {showSeoAccordion && (
                <div className="p-5 pt-0 border-t border-line-strong space-y-4 text-left font-mono" style={{ direction: "ltr" }}>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted font-bold block text-right" style={{ direction: "rtl" }}>Google SERP Title (بهینه شده):</span>
                      <p className="text-xs text-info-text font-bold hover:underline cursor-pointer leading-tight">
                        {prompt.title} | قالب آماده هوش مصنوعی Promty.ir
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-muted font-bold block text-right" style={{ direction: "rtl" }}>SEO Meta Description:</span>
                      <p className="text-[11px] text-muted leading-normal text-right" style={{ direction: "rtl" }}>
                        دانلود، ویرایش و کپی سریع پرامپت مهندسی‌شده "{prompt.title}" مخصوص {prompt.tools?.join("، ") || "هوش مصنوعی"}. {prompt.description || "بهترین نتایج خروجی در کوتاهترین زمان."}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-muted font-bold block text-right" style={{ direction: "rtl" }}>URL Slug:</span>
                      <p className="text-[10px] text-brand hover:underline cursor-pointer">
                        https://promty.ir/prompts/{prompt.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Refinement Panel */}
          <div className="bg-gradient-to-r from-brand-solid/10 to-brand-soft/20 border border-brand/20 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-primary">ارتقای هوشمند پرامپت با Agentیک n8n</h4>
                  <p className="text-[10px] text-muted mt-0.5">افزودن خودکار متغیرهای حرفه‌ای، عکاسی ۳ بعدی و دستورالعمل‌های نهایی‌سازی موتور هوش مصنوعی</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isn8nConfigured ? 'bg-success-soft text-success-text' : 'bg-surface-soft text-muted'}`}>
                {isn8nConfigured ? "عامل متصل" : "محلی فعال"}
              </span>
            </div>

            <button
              onClick={handleRefinePrompt}
              disabled={refineLoading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-brand hover:text-brand font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition border-2 border-brand/30 cursor-pointer shadow-sm"
            >
              {refineLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
              ) : (
                <Wand2 className="w-4 h-4 text-brand" />
              )}
              <span>ارتقا و بهبود فوری این پرامپت با عامل n8n 🤖✨</span>
            </button>
          </div>

          {/* Incremental Version Timeline / History Log */}
          {refineHistory.length > 0 && (
            <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-line">
                <Layers className="w-4 h-4 text-brand" />
                <h4 className="text-xs font-black text-primary">تاریخچه و سوابق تغییرات پرامپت (Version Log)</h4>
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
                          ? "bg-brand-soft/50 border-brand ring-2 ring-brand/10"
                          : "bg-surface-soft border-line/60 hover:bg-surface-soft/50"
                      }`}
                    >
                      <div className="space-y-1">
                        <p className={`text-xs font-black ${isCurrent ? "text-brand" : "text-primary"}`}>
                          {historyItem.versionName}
                        </p>
                        <p className="text-[9px] text-muted font-bold">{historyItem.timestamp}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="bg-brand-solid/10 text-brand text-[9px] font-black px-2 py-0.5 rounded-lg border border-brand/20">
                            فعال در ادیتور
                          </span>
                        )}
                        <span className="text-[10px] text-brand hover:underline transition font-bold">
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
            <div className="bg-slate-900 text-muted border border-brand/30 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 text-center animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">در حال پردازش پرامپت و همگام‌سازی با n8n...</p>
                <p className="text-xs text-muted font-mono mt-1">{loadingStep}</p>
              </div>
            </div>
          )}

          {/* Side by side comparison (Before & After) */}
          {refinedPrompt && (
            <div className="bg-surface border border-brand/20 rounded-3xl p-6 space-y-6 shadow-sm animate-fade-in text-right">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-line">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-primary flex items-center gap-1.5">
                    <span>🔮</span>
                    <span>مقایسه نهایی قبل و بعد پرامپت هوشمند</span>
                  </h3>
                  <p className="text-[11px] text-muted font-semibold">دستیار هوشمند کلمات کلیدی، جزئیات پس‌زمینه و ابزارهای حرفه‌ای عکاسی را به پرامپت شما افزوده است</p>
                </div>
                <span className="text-[10px] text-brand bg-brand-solid/10 px-2.5 py-1 rounded-full font-bold shrink-0">
                  عامل بهینه‌سازی فعال
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-soft border border-line rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-muted text-xs font-bold bg-surface-inset/50 px-2.5 py-0.5 rounded inline-block">پرامپت خام اولیه (قبل)</span>
                    <div className="text-xs text-secondary bg-surface border border-line p-3.5 rounded-xl font-mono leading-relaxed overflow-y-auto max-h-[140px] text-left" style={{ direction: "ltr" }}>
                      {originalBeforeRefining}
                    </div>
                  </div>
                  <CopyButton text={originalBeforeRefining} label="کپی پرامپت اولیه" className="w-full text-xs py-2 bg-surface-inset hover:bg-surface-inset text-primary" />
                </div>

                <div className="bg-slate-900 border-2 border-brand/30 rounded-2xl p-4 space-y-3 flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <div className="space-y-2 z-10 w-full">
                    <span className="text-white text-xs font-bold bg-brand-solid/20 border border-brand/30 px-2.5 py-0.5 rounded inline-flex items-center gap-1">
                      <span>🚀</span>
                      <span>پرامپت ارتقا یافته با هوش مصنوعی (بعد)</span>
                    </span>
                    <div className="text-xs text-success-text bg-slate-950/80 border border-brand/20 p-3.5 rounded-xl font-mono leading-relaxed overflow-y-auto max-h-[140px] text-left" style={{ direction: "ltr" }}>
                      {refinedPrompt}
                    </div>
                  </div>
                  <CopyButton text={refinedPrompt} label="کپی پرامپت بهبودیافته" className="w-full text-xs py-2.5 bg-brand-solid hover:bg-brand-solid text-white shadow-md font-bold" />
                </div>
              </div>
            </div>
          )}

          {/* Sample Output Mocking container Accordion */}
          {!isImagePrompt && (
            <div className="bg-surface rounded-3xl overflow-hidden border border-line shadow-sm transition-all duration-300">
              <button
                onClick={() => setShowOutputAccordion(!showOutputAccordion)}
                className="w-full flex items-center justify-between p-6 text-right font-sans focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4.5 h-4.5 text-brand" />
                  <h4 className="text-xs font-black text-primary">پیش‌نمایش خروجی نمونه (Sample Output Mock)</h4>
                </div>
                <span className="text-muted text-xs">{showOutputAccordion ? "▲" : "▼"}</span>
              </button>

              {showOutputAccordion && (
                <div className="p-6 pt-0 border-t border-line space-y-4">
                  <div className="space-y-4">
                    <p className="text-xs text-muted leading-relaxed">شبیه‌سازی گفت‌وگو و نمونه پاسخ دریافتی از مدل‌های متنی (مانند ChatGPT / Claude):</p>

                    <div className="bg-surface-soft rounded-2xl p-4.5 border border-line space-y-4">
                      {/* User message */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-surface-inset flex items-center justify-center font-bold text-secondary text-xs shrink-0">شما</div>
                        <div className="bg-surface-soft text-primary text-xs p-3 rounded-2xl rounded-tr-none leading-relaxed shadow-xs flex-1">
                          {prompt.description || "درخواست تولید محتوا..."}
                        </div>
                      </div>

                      {/* AI message */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-solid text-white flex items-center justify-center font-bold text-xs shrink-0">AI</div>
                        <div className="bg-slate-900 text-muted text-xs p-4 rounded-2xl rounded-tl-none leading-relaxed shadow-md flex-1 space-y-2 font-sans">
                          <p className="font-bold text-brand flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-success-text" />
                            <span>پاسخ شبیه‌سازی شده مدل هوشمند:</span>
                          </p>
                          <p className="text-muted whitespace-pre-wrap leading-relaxed">
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
          <div className="bg-surface rounded-3xl p-6 border border-line shadow-sm space-y-3.5">
            <div className="flex items-center gap-1.5 pb-2.5 border-b border-line">
              <BookOpen className="w-4.5 h-4.5 text-brand" />
              <h4 className="text-xs font-black text-primary">راهنمای استفاده و فوت‌وفن مهندسی پرامپت</h4>
            </div>

            <ul className="space-y-3 text-xs text-secondary leading-relaxed font-sans">
              <li className="flex items-start gap-2">
                <span className="text-brand font-black mt-0.5">•</span>
                <span>همواره متغیرها را با علامت‌های مشخص شده مانند <code className="bg-surface-soft text-primary px-1 rounded font-mono">[ ]</code> با جزئیات واقعی و فارسی روان جایگزین نمایید.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-black mt-0.5">•</span>
                <span>در مدل‌های تصویرساز نظیر Midjourney، پارامترهای پایانی مانند <code className="bg-surface-soft text-primary px-1 rounded font-mono">--ar 16:9</code> نسبت طول به عرض تصویر را مشخص می‌کنند که به سلیقه خودتان قابل ویرایش است.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-black mt-0.5">•</span>
                <span>شخصی‌ساز هوشمند پرامپتی این امکان را به شما می‌دهد که مقادیر را بدون به هم ریختن ساختار کلی پرامپت کپی کنید.</span>
              </li>
            </ul>
          </div>

            </div>
          </details>

        </div>

      </div>

      {/* Related Prompts Grid Section */}
      {relatedPrompts.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-line">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-black text-primary flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand" />
                <span>پرامپت‌های مکمل و پیشنهادی</span>
              </h3>
              <p className="text-[11px] text-muted font-semibold">پرامپت‌هایی با ابزارها یا موضوعات طبقه‌بندی شده مشابه که مکمل تسک فعلی شما هستند</p>
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
          style={{ zIndex: Z.MODAL }}
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-muted p-2 cursor-pointer transition focus:outline-none"
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

      {/* Mobile Floating Sticky Bar (1:3 Ratio) */}
      <div className="fixed bottom-0 inset-x-0 px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] z-40 lg:hidden">
        <div className="flex items-center gap-2 w-full p-2 bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10">
          {/* Bookmark Button (25% width) */}
          <button
            onClick={handleBookmarkToggle}
            className="w-1/4 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-800 text-muted hover:bg-slate-700 active:scale-95 transition-all text-xs font-bold cursor-pointer"
            title={isBookmarked ? "نشان شده" : "افزودن به نشان‌شده‌ها"}
          >
            <Bookmark className={`w-4 h-4 transition-colors ${isBookmarked ? "fill-amber-400 text-caution-text" : "text-muted"}`} />
            <span className="text-[11px] truncate">{isBookmarked ? "نشان‌شده" : "نشان"}</span>
          </button>

          {/* Copy Button (75% width) */}
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(renderedBody);
              handleTrackCopy?.();
              setMobileCopied(true);
              setTimeout(() => setMobileCopied(false), 2000);
            }}
            className="w-3/4 flex items-center justify-center gap-2 py-3 bg-brand-solid hover:bg-brand-solid text-white rounded-xl shadow-lg shadow-brand/30 active:scale-95 transition-all text-sm font-black cursor-pointer"
          >
            {mobileCopied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>پرامپت کپی شد! 🎉</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>کپی نسخه {promptLang === "fa" ? "پارسی" : "انگلیسی"}</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

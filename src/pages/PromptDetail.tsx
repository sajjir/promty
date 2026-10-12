import { getUseCase, resourceTypes, outputLabels, useCasePath } from "../lib/archiveCatalog";
import Loader from "../components/Loader";
import { usePromptLanguage } from "../lib/usePromptLanguage";
import IranIcon from "../components/IranIcon";
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Prompt } from "../types";
import PromptWizard, { getPromptCopyError } from "../components/PromptWizard";
import { renderPrompt } from "../lib/renderPrompt";
import PromptCard from "../components/PromptCard";
import { useAuth } from "../components/AuthContext";
import { Z } from "../lib/zIndex";
import {
  ChevronRight, Megaphone, Globe, Video, Camera, Sparkles,
  PlayCircle, Copy, Compass,
  Tag,
  Check, ChevronLeft, Trash2,
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

function renderHighlightedNodes(body: string, values: Record<string, string>, changedKey?: string | null): React.ReactNode[] {
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
          data-prompt-field={placeholderKey}
          className={`scroll-mt-28 rounded px-0.5 text-caution-text border-b border-dashed border-caution-text/70 ${changedKey === placeholderKey ? 'bg-brand-solid/20 ring-2 ring-brand font-bold' : ''}`}
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
  "teaching": "یادگیری و آموزش", "learning": "یادگیری و آموزش",
  "writing": "نوشتن و تولید متن", "coding": "برنامه‌نویسی", "planning": "برنامه‌ریزی", "analysis": "تحلیل", "visual-generation": "تولید تصویر یا ویدیو",
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
        <div className="col-span-2"><span className="block text-muted">کاربرد اصلی</span><Link to={`/?useCase=${prompt.useCase || ''}`} className="text-brand">{useCasePath(prompt.useCase) || 'نیازمند تعیین کاربرد'}</Link></div>
        <div>نوع منبع: {resourceTypes[prompt.resourceType || 'prompt']}</div>
        <div>خروجی: {(prompt.outputFormats || []).map(value => outputLabels[value] || value).join('، ')}</div>
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
  const [preferredLanguage, setPromptLang] = usePromptLanguage();
  const isPersianOnly = !!prompt?.bodyFa && prompt.bodyFa === prompt.body;
  const promptLang = isPersianOnly || (preferredLanguage === "fa" && prompt?.bodyFa) ? "fa" : "en";
  const [selectedRunTool, setSelectedRunTool] = useState<string>("");
  const [isManualEditMode, setIsManualEditMode] = useState(false);
  const [boxCopied, setBoxCopied] = useState(false);
  const [mobileCopied, setMobileCopied] = useState(false);

  useEffect(() => {
    if (prompt?.tools && prompt.tools.length > 0) {
      setSelectedRunTool(prompt.tools[0]);
    }
  }, [prompt?.id]);

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
  }, [prompt?.id]);

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
                            <Loader className="w-3.5 h-3.5" />
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

  const [fieldChange, setFieldChange] = useState<{ key: string; type: string; sequence: number } | null>(null);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  useEffect(() => {
    if (!fieldChange) return;
    const delay = ['select', 'radio', 'switch', 'color'].includes(fieldChange.type) ? 100 : 700;
    const scrollTimer = window.setTimeout(() => {
      setShowFullPrompt(true);
      setIsManualEditMode(false);
      setHighlightedField(fieldChange.key);
    }, delay);
    return () => window.clearTimeout(scrollTimer);
  }, [fieldChange]);
  useEffect(() => {
    if (!highlightedField) return;
    const frame = requestAnimationFrame(() => {
      const target = Array.from(document.querySelectorAll<HTMLElement>('[data-prompt-field]')).find(element => element.dataset.promptField === highlightedField);
      (target || document.getElementById('prompt-text-section'))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    });
    const clearTimer = window.setTimeout(() => setHighlightedField(null), 3500);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(clearTimer); };
  }, [highlightedField, fieldChange]);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const isAdmin = !!localStorage.getItem("promty_admin_token");

  const [copyError, setCopyError] = useState<string | null>(null);
  const copyPromptText = async (text: string) => {
    const template = (promptLang === "fa" && prompt?.bodyFa ? prompt.bodyFa : prompt?.body || "");
    const error = getPromptCopyError(text, prompt?.fieldsSchema || [], liveValues, template);
    if (error) { setCopyError(error); return false; }
    try { await navigator.clipboard.writeText(text); }
    catch { setCopyError("کپی انجام نشد؛ دسترسی کلیپ‌بورد را بررسی کنید."); return false; }
    setCopyError(null);
    void handleTrackCopy();
    return true;
  };

  const handleRunExternal = async (textToRun: string, overrideTool?: string) => {
    if (!textToRun) return;

    if (!await copyPromptText(textToRun)) return;

    // 2. Determine target tool and URL
    const targetTool = overrideTool || (prompt?.tools && prompt.tools.length > 0 ? prompt.tools[0] : "");
    const toolLower = targetTool.toLowerCase();
    if (toolLower === "codex") { setCopyError("متن کپی شد؛ آن را در گفت‌وگوی Codex و پروژه موردنظر وارد کنید."); return; }

    let baseUrl = "";
    if (targetTool) {
      const matchedKey = Object.keys(RUN_URLS).find(k => toolLower.includes(k) || k.includes(toolLower));
      if (matchedKey) {
        baseUrl = RUN_URLS[matchedKey];
      } else if (["midjourney", "flux", "stable diffusion", "stable-diffusion", "ideogram", "mj", "عکاسی", "تصویر سازی"].some(x => toolLower.includes(x))) {
        baseUrl = "https://fal.ai/";
      }
    }

    if (!baseUrl) { setCopyError(`متن کپی شد؛ آن را در ابزار ${targetTool || "مقصد"} وارد کنید.`); return; }

    // 3. Construct URL and open in new tab
    const finalUrl = baseUrl.includes("?q=")
      ? `${baseUrl}${encodeURIComponent(textToRun)}`
      : baseUrl;

    window.open(finalUrl, "_blank");
  };

  // Accordion states

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

  const [relatedPrompts, setRelatedPrompts] = useState<Prompt[]>([]);
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
          const initialBody = data.prompt.body;
          setRenderedBody(initialBody);

        }

        // Fetch all prompts to extract related prompts matching tags, category, tools, or domains
        const allRes = await fetch("/api/prompts");
        if (allRes.ok) {
          const allData = await allRes.json();
          const list = allData.data || [];
          setAllPrompts(list);

          if (currentPrompt) {
            // Find related prompts: same category or sharing tags/tools/domains, excluding current prompt
            const related = list
              .filter((p: Prompt) => p.id !== currentPrompt?.id && p.isActive)
              .map((p: Prompt) => {
                let score = 0;
                if (currentPrompt?.useCase && p.useCase === currentPrompt.useCase) score += 20;
                if (getUseCase(p.useCase)?.group && getUseCase(p.useCase)?.group === getUseCase(currentPrompt?.useCase)?.group) score += 10;
                if (currentPrompt?.tools?.some(t => p.tools?.includes(t))) score += 4;
                if (currentPrompt?.domains?.some(d => p.domains?.includes(d))) score += 3;
                if (p.tags?.some(t => t !== 'نمونه آزمایشی' && currentPrompt?.tags?.includes(t))) score += 2;
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
      const baseTemplate = ((promptLang === "fa" && prompt.bodyFa) ? prompt.bodyFa : prompt.body);
      const finalRenderedText = renderPrompt(baseTemplate, displayValues);
      setRenderedBody(finalRenderedText);
    }
  }, [liveValues, prompt, promptLang]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted">
        <Loader className="w-8 h-8 text-brand" />
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
  const isImagePrompt = prompt.outputFormats?.includes("image") || false;

  const isCoding = prompt.outputFormats?.some(format => ['code', 'react', 'html', 'javascript', 'python', 'typescript', 'sql'].includes(format)) || false;
  const downloadResource = () => {
    const template = promptLang === 'fa' && prompt.bodyFa ? prompt.bodyFa : prompt.body;
    const error = getPromptCopyError(renderedBody, prompt.fieldsSchema || [], liveValues, template);
    if (error) { setCopyError(error); return; }
    setCopyError(null);
    const url = URL.createObjectURL(new Blob([renderedBody], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url;
    link.download = prompt.resourceType === 'skill' ? 'SKILL.md' : 'GUIDE.md';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };


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
    <div className="space-y-8 pb-32 lg:pb-32 animate-fade-in text-right" dir="rtl">

      {prompt.isDemo && <p role="note" className="rounded-xl border border-brand bg-brand-soft p-3 text-sm text-brand">نمونه آزمایشی برای بررسی آرشیو و شخصی‌سازی؛ کیفیت خروجی و سازگاری ابزارها هنوز تأیید نشده است.</p>}
      {prompt.resourceType && prompt.resourceType !== 'prompt' && <section aria-label="راهنمای دریافت منبع" className="rounded-xl border border-line bg-surface p-4 space-y-2">
        <h2 className="font-bold">{resourceTypes[prompt.resourceType]} — دریافت فایل Markdown</h2>
        <p className="text-sm text-muted">{prompt.resourceType === 'skill' ? 'پس از شخصی‌سازی، فایل SKILL.md را در پوشه یک مهارت در محیط سازگار قرار دهید و راهنمای داخل آن را بخوانید. دانلود، مهارت را نصب یا اجرا نمی‌کند.' : 'فایل GUIDE.md را به ایجنت معرفی کنید تا آن را بخواند. پیش از ادغام قواعد با راهنمای پروژه، محتوای آن را بررسی کنید.'}</p>
        <button onClick={downloadResource} className="rounded-lg bg-brand-solid text-white px-4 py-2">دریافت فایل {prompt.resourceType === 'skill' ? 'SKILL.md' : 'GUIDE.md'}</button>
      </section>}
      {/* Top Breadcrumb Nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-4 border border-line rounded-2xl shadow-xs">
        <nav className="flex items-center gap-1.5 text-xs text-muted font-bold">
          <Link to="/" className="hover:text-secondary transition">خانه</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={`/?useCase=${prompt.useCase || ""}`} className="text-muted bg-surface-soft px-2 py-0.5 rounded-md border border-line hover:text-brand focus-visible:ring-2 focus-visible:ring-brand">{getUseCase(prompt.useCase)?.title || "آرشیو"}</Link>
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

        {/* Right Side: Interactive prompt and personalization */}
        <div className="lg:col-span-7 space-y-6">

          {/* Main prompt code block */}
          <div className="bg-surface rounded-3xl p-6 border border-line shadow-sm flex flex-col gap-5 z-10">

            {/* Live Wizard Form */}
            {prompt.fieldsSchema && prompt.fieldsSchema.length > 0 && (
              <div className="order-3 pt-2" ref={wizardRef}>
                <PromptWizard
                  showCopyButton={false}
                  fields={prompt.fieldsSchema}
                  promptBody={((promptLang === "fa" && prompt.bodyFa) ? prompt.bodyFa : prompt.body)}
                  onRendered={() => { /* Page renders the selected language centrally. */ }}
                  promptId={prompt.id}
                  activePresetId={activePresetId}
                  setActivePresetId={setActivePresetId}
                  values={wizardValues}
                  setValues={setWizardValues}
                  onPresetSavedOrUpdated={fetchPresets}
                  onFieldChange={(key, type) => { setHighlightedField(null); setFieldChange(previous => ({ key, type, sequence: (previous?.sequence || 0) + 1 })); }}
                  onValuesChange={setLiveValues}
                />
              </div>
            )}
            {/* Prompt Textbox */}
            <div id="prompt-text-section" className="order-1 space-y-3 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <label htmlFor="prompt-box-area" className="text-xs font-black text-muted">متن پرامپت نهایی:</label>
                </div>
                <span className="text-[10px] font-mono text-muted bg-surface-soft px-2.5 py-1 rounded-md">
                  {prompt.usageCount} بار کپی
                </span>
              </div>

              <p role="status" aria-live="polite" className={highlightedField ? "text-xs text-brand font-bold" : "sr-only"}>{highlightedField ? `مقدار «${prompt.fieldsSchema?.find(field => field.key === highlightedField)?.label || highlightedField}» در متن اعمال شد.` : ""}</p>
              <div role="group" aria-label="زبان نسخه پرامپت" className="grid grid-cols-2 gap-2 rounded-xl bg-surface-soft p-1 border border-line">
                <button type="button" aria-pressed={promptLang === 'fa'} disabled={!prompt.bodyFa} title={!prompt.bodyFa ? 'نسخه پارسی هنوز ثبت نشده است' : 'نسخه پارسی'} onClick={() => { setPromptLang('fa'); setIsManualEditMode(false); }} className={`flex min-h-11 items-center justify-center gap-1 rounded-lg px-1 text-xs font-bold disabled:opacity-40 ${promptLang === 'fa' ? 'bg-brand-solid text-white' : 'text-secondary'}`}>
                  <IranIcon /><span>نسخه پارسی</span>
                </button>
                <button type="button" disabled={isPersianOnly} title={isPersianOnly ? "نسخه انگلیسی ثبت نشده است" : "نسخه انگلیسی"} aria-pressed={promptLang === 'en'} onClick={() => { setPromptLang('en'); setIsManualEditMode(false); }} className={`flex min-h-11 flex-wrap items-center justify-center gap-1 rounded-lg px-1 text-xs font-bold disabled:opacity-40 ${promptLang === 'en' ? 'bg-brand-solid text-white' : 'text-secondary'}`}><span aria-hidden="true">EN</span><span>English</span><small className="text-[9px]">(نسخه پیشنهادی)</small></button>
              </div>
              {!prompt.bodyFa && <p className="text-[11px] text-muted">نسخه پارسی هنوز ثبت نشده است.</p>}
              {isPersianOnly && <p className="text-[11px] text-muted">این منبع فعلاً فقط نسخه فارسی دارد.</p>}
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
                    tabIndex={0}
                    aria-label="متن پرامپت؛ برای نمایش کامل کلیک کنید"
                    onClick={() => setShowFullPrompt(true)}
                    onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setShowFullPrompt(true); } }}
                    className={`w-full p-4 pt-12 bg-surface-inset text-primary text-sm leading-7 rounded-2xl whitespace-pre-wrap ${showFullPrompt ? "max-h-[65vh]" : "max-h-[240px]"} overflow-y-auto overscroll-contain cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      promptLang === "fa" ? "text-right font-sans" : "text-left font-mono"
                    }`}
                    style={{ direction: promptLang === "fa" ? "rtl" : "ltr" }}
                  >
                    {renderHighlightedNodes(((promptLang === "fa" && prompt.bodyFa) ? prompt.bodyFa : prompt.body), displayValues, highlightedField)}
                  </div>
                )}

                {/* دکمه کپی داخل خود باکس، بالا-گوشه (استاندارد گیت‌هاب/ChatGPT) */}
                <button
                  type="button"
                  onClick={async () => {
                    if (!await copyPromptText(renderedBody)) return;
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
             <div className="order-2 flex items-center justify-between pt-2">
               <div>
                 {/* Left side empty or metadata */}
               </div>

               {prompt.resourceType && prompt.resourceType !== "prompt" ? <span className="text-xs text-muted">این منبع را طبق راهنمای دریافت در ایجنت استفاده کنید.</span> : prompt.tools && prompt.tools.length > 1 ? (
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
              <p className="text-[11px] text-muted font-semibold">منابع با کاربرد مشابه در اولویت‌اند؛ حوزه و ابزار نیز در پیشنهادها مؤثرند</p>
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

      {copyError && <div role="alert" className="fixed bottom-24 inset-x-4 z-50 rounded-xl border border-danger-text bg-surface p-3 text-sm text-danger-text">{copyError}<button className="mr-3 underline" onClick={() => setCopyError(null)}>بستن</button></div>}
      {/* Responsive floating copy and bookmark actions */}
      <div className="fixed bottom-0 inset-x-0 px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] z-40 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-[min(560px,calc(100vw-48px))] lg:bottom-4">
        <div className="flex items-center gap-2 w-full p-2 bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10">
          {/* Bookmark Button (25% width) */}
          <button
            onClick={handleBookmarkToggle}
            className="w-1/4 h-14 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-800 text-muted hover:bg-slate-700 active:scale-95 transition-all text-xs font-bold cursor-pointer"
            title={isBookmarked ? "نشان شده" : "افزودن به نشان‌شده‌ها"}
          >
            <Bookmark className={`w-4 h-4 transition-colors ${isBookmarked ? "fill-amber-400 text-caution-text" : "text-muted"}`} />
            <span className="text-[11px] truncate">{isBookmarked ? "نشان‌شده" : "نشان"}</span>
          </button>

          {/* Copy Button (75% width) */}
          <button
            onClick={async () => {
              if (!await copyPromptText(renderedBody)) return;
              document.getElementById('prompt-text-section')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
              setMobileCopied(true);
              setTimeout(() => setMobileCopied(false), 2000);
            }}
            className="w-3/4 h-14 flex items-center justify-center gap-2 py-3 bg-brand-solid hover:bg-brand-solid text-white rounded-xl shadow-lg shadow-brand/30 active:scale-95 transition-all text-sm font-black cursor-pointer"
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

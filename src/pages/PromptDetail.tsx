import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Prompt } from "../types";
import PromptWizard from "../components/PromptWizard";
import CopyButton from "../components/CopyButton";
import { ChevronRight, Megaphone, Globe, Video, Camera, Sparkles, Wand2, PlayCircle, Loader2 } from "lucide-react";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "تبلیغات": Megaphone,
  "وبسایت": Globe,
  "ویدیو": Video,
  "عکاسی": Camera,
};

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [renderedBody, setRenderedBody] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);

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
        "در حال مهندسی و بازنویسی متغیرها تحت گایدلاین‌های n8n...",
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
    async function loadPrompt() {
      try {
        setLoading(true);
        const res = await fetch(`/api/prompts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPrompt(data.prompt);
          setRenderedBody(data.prompt.body);
        } else {
          console.error("Failed to load prompt");
        }
      } catch (error) {
        console.error("Error fetching prompt:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadPrompt();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C47FF]" />
        <p className="text-xs">در حال بارگذاری جزئیات پرامپت...</p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 space-y-4 max-w-lg mx-auto">
        <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">پرامپت مورد نظر پیدا نشد.</p>
        <Link to="/" className="inline-block text-xs bg-[#6C47FF] text-white px-4 py-2 rounded-lg hover:bg-opacity-90">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const IconComponent = categoryIcons[prompt.category] || Sparkles;

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-right">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-slate-400 font-semibold mb-2">
        <Link to="/" className="hover:text-slate-600 transition">خانه</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600">{prompt.title}</span>
      </nav>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Main Info & Sample Output Image) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm p-4 space-y-4">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
              {prompt.sampleImage ? (
                <img
                  src={prompt.sampleImage}
                  alt={prompt.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <PlayCircle className="w-16 h-16 opacity-30" />
                </div>
              )}
              {prompt.isPremium && (
                <span className="absolute top-3 right-3 bg-[#6C47FF] text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md">
                  ویژه 🛡️
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <IconComponent className="w-4 h-4 text-[#6C47FF]" />
                <span>دسته: {prompt.category}</span>
              </div>

              <h1 className="text-xl md:text-2xl font-black text-slate-800">
                {prompt.title}
              </h1>

              <p className="text-slate-500 text-sm leading-relaxed">
                {prompt.description || "توضیحی برای این پرامپت ثبت نشده است."}
              </p>
            </div>
          </div>

          {/* Tags Box */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-700">برچسب‌ها</h4>
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] md:text-xs font-medium rounded-lg cursor-default transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Live Prompt Viewer & Customization Panel) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <span className="text-xs font-bold text-slate-400">خروجی پرامپت</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                {prompt.usageCount - 1} کپی موفق
              </span>
            </div>

            {/* Prompt Textbox */}
            <div className="space-y-3">
              <label htmlFor="prompt-body-textarea" className="sr-only">متن کامل پرامپت هوش مصنوعی</label>
              <textarea
                id="prompt-body-textarea"
                rows={10}
                value={renderedBody}
                onChange={(e) => setRenderedBody(e.target.value)}
                className="w-full p-4.5 bg-slate-900 text-slate-100 font-mono text-sm leading-relaxed rounded-2xl ring-4 ring-slate-900/5 focus:outline-none focus:ring-4 focus:ring-[#6C47FF]/20 text-left"
                style={{ direction: "ltr" }}
                placeholder="متن پرامپت در اینجا نمایان خواهد شد..."
              />
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <CopyButton text={renderedBody} className="flex-1 text-sm py-4" />
              
              {/* Customize Button with custom color accent and pencil icon */}
              {prompt.fieldsSchema && prompt.fieldsSchema.length > 0 && (
                <button
                  id="toggle-wizard-btn"
                  onClick={() => setShowWizard(!showWizard)}
                  className={`flex items-center justify-center gap-2 px-5 py-4 text-sm font-bold rounded-lg cursor-pointer transition duration-300 ${
                    showWizard
                      ? "bg-slate-800 text-white"
                      : "bg-[#6C47FF] hover:bg-[#5935e6] text-white"
                  }`}
                >
                  <Wand2 className="w-5 h-5" />
                  <span>شخصی‌سازی این پرامپت ✏️</span>
                </button>
              )}
            </div>

            {/* Live PromptWizard (Toggled Section) */}
            {showWizard && prompt.fieldsSchema && prompt.fieldsSchema.length > 0 && (
              <div className="pt-2">
                <PromptWizard
                  fields={prompt.fieldsSchema}
                  promptBody={prompt.body}
                  onRendered={(rendered) => setRenderedBody(rendered)}
                />
              </div>
            )}
          </div>

          {/* Highlighted AI Assistant Action panel */}
          <div className="bg-gradient-to-r from-[#6C47FF]/10 to-indigo-50/20 border border-[#6C47FF]/20 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#6C47FF] animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-slate-800">بهبود دهنده هوشمند پرامپت (Professional AI Refinement)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">افزودن لنز دوربین حرفه‌ای، نورپردازی سه بعدی و کلمات کلیدی سینمایی به متغیرها برای فهم مستقیم موتور هوشمند</p>
                </div>
              </div>
              
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isn8nConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {isn8nConfigured ? "عامل متصل" : "محلی فعال"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleRefinePrompt}
                disabled={refineLoading}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-[#6C47FF] hover:text-[#5935e6] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition border-2 border-[#6C47FF]/30 cursor-pointer shadow-sm disabled:cursor-not-allowed"
              >
                {refineLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#6C47FF]" />
                ) : (
                  <Wand2 className="w-4 h-4 text-[#6C47FF]" />
                )}
                <span>ارتقا و بهبود فوری این پرامپت با عامل n8n 🤖✨</span>
              </button>
            </div>
          </div>

          {/* AI Processing Feedback */}
          {refineLoading && (
            <div className="bg-slate-900 text-slate-200 border border-[#6C47FF]/30 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 text-center animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-[#6C47FF]" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">در حال پردازش پرامپت و همگام‌سازی با n8n...</p>
                <p className="text-xs text-slate-400 font-mono mt-1">{loadingStep}</p>
              </div>
            </div>
          )}

          {/* Side by side comparison (Before & After) */}
          {refinedPrompt && (
            <div className="bg-white border border-[#6C47FF]/20 rounded-2xl p-6 space-y-6 shadow-sm animate-fade-in text-right">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <span>🔮</span>
                    <span>مقایسه نهایی قبل و بعد پرامپت هوشمند</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">دستیار هوشمند کلمات طلایی، جزئیات پس‌زمینه و ابزارهای حرفه‌ای عکاسی را به پرامپت شما افزوده است</p>
                </div>

                <span className="text-[10px] text-[#6C47FF] bg-[#6C47FF]/10 px-2.5 py-1 rounded-full font-bold">
                  عامل بهینه‌سازی فعال
                </span>
              </div>

              {refineMessage && (
                <div className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl border border-amber-100 flex items-center gap-1.5 leading-relaxed">
                  <span>💡 نکته سیستم:</span>
                  <span>{refineMessage}</span>
                </div>
              )}

              {/* Side by side containers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs font-bold bg-slate-200/50 px-2.5 py-0.5 rounded">پرامپت خام اولیه (قبل)</span>
                      <span className="text-[10px] text-slate-400 font-mono">{originalBeforeRefining.length} کاراکتر</span>
                    </div>
                    <div 
                      className="text-xs text-slate-600 bg-white/70 border border-slate-100 p-3.5 rounded-lg font-mono leading-relaxed select-all overflow-y-auto max-h-[140px]"
                      style={{ direction: "ltr", textAlign: "left" }}
                    >
                      {originalBeforeRefining}
                    </div>
                  </div>
                  <CopyButton text={originalBeforeRefining} label="کپی پرامپت اولیه" className="w-full text-xs py-2 bg-slate-200 hover:bg-slate-300 text-slate-700" />
                </div>

                {/* After */}
                <div className="bg-slate-900 border-2 border-[#6C47FF]/30 rounded-xl p-4.5 space-y-3 flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-[#6C47FF]/20 to-transparent rounded-full blur-xl pointer-events-none"></div>
                  <div className="space-y-2 z-10 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-bold bg-[#6C47FF]/20 border border-[#6C47FF]/30 px-2.5 py-0.5 rounded flex items-center gap-1">
                        <span>🚀</span>
                        <span>پرامپت ارتقا یافته با هوش مصنوعی (بعد)</span>
                      </span>
                      <span className="text-[10px] text-indigo-300 font-mono font-bold bg-indigo-950/40 px-2 rounded-full">{refinedPrompt.length} کاراکتر</span>
                    </div>
                    <div 
                      className="text-xs text-emerald-300 bg-slate-950/80 border border-[#6C47FF]/20 p-3.5 rounded-lg font-mono leading-relaxed select-all overflow-y-auto max-h-[140px]"
                      style={{ direction: "ltr", textAlign: "left" }}
                    >
                      {refinedPrompt}
                    </div>
                  </div>
                  <CopyButton text={refinedPrompt} label="کپی پرامپت بهبودیافته" className="w-full text-xs py-2.5 bg-[#6C47FF] hover:bg-[#5935e6] text-white shadow-md font-bold" />
                </div>
              </div>

              {/* Improvement bullet points */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
                <h4 className="text-xs font-black text-slate-700">تغییرات مهندسی شده توسط دستیار هوشمند:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] md:text-xs text-slate-500 font-bold">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500 font-black">✓</span>
                    <span>افزایش توصیفات پس‌زمینه و اشیاء پیرامون</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500 font-black">✓</span>
                    <span>افزودن لنز دوربین عکاسی مجلل (85mm focal)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500 font-black">✓</span>
                    <span>نورپردازی سه‌بعدی و سایه‌های سینمایی عمیق</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integration Status Block (Disabled buttons with Tooltips) */}
          <div className="bg-gradient-to-tr from-[#6C47FF]/5 to-indigo-50/20 border border-[#6C47FF]/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#6C47FF]">
              <Sparkles className="w-4 h-4" />
              <span>اجرای مستقیم با هوش مصنوعی (فاز آینده)</span>
            </div>
            
            <p className="text-slate-500 text-xs leading-relaxed">
              با استفاده از توکن‌های اعتباری خود، بدون ترک کردن سایت سفارش اجرای مستقیم پرامپت‌های گرافیکی و متنی را صادر کنید:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Build with Kling */}
              <div className="relative group">
                <button
                  disabled
                  className="w-full py-3 px-4 bg-slate-200/50 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>ساخت ویدیو با Kling</span>
                </button>
                <div id="tooltip-kling" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block transition bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap z-10 font-sans">
                  به زودی / شارژ اعتبار در نسخه بعدی 🔒
                </div>
              </div>

              {/* Build with Midjourney */}
              <div className="relative group">
                <button
                  disabled
                  className="w-full py-3 px-4 bg-slate-200/50 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>سفارش عکس با Midjourney</span>
                </button>
                <div id="tooltip-midjourney" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block transition bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap z-10 font-sans">
                  به زودی / شارژ اعتبار در نسخه بعدی 🔒
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

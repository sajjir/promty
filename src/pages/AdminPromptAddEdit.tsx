import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Category, FieldSchema } from "../types";
import PromptWizard from "../components/PromptWizard";
import { ArrowRight, AlertTriangle, Sparkles, Code, Check, Loader2, Wand2, Camera } from "lucide-react";

export default function AdminPromptAddEdit() {
  const { id } = useParams<{ id: string }>(); // If there is an ID, we are in Edit mode, otherwise Add mode.
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forkedFrom = searchParams.get("forkedFrom");
  const [parentId, setParentId] = useState<string | null>(null);

  const token = localStorage.getItem("promty_admin_token");

  // Dynamic Taxonomy State
  const [taxonomiesList, setTaxonomiesList] = useState<any[]>([]);

  const getOptions = (type: string, fallback?: string[]) => {
    const filtered = taxonomiesList.filter(t => t.type?.toLowerCase() === type?.toLowerCase());
    if (filtered.length > 0) {
      return filtered.map(t => ({ value: t.slug, label: t.titleFa }));
    }
    return [{ value: "", label: "در حال بارگذاری..." }];
  };

  // Local form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("تبلیغات");
  const [intent, setIntent] = useState("Create");
  const [domains, setDomains] = useState<string[]>(["Marketing"]);
  const [tools, setTools] = useState<string[]>(["ChatGPT"]);
  const [task, setTask] = useState("");
  const [language, setLanguage] = useState("Persian");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [outputFormats, setOutputFormats] = useState<string[]>(["Text"]);
  const [industry, setIndustry] = useState("Ecommerce");
  const [tagsInput, setTagsInput] = useState("");
  const [body, setBody] = useState("");
  const [schemaJson, setSchemaJson] = useState("");
  const [sampleImage, setSampleImage] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Smart Media Engine states
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [existingCover, setExistingCover] = useState<string>("");
  const [existingGallery, setExistingGallery] = useState<string[]>([]);

  // Source AI Analysis states
  const [sourceText, setSourceText] = useState("");
  const [analyzingSource, setAnalyzingSource] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisSuccess, setAnalysisSuccess] = useState(false);

  // Status states
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Live validation states
  const [schemaError, setSchemaError] = useState("");
  const [parsedSchema, setParsedSchema] = useState<FieldSchema[]>([]);
  const [previewRendered, setPreviewRendered] = useState("");

  const defaultSchema = [
    {
      key: "product_name",
      label: "نام محصول",
      type: "text",
      placeholder: "مثال: عینک آفتابی ری‌بن",
      required: true
    },
    {
      key: "brand_color",
      label: "رنگ اصلی برند",
      type: "color",
      required: false
    }
  ];

  // Auth Protection Guard
  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  // Load categories, taxonomies and prompt if editing
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch categories list
        const catRes = await fetch("/api/categories");
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        // Fetch taxonomies list
        const taxRes = await fetch("/api/taxonomies");
        if (taxRes.ok) {
          const taxData = await taxRes.json();
          setTaxonomiesList(taxData.terms || []);
        }

        if (isEditMode) {
          // Fetch existing prompt
          const res = await fetch(`/api/prompts/${id}`);
          if (res.ok) {
            const data = await res.json();
            const p = data.prompt;
            setTitle(p.title);
            setDescription(p.description);
            setCategory(p.category || (p.tools && p.tools[0]) || (p.domains && p.domains[0]) || p.tool || p.domain || "عمومی");
            setIntent(p.intent || "Create");
            setDomains(Array.isArray(p.domains) ? p.domains : (p.domain ? [p.domain] : ["Marketing"]));
            setTools(Array.isArray(p.tools) ? p.tools : (p.tool ? [p.tool] : ["ChatGPT"]));
            setTask(p.task || "");
            setLanguage(p.language || "Persian");
            setDifficulty(p.difficulty || "Beginner");
            setOutputFormats(Array.isArray(p.outputFormats) ? p.outputFormats : (p.outputFormat ? [p.outputFormat] : ["Text"]));
            setIndustry(p.industry || "Ecommerce");
            setTagsInput(p.tags ? p.tags.join(", ") : "");
            setBody(p.body);
            setSchemaJson(JSON.stringify(p.fieldsSchema, null, 2));
            setSampleImage(p.sampleImage || "");
            setExistingCover(p.coverImage || "");
            setExistingGallery(Array.isArray(p.mediaGallery) ? p.mediaGallery : []);
            setIsPremium(p.isPremium);
            setIsActive(p.isActive);
            setSourceText(p.sourceText || "");
            if (p.parentId) {
              setParentId(p.parentId);
            }
          } else {
            setError("خطا در دریافت اطلاعات پرامپت.");
          }
        } else if (forkedFrom) {
          // Fetch parent prompt data to pre-fill form for Forking
          const res = await fetch(`/api/prompts/${forkedFrom}`);
          if (res.ok) {
            const data = await res.json();
            const p = data.prompt;
            setTitle(""); // Keep title empty for user input
            setDescription(p.description || "");
            setCategory(p.category || (p.tools && p.tools[0]) || (p.domains && p.domains[0]) || "عمومی");
            setIntent(p.intent || "Create");
            setDomains(Array.isArray(p.domains) ? p.domains : (p.domain ? [p.domain] : ["Marketing"]));
            setTools(Array.isArray(p.tools) ? p.tools : (p.tool ? [p.tool] : ["ChatGPT"]));
            setTask(p.task || "");
            setLanguage(p.language || "Persian");
            setDifficulty(p.difficulty || "Beginner");
            setOutputFormats(Array.isArray(p.outputFormats) ? p.outputFormats : (p.outputFormat ? [p.outputFormat] : ["Text"]));
            setIndustry(p.industry || "Ecommerce");
            setTagsInput(p.tags ? p.tags.join(", ") : "");
            setBody(p.body);
            setSchemaJson(JSON.stringify(p.fieldsSchema || [], null, 2));
            setSampleImage(p.sampleImage || "");
            setIsPremium(p.isPremium);
            setIsActive(p.isActive);
            setSourceText(p.sourceText || p.body || ""); // Pre-fill with parent's sourceText or body as fallback
            setParentId(forkedFrom);
          } else {
            setError("خطا در دریافت اطلاعات پرامپت مادر برای انشعاب.");
          }
        } else {
          // Pre-populate JSON schema
          setSchemaJson(JSON.stringify(defaultSchema, null, 2));
          setBody("یک تصویر تبلیغاتی با رویکرد مدرن برندینگ برای محصول {{product_name}} بسازید. در تصویر از رنگ {{brand_color}} به شیوه‌ای ظریف و جذاب بهره بگیرید.");
        }
      } catch (err) {
        console.error("Error loading edit/add data:", err);
        setError("خطا در بارگذاری پیکربندی صفحه.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, isEditMode, forkedFrom]);

  // Live validator for fieldsSchema JSON
  useEffect(() => {
    if (!schemaJson.trim()) {
      setParsedSchema([]);
      setSchemaError("");
      return;
    }

    try {
      const parsed = JSON.parse(schemaJson);
      if (!Array.isArray(parsed)) {
        setSchemaError("ساختار JSON فیلدها باید یک آرایه (Array) معتبر باشد.");
        setParsedSchema([]);
        return;
      }

      // Quick validate objects structure
      let hasError = false;
      for (const item of parsed) {
        if (!item.key || !item.label || !item.type) {
          setSchemaError("هر فیلد در آرایه JSON باید حداقل دارای فیلدهای key، label و type باشد.");
          hasError = true;
          break;
        }
      }

      if (!hasError) {
        setSchemaError("");
        setParsedSchema(parsed as FieldSchema[]);
      }
    } catch (e: any) {
      setSchemaError(`خطای ساختاری JSON: ${e.message}`);
      setParsedSchema([]);
    }
  }, [schemaJson]);

  // Source AI Analysis action
  const handleAnalyzeSource = async () => {
    if (!sourceText.trim()) return;
    setAnalyzingSource(true);
    setAnalysisError("");
    setAnalysisSuccess(false);

    try {
      const res = await fetch("/api/analyze-source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sourceText })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const parsed = data.data;
        setTitle(parsed.title || "");
        setDescription(parsed.description || "");
        setIntent(parsed.intent || "Create");
        setDomains(Array.isArray(parsed.domains) ? parsed.domains : (parsed.domain ? [parsed.domain] : ["Marketing"]));
        setTools(Array.isArray(parsed.tools) ? parsed.tools : (parsed.tool ? [parsed.tool] : ["ChatGPT"]));
        setTask(parsed.task || "");
        setLanguage(parsed.language || "Persian");
        setDifficulty(parsed.difficulty || "Beginner");
        setOutputFormats(Array.isArray(parsed.outputFormats) ? parsed.outputFormats : (parsed.outputFormat ? [parsed.outputFormat] : ["Text"]));
        setIndustry(parsed.industry || "Ecommerce");
        setTagsInput(parsed.tags ? parsed.tags.join(", ") : "");
        setBody(parsed.body || "");
        setSchemaJson(JSON.stringify(parsed.fieldsSchema || [], null, 2));
        setAnalysisSuccess(true);
      } else {
        setAnalysisError(data.message || "خطا در تجزیه و تحلیل متن خام پرامپت.");
      }
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setAnalysisError("خطا در برقراری ارتباط با سرویس هوش مصنوعی.");
    } finally {
      setAnalyzingSource(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Schema Validation block
    if (schemaError) {
      setError("لطفاً ابتدا خطای ساختار فیلدهای Wizard را تصحیح کنید.");
      return;
    }

    setSaving(true);

    // Prepare payload
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title,
      description,
      category: tools[0] || domains[0] || category || "عمومی",
      intent,
      domains,
      tools,
      task,
      language,
      difficulty,
      outputFormats,
      industry,
      tags,
      body,
      fieldsSchema: parsedSchema,
      sampleImage,
      isPremium,
      isActive,
      sourceText,
      parentId,
    };

    try {
      const url = isEditMode ? `/api/prompts/${id}` : "/api/prompts";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const savedPromptId = data.prompt?.id || id;

        // Stage 2: Upload Files if present
        if (savedPromptId && (coverFile || galleryFiles.length > 0)) {
          setIsUploading(true);
          const formData = new FormData();
          
          if (coverFile) {
            formData.append("cover", coverFile);
          }
          if (galleryFiles.length > 0) {
            galleryFiles.forEach((file) => {
              formData.append("gallery", file);
            });
          }

          try {
            const uploadRes = await fetch(`/api/upload/${savedPromptId}`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`
              },
              body: formData
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData.success) {
              setError(uploadData.message || "آپلود و پردازش تصاویر با خطا مواجه شد ولی اطلاعات متنی ذخیره گردید.");
              setIsUploading(false);
              setSaving(false);
              return;
            }
          } catch (uploadErr) {
            console.error("Upload error:", uploadErr);
            setError("خطا در برقراری ارتباط جهت آپلود تصاویر. اطلاعات متنی با موفقیت ذخیره شد.");
            setIsUploading(false);
            setSaving(false);
            return;
          } finally {
            setIsUploading(false);
          }
        }

        setSuccess(true);
        setTimeout(() => {
          navigate("/admin");
        }, 1200);
      } else {
        setError(data.message || "خطا در فرآیند ذخیره‌سازی اطلاعات.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C47FF]" />
        <p className="text-xs">در حال دریافت و تحلیل مشخصات فنی...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-right">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-800">
            {isEditMode ? "ویرایش پرامپت مهندسی‌شده" : "ایجاد پرامپت هوشمند جدید"}
          </h1>
          <p className="text-xs text-slate-400">فیلدها و کدهای پرامپت خود را تعریف نموده و پیش‌نمایش آن را بررسی کنید.</p>
        </div>

        <Link
          to="/admin"
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer transition"
        >
          <span>بازگشت به پنل</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {/* Source AI Analysis "چشمه" Section */}
      <div className="bg-gradient-to-tr from-[#6C47FF]/5 to-[#8A2BE2]/5 border border-[#6C47FF]/10 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#6C47FF]/10">
          <div className="p-2 bg-[#6C47FF]/10 rounded-lg text-[#6C47FF]">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">بخش "چشمه" (تجزیه و تحلیل متن با هوش مصنوعی) 💡</h3>
            <p className="text-[11px] text-slate-500">متن پرامپت خام خود را وارد کنید تا هوش مصنوعی به صورت خودکار آن را به قالب استاندارد Promty.ir تبدیل کند.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label htmlFor="source-textarea" className="text-xs font-bold text-slate-600 block">متن خام پرامپت (Source)</label>
            <textarea
              id="source-textarea"
              rows={3}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="مثال: یک پرامپت بنویس که لوگوی مینیمال عینک آفتابی بسازه و رنگ اصلیش طلایی باشه و اسمش برند X باشه..."
              className="w-full text-xs p-3.5 bg-white border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition"
            />
          </div>
          <button
            type="button"
            onClick={handleAnalyzeSource}
            disabled={analyzingSource || !sourceText.trim()}
            className="w-full md:w-auto px-6 py-3 bg-[#6C47FF] hover:bg-[#5935e6] disabled:bg-slate-300 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer h-[50px] shadow-sm"
          >
            {analyzingSource ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال تجزیه و ساختاردهی...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>تجزیه و تحلیل با هوش مصنوعی 🪄</span>
              </>
            )}
          </button>
        </div>

        {analysisSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>با موفقیت پردازش شد! فیلدهای پایین با اطلاعات استخراج شده مقداردهی اولیه شدند.</span>
          </div>
        )}

        {analysisError && (
          <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 flex items-center gap-1.5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-bold leading-relaxed">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>عملیات با موفقیت انجام شد! در حال هدایت به پنل مدیریت...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Metadata Details form) */}
        <div className="lg:col-span-6 bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          
          <h3 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-50 mb-2">۱. جزئیات و اطلاعات پایه پرامپت</h3>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prompt-title" className="text-xs font-bold text-slate-600">عنوان پرامپت *</label>
            <input
              type="text"
              id="prompt-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: پرتره آتلیه‌ای سینمایی"
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prompt-desc" className="text-xs font-bold text-slate-600">توضیحات کوتاه پرامپت</label>
            <textarea
              id="prompt-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: این پرامپت به شما اجازه می‌دهد تصاویری با نورپردازی متمرکز سینمایی ایجاد کنید..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition"
            />
          </div>

          {/* Read-only Source Text (for forked/analyzed prompts) */}
          {sourceText && (
            <div className="flex flex-col gap-1.5 p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl">
              <label htmlFor="readonly-source-textarea" className="text-xs font-bold text-amber-800 block">📝 متن منبع خام پرامپت (Source Text - Read-only)</label>
              <textarea
                id="readonly-source-textarea"
                rows={3}
                readOnly
                value={sourceText}
                className="w-full text-xs p-3 bg-white border border-amber-200/50 rounded-xl outline-none text-slate-600 cursor-not-allowed select-all"
                placeholder="منبع خام ثبت نشده است."
              />
              <span className="text-[10px] text-amber-600 leading-normal">این فیلد فقط‌خواندنی است و نشان‌دهنده متن خام منبع (Source) این پرامپت انشعاب‌یافته یا پردازش‌شده می‌باشد.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Intent */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prompt-intent" className="text-xs font-bold text-slate-600">هدف اصلی (Intent) *</label>
              <select
                id="prompt-intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition cursor-pointer"
              >
                {getOptions("intent", [
                  "Create", "Write", "Code", "Design", "Market",
                  "Analyze", "Learn", "Automate", "Research", "Productivity"
                ]).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Specific Task */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prompt-task" className="text-xs font-bold text-slate-600">کار مشخص (Task)</label>
              <input
                type="text"
                id="prompt-task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="مثال: Write Instagram Caption"
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition text-left"
                style={{ direction: "ltr" }}
              />
            </div>

            {/* Language */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prompt-language" className="text-xs font-bold text-slate-600">زبان اصلی پرامپت *</label>
              <select
                id="prompt-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition cursor-pointer"
              >
                {getOptions("language", ["Persian", "English"]).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prompt-difficulty" className="text-xs font-bold text-slate-600">سطح دشواری (Difficulty) *</label>
              <select
                id="prompt-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition cursor-pointer"
              >
                {getOptions("difficulty", ["Beginner", "Intermediate", "Advanced", "Expert"]).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Industry */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label htmlFor="prompt-industry" className="text-xs font-bold text-slate-600">صنعت هدف (Industry) *</label>
              <select
                id="prompt-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition cursor-pointer"
              >
                {getOptions("industry", [
                  "Ecommerce", "Startup", "Healthcare", "Education", "Restaurant",
                  "Construction", "Law", "Bank", "Crypto", "Fashion", "Fitness",
                  "Agriculture", "Tourism", "Insurance", "NGO"
                ]).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Domain - Multi Select */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-600">حوزه‌های مرتبط (Domain) * — چندانتخابی</label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto">
                {getOptions("domain", [
                  "Business", "Marketing", "Education", "Medical", "Health", "Legal",
                  "Finance", "Programming", "Gaming", "Food", "Travel", "Architecture",
                  "Photography", "Real Estate", "Sports", "AI", "Robotics", "Science",
                  "Religion", "History"
                ]).map((opt) => {
                  const isSelected = domains.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                        isSelected
                          ? "bg-[#6C47FF] text-white border-[#6C47FF]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setDomains(isSelected ? domains.filter((d) => d !== opt.value) : [...domains, opt.value]);
                        }}
                        className="sr-only"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Tool - Multi Select */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-600">ابزارهای هوش مصنوعی (Tool) * — چندانتخابی</label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto">
                {getOptions("tool", [
                  "ChatGPT", "Claude", "Gemini", "Grok", "Midjourney", "Flux",
                  "Stable Diffusion", "Ideogram", "Veo", "Kling", "Runway",
                  "ElevenLabs", "Suno", "n8n AI Agent"
                ]).map((opt) => {
                  const isSelected = tools.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                        isSelected
                          ? "bg-[#6C47FF] text-white border-[#6C47FF]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setTools(isSelected ? tools.filter((t) => t !== opt.value) : [...tools, opt.value]);
                        }}
                        className="sr-only"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Output Format - Multi Select */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-600">فرمت‌های خروجی (Output Format) * — چندانتخابی</label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto">
                {getOptions("outputFormat", [
                  "Text", "Markdown", "JSON", "CSV", "HTML", "CSS", "JavaScript",
                  "Python", "React", "TypeScript", "SQL", "XML", "PDF", "Image",
                  "Video", "Table", "Checklist", "Roadmap", "Presentation"
                ]).map((opt) => {
                  const isSelected = outputFormats.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                        isSelected
                          ? "bg-[#6C47FF] text-white border-[#6C47FF]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setOutputFormats(isSelected ? outputFormats.filter((o) => o !== opt.value) : [...outputFormats, opt.value]);
                        }}
                        className="sr-only"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prompt-tags" className="text-xs font-bold text-slate-600">تگ‌ها (جدا شده با کاما ,)</label>
            <input
              type="text"
              id="prompt-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="مثال: عکاسی, پرتره, Midjourney"
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition text-left"
              style={{ direction: "ltr" }}
            />
          </div>

          {/* Image */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prompt-sample-img" className="text-xs font-bold text-slate-600">آدرس تصویر نمونه خروجی (URL)</label>
            <input
              type="text"
              id="prompt-sample-img"
              value={sampleImage}
              onChange={(e) => setSampleImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition text-left"
              style={{ direction: "ltr" }}
            />
          </div>

          {/* Large Body Code */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="prompt-body" className="text-xs font-bold text-slate-600">متن پرامپت با جایگاه‌های {"{{placeholder}}"} *</label>
              <span className="text-[10px] text-[#6C47FF] font-semibold bg-[#6C47FF]/10 px-2 py-0.5 rounded">پرامپت نهایی</span>
            </div>
            <textarea
              id="prompt-body"
              rows={6}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="یک عکس خلاقانه از {{product_name}} با پس‌زمینه {{brand_color}} بساز..."
              className="w-full p-4.5 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed rounded-xl ring-4 ring-slate-900/5 focus:outline-none focus:ring-4 focus:ring-[#6C47FF]/20 text-left"
              style={{ direction: "ltr" }}
            />
            <span className="text-[10px] text-slate-400">
              راهنما: حتماً فیلدهای شخصی‌سازی را بدین شکل قرار دهید: <span className="font-mono text-[#6C47FF] block md:inline font-bold">{"{{product_name}}"}</span> یا <span className="font-mono text-[#6C47FF] block md:inline font-bold">{"{{tone}}"}</span> تا با مقادیر Wizard جایگزین شوند.
            </span>
          </div>

          {/* Checkboxes Row */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <label id="premium-toggle-label" className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-4 h-4 text-[#6C47FF] border-slate-300 focus:ring-[#6C47FF] rounded cursor-pointer"
              />
              <div className="space-y-0.5 cursor-pointer">
                <span className="text-xs font-bold text-slate-700 block">پرامپت ویژه (Premium)</span>
                <span className="text-[10px] text-slate-400 block font-normal">نیازمند عضویت ممتاز جهت کپی</span>
              </div>
            </label>

            <label id="active-toggle-label" className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-500 border-slate-300 focus:ring-emerald-500 rounded cursor-pointer"
              />
              <div className="space-y-0.5 cursor-pointer">
                <span className="text-xs font-bold text-slate-700 block">نمایش عمومی در سایت (Active)</span>
                <span className="text-[10px] text-slate-400 block font-normal">نمایش در نتایج جستجو و لیست‌ها</span>
              </div>
            </label>
          </div>

        </div>

        {/* Right Column (Wizard Schema JSON & Live Preview) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* JSON Wizard Editor */}
          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Code className="w-4 h-4 text-[#6C47FF]" />
                <span>۲. تعریف فیلدهای Wizard (JSON Schema)</span>
              </h3>
              <span className="text-[10px] text-[#6C47FF] font-semibold bg-[#6C47FF]/10 px-2.5 py-0.5 rounded">آرایه JSON</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="schema-json-textarea" className="sr-only">ساختار JSON برای فیلدهای شخصی‌سازی</label>
              <textarea
                id="schema-json-textarea"
                rows={8}
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                placeholder="[ { 'key': 'product', 'label': 'محصول', 'type': 'text' } ]"
                className="w-full p-4.5 bg-slate-900 text-teal-400 font-mono text-xs leading-relaxed rounded-xl ring-4 ring-slate-900/5 focus:outline-none focus:ring-4 focus:ring-[#6C47FF]/20 text-left"
                style={{ direction: "ltr" }}
              />
            </div>

            {/* Error handling inside JSON validator */}
            {schemaError ? (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[10px] leading-relaxed">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-mono">{schemaError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-extrabold">
                <Check className="w-4 h-4" />
                <span>ساختار آرایه JSON کاملاً معتبر است ✓</span>
              </div>
            )}
          </div>

          {/* Interactive Live Preview */}
          {parsedSchema.length > 0 && (
            <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-800">🕵️ پیش‌نمایش زنده فرم محصول (Live Preview)</h4>
              <p className="text-[10px] text-slate-400">فرم پایین به صورت خودکار از روی فیلدهای بالا شبیه‌سازی و رندر گردیده است:</p>
              
              <div className="pt-2 border-t border-slate-50">
                <PromptWizard
                  fields={parsedSchema}
                  promptBody={body}
                  onRendered={(rendered) => setPreviewRendered(rendered)}
                />
              </div>

              {previewRendered && (
                <div className="space-y-1.5 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 block">پیش‌نمایش خروجی متن زنده:</span>
                  <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[10px] leading-relaxed rounded-lg overflow-x-auto text-left" style={{ direction: "ltr" }}>
                    {previewRendered}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Media Engine File Upload Area */}
          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <Camera className="w-4 h-4 text-[#6C47FF]" />
              <h3 className="text-xs font-bold text-slate-800">۳. موتور پردازش تصویر و رسانه اختصاصی</h3>
            </div>

            {isEditMode && (existingCover || (existingGallery && existingGallery.length > 0)) && (
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 text-right">
                <span className="text-[11px] font-bold text-slate-600 block">🖼️ پیش‌نمایش رسانه‌های فعلی این پرامپت:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {existingCover && (
                    <div className="space-y-1">
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white shadow-xs">
                        <img src={existingCover} alt="کاور فعلی" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] font-black text-amber-600 block text-center">کاور فعلی</span>
                    </div>
                  )}
                  {existingGallery && existingGallery.length > 0 && existingGallery.map((url, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white shadow-xs">
                        <img src={url} alt={`گالری ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 block text-center">گالری فعلی {idx + 1}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-semibold text-amber-600 mt-2">
                  ⚠️ آپلود تصاویر جدید، تصاویر فعلی را در دیتابیس جایگزین خواهد کرد.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
              {/* Cover Image Input */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">تصویر کاور اختصاصی (اختیاری)</label>
                <div className="relative border border-dashed border-slate-200 hover:border-[#6C47FF]/50 bg-slate-50/50 hover:bg-[#6C47FF]/5 rounded-xl transition duration-200 p-4 flex flex-col items-center justify-center text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCoverFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">
                    {coverFile ? `✓ انتخاب شده: ${coverFile.name}` : "کلیک کنید یا تصویر کاور را اینجا رها کنید"}
                  </span>
                </div>
              </div>

              {/* Gallery Images Input */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">گالری نمونه خروجی‌ها (اختیاری)</label>
                <div className="relative border border-dashed border-slate-200 hover:border-[#6C47FF]/50 bg-slate-50/50 hover:bg-[#6C47FF]/5 rounded-xl transition duration-200 p-4 flex flex-col items-center justify-center text-center cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setGalleryFiles(Array.from(e.target.files));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">
                    {galleryFiles.length > 0 ? `✓ ${galleryFiles.length} تصویر انتخاب شده` : "انتخاب گروهی تصاویر نمونه خروجی"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Box */}
          <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-end gap-3 mt-auto">
            <Link
              to="/admin"
              className="px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition duration-200"
            >
              انصراف
            </Link>

            <button
              type="submit"
              disabled={saving || isUploading || !!schemaError}
              className={`px-6 py-3 bg-[#6C47FF] hover:bg-[#5935e6] text-white font-bold text-xs rounded-xl shadow-md transition duration-200 flex items-center gap-2 cursor-pointer ${
                saving || isUploading || schemaError ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isUploading ? "در حال پردازش و آپلود تصاویر..." : "در حال ذخیره‌سازی..."}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditMode ? "بروزرسانی نهایی پرامپت" : "ذخیره و انتشار پرامپت"}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}

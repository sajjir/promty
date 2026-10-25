import AgentAnalysisProposal from '../components/AgentAnalysisProposal';
import { normalizeAgentAnalysis } from '../lib/normalizeAgentAnalysis';
import type { PromptEditorial } from '../types';
import { useCases, useCaseGroups, getUseCase, resourceTypes, ResourceType, normalizeIntent, groupAncestors, getGroup } from "../lib/archiveCatalog";
import Loader from "../components/Loader";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Category, FieldSchema } from "../types";
import PromptWizard from "../components/PromptWizard";
import { ArrowRight, AlertTriangle, Sparkles, Code, Check, Wand2, Camera } from "lucide-react";

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
  const [useCase, setUseCase] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("prompt");
  const [category, setCategory] = useState("تبلیغات");
  const [intent, setIntent] = useState("writing");
  const [intents, setIntents] = useState<string[]>(["writing"]);
  const [domains, setDomains] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [task, setTask] = useState("");
  const [language, setLanguage] = useState("persian");
  const [difficulty, setDifficulty] = useState("beginner");
  const [outputFormats, setOutputFormats] = useState<string[]>(["text"]);
  const [requiresReferenceImage, setRequiresReferenceImage] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [body, setBody] = useState("");
  const [bodyFa, setBodyFa] = useState("");
  const [schemaJson, setSchemaJson] = useState("");
  const [sampleImage, setSampleImage] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(false);

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
  const [analysisDurationMs, setAnalysisDurationMs] = useState<number | null>(null);
  const [editorial, setEditorial] = useState<PromptEditorial | undefined>();
  const [analysisProposal, setAnalysisProposal] = useState<ReturnType<typeof normalizeAgentAnalysis> | null>(null);
  const [undoAnalysis, setUndoAnalysis] = useState<any>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<'fa'|'en'>('fa');
  const [relatedUseCases, setRelatedUseCases] = useState<string[]>([]);

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
          const res = await fetch(`/api/prompts/${id}`, {headers:{Authorization:`Bearer ${token}`}});
          if (res.ok) {
            const data = await res.json();
            const p = data.prompt;
            setTitle(p.title);
            setDescription(p.description);
            setCategory(p.category || (p.tools && p.tools[0]) || (p.domains && p.domains[0]) || p.tool || p.domain || "عمومی");
            setIntent(normalizeIntent(p.intent || "writing"));
            setIntents((Array.isArray(p.intents) ? p.intents : (p.intent ? [p.intent] : ["writing"])).map(normalizeIntent));
            setDomains(Array.isArray(p.domains) ? p.domains : (p.domain ? [p.domain] : []));
            setTools(Array.isArray(p.tools) ? p.tools : (p.tool ? [p.tool] : []));
            setTask(p.task || "");
            setUseCase(p.useCase || "");
            setRelatedUseCases(p.relatedUseCases || []);
            setEditorial(p.editorial);
            setResourceType(p.resourceType || "prompt");
            setLanguage((p.language || "persian").toLowerCase());
            setDifficulty((p.difficulty || "beginner").toLowerCase());
            setOutputFormats(Array.isArray(p.outputFormats) ? p.outputFormats : (p.outputFormat ? [p.outputFormat] : ["text"]));
            setRequiresReferenceImage(p.requiresReferenceImage || false);
            setTagsInput(p.tags ? p.tags.join(", ") : "");
            setBody(p.body);
            setBodyFa(p.bodyFa || "");
            setSchemaJson(JSON.stringify(p.fieldsSchema, null, 2));
            setSampleImage(p.sampleImage || "");
            setExistingCover(p.coverImage || "");
            setExistingGallery(Array.isArray(p.mediaGallery) ? p.mediaGallery : []);
            setIsPremium(p.isPremium);
            setIsActive(p.isActive);
            setSourceText(p.editorial?.sourceText || p.sourceText || "");
            if (p.parentId) {
              setParentId(p.parentId);
            }
          } else {
            setError("خطا در دریافت اطلاعات پرامپت.");
          }
        } else if (forkedFrom) {
          // Fetch parent prompt data to pre-fill form for Forking
          const res = await fetch(`/api/prompts/${forkedFrom}`, {headers:{Authorization:`Bearer ${token}`}});
          if (res.ok) {
            const data = await res.json();
            const p = data.prompt;
            setTitle(""); // Keep title empty for user input
            setDescription(p.description || "");
            setCategory(p.category || (p.tools && p.tools[0]) || (p.domains && p.domains[0]) || "عمومی");
            setIntent(normalizeIntent(p.intent || "writing"));
            setIntents((Array.isArray(p.intents) ? p.intents : (p.intent ? [p.intent] : ["writing"])).map(normalizeIntent));
            setDomains(Array.isArray(p.domains) ? p.domains : (p.domain ? [p.domain] : []));
            setTools(Array.isArray(p.tools) ? p.tools : (p.tool ? [p.tool] : []));
            setTask(p.task || "");
            setUseCase(p.useCase || "");
            setRelatedUseCases(p.relatedUseCases || []);
            setEditorial(p.editorial);
            setResourceType(p.resourceType || "prompt");
            setLanguage((p.language || "persian").toLowerCase());
            setDifficulty((p.difficulty || "beginner").toLowerCase());
            setOutputFormats(Array.isArray(p.outputFormats) ? p.outputFormats : (p.outputFormat ? [p.outputFormat] : ["text"]));
            setRequiresReferenceImage(p.requiresReferenceImage || false);
            setTagsInput(p.tags ? p.tags.join(", ") : "");
            setBody(p.body);
            setBodyFa(p.bodyFa || "");
            setSchemaJson(JSON.stringify(p.fieldsSchema || [], null, 2));
            setSampleImage(p.sampleImage || "");
            setIsPremium(p.isPremium);
            setIsActive(false);
            setSourceText(p.editorial?.sourceText || p.sourceText || p.body || ""); // Pre-fill with parent's sourceText or body as fallback
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
    const requestStartedAt = performance.now();
    setAnalyzingSource(true);
    setAnalysisDurationMs(null);
    setAnalysisError("");
    setAnalysisSuccess(false);
    setAnalysisProposal(null);
    const submittedSource = sourceText;

    try {
      const res = await fetch("/api/analyze-source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sourceText: submittedSource })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const parsed = normalizeAgentAnalysis(data.data, {sourceText:submittedSource});
        setAnalysisDurationMs(Math.round(performance.now() - requestStartedAt));
        setAnalysisProposal(parsed);
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

  const captureAnalysisForm = () => ({title,description,useCase,resourceType,relatedUseCases,editorial,intent,intents,domains,tools,task,language,difficulty,outputFormats,requiresReferenceImage,tags:tagsInput.split(',').map(v=>v.trim()).filter(Boolean),body,bodyFa,fieldsSchema:parsedSchema,isActive,sourceText,schemaJson,reviewConfirmed});
  const applyAnalysisFields = (parsed: ReturnType<typeof normalizeAgentAnalysis>) => {
        setUseCase(parsed.useCase || "");
        setResourceType(parsed.resourceType || "prompt");
        setRelatedUseCases(parsed.relatedUseCases || []);
        setEditorial(parsed.editorial);
        setTitle(parsed.title || "");
        setDescription(parsed.description || "");
        setIntent(normalizeIntent(parsed.intent || "writing"));
        setIntents((Array.isArray(parsed.intents) ? parsed.intents : (parsed.intent ? [parsed.intent] : ["writing"])).map(normalizeIntent));
        setDomains(parsed.domains || []);
        setTools(parsed.tools || []);
        setTask(parsed.task || "");
        setLanguage((parsed.language || "persian").toLowerCase());
        setDifficulty((parsed.difficulty || "beginner").toLowerCase());
        setOutputFormats(parsed.outputFormats || []);
        setTagsInput(parsed.tags ? parsed.tags.join(", ") : "");
        setBody(parsed.body || "");
        setBodyFa((parsed.bodyFa || "").replace(/\[\[(.*?)\]\]/g, "{{$1}}"));
        setRequiresReferenceImage(!!parsed.requiresReferenceImage);
        setSchemaJson(JSON.stringify(parsed.fieldsSchema || [], null, 2));
  };
  const applyProposal = () => {
    if (!analysisProposal) return;
    setError("");
    setUndoAnalysis(captureAnalysisForm());
    applyAnalysisFields(analysisProposal);
    setSourceText(analysisProposal.editorial?.sourceText || sourceText);
    setIsActive(false);
    setReviewConfirmed(false);
    setAnalysisProposal(null);
  };
  const restoreAnalysis = () => {
    if (!undoAnalysis) return;
    setError("");
    applyAnalysisFields(undoAnalysis);
    setSourceText(undoAnalysis.sourceText);
    setSchemaJson(undoAnalysis.schemaJson);
    setIsActive(undoAnalysis.isActive);
    setReviewConfirmed(undoAnalysis.reviewConfirmed);
    setUndoAnalysis(null);
    setAnalysisSuccess(false);
  };
  useEffect(() => { setReviewConfirmed(false); }, [body,bodyFa,schemaJson,useCase,resourceType,requiresReferenceImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!getUseCase(useCase)) { setError("کاربرد اصلی محتوا را انتخاب کنید."); return; }

    // Schema Validation block
    if (schemaError) {
      setError("لطفاً ابتدا خطای ساختار فیلدهای Wizard را تصحیح کنید.");
      return;
    }

    if (analysisProposal) { setError('پیشنهاد تحلیل را ابتدا اعمال یا کنار بگذارید.'); return; }
    if (isActive && editorial && !reviewConfirmed) { setError('پیش از انتشار، متن، ترجمه و گزینه‌های شخصی‌سازی را بازبینی و تأیید کنید.'); return; }
    setSaving(true);

    // Prepare payload
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title,
      description,
      relatedUseCases,
      editorial: editorial ? {...editorial, needsReview: isActive && reviewConfirmed ? false : true} : undefined,
      category: getUseCase(useCase)!.title,
      useCase,
      resourceType,
      intent: normalizeIntent(intents[0] || intent || "writing"),
      intents: intents.map(normalizeIntent),
      domains,
      tools,
      task,
      language,
      difficulty,
      outputFormats,
      requiresReferenceImage,
      tags,
      body,
      bodyFa,
      fieldsSchema: parsedSchema,
      sampleImage,
      isPremium,
      isActive,
      sourceText: undefined,
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
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted">
        <Loader className="w-8 h-8 text-brand" />
        <p className="text-xs">در حال دریافت و تحلیل مشخصات فنی...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-right">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-line">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-primary">
            {isEditMode ? "ویرایش پرامپت مهندسی‌شده" : "ایجاد پرامپت هوشمند جدید"}
          </h1>
          <p className="text-xs text-muted">فیلدها و کدهای پرامپت خود را تعریف نموده و پیش‌نمایش آن را بررسی کنید.</p>
        </div>

        <Link
          to="/admin"
          className="flex items-center gap-1.5 px-4 py-2 border border-line hover:bg-surface-soft text-secondary rounded-xl text-xs font-semibold cursor-pointer transition"
        >
          <span>بازگشت به پنل</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {/* Source AI Analysis "چشمه" Section */}
      <div className="bg-gradient-to-tr from-brand-solid/5 to-brand-solid/5 border border-brand/10 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-brand/10">
          <div className="p-2 bg-brand-solid/10 rounded-lg text-brand">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-primary">بخش "چشمه" (تجزیه و تحلیل متن با هوش مصنوعی) 💡</h3>
            <p className="text-[11px] text-muted">متن پرامپت خام خود را وارد کنید تا هوش مصنوعی به صورت خودکار آن را به قالب استاندارد Promty.ir تبدیل کند.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label htmlFor="source-textarea" className="text-xs font-bold text-secondary block">متن خام پرامپت (Source)</label>
            <textarea
              id="source-textarea"
              rows={3}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="مثال: یک پرامپت بنویس که لوگوی مینیمال عینک آفتابی بسازه و رنگ اصلیش طلایی باشه و اسمش برند X باشه..."
              className="w-full text-xs p-3.5 bg-surface border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-xl outline-none transition"
            />
          </div>
          <button
            type="button"
            onClick={handleAnalyzeSource}
            disabled={analyzingSource || !sourceText.trim()}
            className="w-full md:w-auto px-6 py-3 bg-brand-solid hover:bg-brand-solid disabled:bg-surface-inset disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer h-[50px] shadow-sm"
          >
            {analyzingSource ? (
              <>
                <Loader className="w-4 h-4" />
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
          <div className="p-3 bg-success-soft text-success-text text-xs font-bold rounded-xl border border-success-text flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4 text-success-text" />
            <span>تحلیل دریافت شد{analysisDurationMs !== null ? `؛ ${(analysisDurationMs / 1000).toLocaleString("fa-IR",{maximumFractionDigits:1})} ثانیه` : ""}. نتیجه را بازبینی کنید و سپس در فرم اعمال کنید.</span>
          </div>
        )}

        {analysisProposal && <AgentAnalysisProposal draft={analysisProposal} onApply={applyProposal} onDismiss={()=>setAnalysisProposal(null)} />}
        {undoAnalysis && <button type="button" onClick={restoreAnalysis} className="rounded-lg border border-line px-4 py-2 text-xs font-bold">بازگردانی فرم به قبل از اعمال تحلیل</button>}

        {editorial && (
          <section aria-label="گزارش بازبینی ایجنت" className="p-4 rounded-xl border border-line bg-surface-soft text-xs space-y-3">
            <h3 className="font-bold text-primary">گزارش بازبینی ایجنت {editorial.needsReview ? '— نیازمند بررسی' : '— آمادهٔ بررسی نهایی شما'}</h3>
            <p className="text-secondary leading-relaxed">{editorial.classificationReason}</p>
            <p className="leading-7">{editorial.fidelity?.reason || 'حفظ متن اصلی هنوز مستقل بررسی نشده است.'}</p>
            {!!editorial.fixedConstraints?.length && <div><h4 className="font-bold mb-2">قیود ثابت محتوا</h4><ul className="list-disc list-inside space-y-2">{editorial.fixedConstraints.map((v,i)=><li key={i}>{v}</li>)}</ul></div>}
            {!!editorial.improvementSuggestions?.length && <details><summary className="font-bold cursor-pointer">پیشنهادهای بهبود؛ اعمال نشده در متن</summary><div className="space-y-4 mt-3">{editorial.improvementSuggestions.map((v,i)=><article key={i} className="space-y-2"><h4 className="font-bold">{v.title}</h4><p>{v.reason}</p><p>{v.proposedChange}</p></article>)}</div></details>}
            {relatedUseCases.length > 0 && <p>کاربردهای مرتبط: {relatedUseCases.map(slug => getUseCase(slug)?.title || slug).join('، ')}</p>}
            <details><summary className="cursor-pointer font-bold">یادداشت‌ها و نیازمندی‌های اجرا</summary>
              <ul className="list-disc list-inside mt-3 space-y-2 text-secondary">{editorial.reviewNotes.map((note, i) => <li key={i}>{note}</li>)}</ul>
              <p className="mt-3">نیازمندی‌ها: {editorial.execution.requiredCapabilities.join('؛ ')}</p>
              <p className="mt-2 text-muted">مرجع طبقه‌بندی: {editorial.catalogVersion} — این گزارش، اثبات اجرای پرامپت در ابزار مقصد نیست.</p>
            </details>
          </section>
        )}

        {analysisError && (
          <div className="p-3 bg-danger-soft text-danger-text text-xs font-bold rounded-xl border border-danger-text flex items-center gap-1.5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-danger-text" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-danger-soft border border-danger-text text-danger-text rounded-xl text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-4 bg-success-soft border border-success-text text-success-text rounded-xl text-xs font-bold leading-relaxed">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>عملیات با موفقیت انجام شد! در حال هدایت به پنل مدیریت...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Metadata Details form) */}
        <div className="lg:col-span-6 bg-surface p-6 border border-line rounded-2xl shadow-sm space-y-4">
          
          <h3 className="text-xs font-bold text-primary pb-2 border-b border-line mb-2">۱. جزئیات و اطلاعات پایه پرامپت</h3>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prompt-title" className="text-xs font-bold text-secondary">عنوان پرامپت *</label>
            <input
              type="text"
              id="prompt-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: پرتره آتلیه‌ای سینمایی"
              className="w-full text-xs p-3 bg-surface-soft border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-xl outline-none transition"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prompt-desc" className="text-xs font-bold text-secondary">توضیحات کوتاه پرامپت</label>
            <textarea
              id="prompt-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: این پرامپت به شما اجازه می‌دهد تصاویری با نورپردازی متمرکز سینمایی ایجاد کنید..."
              className="w-full text-xs p-3 bg-surface-soft border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-xl outline-none transition"
            />
          </div>

          {/* Read-only Source Text (for forked/analyzed prompts) */}
          {sourceText && (
            <div className="flex flex-col gap-1.5 p-3.5 bg-caution-soft/50 border border-caution-text rounded-xl">
              <label htmlFor="readonly-source-textarea" className="text-xs font-bold text-caution-text block">📝 متن منبع خام پرامپت (Source Text - Read-only)</label>
              <textarea
                id="readonly-source-textarea"
                rows={3}
                readOnly
                value={sourceText}
                className="w-full text-xs p-3 bg-surface border border-caution-text/50 rounded-xl outline-none text-secondary cursor-not-allowed select-all"
                placeholder="منبع خام ثبت نشده است."
              />
              <span className="text-[10px] text-caution-text leading-normal">این فیلد فقط‌خواندنی است و نشان‌دهنده متن خام منبع (Source) این پرامپت انشعاب‌یافته یا پردازش‌شده می‌باشد.</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-brand p-4">
            <label className="text-sm text-primary">کاربرد اصلی *
              <select required aria-label="کاربرد اصلی" value={useCase} onChange={e => setUseCase(e.target.value)} className="w-full mt-2 rounded-lg bg-surface border border-line p-3">
                <option value="">انتخاب کاربرد</option>
                {useCaseGroups.map(group => <optgroup key={group.slug} label={groupAncestors(group.slug).reverse().map(slug => getGroup(slug)!.title).join(' ← ')}>{useCases.filter(item => item.group === group.slug && (!item.legacy || item.slug === useCase)).map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</optgroup>)}
              </select>
            </label>
            <label className="text-sm text-primary">نوع منبع
              <select aria-label="نوع منبع محتوا" value={resourceType} onChange={e => setResourceType(e.target.value as ResourceType)} className="w-full mt-2 rounded-lg bg-surface border border-line p-3">
                {Object.entries(resourceTypes).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
              </select>
            </label>
            <p className="text-xs text-muted sm:col-span-2">ابزارها و قالب خروجی ویژگی مکمل‌اند. برای Skill متن کامل SKILL.md و برای راهنمای ایجنت دستورالعمل و روش استفاده را وارد کنید.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Intent - Multi Select */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-secondary">اهداف اصلی (Intent) * — چندانتخابی</label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-surface-soft border border-line rounded-xl max-h-32 overflow-y-auto">
                {getOptions("intent", [
                  "Create", "Write", "Code", "Design", "Market",
                  "Analyze", "Learn", "Automate", "Research", "Productivity"
                ]).map((opt) => {
                  const isSelected = intents.includes(opt.value);
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => {
                        if (isSelected) {
                          setIntents(intents.filter((i) => i !== opt.value));
                        } else {
                          setIntents([...intents, opt.value]);
                        }
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? "bg-brand-solid text-white border-brand"
                          : "bg-surface text-secondary border-line hover:border-line-strong"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Task */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prompt-task" className="text-xs font-bold text-secondary">کار مشخص (Task)</label>
              <input
                type="text"
                id="prompt-task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="مثال: Write Instagram Caption"
                className="w-full text-xs p-3 bg-surface-soft border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-xl outline-none transition text-left"
                style={{ direction: "ltr" }}
              />
            </div>

            {/* Language */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prompt-language" className="text-xs font-bold text-secondary">زبان اصلی پرامپت *</label>
              <select
                id="prompt-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs p-3 bg-surface-soft border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-xl outline-none transition cursor-pointer"
              >
                {getOptions("language", ["Persian", "English"]).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prompt-difficulty" className="text-xs font-bold text-secondary">سطح دشواری (Difficulty) *</label>
              <select
                id="prompt-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full text-xs p-3 bg-surface-soft border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-xl outline-none transition cursor-pointer"
              >
                {getOptions("difficulty", ["Beginner", "Intermediate", "Advanced", "Expert"]).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Requires Reference Image */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-secondary">نیاز به تصویر منبع (Reference Image)</label>
              <div className="flex items-center gap-3 p-3 bg-surface-soft border border-line rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="requiresReferenceImage"
                  checked={requiresReferenceImage}
                  onChange={(e) => setRequiresReferenceImage(e.target.checked)}
                  className="w-4 h-4 text-brand border-line-strong rounded focus:ring-brand cursor-pointer"
                />
                <label htmlFor="requiresReferenceImage" className="text-xs font-semibold text-primary cursor-pointer">
                  این پرامپت برای اجرا یا آنالیز نیاز به تصویر ورودی/منبع دارد.
                </label>
              </div>
            </div>

            {/* Domain - Multi Select */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-secondary">حوزه‌های مرتبط (Domain) * — چندانتخابی</label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-surface-soft border border-line rounded-xl max-h-32 overflow-y-auto">
                {getOptions("domain", [
                  "Business", "Marketing", "Education", "Health", "Legal",
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
                          ? "bg-brand-solid text-white border-brand"
                          : "bg-surface text-secondary border-line hover:border-line-strong"
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
              <label className="text-xs font-bold text-secondary">ابزارهای هوش مصنوعی (Tool) * — چندانتخابی</label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-surface-soft border border-line rounded-xl max-h-32 overflow-y-auto">
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
                          ? "bg-brand-solid text-white border-brand"
                          : "bg-surface text-secondary border-line hover:border-line-strong"
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
              <label className="text-xs font-bold text-secondary">فرمت‌های خروجی (Output Format) * — چندانتخابی</label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-surface-soft border border-line rounded-xl max-h-32 overflow-y-auto">
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
                          ? "bg-brand-solid text-white border-brand"
                          : "bg-surface text-secondary border-line hover:border-line-strong"
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
            <label htmlFor="prompt-tags" className="text-xs font-bold text-secondary">تگ‌ها (جدا شده با کاما ,)</label>
            <input
              type="text"
              id="prompt-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="مثال: عکاسی, پرتره, Midjourney"
              className="w-full text-xs p-3 bg-surface-soft border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-xl outline-none transition text-left"
              style={{ direction: "ltr" }}
            />
          </div>

          {/* Image */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prompt-sample-img" className="text-xs font-bold text-secondary">آدرس تصویر نمونه خروجی (URL)</label>
            <input
              type="text"
              id="prompt-sample-img"
              value={sampleImage}
              onChange={(e) => setSampleImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs p-3 bg-surface-soft border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-xl outline-none transition text-left"
              style={{ direction: "ltr" }}
            />
          </div>

          {/* Large Body Code */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="prompt-body" className="text-xs font-bold text-secondary">متن پرامپت با جایگاه‌های {"{{placeholder}}"} *</label>
              <span className="text-[10px] text-brand font-semibold bg-brand-solid/10 px-2 py-0.5 rounded">پرامپت نهایی</span>
            </div>
            <textarea
              id="prompt-body"
              rows={6}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="یک عکس خلاقانه از {{product_name}} با پس‌زمینه {{brand_color}} بساز..."
              className="w-full p-4.5 bg-slate-900 text-muted font-mono text-xs leading-relaxed rounded-xl ring-4 ring-line-strong/5 focus:outline-none focus:ring-4 focus:ring-brand/20 text-left"
              style={{ direction: "ltr" }}
            />
            <span className="text-[10px] text-muted">
              راهنما: حتماً فیلدهای شخصی‌سازی را بدین شکل قرار دهید: <span className="font-mono text-brand block md:inline font-bold">{"{{product_name}}"}</span> یا <span className="font-mono text-brand block md:inline font-bold">{"{{tone}}"}</span> تا با مقادیر Wizard جایگزین شوند.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="prompt-body-fa" className="text-xs font-bold text-secondary">نسخه پارسی پرامپت (اختیاری)</label>
            <textarea id="prompt-body-fa" rows={6} value={bodyFa} onChange={event => setBodyFa(event.target.value)} dir="rtl" className="w-full p-4 bg-surface-inset text-primary text-sm leading-relaxed rounded-xl border border-line focus:border-brand" placeholder="ترجمه پارسی با همان متغیرهای نسخه اصلی" />
            <p className="text-[11px] text-muted">این متن در صفحه پرامپت با انتخاب «نسخه پارسی» نمایش داده می‌شود. نام متغیرها را مانند نسخه اصلی نگه دارید.</p>
          </div>

          {editorial && <label className="flex items-start gap-3 rounded-xl border border-line bg-surface-soft p-4 text-xs leading-7"><input type="checkbox" checked={reviewConfirmed} onChange={event=>setReviewConfirmed(event.target.checked)} className="mt-2" /><span>متن کامل، ترجمه، نیاز به تصویر و تمام گزینه‌های شخصی‌سازی را بازبینی کرده‌ام و انتشار را تأیید می‌کنم. این تأیید، نشان آزمون اجرای واقعی در ابزار مقصد ایجاد نمی‌کند.</span></label>}

          {/* Checkboxes Row */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <label id="premium-toggle-label" className="flex items-center gap-2.5 p-3.5 bg-surface-soft border border-line rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-4 h-4 text-brand border-line-strong focus:ring-brand rounded cursor-pointer"
              />
              <div className="space-y-0.5 cursor-pointer">
                <span className="text-xs font-bold text-primary block">پرامپت ویژه (Premium)</span>
                <span className="text-[10px] text-muted block font-normal">نیازمند عضویت ممتاز جهت کپی</span>
              </div>
            </label>

            <label id="active-toggle-label" className="flex items-center gap-2.5 p-3.5 bg-surface-soft border border-line rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-success-text border-line-strong focus:ring-success-text rounded cursor-pointer"
              />
              <div className="space-y-0.5 cursor-pointer">
                <span className="text-xs font-bold text-primary block">انتشار عمومی پس از بازبینی</span>
                <span className="text-[10px] text-muted block font-normal">نمایش در نتایج جستجو و لیست‌ها</span>
              </div>
            </label>
          </div>

        </div>

        {/* Right Column (Wizard Schema JSON & Live Preview) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* JSON Wizard Editor */}
          <details className="bg-surface p-6 border border-line rounded-2xl shadow-sm space-y-4">
            <summary className="cursor-pointer text-sm font-bold text-primary">تنظیمات پیشرفتهٔ فیلدها (JSON)</summary>
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="text-xs font-bold text-primary flex items-center gap-1">
                <Code className="w-4 h-4 text-brand" />
                <span>۲. تعریف فیلدهای Wizard (JSON Schema)</span>
              </h3>
              <span className="text-[10px] text-brand font-semibold bg-brand-solid/10 px-2.5 py-0.5 rounded">آرایه JSON</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="schema-json-textarea" className="sr-only">ساختار JSON برای فیلدهای شخصی‌سازی</label>
              <textarea
                id="schema-json-textarea"
                rows={8}
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                placeholder="[ { 'key': 'product', 'label': 'محصول', 'type': 'text' } ]"
                className="w-full p-4.5 bg-slate-900 text-success-text font-mono text-xs leading-relaxed rounded-xl ring-4 ring-line-strong/5 focus:outline-none focus:ring-4 focus:ring-brand/20 text-left"
                style={{ direction: "ltr" }}
              />
            </div>

            {/* Error handling inside JSON validator */}
            {schemaError ? (
              <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger-text text-danger-text rounded-lg text-[10px] leading-relaxed">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-mono">{schemaError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-success-text font-extrabold">
                <Check className="w-4 h-4" />
                <span>ساختار پایهٔ فیلدها خوانده شد؛ متن و گزینه‌ها را در پیش‌نمایش بررسی کنید.</span>
              </div>
            )}
          </details>

          {/* Interactive Live Preview */}
          {(body || bodyFa) && (
            <div className="bg-surface p-6 border border-line rounded-2xl shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-primary">🕵️ پیش‌نمایش زنده فرم محصول (Live Preview)</h4>
              <div className="flex gap-2" role="group" aria-label="زبان پیش‌نمایش فرم"><button type="button" aria-pressed={previewLanguage==='fa'} onClick={()=>setPreviewLanguage('fa')} className="border border-line rounded-lg px-3 py-2 text-xs">فارسی</button><button type="button" aria-pressed={previewLanguage==='en'} onClick={()=>setPreviewLanguage('en')} className="border border-line rounded-lg px-3 py-2 text-xs">زبان اصلی</button></div>
              {!parsedSchema.length && <p className="text-xs text-muted">این محتوا فیلد شخصی‌سازی ندارد؛ متن کامل همچنان قابل بازبینی است.</p>}
              
              <div className="pt-2 border-t border-line">
                <PromptWizard
                  fields={parsedSchema}
                  language={previewLanguage}
                  promptBody={previewLanguage === "fa" ? bodyFa || body : body}
                  onRendered={(rendered) => setPreviewRendered(rendered)}
                />
              </div>

              {previewRendered && (
                <div className="space-y-1.5 pt-3">
                  <span className="text-[10px] font-bold text-muted block">پیش‌نمایش خروجی متن زنده:</span>
                  <div className="p-3 bg-slate-900 text-muted font-mono text-[10px] leading-relaxed rounded-lg overflow-x-auto text-left" style={{ direction: "ltr" }}>
                    {previewRendered}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Media Engine File Upload Area */}
          <div className="bg-surface p-6 border border-line rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Camera className="w-4 h-4 text-brand" />
              <h3 className="text-xs font-bold text-primary">۳. موتور پردازش تصویر و رسانه اختصاصی</h3>
            </div>

            {isEditMode && (existingCover || (existingGallery && existingGallery.length > 0)) && (
              <div className="bg-surface-soft/50 p-4 rounded-xl border border-line space-y-3 text-right">
                <span className="text-[11px] font-bold text-secondary block">🖼️ پیش‌نمایش رسانه‌های فعلی این پرامپت:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {existingCover && (
                    <div className="space-y-1">
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-line bg-surface shadow-xs">
                        <img src={existingCover} alt="کاور فعلی" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] font-black text-caution-text block text-center">کاور فعلی</span>
                    </div>
                  )}
                  {existingGallery && existingGallery.length > 0 && existingGallery.map((url, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-line bg-surface shadow-xs">
                        <img src={url} alt={`گالری ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] font-bold text-muted block text-center">گالری فعلی {idx + 1}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-semibold text-caution-text mt-2">
                  ⚠️ آپلود تصاویر جدید، تصاویر فعلی را در دیتابیس جایگزین خواهد کرد.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
              {/* Cover Image Input */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-secondary block">تصویر کاور اختصاصی (اختیاری)</label>
                <div className="relative border border-dashed border-line hover:border-brand/50 bg-surface-soft/50 hover:bg-brand-solid/5 rounded-xl transition duration-200 p-4 flex flex-col items-center justify-center text-center cursor-pointer">
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
                  <span className="text-[10px] text-muted font-medium">
                    {coverFile ? `✓ انتخاب شده: ${coverFile.name}` : "کلیک کنید یا تصویر کاور را اینجا رها کنید"}
                  </span>
                </div>
              </div>

              {/* Gallery Images Input */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-secondary block">گالری نمونه خروجی‌ها (اختیاری)</label>
                <div className="relative border border-dashed border-line hover:border-brand/50 bg-surface-soft/50 hover:bg-brand-solid/5 rounded-xl transition duration-200 p-4 flex flex-col items-center justify-center text-center cursor-pointer">
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
                  <span className="text-[10px] text-muted font-medium">
                    {galleryFiles.length > 0 ? `✓ ${galleryFiles.length} تصویر انتخاب شده` : "انتخاب گروهی تصاویر نمونه خروجی"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Box */}
          <div className="bg-surface p-4 border border-line rounded-2xl shadow-sm flex items-center justify-end gap-3 mt-auto">
            <Link
              to="/admin"
              className="px-5 py-3 text-xs font-bold text-muted hover:text-primary bg-surface-soft hover:bg-surface-soft rounded-xl transition duration-200"
            >
              انصراف
            </Link>

            <button
              type="submit"
              disabled={saving || isUploading || !!schemaError}
              className={`px-6 py-3 bg-brand-solid hover:bg-brand-solid text-white font-bold text-xs rounded-xl shadow-md transition duration-200 flex items-center gap-2 cursor-pointer ${
                saving || isUploading || schemaError ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving || isUploading ? (
                <>
                  <Loader className="w-4 h-4" />
                  <span>
                    {isUploading ? "در حال پردازش و آپلود تصاویر..." : "در حال ذخیره‌سازی..."}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isActive ? "انتشار پس از بازبینی" : "ذخیرهٔ پیش‌نویس"}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}

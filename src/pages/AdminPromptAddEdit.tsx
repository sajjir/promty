import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Category, FieldSchema } from "../types";
import PromptWizard from "../components/PromptWizard";
import { ArrowRight, AlertTriangle, Sparkles, Code, Check, Loader2 } from "lucide-react";

export default function AdminPromptAddEdit() {
  const { id } = useParams<{ id: string }>(); // If there is an ID, we are in Edit mode, otherwise Add mode.
  const isEditMode = !!id;
  const navigate = useNavigate();

  const token = localStorage.getItem("promty_admin_token");

  // Local form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("تبلیغات");
  const [tagsInput, setTagsInput] = useState("");
  const [body, setBody] = useState("");
  const [schemaJson, setSchemaJson] = useState("");
  const [sampleImage, setSampleImage] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);

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

  // Load categories and prompt if editing
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

        if (isEditMode) {
          // Fetch existing prompt
          const res = await fetch(`/api/prompts/${id}`);
          if (res.ok) {
            const data = await res.json();
            const p = data.prompt;
            setTitle(p.title);
            setDescription(p.description);
            setCategory(p.category);
            setTagsInput(p.tags ? p.tags.join(", ") : "");
            setBody(p.body);
            setSchemaJson(JSON.stringify(p.fieldsSchema, null, 2));
            setSampleImage(p.sampleImage || "");
            setIsPremium(p.isPremium);
            setIsActive(p.isActive);
          } else {
            setError("خطا در دریافت اطلاعات پرامپت.");
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
  }, [id, isEditMode]);

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
      category,
      tags,
      body,
      fieldsSchema: parsedSchema,
      sampleImage,
      isPremium,
      isActive,
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

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prompt-category" className="text-xs font-bold text-slate-600">دسته‌بندی اصلی *</label>
              <select
                id="prompt-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
              راهنما: حتماً فیلدهای شخصی‌سازی را بدین شکل قرار دهید: <span className="font-mono text-[#6C47FF] font-bold">{"{{product_name}}"}</span> یا <span className="font-mono text-[#6C47FF] font-bold">{"{{tone}}"}</span> تا با مقادیر Wizard جایگزین شوند.
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
              disabled={saving || !!schemaError}
              className={`px-6 py-3 bg-[#6C47FF] hover:bg-[#5935e6] text-white font-bold text-xs rounded-xl shadow-md transition duration-200 flex items-center gap-2 cursor-pointer ${
                saving || schemaError ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره‌سازی...</span>
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

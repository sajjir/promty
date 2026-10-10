import React, { useState, useEffect } from "react";
import { FieldSchema } from "../types";
import { renderPrompt } from "../lib/renderPrompt";
import { useAuth } from "./AuthContext";
import { Wand2, X, AlertCircle, CheckCircle, Save, Sparkles, FolderPlus, RotateCcw, Copy } from "lucide-react";
import { Z } from "../lib/zIndex";

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

interface PromptWizardProps {
  showCopyButton?: boolean;
  fields: FieldSchema[];
  promptBody: string;
  onRendered: (rendered: string) => void;
  promptId?: string;
  activePresetId?: string | null;
  setActivePresetId?: (id: string | null) => void;
  values?: Record<string, string>;
  setValues?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onPresetSavedOrUpdated?: () => void;
  onValuesChange?: (values: Record<string, string>) => void;
}

export default function PromptWizard({
  showCopyButton = true,
  fields,
  promptBody,
  onRendered,
  promptId,
  activePresetId,
  setActivePresetId,
  values,
  setValues,
  onPresetSavedOrUpdated,
  onValuesChange
}: PromptWizardProps) {
  const { user, setPhoneModalOpen } = useAuth();
  
  // State to track customized text input fields instead of selects
  const [customMode, setCustomMode] = useState<Record<string, boolean>>({});

  // Fallback states if not passed as props (e.g. in Admin live form preview)
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [localActivePresetId, setLocalActivePresetId] = useState<string | null>(null);

  const finalValues = values !== undefined ? values : localValues;
  const finalSetValues = setValues !== undefined ? setValues : setLocalValues;
  const finalActivePresetId = activePresetId !== undefined ? activePresetId : localActivePresetId;
  const finalSetActivePresetId = setActivePresetId !== undefined ? setActivePresetId : setLocalActivePresetId;

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [wizardCopied, setWizardCopied] = useState(false);

  // Sync values to parent components
  useEffect(() => {
    if (onValuesChange) {
      onValuesChange(finalValues);
    }
  }, [finalValues, onValuesChange]);

  // Auto-detect customMode when values/presets are loaded
  useEffect(() => {
    if (finalValues) {
      const updatedCustomMode: Record<string, boolean> = {};
      fields.forEach((field) => {
        if (field.type === "select") {
          const val = finalValues[field.key];
          if (val) {
            const optionsList = field.options || [];
            const hasOption = optionsList.some((opt) => {
              const parsed = parseOption(opt);
              return parsed.value === val;
            });
            if (!hasOption) {
              updatedCustomMode[field.key] = true;
            }
          }
        }
      });
      setCustomMode((prev) => ({ ...prev, ...updatedCustomMode }));
    }
  }, [finalValues, fields]);

  // Initialize local fallback values when fields change (if uncontrolled)
  useEffect(() => {
    if (values === undefined) {
      const initial: Record<string, string> = {};
      fields.forEach((field) => {
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
      setLocalValues(initial);
    }
  }, [fields, values]);

  // Perform live client-side replacement when values or promptBody change
  useEffect(() => {
    const rendered = renderPrompt(promptBody, finalValues);
    onRendered(rendered);
  }, [finalValues, promptBody]);

  const updateValues = (newValuesOrUpdater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    if (typeof newValuesOrUpdater === "function") {
      finalSetValues((prev) => {
        const updated = newValuesOrUpdater(prev);
        if (onValuesChange) {
          onValuesChange(updated);
        }
        return updated;
      });
    } else {
      finalSetValues(newValuesOrUpdater);
      if (onValuesChange) {
        onValuesChange(newValuesOrUpdater);
      }
    }
  };

  const handleInputChange = (key: string, value: string) => {
    updateValues((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    const initial: Record<string, string> = {};
    fields.forEach((field) => {
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
    updateValues(initial);
    setCustomMode({});
    if (setActivePresetId) {
      setActivePresetId(null);
    }
  };

  const handleSaveNewPresetClick = () => {
    if (!user) {
      setPhoneModalOpen(true, "برای ذخیره نسخه شخصی پرامپت وارد شوید");
      return;
    }
    // Set smart default name
    const now = new Date();
    const faDate = now.toLocaleDateString("fa-IR");
    const faTime = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    setPresetName(`نسخه شخصی - ${faDate} ساعت ${faTime}`);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaveModalOpen(true);
  };

  const submitNewPreset = async () => {
    if (!presetName.trim()) {
      setErrorMessage("لطفاً نامی برای نسخه خود وارد کنید.");
      return;
    }

    if (!promptId) {
      setErrorMessage("شناسه پرامپت معتبر یافت نشد.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await fetch(`/api/prompts/${promptId}/presets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: presetName.trim(),
          values: finalValues
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage("نسخه با موفقیت ذخیره و به بوکمارک‌های شما اضافه شد.");
        finalSetActivePresetId(data.preset.id);
        setIsSaveModalOpen(false);
        if (onPresetSavedOrUpdated) {
          onPresetSavedOrUpdated();
        }
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.message || "خطایی رخ داد.");
      }
    } catch (err: any) {
      setErrorMessage("برقراری ارتباط با سرور با خطا مواجه شد.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePreset = async () => {
    if (!user) {
      setPhoneModalOpen(true, "برای بروزرسانی نسخه شخصی پرامپت وارد شوید");
      return;
    }
    if (!finalActivePresetId) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await fetch(`/api/presets/${finalActivePresetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: finalValues
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage("نسخه با موفقیت بروزرسانی شد.");
        if (onPresetSavedOrUpdated) {
          onPresetSavedOrUpdated();
        }
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.message || "خطایی رخ داد.");
      }
    } catch (err: any) {
      setErrorMessage("برقراری ارتباط با سرور با خطا مواجه شد.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="prompt-wizard-container" className="bg-surface-soft border border-line rounded-xl p-5 space-y-4 animate-fade-in text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-3 gap-2">
        <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
          <span>✏️</span>
          <span>شخصی‌سازی مقادیر پرامپت</span>
        </h4>
        <span className="text-[10px] text-muted">تغییرات در همان لحظه اعمال می‌شود</span>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-success-soft text-success-text border border-success-text rounded-lg text-xs font-bold">
          <CheckCircle className="w-4 h-4 shrink-0 text-success-text" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-danger-soft text-danger-text border border-danger-text rounded-lg text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-danger-text" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const value = finalValues[field.key] || "";

          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label htmlFor={field.key} className="text-xs font-semibold text-primary flex items-center gap-1">
                <span>{field.label}</span>
                {field.required && <span className="text-danger-text text-xs">*</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  id={field.key}
                  rows={2}
                  value={value}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder || "توضیحات مربوطه را بنویسید..."}
                  className="w-full text-xs p-2.5 bg-surface border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-lg outline-none transition"
                />
              ) : field.type === "select" ? (
                customMode[field.key] ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      id={field.key}
                      value={value}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder || "مقدار دلخواه خود را بنویسید..."}
                      className="flex-1 text-xs p-2.5 bg-surface border border-brand focus:border-brand focus:ring-1 focus:ring-brand rounded-lg outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMode((prev) => ({ ...prev, [field.key]: false }));
                        handleInputChange(field.key, "");
                      }}
                      className="p-2.5 bg-surface-soft hover:bg-surface-inset text-muted hover:text-primary rounded-lg transition shrink-0 cursor-pointer"
                      title="بازگشت به لیست"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select
                    id={field.key}
                    value={value}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__CUSTOM__") {
                        setCustomMode((prev) => ({ ...prev, [field.key]: true }));
                        handleInputChange(field.key, "");
                      } else {
                        handleInputChange(field.key, val);
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-surface border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-lg outline-none transition cursor-pointer"
                  >
                    <option value="">{field.placeholder || "یکی را انتخاب کنید"}</option>
                    {field.options?.map((opt) => {
                      const parsed = parseOption(opt);
                      return (
                        <option key={opt} value={parsed.value}>
                          {parsed.label}
                        </option>
                      );
                    })}
                    <option value="__CUSTOM__" className="text-brand font-bold">+ تایپ مقدار دلخواه...</option>
                  </select>
                )
              ) : field.type === "color" ? (
                <div id="color-picker-group" className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-line cursor-pointer flex-shrink-0">
                    <input
                      type="color"
                      id={field.key}
                      value={value || "#6c47ff"}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="absolute inset-0 w-full h-full p-0 border-0 scale-150 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder="#000000 پس‌زمینه"
                    className="flex-1 text-xs p-2.5 bg-surface border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-lg outline-none transition font-mono text-left"
                  />
                </div>
              ) : field.type === "switch" ? (
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={value === "بله"}
                    onChange={(e) => handleInputChange(field.key, e.target.checked ? "بله" : "خیر")}
                    className="sr-only peer"
                  />
                  <div className="relative w-9 h-5 bg-surface-inset peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-surface after:border-line-strong after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-solid"></div>
                  <span className="text-xs text-secondary font-bold">{value || "خیر"}</span>
                </label>
              ) : field.type === "slider" ? (
                <div className="flex items-center gap-3 w-full">
                  <input
                    type="range"
                    id={field.key}
                    min={field.min ?? 1}
                    max={field.max ?? 100}
                    value={value || field.min || 10}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="flex-1 h-1.5 bg-surface-inset rounded-lg appearance-none cursor-pointer accent-[#6C47FF]"
                  />
                  <span className="text-xs font-mono font-bold bg-brand-solid/10 text-brand px-2.5 py-0.5 rounded">
                    {value || field.min || 10}
                  </span>
                </div>
              ) : field.type === "radio" ? (
                <div className="flex flex-wrap gap-3 mt-1">
                  {field.options?.map((opt) => {
                    const parsed = parseOption(opt);
                    return (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs text-secondary">
                        <input
                          type="radio"
                          name={field.key}
                          value={parsed.value}
                          checked={value === parsed.value}
                          onChange={() => handleInputChange(field.key, parsed.value)}
                          className="w-3.5 h-3.5 text-brand focus:ring-brand"
                        />
                        <span>{parsed.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : field.type === "multiselect" ? (
                <div className="flex flex-wrap gap-2 mt-1 p-2 bg-surface border border-line rounded-lg max-h-24 overflow-y-auto w-full">
                  {field.options?.map((opt) => {
                    const parsed = parseOption(opt);
                    const selectedList = value ? value.split(", ") : [];
                    const isSelected = selectedList.includes(parsed.value);
                    const toggleOption = () => {
                      let newList;
                      if (isSelected) {
                        newList = selectedList.filter((s) => s !== parsed.value);
                      } else {
                        newList = [...selectedList, parsed.value];
                      }
                      handleInputChange(field.key, newList.join(", "));
                    };

                    return (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs text-secondary bg-surface-soft hover:bg-surface-soft px-2.5 py-1 rounded border border-line">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={toggleOption}
                          className="w-3.5 h-3.5 text-brand focus:ring-brand rounded"
                        />
                        <span>{parsed.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : field.type === "url" ? (
                <input
                  type="url"
                  id={field.key}
                  value={value}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder || "https://example.com"}
                  className="w-full text-xs p-2.5 bg-surface border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-lg outline-none transition text-left font-mono"
                  style={{ direction: "ltr" }}
                />
              ) : (
                <input
                  type="text"
                  id={field.key}
                  value={value}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder || "متنی وارد کنید..."}
                  className="w-full text-xs p-2.5 bg-surface border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-lg outline-none transition"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Glowing Final Copy Button */}
      {showCopyButton && (
      <button
        type="button"
        onClick={async () => {
          const finalRenderedText = renderPrompt(promptBody, finalValues);
          await navigator.clipboard.writeText(finalRenderedText);
          setWizardCopied(true);
          setTimeout(() => setWizardCopied(false), 2000);
        }}
        className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-l from-brand-solid to-[#8B6CFF] text-white text-sm font-black rounded-2xl shadow-lg shadow-brand/20 hover:shadow-xl transition-all cursor-pointer"
      >
        <Copy className="w-4 h-4" />
        <span>{wizardCopied ? "کپی شد! 🎉" : "✅ کپی پرامپت نهایی شخصی‌سازی‌شده"}</span>
      </button>
      )}

      {/* Preset Customizer Controls */}
      {promptId && (
        <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-line justify-between items-center">
          <div className="text-right">
            {finalActivePresetId ? (
              <p className="text-[10px] text-brand font-black flex items-center gap-1">
                <span>🌟 درحال ویرایش نسخه فعال لود شده</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted font-semibold">
                می‌توانید مقادیر بالا را به عنوان یک نسخه شخصی (Preset) برای بعد ذخیره کنید.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-black text-muted bg-surface border border-line hover:bg-surface-soft hover:text-primary rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی مقادیر</span>
            </button>
            {finalActivePresetId ? (
              <>
                <button
                  type="button"
                  onClick={handleUpdatePreset}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-black text-primary bg-surface border border-line hover:bg-surface-soft hover:border-line-strong rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                >
                  💾 بروزرسانی این نسخه
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewPresetClick}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-black text-white bg-brand-solid hover:bg-brand-solid rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-sm"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>ذخیره به عنوان نسخه جدید</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSaveNewPresetClick}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-black text-white bg-brand-solid hover:bg-brand-solid rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-md shadow-brand/10"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره مقادیر به عنوان نسخه شخصی (Preset)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Elegant Naming Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" style={{ zIndex: Z.MODAL }}>
          <div className="bg-surface rounded-2xl border border-line p-6 max-w-sm w-full space-y-4 shadow-xl text-right animate-scale-up" dir="rtl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h5 className="text-xs font-black text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>ذخیره نسخه جدید پرامپت</span>
              </h5>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-muted hover:text-secondary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="preset-name-input" className="text-[11px] font-bold text-muted">نام نسخه شخصی:</label>
              <input
                id="preset-name-input"
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="مثلا: نسخه تست بازاریابی"
                className="w-full p-2.5 text-xs bg-surface-soft border border-line focus:border-brand focus:bg-surface rounded-xl outline-none transition"
              />
            </div>

            <div className="flex gap-2.5 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-3 py-2 text-xs font-bold text-muted hover:bg-surface-soft rounded-xl transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={submitNewPreset}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-black text-white bg-brand-solid hover:bg-brand-solid rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? "در حال ذخیره‌سازی..." : "ثبت و ذخیره"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

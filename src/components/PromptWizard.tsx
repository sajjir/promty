import React, { useState, useEffect } from "react";
import { FieldSchema } from "../types";
import { renderPrompt } from "../lib/renderPrompt";

interface PromptWizardProps {
  fields: FieldSchema[];
  promptBody: string;
  onRendered: (rendered: string) => void;
}

export default function PromptWizard({ fields, promptBody, onRendered }: PromptWizardProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  // Initialize values dictionary with empty strings
  useEffect(() => {
    const initial: Record<string, string> = {};
    fields.forEach((field) => {
      initial[field.key] = "";
    });
    setValues(initial);
  }, [fields]);

  const handleInputChange = (key: string, value: string) => {
    const updated = { ...values, [key]: value };
    setValues(updated);
    
    // Perform live client-side replacement
    const rendered = renderPrompt(promptBody, updated);
    onRendered(rendered);
  };

  return (
    <div id="prompt-wizard-container" className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span>✏️</span>
          <span>شخصی‌سازی مقادیر پرامپت</span>
        </h4>
        <span className="text-xs text-slate-400">تمام تغییرات در همان لحظه در پرامپت بالا اعمال می‌شود</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const value = values[field.key] || "";

          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label htmlFor={field.key} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <span>{field.label}</span>
                {field.required && <span className="text-rose-500 text-xs">*</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  id={field.key}
                  rows={2}
                  value={value}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder || "توضیحات مربوطه را بنویسید..."}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-lg outline-none transition"
                />
              ) : field.type === "select" ? (
                <select
                  id={field.key}
                  value={value}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-lg outline-none transition cursor-pointer"
                >
                  <option value="">{field.placeholder || "یکی را انتخاب کنید"}</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "color" ? (
                <div id="color-picker-group" className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-pointer flex-shrink-0">
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
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-lg outline-none transition font-mono text-left"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  id={field.key}
                  value={value}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder || "متنی وارد کنید..."}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-lg outline-none transition"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

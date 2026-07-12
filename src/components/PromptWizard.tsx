import React, { useState, useEffect } from "react";
import { FieldSchema } from "../types";
import { renderPrompt } from "../lib/renderPrompt";

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
  fields: FieldSchema[];
  promptBody: string;
  onRendered: (rendered: string) => void;
}

export default function PromptWizard({ fields, promptBody, onRendered }: PromptWizardProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  // Initialize values dictionary with appropriate defaults
  useEffect(() => {
    const initial: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.type === "switch") {
        initial[field.key] = "خیر";
      } else if (field.type === "slider") {
        initial[field.key] = String(field.min ?? 10);
      } else {
        initial[field.key] = "";
      }
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
            <div key={field.key} className="flex flex-col gap-1.5 text-right">
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
                  {field.options?.map((opt) => {
                    const parsed = parseOption(opt);
                    return (
                      <option key={opt} value={parsed.value}>
                        {parsed.label}
                      </option>
                    );
                  })}
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
              ) : field.type === "switch" ? (
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={value === "بله"}
                    onChange={(e) => handleInputChange(field.key, e.target.checked ? "بله" : "خیر")}
                    className="sr-only peer"
                  />
                  <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6C47FF]"></div>
                  <span className="text-xs text-slate-600 font-bold">{value || "خیر"}</span>
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
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#6C47FF]"
                  />
                  <span className="text-xs font-mono font-bold bg-[#6C47FF]/10 text-[#6C47FF] px-2.5 py-0.5 rounded">
                    {value || field.min || 10}
                  </span>
                </div>
              ) : field.type === "radio" ? (
                <div className="flex flex-wrap gap-3 mt-1">
                  {field.options?.map((opt) => {
                    const parsed = parseOption(opt);
                    return (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                        <input
                          type="radio"
                          name={field.key}
                          value={parsed.value}
                          checked={value === parsed.value}
                          onChange={() => handleInputChange(field.key, parsed.value)}
                          className="w-3.5 h-3.5 text-[#6C47FF] focus:ring-[#6C47FF]"
                        />
                        <span>{parsed.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : field.type === "multiselect" ? (
                <div className="flex flex-wrap gap-2 mt-1 p-2 bg-white border border-slate-200 rounded-lg max-h-24 overflow-y-auto w-full">
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
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-100">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={toggleOption}
                          className="w-3.5 h-3.5 text-[#6C47FF] focus:ring-[#6C47FF] rounded"
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
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-lg outline-none transition text-left font-mono"
                  style={{ direction: "ltr" }}
                />
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

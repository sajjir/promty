import React from "react";
import { Link } from "react-router-dom";
import { Prompt } from "../types";
import { Megaphone, Globe, Video, Camera, Sparkles, ArrowLeft } from "lucide-react";

interface PromptCardProps {
  prompt: Prompt;
  key?: any;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "تبلیغات": Megaphone,
  "وبسایت": Globe,
  "ویدیو": Video,
  "عکاسی": Camera,
};

export default function PromptCard({ prompt }: PromptCardProps) {
  const IconComponent = categoryIcons[prompt.category] || Sparkles;

  return (
    <div
      id={`prompt-card-${prompt.id}`}
      className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:shadow-md flex flex-col h-full group"
    >
      {/* Sample Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {prompt.sampleImage ? (
          <img
            src={prompt.sampleImage}
            alt={prompt.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-50 to-purple-50 text-[#6C47FF]/20">
            <Sparkles className="w-12 h-12" />
          </div>
        )}

        {/* Premium / Free Badge */}
        <span
          className={`absolute top-3 right-3 px-2 py-1 text-xs font-bold rounded-lg shadow-sm ${
            prompt.isPremium
              ? "bg-[#6C47FF] text-white"
              : "bg-emerald-500 text-white"
          }`}
        >
          {prompt.isPremium ? "ویژه" : "رایگان"}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Category Badge */}
        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2">
          <IconComponent className="w-3.5 h-3.5" />
          <span>{prompt.category}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-[#6C47FF] transition-colors mb-2">
          {prompt.title}
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
          {prompt.description || "توضیحی برای این پرامپت ثبت نشده است."}
        </p>

        {/* Footer info & Button */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
          <span className="text-slate-400 text-xs font-mono">
            {prompt.usageCount} استفاده
          </span>

          <Link
            id={`view-btn-${prompt.id}`}
            to={`/prompts/${prompt.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-[#6C47FF] hover:translate-x-[-4px] transition-transform duration-200"
          >
            <span>مشاهده و ساخت</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

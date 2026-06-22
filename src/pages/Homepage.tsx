import React, { useState, useEffect } from "react";
import { Prompt, Category } from "../types";
import PromptCard from "../components/PromptCard";
import { Search, Megaphone, Globe, Video, Camera, Sparkles, SlidersHorizontal, Loader2 } from "lucide-react";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Megaphone": Megaphone,
  "Globe": Globe,
  "Video": Video,
  "Camera": Camera,
};

export default function Homepage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        // Fetch categories
        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        setCategories(catData.categories || []);

        // Fetch prompts
        const promptRes = await fetch("/api/prompts");
        const promptData = await promptRes.json();
        setPrompts(promptData.prompts || []);
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Filter prompts by selected category and search query
  const filteredPrompts = prompts.filter((p) => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = searchQuery
      ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-16 bg-white border border-slate-100 rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-sm">
        <div id="hero-glow-1" className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#6C47FF]/5 blur-3xl rounded-full" />
        
        <div className="relative space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#6C47FF]/10 text-[#6C47FF] rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>آرشیو هوشمند پرامپت‌های فارسی</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight md:leading-normal">
            پرامپت‌های آماده <span className="text-[#6C47FF]">هوش مصنوعی</span>
          </h1>
          
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            پرامپت‌های مهندسی‌شده برای ابزارهای Midjourney، Kling، Sora، ChatGPT و دیگر مدل‌ها را پیدا کنید، به راحتی به زبان فارسی شخصی‌سازی کنید و کپی کنید.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-lg mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در بین پرامپت‌ها (مثال: جواهرات، طراحی سایت، Kling...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm py-4.5 pr-12 pl-4 bg-[#FAFAF9] border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-2xl outline-none transition text-right"
              />
              <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#6C47FF]" />
            <span>دسته‌بندی پرامپت‌ها</span>
          </h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory("")}
              className="text-xs font-semibold text-[#6C47FF] hover:underline"
            >
              پاک کردن فیلتر مکرر
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* All Button */}
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              selectedCategory === ""
                ? "bg-[#6C47FF] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            همه پرامپت‌ها
          </button>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat.icon] || Sparkles;
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-[#6C47FF] text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs">
            {loading ? "در حال دریافت..." : `نمایش ${filteredPrompts.length} پرامپت`}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#6C47FF]" />
            <p className="text-xs">در حال بارگذاری پرامپت‌های مهندسی‌شده...</p>
          </div>
        ) : filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">پرامپتی با این ویژگی‌ها پیدا نشد.</p>
            <p className="text-xs text-slate-400">یک کلمه دیگر یا دسته‌بندی دیگری را امتحان کنید.</p>
          </div>
        )}
      </div>
    </div>
  );
}

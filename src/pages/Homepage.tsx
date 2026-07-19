import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Prompt } from "../types";
import PromptCard from "../components/PromptCard";
import { useAuth } from "../components/AuthContext";
import { 
  Search, Megaphone, Globe, Video, Camera, Sparkles, 
  SlidersHorizontal, Loader2, X, Clock, Tag, Check, 
  Compass, Cpu, ChevronDown, ListFilter, RotateCcw, 
  Sparkle, AlertCircle, HelpCircle, ArrowLeft, Plus, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Homepage() {
  const navigate = useNavigate();
  const { toolSlug, domainSlug } = useParams<{ toolSlug?: string; domainSlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setBookmarkedIds(new Set());
      return;
    }
    fetch("/api/user/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.bookmarks)) {
          setBookmarkedIds(new Set(data.bookmarks.map((b: any) => b.promptId)));
        }
      })
      .catch((err) => console.error("Error fetching bookmarks:", err));
  }, [user]);

  // Search parameters parsed from URL
  const searchQuery = searchParams.get("q") || "";
  const selectedTool = searchParams.get("tool") || "";
  const selectedDomain = searchParams.get("domain") || "";
  const selectedIntent = searchParams.get("intent") || "";
  const selectedDifficulty = searchParams.get("difficulty") || "";
  const selectedLanguage = searchParams.get("language") || "";

  // Helper to update any filter in URL search params
  const updateFilter = (key: string, value: string, isSearch: boolean = false) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Always reset page to 1 when filters change
    newParams.delete("page");
    setSearchParams(newParams, { replace: isSearch });
  };

  const setSearchQuery = (val: string) => {
    updateFilter("q", val, true);
  };

  const setSelectedTool = (val: string) => updateFilter("tool", val);
  const setSelectedDomain = (val: string) => updateFilter("domain", val);
  const setSelectedIntent = (val: string) => updateFilter("intent", val);
  const setSelectedDifficulty = (val: string) => updateFilter("difficulty", val);
  const setSelectedLanguage = (val: string) => updateFilter("language", val);

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic DB Taxonomies & Facet Counts state
  const [dbTaxonomies, setDbTaxonomies] = useState<any[]>([]);
  const [availableFacets, setAvailableFacets] = useState<any>(null);
  const facets = availableFacets;

  // Translate helper using dynamic taxonomies
  const getTranslation = (slug: string, type: string) => {
    if (!slug) return "";
    const term = dbTaxonomies.find(
      (t) => t.slug?.toLowerCase() === slug.toLowerCase() && t.type?.toLowerCase() === type.toLowerCase()
    );
    return term ? term.titleFa : slug;
  };

  // Compute filterHistory dynamically from URL parameters
  const filterHistory = [
    selectedIntent ? { type: "intent", value: selectedIntent, label: "" } : null,
    selectedTool ? { type: "tool", value: selectedTool, label: "" } : null,
    selectedDomain ? { type: "domain", value: selectedDomain, label: "" } : null,
    selectedDifficulty ? { type: "difficulty", value: selectedDifficulty, label: "" } : null,
    selectedLanguage ? { type: "language", value: selectedLanguage, label: "" } : null,
  ].filter(Boolean).map((item: any) => ({
    ...item,
    label: getTranslation(item.value, item.type)
  })) as { type: string; value: string; label: string }[];

  // Search state response from server
  const [searchResults, setSearchResults] = useState<{
    prompts: Prompt[];
    matchedIntents: string[];
    matchedDomains: string[];
    matchedTools: string[];
    matchedTags: string[];
  } | null>(null);

  // Search History & Trends
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Community Submission Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subBody, setSubBody] = useState("");
  const [subTool, setSubTool] = useState("chatgpt");
  const [subDomain, setSubDomain] = useState("marketing");
  const [subLang, setSubLang] = useState("persian");
  const [subDifficulty, setSubDifficulty] = useState("beginner");
  const [subTags, setSubTags] = useState("");

  const [isAnalyzingPublic, setIsAnalyzingPublic] = useState(false);
  const [analyzePublicError, setAnalyzePublicError] = useState("");

  // Keyboard navigation inside Suggestions Overlay
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const navigablePrompts = searchResults ? searchResults.prompts.slice(0, 5) : [];
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (navigablePrompts.length > 0) {
        setActiveSuggestionIndex((prev) => 
          prev < navigablePrompts.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (navigablePrompts.length > 0) {
        setActiveSuggestionIndex((prev) => 
          prev > 0 ? prev - 1 : navigablePrompts.length - 1
        );
      }
    } else if (e.key === "Enter") {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < navigablePrompts.length) {
        e.preventDefault();
        const selectedPrompt = navigablePrompts[activeSuggestionIndex];
        navigate(`/prompts/${selectedPrompt.id}`);
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [searchQuery]);

  // Derived taxonomy lists for filters
  const tools = dbTaxonomies.filter((t) => t.type?.toLowerCase() === "tool" && t.status === "active");
  const intents = dbTaxonomies.filter((t) => t.type?.toLowerCase() === "intent" && t.status === "active");
  const domains = dbTaxonomies.filter((t) => t.type?.toLowerCase() === "domain" && t.status === "active");
  const difficulties = dbTaxonomies.filter((t) => t.type?.toLowerCase() === "difficulty" && t.status === "active");
  const languages = dbTaxonomies.filter((t) => t.type?.toLowerCase() === "language" && t.status === "active");

  // Autofill fields using intelligent backend metadata recommendation
  const handleAutoAnalyzePublic = async () => {
    if (!subBody.trim()) {
      setAnalyzePublicError("لطفاً ابتدا متن پرامپت را وارد کنید.");
      return;
    }
    setAnalyzePublicError("");
    try {
      setIsAnalyzingPublic(true);
      const res = await fetch("/api/prompts/analyze-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ body: subBody })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        if (d.title) setSubTitle(d.title);
        if (d.description) setSubDesc(d.description);
        if (d.tool) setSubTool(d.tool.toLowerCase());
        if (d.domain) setSubDomain(d.domain.toLowerCase());
        if (d.difficulty) setSubDifficulty(d.difficulty.toLowerCase());
        if (d.tags && Array.isArray(d.tags)) {
          setSubTags(d.tags.join(", "));
        }
      } else {
        setAnalyzePublicError("امکان تحلیل هوشمند وجود نداشت. لطفاً فیلدها را دستی پر کنید.");
      }
    } catch (err: any) {
      setAnalyzePublicError("خطا در ارتباط با سرور تحلیل هوشمند.");
    } finally {
      setIsAnalyzingPublic(false);
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle.trim() || !subBody.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/prompts/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: subTitle,
          description: subDesc,
          body: subBody,
          tools: [subTool],
          domains: [subDomain],
          language: subLang,
          difficulty: subDifficulty,
          tags: subTags.split(",").map(t => t.trim()).filter(Boolean),
          category: getTranslation(subTool, "tool") || subTool
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        // Clear form
        setSubTitle("");
        setSubDesc("");
        setSubBody("");
        setSubTags("");
      }
    } catch (err) {
      console.error("Failed to submit prompt contribution:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"usage" | "latest" | "title">("usage");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPromptsCount, setTotalPromptsCount] = useState(0);

  const suggestionRef = useRef<HTMLDivElement>(null);

  const loadPrompts = async (pageNum: number, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const limit = 20;
      const res = await fetch(`/api/prompts?page=${pageNum}&limit=${limit}`);
      const response = await res.json();
      
      const newPrompts = response.data || [];
      const total = response.pagination?.total || 0;

      if (response.facets) {
        setAvailableFacets(response.facets);
      }

      if (append) {
        setPrompts((prev) => [...prev, ...newPrompts]);
      } else {
        setPrompts(newPrompts);
      }

      setTotalPromptsCount(total);
      setPage(pageNum);

      const currentLoadedCount = append ? prompts.length + newPrompts.length : newPrompts.length;
      if (currentLoadedCount >= total) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Error loading paginated prompts:", err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    loadPrompts(page + 1, true);
  };

  const handleFilterToggle = (type: string, value: string, label?: string) => {
    updateFilter(type, value);
  };

  const handleRemoveLastFilter = () => {
    if (filterHistory.length === 0) return;
    const last = filterHistory[filterHistory.length - 1];
    updateFilter(last.type, "");
  };

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {
        await loadPrompts(1, false);

        // Fetch dynamic taxonomies from DB
        const taxRes = await fetch("/api/taxonomies");
        const taxData = await taxRes.json();
        if (taxData.success) {
          setDbTaxonomies(taxData.terms || []);
        }

        // Fetch history and trends
        const histRes = await fetch("/api/search/history");
        const histData = await histRes.json();
        setSearchHistory(histData.history || []);
        setTrendingSearches(histData.trending || []);
      } catch (e) {
        console.error("Error fetching homepage initial data:", e);
      }
    }
    init();
  }, []);

  // Fetch available facets on any search parameter change (progressive narrowing)
  useEffect(() => {
    const fetchFacets = async () => {
      try {
        const queryParams = searchParams.toString();
        const res = await fetch(`/api/facets?${queryParams}`);
        const data = await res.json();
        if (data.success && data.facets) {
          setAvailableFacets(data.facets);
        }
      } catch (err) {
        console.error("Error fetching facets:", err);
      }
    };
    fetchFacets();
  }, [searchParams]);

  // Sync route parameters (toolSlug, domainSlug) with active filter states
  useEffect(() => {
    if (dbTaxonomies.length > 0) {
      let changed = false;
      const newParams = new URLSearchParams(searchParams);
      if (toolSlug) {
        const found = dbTaxonomies.find(
          t => t.slug?.toLowerCase() === toolSlug.toLowerCase() && t.type?.toLowerCase() === "tool"
        );
        if (found && searchParams.get("tool") !== found.slug) {
          newParams.set("tool", found.slug);
          changed = true;
        }
      }
      if (domainSlug) {
        const found = dbTaxonomies.find(
          t => t.slug?.toLowerCase() === domainSlug.toLowerCase() && t.type?.toLowerCase() === "domain"
        );
        if (found && searchParams.get("domain") !== found.slug) {
          newParams.set("domain", found.slug);
          changed = true;
        }
      }
      if (changed) {
        setSearchParams(newParams, { replace: true });
        navigate(`/?${newParams.toString()}`, { replace: true });
      }
    }
  }, [toolSlug, domainSlug, dbTaxonomies]);

  // Find taxonomy suggestions matching the user's input
  const taxonomySuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const normalizedQuery = searchQuery.toLowerCase().trim();
    return dbTaxonomies.filter((tax) => {
      const titleFa = (tax.titleFa || "").toLowerCase();
      const slug = (tax.slug || "").toLowerCase();
      const titleEn = (tax.titleEn || "").toLowerCase();
      return (
        titleFa.includes(normalizedQuery) ||
        slug.includes(normalizedQuery) ||
        titleEn.includes(normalizedQuery)
      );
    }).slice(0, 5); // Limit to top 5 suggestions
  }, [searchQuery, dbTaxonomies]);

  const handleTaxonomySuggestionClick = (tax: any) => {
    const paramKey = tax.type.toLowerCase();
    const newParams = new URLSearchParams(searchParams);
    // Set the taxonomy parameter
    newParams.set(paramKey, tax.slug);
    // Clear the search query 'q'
    newParams.delete("q");
    newParams.delete("page");
    setSearchParams(newParams, { replace: true });
    setShowSuggestions(false);
  };

  // Sync Search Query with Server endpoint
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults({
            prompts: data.results || [],
            matchedIntents: data.matchedIntents || [],
            matchedDomains: data.matchedDomains || [],
            matchedTools: data.matchedTools || [],
            matchedTags: data.matchedTags || []
          });
          setSearchHistory(data.history || []);
        }
      } catch (err) {
        console.error("Failed to query advanced search:", err);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle outside click to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute final filtered list
  const displayPrompts = searchQuery.trim() 
    ? (searchResults ? searchResults.prompts : []) 
    : prompts;

  const filteredPrompts = displayPrompts.filter((p) => {
    if (selectedIntent) {
      const pIntents = Array.isArray(p.intents) ? p.intents : (p.intent ? [p.intent] : []);
      const matched = pIntents.some(i => i.toLowerCase() === selectedIntent.toLowerCase());
      if (!matched) return false;
    }
    if (selectedTool && !(p.tools || []).some(t => t.toLowerCase() === selectedTool.toLowerCase())) return false;
    if (selectedDomain && !(p.domains || []).some(d => d.toLowerCase() === selectedDomain.toLowerCase())) return false;
    if (selectedDifficulty && p.difficulty?.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
    if (selectedLanguage && p.language?.toLowerCase() !== selectedLanguage.toLowerCase()) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "usage") {
      return (b.usageCount || 0) - (a.usageCount || 0);
    } else if (sortBy === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return a.title.localeCompare(b.title, "fa");
    }
  });

  // Handler for quick suggestions selection
  const selectSuggestion = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSortBy("usage");
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in relative text-right" dir="rtl">
      
      {/* Search & Hero Engine Section */}
      <section className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-sm p-6 md:p-12 text-center">
        {/* Background visual accents */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#6C47FF]/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C47FF]/10 text-[#6C47FF] rounded-full text-xs font-bold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>موتور جستجوی معنایی و هوشمند پرامپت</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight md:leading-normal">
            قلب تپنده نوآوری با <span className="text-[#6C47FF] bg-gradient-to-r from-[#6C47FF] to-indigo-600 bg-clip-text text-transparent">پرامپتی</span>
          </h1>

          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            اولین پلتفرم گرافِ دانش پرامپت در ایران. با موتور هوشمند ما، فیلترها، ابزارها، قالب‌های خروجی و دسته‌بندی‌های معنایی را با یک کلیک کاوش کنید.
          </p>

          {/* Core Search Input Container */}
          <div ref={suggestionRef} className="pt-6 max-w-2xl mx-auto relative z-30">
            <div className="relative">
              <input
                type="text"
                placeholder="چیزی بنویسید (مثال: 'طراحی عکس تبلیغاتی طلا با میدجرنی' یا 'کد React')"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full text-sm md:text-base py-4.5 pr-12 pl-12 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100 focus:border-[#6C47FF] rounded-2xl outline-none transition-all text-right shadow-sm focus:shadow-md font-medium"
              />
              <Search className="w-5 h-5 text-[#6C47FF] absolute right-4 top-1/2 -translate-y-1/2" />
              
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Smart Auto-Suggestions Overlay */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-right z-50 max-h-[420px] overflow-y-auto"
                >
                  {/* Real-time Intent & Tool Parser Matching Indicator */}
                  {searchQuery.trim() && searchResults && (
                    <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100/50 flex flex-wrap items-center gap-2 text-xs text-indigo-700">
                      <Sparkle className="w-3.5 h-3.5 text-[#6C47FF]" />
                      <span className="font-bold">تطبیق هوشمند الگو:</span>
                      
                      {searchResults.matchedTools.map(t => (
                        <span key={t} onClick={() => { setSelectedTool(t); setShowSuggestions(false); }} className="bg-white px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 cursor-pointer text-slate-700 font-medium">
                          🛠️ ابزار: {getTranslation(t, "tool")}
                        </span>
                      ))}

                      {searchResults.matchedIntents.map(i => (
                        <span key={i} onClick={() => { setSelectedIntent(i); setShowSuggestions(false); }} className="bg-white px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 cursor-pointer text-slate-700 font-medium">
                          🎯 هدف: {getTranslation(i, "intent")}
                        </span>
                      ))}

                      {searchResults.matchedDomains.map(d => (
                        <span key={d} onClick={() => { setSelectedDomain(d); setShowSuggestions(false); }} className="bg-white px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 cursor-pointer text-slate-700 font-medium">
                          🌐 حوزه: {getTranslation(d, "domain")}
                        </span>
                      ))}

                      {searchResults.matchedTags.map(tag => (
                        <span key={tag} onClick={() => { setSearchQuery(tag); setShowSuggestions(false); }} className="bg-white px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 cursor-pointer text-slate-700 font-medium">
                          🏷️ برچسب: {tag}
                        </span>
                      ))}

                      {searchResults.matchedTools.length === 0 && searchResults.matchedIntents.length === 0 && searchResults.matchedDomains.length === 0 && (
                        <span className="text-slate-400 font-medium">موتور در حال واکاوی معنایی متن است...</span>
                      )}
                    </div>
                  )}

                  {/* Autocomplete list */}
                  <div className="p-2 space-y-1">
                    {/* Taxonomy-Aware Autocomplete Suggestions */}
                    {taxonomySuggestions.length > 0 && (
                      <div className="border-b border-slate-100 pb-2 mb-2">
                        <div className="text-[10px] text-slate-400 font-bold px-3 py-1 bg-slate-50 rounded mb-1.5">پیشنهادهای هوشمند طبقه‌بندی</div>
                        <div className="flex flex-wrap gap-2 p-2">
                          {taxonomySuggestions.map((tax) => {
                            let emoji = "🏷";
                            let prefix = "کلیدواژه";
                            const typeLower = tax.type?.toLowerCase();
                            if (typeLower === "tool") {
                              emoji = "🛠️";
                              prefix = "ابزار";
                            } else if (typeLower === "domain") {
                              emoji = "🌐";
                              prefix = "حوزه";
                            } else if (typeLower === "intent") {
                              emoji = "🎯";
                              prefix = "هدف";
                            } else if (typeLower === "difficulty") {
                              emoji = "⚡";
                              prefix = "سطح";
                            } else if (typeLower === "language") {
                              emoji = "💬";
                              prefix = "زبان";
                            }
                            return (
                              <button
                                key={tax.id}
                                onClick={() => handleTaxonomySuggestionClick(tax)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-[#6C47FF]/10 text-[#6C47FF] border border-[#6C47FF]/20 hover:border-[#6C47FF]/40 rounded-xl text-xs font-bold transition-all duration-150 shadow-sm"
                              >
                                <span className="text-sm">{emoji}</span>
                                <span>{prefix}: {tax.titleFa}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {searchQuery.trim() && searchResults && searchResults.prompts.length > 0 ? (
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold px-3 py-1 bg-slate-50 rounded mb-1">پرامپت‌های تطبیق‌یافته ({searchResults.prompts.length})</div>
                        {searchResults.prompts.slice(0, 5).map((p, idx) => (
                          <Link
                            key={p.id}
                            to={`/prompts/${p.id}`}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl transition group text-right ${idx === activeSuggestionIndex ? "bg-indigo-50/80 border-r-4 border-[#6C47FF]" : "hover:bg-slate-50"}`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Compass className="w-4 h-4 text-slate-400 group-hover:text-[#6C47FF] shrink-0" />
                              <span className="text-xs font-semibold text-slate-700 group-hover:text-[#6C47FF] truncate">{p.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{p.tools?.[0] || "عمومی"}</span>
                          </Link>
                        ))}
                      </div>
                    ) : searchQuery.trim() && (
                      <div className="px-4 py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5 text-slate-300" />
                        <span>هیچ پرامپت مستقیمی یافت نشد. می‌توانید جستجو را با کلیدواژه‌های ساده‌تر انجام دهید.</span>
                      </div>
                    )}

                    {/* Search history */}
                    {searchHistory.length > 0 && (
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold px-3 py-1 bg-slate-50 rounded mb-1">جستجوهای اخیر شما</div>
                        <div className="flex flex-wrap gap-1.5 p-2">
                          {searchHistory.map((hist, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectSuggestion(hist)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 rounded-lg transition"
                            >
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{hist}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trending queries */}
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold px-3 py-1 bg-slate-50 rounded mb-1">بیشترین جستجوهای هفته</div>
                      <div className="flex flex-wrap gap-1.5 p-2">
                        {trendingSearches.map((trend, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectSuggestion(trend)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#6C47FF]/5 hover:bg-[#6C47FF]/10 text-xs text-[#6C47FF] rounded-lg font-semibold transition"
                          >
                            <Sparkle className="w-3 h-3" />
                            <span>{trend}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Advanced Faceted Sidebar/Filter Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#6C47FF]/10 text-[#6C47FF] rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">فیلترهای طبقه‌بندی هوشمند</h2>
              <p className="text-[11px] text-slate-400">بر اساس گراف طبقه‌بندی استاندارد Promty.ir</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showFilters 
                  ? "bg-[#6C47FF] text-white shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>{showFilters ? "پنهان‌سازی فیلترها" : "فیلتر پیشرفته"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
            </button>

            {(selectedIntent || selectedTool || selectedDomain || selectedDifficulty || selectedLanguage) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>حذف فیلترها</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips for AI Tools */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0 ml-1">ابزارهای محبوب:</span>
          <button
            onClick={() => handleFilterToggle("tool", "", "همه ابزارها")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
              selectedTool === "" 
                ? "bg-[#6C47FF]/10 text-[#6C47FF]" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            همه ابزارها
          </button>
          {tools.map((opt) => {
            const count = facets?.tools?.[opt.slug.toLowerCase()] || 0;
            const isSelected = selectedTool === opt.slug;
            return (
              <button
                key={opt.slug}
                onClick={() => handleFilterToggle("tool", isSelected ? "" : opt.slug, opt.titleFa)}
                disabled={count === 0 && !isSelected}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                  isSelected 
                    ? "bg-[#6C47FF] text-white shadow-sm" 
                    : count === 0
                      ? "bg-slate-50 text-slate-300 opacity-50 cursor-not-allowed border border-slate-100"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{opt.titleFa} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Expandable Advanced Filters Grid */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-slate-50 pt-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Intent Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">🎯 هدف پرامپت (Intent)</label>
                  <select
                    value={selectedIntent}
                    onChange={(e) => {
                      const val = e.target.value;
                      const opt = intents.find(t => t.slug === val);
                      handleFilterToggle("intent", val, opt ? opt.titleFa : val);
                    }}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none text-right font-medium"
                  >
                    <option value="">همه اهداف</option>
                    {intents.map(opt => {
                      const count = facets?.intents?.[opt.slug.toLowerCase()] || 0;
                      const isSelected = selectedIntent === opt.slug;
                      return (
                        <option 
                          key={opt.slug} 
                          value={opt.slug} 
                          disabled={count === 0 && !isSelected}
                          className={count === 0 && !isSelected ? "text-slate-300" : ""}
                        >
                          {opt.titleFa} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Domain Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">🌐 حوزه موضوعی (Domain)</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => {
                      const val = e.target.value;
                      const opt = domains.find(t => t.slug === val);
                      handleFilterToggle("domain", val, opt ? opt.titleFa : val);
                    }}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none text-right font-medium"
                  >
                    <option value="">همه حوزه‌ها</option>
                    {domains.map(opt => {
                      const count = facets?.domains?.[opt.slug.toLowerCase()] || 0;
                      const isSelected = selectedDomain === opt.slug;
                      return (
                        <option 
                          key={opt.slug} 
                          value={opt.slug} 
                          disabled={count === 0 && !isSelected}
                          className={count === 0 && !isSelected ? "text-slate-300" : ""}
                        >
                          {opt.titleFa} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Difficulty Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">⚡ سطح سختی پرامپت</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => {
                      const val = e.target.value;
                      const opt = difficulties.find(t => t.slug === val);
                      handleFilterToggle("difficulty", val, opt ? opt.titleFa : val);
                    }}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none text-right font-medium"
                  >
                    <option value="">همه سطوح</option>
                    {difficulties.map(opt => {
                      const count = facets?.difficulties?.[opt.slug.toLowerCase()] || 0;
                      const isSelected = selectedDifficulty === opt.slug;
                      return (
                        <option 
                          key={opt.slug} 
                          value={opt.slug} 
                          disabled={count === 0 && !isSelected}
                          className={count === 0 && !isSelected ? "text-slate-300" : ""}
                        >
                          {opt.titleFa} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Language Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">💬 زبان پرامپت</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      const val = e.target.value;
                      const opt = languages.find(t => t.slug === val);
                      handleFilterToggle("language", val, opt ? opt.titleFa : val);
                    }}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none text-right font-medium"
                  >
                    <option value="">همه زبان‌ها</option>
                    {languages.map(opt => {
                      const count = facets?.languages?.[opt.slug.toLowerCase()] || 0;
                      const isSelected = selectedLanguage === opt.slug;
                      return (
                        <option 
                          key={opt.slug} 
                          value={opt.slug} 
                          disabled={count === 0 && !isSelected}
                          className={count === 0 && !isSelected ? "text-slate-300" : ""}
                        >
                          {opt.titleFa} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Applied Filters Summary */}
        {(selectedIntent || selectedTool || selectedDomain || selectedDifficulty || selectedLanguage) && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold ml-1.5">فیلترهای اعمال‌شده:</span>
            {selectedIntent && (
              <span className="flex items-center gap-1 bg-white text-xs text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                <span>🎯 هدف: {getTranslation(selectedIntent, "intent")}</span>
                <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => handleFilterToggle("intent", "", "")} />
              </span>
            )}
            {selectedTool && (
              <span className="flex items-center gap-1 bg-white text-xs text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                <span>🛠️ ابزار: {getTranslation(selectedTool, "tool")}</span>
                <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => handleFilterToggle("tool", "", "")} />
              </span>
            )}
            {selectedDomain && (
              <span className="flex items-center gap-1 bg-white text-xs text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                <span>🌐 حوزه: {getTranslation(selectedDomain, "domain")}</span>
                <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => handleFilterToggle("domain", "", "")} />
              </span>
            )}
            {selectedDifficulty && (
              <span className="flex items-center gap-1 bg-white text-xs text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                <span>⚡ سطح: {getTranslation(selectedDifficulty, "difficulty")}</span>
                <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => handleFilterToggle("difficulty", "", "")} />
              </span>
            )}
            {selectedLanguage && (
              <span className="flex items-center gap-1 bg-white text-xs text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                <span>💬 زبان: {getTranslation(selectedLanguage, "language")}</span>
                <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => handleFilterToggle("language", "", "")} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Prompts Layout Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#6C47FF]" />
              <span>آرشیو جامع پرامپت‌ها</span>
            </h2>
            <button
              id="open-contrib-modal-btn"
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1 bg-[#6C47FF]/10 hover:bg-[#6C47FF]/20 text-[#6C47FF] font-extrabold text-[11px] py-1.5 px-3 rounded-xl transition cursor-pointer shrink-0 animate-pulse"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>اشتراک پرامپت شما 💡</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs hidden sm:inline">
              {loading ? "در حال دریافت..." : `نمایش ${filteredPrompts.length} پرامپت`}
            </span>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 font-bold shrink-0">مرتب‌سازی:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-white border border-slate-200 rounded-lg py-1 px-2 outline-none font-bold text-slate-600 focus:border-[#6C47FF] cursor-pointer"
              >
                <option value="usage">محبوب‌ترین‌ها</option>
                <option value="latest">جدیدترین‌ها</option>
                <option value="title">الفبایی (عنوان)</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white border border-slate-100 rounded-3xl">
            <Loader2 className="w-8 h-8 animate-spin text-[#6C47FF]" />
            <p className="text-xs font-semibold">موتور در حال واکاوی است...</p>
          </div>
        ) : filteredPrompts.length > 0 ? (
          <div className="space-y-8">
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPrompts.map((prompt) => (
                <motion.div
                  key={prompt.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <PromptCard prompt={prompt} isInitiallyBookmarked={bookmarkedIds.has(prompt.id)} />
                </motion.div>
              ))}
            </motion.div>

            {/* Load More Button */}
            {hasMore && !searchQuery.trim() && (
              <div className="flex justify-center pt-4">
                <button
                  id="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#6C47FF] border-2 border-slate-100 hover:border-[#6C47FF]/30 active:border-[#6C47FF] rounded-2xl shadow-sm hover:shadow-md font-bold text-xs transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#6C47FF]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6C47FF] group-hover:translate-y-0.5 transition-transform" />
                  )}
                  <span>{isLoadingMore ? "در حال بارگذاری..." : "نمایش پرامپت‌های بیشتر"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 space-y-3 shadow-sm">
            <Sparkle className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
            <p className="text-sm font-black text-slate-700">هیچ پرامپتی پیدا نشد.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              فیلترهای اعمال‌شده بسیار محدود کننده هستند، یا پرامپتی متناسب با عبارت جستجوی شما یافت نشد. برای نتایج بهتر فیلترها را حذف کنید.
            </p>
            {filterHistory.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleRemoveLastFilter}
                  className="px-6 py-2.5 bg-[#6C47FF] hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>حذف فیلتر [{filterHistory[filterHistory.length - 1].label}]</span>
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  پاک‌سازی کامل فیلترها
                </button>
              </div>
            ) : (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-[#6C47FF] hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                پاک‌سازی کامل فیلترها
              </button>
            )}
          </div>
        )}
      </div>

      {/* Community Contribution Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs text-right overflow-y-auto" style={{ direction: "rtl" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full p-6 md:p-8 space-y-6 relative my-8"
            >
              <button
                onClick={() => { setShowSubmitModal(false); setSubmitSuccess(false); }}
                className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#6C47FF]/10 text-[#6C47FF] rounded-full text-[10px] font-black">
                  <Sparkles className="w-3 h-3" />
                  <span>مشارکت در پایگاه دانش</span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-800">ارسال و اشتراک‌گذاری پرامپت شما 💡</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  پرامپت خلاقانه خود را ثبت کنید. پرامپت شما پس از تایید توسط تیم ادمین در آرشیو عمومی منتشر خواهد شد.
                </p>
              </div>

              {submitSuccess ? (
                <div className="p-8 text-center space-y-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-fade-in">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-base font-black text-slate-800">ارسال موفقیت‌آمیز پرامپت!</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    با تشکر از همکاری ارزشمند شما! پرامپت شما به صف بررسی ادمین‌های Promty.ir منتقل شد. پس از بازبینی و طبقه‌بندی هوشمند، در صفحه اول پلتفرم نمایش داده خواهد شد.
                  </p>
                  <button
                    onClick={() => { setShowSubmitModal(false); setSubmitSuccess(false); }}
                    className="px-5 py-2 bg-[#6C47FF] hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    متوجه شدم
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContributionSubmit} className="space-y-4 text-right">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">عنوان پرامپت <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="مثال: تولید لوگوی مینیمال"
                        value={subTitle}
                        onChange={(e) => setSubTitle(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6C47FF] rounded-xl outline-none transition font-medium"
                        required
                      />
                    </div>

                    {/* Tool */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">ابزار هوش مصنوعی اصلی</label>
                      <select
                        value={subTool}
                        onChange={(e) => setSubTool(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6C47FF] rounded-xl outline-none transition cursor-pointer font-bold"
                      >
                        {tools.map(opt => (
                          <option key={opt.slug} value={opt.slug}>{opt.titleFa}</option>
                        ))}
                      </select>
                    </div>

                    {/* Domain */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">حوزه کاربرد موضوعی</label>
                      <select
                        value={subDomain}
                        onChange={(e) => setSubDomain(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6C47FF] rounded-xl outline-none transition cursor-pointer font-bold"
                      >
                        {domains.map(opt => (
                          <option key={opt.slug} value={opt.slug}>{opt.titleFa}</option>
                        ))}
                      </select>
                    </div>

                    {/* Language */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">زبان اصلی پرامپت</label>
                      <select
                        value={subLang}
                        onChange={(e) => setSubLang(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6C47FF] rounded-xl outline-none transition cursor-pointer font-bold"
                      >
                        {languages.map(opt => (
                          <option key={opt.slug} value={opt.slug}>{opt.titleFa}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">توضیح کوتاه پرامپت (راهنمایی برای کاربر)</label>
                    <input
                      type="text"
                      placeholder="توضیح کوتاهی درباره خروجی این پرامپت و مدل مناسب بنویسید..."
                      value={subDesc}
                      onChange={(e) => setSubDesc(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6C47FF] rounded-xl outline-none transition font-medium"
                    />
                  </div>

                  {/* Body Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600">متن کامل و خام پرامپت <span className="text-rose-500">*</span></label>
                      <button
                        type="button"
                        onClick={handleAutoAnalyzePublic}
                        disabled={isAnalyzingPublic}
                        className="text-[11px] font-black text-[#6C47FF] hover:text-indigo-700 transition flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-[#6C47FF]/10 px-2.5 py-1 rounded-lg border border-slate-200"
                      >
                        {isAnalyzingPublic ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6C47FF]" />
                            <span>در حال استخراج معنایی...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-[#6C47FF]" />
                            <span>آنالیز هوشمند و پر کردن خودکار فرم ✨</span>
                          </>
                        )}
                      </button>
                    </div>
                    {analyzePublicError && <p className="text-[10px] text-rose-500 font-bold">{analyzePublicError}</p>}
                    <textarea
                      rows={5}
                      placeholder="متن کامل انگلیسی یا فارسی پرامپت خود را همراه با متغیرها به صورت [variable] بنویسید..."
                      value={subBody}
                      onChange={(e) => setSubBody(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6C47FF] rounded-xl outline-none transition font-mono leading-relaxed"
                      style={{ direction: "ltr" }}
                      required
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">برچسب‌ها (جدا شده با ویرگول فارسی یا انگلیسی)</label>
                    <input
                      type="text"
                      placeholder="مثال: لوگو, مینیمال, برندینگ, midjourney"
                      value={subTags}
                      onChange={(e) => setSubTags(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6C47FF] rounded-xl outline-none transition"
                    />
                  </div>

                  <div className="flex gap-2 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-5 py-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 text-xs bg-[#6C47FF] hover:bg-indigo-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-[#6C47FF]/10 transition cursor-pointer flex items-center gap-1"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>ارسال جهت بازبینی ادمین 🚀</span>}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

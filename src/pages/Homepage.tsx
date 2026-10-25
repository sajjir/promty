import ActiveFilterChips from '../components/ActiveFilterChips';
import ArchiveFilterDialog from '../components/ArchiveFilterDialog';
import { filterSelectionCount } from '../lib/filterDraft';
import HomepageQuickChips from '../components/HomepageQuickChips';
import { Z } from '../lib/zIndex';
import HomepageShelves from '../components/HomepageShelves';
import { archiveFilterKeys, readFilterValues, setFilterValues, SelectionUpdate } from "../lib/archiveFilters";
import { getUseCase, useCaseGroups, resourceTypes, outputLabels, useCaseInGroups } from "../lib/archiveCatalog";
import Loader from "../components/Loader";
import PromptBackdrop from '../components/PromptBackdrop';
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Prompt } from "../types";
import PromptCollection from "../components/PromptCollection";
import { useAuth } from "../components/AuthContext";
import {
  Search, Megaphone, Globe, Video, Camera, Sparkles,
  SlidersHorizontal, X, Clock, Tag, Check,
  Compass, Cpu, ChevronDown, ListFilter, RotateCcw,
  Sparkle, AlertCircle, HelpCircle, ArrowLeft, Plus, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Homepage() {
  const navigate = useNavigate();
  const { toolSlug, domainSlug, useCaseSlug } = useParams<{ toolSlug?: string; domainSlug?: string; useCaseSlug?:string }>();
  const [urlParams, setSearchParams] = useSearchParams();
  const searchParams = new URLSearchParams(urlParams);
  if(useCaseSlug)searchParams.set('useCase',useCaseSlug);
  if(toolSlug)searchParams.set('tool',toolSlug);
  if(domainSlug)searchParams.set('domain',domainSlug);
  const [headerOffset,setHeaderOffset] = useState(80);
  useEffect(()=>{const header=document.getElementById('main-nav-bar');if(!header)return;const update=()=>setHeaderOffset(header.getBoundingClientRect().height+8);update();const observer=new ResizeObserver(update);observer.observe(header);return()=>observer.disconnect();},[]);
  useEffect(()=>{try{sessionStorage.setItem('promty:archive-return',window.location.pathname+window.location.search);}catch{}},[urlParams.toString(),useCaseSlug,toolSlug,domainSlug]);
  // Router search-param updates do not queue like React state updates. Preserve
  // the latest pending URL so rapid checkbox actions cannot overwrite each other.
  const paramsRef = useRef(new URLSearchParams(searchParams));
  useLayoutEffect(() => { paramsRef.current = new URLSearchParams(searchParams); }, [searchParams]);
  const { user, branding, siteTitle } = useAuth();
  const latestSection = branding.homepageSections[0];
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

  useEffect(() => {
    const syncBookmark = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (typeof detail?.id !== 'string' || typeof detail.bookmarked !== 'boolean') return;
      setBookmarkedIds(previous => {
        const next = new Set(previous);
        if (detail.bookmarked) next.add(detail.id); else next.delete(detail.id);
        return next;
      });
    };
    window.addEventListener('promty:bookmark-changed', syncBookmark);
    return () => window.removeEventListener('promty:bookmark-changed', syncBookmark);
  }, []);

  // Search parameters parsed from URL
  const searchQuery = searchParams.get("q") || "";

  // Helper to update any filter in URL search params
  const updateFilter = (key: string, value: string, isSearch: boolean = false) => {
    const newParams = new URLSearchParams(paramsRef.current);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Always reset page to 1 when filters change
    newParams.delete("page");
    paramsRef.current = newParams;
    setSearchParams(newParams, { replace: isSearch });
  };

  const setSearchQuery = (val: string) => {
    updateFilter("q", val, true);
  };

  const updateSelections = (key: string, update: SelectionUpdate) => {
    const next = new URLSearchParams(paramsRef.current);
    const values = typeof update === 'function' ? update(readFilterValues(next,key)) : update;
    setFilterValues(next, key, values);
    if (key === 'group') setFilterValues(next, 'useCase', values.length ? readFilterValues(next, 'useCase').filter(slug => useCaseInGroups(slug, values)) : []);
    next.delete('page');
    paramsRef.current = next;
    if((useCaseSlug||toolSlug||domainSlug)&&['useCase','group','tool','domain'].includes(key))navigate('/?'+next.toString());else setSearchParams(next);
  };
  const removeSelection = (key: string, value: string) => updateSelections(key, current => current.filter(selected => selected !== value));

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic DB Taxonomies & Facet Counts state
  const [dbTaxonomies, setDbTaxonomies] = useState<any[]>([]);
  const [availableFacets, setAvailableFacets] = useState<any>(null);
  const facets = availableFacets;
  const [archiveFacets, setArchiveFacets] = useState<Record<string, Record<string, number>>>({});

  // Translate helper using dynamic taxonomies
  const getTranslation = (slug: string, type: string) => {
    if (!slug) return "";
    if (type === "useCase") return getUseCase(slug)?.title || slug;
    if (type === "group") return useCaseGroups.find(g => g.slug === slug)?.title || slug;
    if (type === "resourceType") return resourceTypes[slug as keyof typeof resourceTypes] || slug;
    if (type === "outputFormat") return outputLabels[slug] || slug;
    if (type === "access") return slug === "premium" ? "پریمیوم" : "رایگان";
    if (type === "referenceImage" && slug === "required") return "نیازمند تصویر ورودی";
    const term = dbTaxonomies.find(
      (t) => t.slug?.toLowerCase() === slug.toLowerCase() && t.type?.toLowerCase() === type.toLowerCase()
    );
    return term ? term.titleFa : slug;
  };

  // Compute filterHistory dynamically from URL parameters
  const filterHistory = archiveFilterKeys.flatMap(type => readFilterValues(searchParams, type).map(value => ({ type, value, label: getTranslation(value, type) })));

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
  const sortBy = (searchParams.get("sort") || (searchQuery.trim() ? "relevance" : "latest")) as "relevance" | "usage" | "latest" | "title";
  const setSortBy = (value: string) => updateFilter("sort", value);
  const requestVersion = useRef(0);
  const historyKey = `promty-search-history:${user?.id || "guest"}`;
  useEffect(() => {
    try { setSearchHistory(JSON.parse(sessionStorage.getItem(historyKey) || "[]")); }
    catch { setSearchHistory([]); }
  }, [historyKey]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPromptsCount, setTotalPromptsCount] = useState(0);

  const suggestionRef = useRef<HTMLDivElement>(null);

  const loadPrompts = async (pageNum: number, append: boolean = false) => {
    const version = ++requestVersion.current;
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const limit = latestSection.limit;
      const params = new URLSearchParams(searchParams);
      params.set("page", String(pageNum)); params.set("limit", String(limit)); params.set("sort", sortBy); params.set("isActive", "true");
      const res = await fetch(`/api/prompts?${params}`);
      const response = await res.json();
      if (version !== requestVersion.current) return;
      if (!res.ok) throw new Error("Archive request failed");

      const newPrompts = response.data || [];
      const total = response.pagination?.total || 0;

      setArchiveFacets(response.archiveFacets || {});
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

      const currentLoadedCount = pageNum * limit;
      if (currentLoadedCount >= total) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Error loading paginated prompts:", err);
    } finally {
      if (version === requestVersion.current) { setLoading(false); setIsLoadingMore(false); }
    }
  };

  const handleRemoveLastFilter = () => {
    if (filterHistory.length === 0) return;
    const last = filterHistory[filterHistory.length - 1];
    removeSelection(last.type, last.value);
  };

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {


        // Fetch dynamic taxonomies from DB
        const taxRes = await fetch("/api/taxonomies");
        const taxData = await taxRes.json();
        if (taxData.success) {
          setDbTaxonomies(taxData.terms || []);
        }

      } catch (e) {
        console.error("Error fetching homepage initial data:", e);
      }
    }
    init();
  }, []);

  // One server contract handles search, filters, sorting and pagination.
  useEffect(() => {
    ++requestVersion.current;
    setPrompts([]); setHasMore(false); setLoading(true);
    const pageFromUrl=Number(searchParams.get('page')||1);
    const timer = setTimeout(() => loadPrompts(Number.isSafeInteger(pageFromUrl)&&pageFromUrl>0?pageFromUrl:1), searchQuery.trim() ? 300 : 0);
    return () => { clearTimeout(timer); ++requestVersion.current; };
  }, [searchParams.toString(), latestSection.limit]);

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
    setFilterValues(newParams, paramKey, [...readFilterValues(newParams,paramKey), tax.slug]);
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

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal });
        const data = await res.json();
        if (data.success) {
          setSearchResults({
            prompts: data.prompts || [],
            matchedIntents: data.matchedIntents || [],
            matchedDomains: data.matchedDomains || [],
            matchedTools: data.matchedTools || [],
            matchedTags: data.matchedTags || []
          });
          try {
            const previous = JSON.parse(sessionStorage.getItem(historyKey) || "[]") as string[];
            const history = [searchQuery.trim(), ...previous.filter(q => q !== searchQuery.trim())].slice(0, 10);
            sessionStorage.setItem(historyKey, JSON.stringify(history)); setSearchHistory(history);
          } catch { /* Storage is optional. */ }
        }
      } catch (err) {
        console.error("Failed to query advanced search:", err);
      }
    }, 300); // 300ms debounce

    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery, historyKey]);

  // Handle outside click to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(e: PointerEvent | FocusEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside, true);
    document.addEventListener("focusin", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true);
      document.removeEventListener("focusin", handleClickOutside);
    };
  }, []);

  const filteredPrompts = prompts;

  // Handler for quick suggestions selection
  const selectSuggestion = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
  };

  const handleClearFilters = () => {
    paramsRef.current = new URLSearchParams();
    if(useCaseSlug||toolSlug||domainSlug)navigate('/');else setSearchParams(new URLSearchParams());

  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in relative text-right" dir="rtl">

      {/* Search & Hero Engine Section */}
      <section className="home-hero relative bg-surface border border-line rounded-3xl shadow-sm p-6 md:p-12 text-center z-20">
        <PromptBackdrop />
        {/* Background visual accents */}
        <div className="absolute top-0 right-1/4 w-1/2 max-w-80 h-80 bg-brand-solid/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-1/2 max-w-80 h-80 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-solid/10 text-brand rounded-full text-xs font-bold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>موتور جستجوی معنایی و هوشمند پرامپت</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tight leading-tight md:leading-normal">
            {useCaseSlug ? <span>پرامپت‌های {getUseCase(useCaseSlug)?.title || 'کاربرد انتخاب‌شده'}</span> : (toolSlug||domainSlug) ? <span>پرامپت‌های {getTranslation(toolSlug||domainSlug||'',toolSlug?'tool':'domain')}</span> : branding.heroTitle ? (
              <span>{branding.heroTitle}</span>
            ) : (
              <>
                قلب تپنده نوآوری با <span className="text-brand">{siteTitle}</span>
              </>
            )}
          </h1>

          <p className="text-muted text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            {branding.heroDescription || "مرجع جستجو و شخصی‌سازی پرامپت. با جستجو، فیلترها، ابزارها، قالب‌های خروجی و دسته‌بندی‌های معنایی را با یک کلیک کاوش کنید."}
          </p>

          {/* Core Search Input Container */}
          <div ref={suggestionRef} className="pt-6 max-w-2xl mx-auto relative z-40">
            <div className="promty-search" data-has-query={!!searchQuery}>
              <span aria-hidden="true" className="promty-search-layer promty-search-glow" />
              <span aria-hidden="true" className="promty-search-layer promty-search-dark" />
              <span aria-hidden="true" className="promty-search-layer promty-search-white" />
              <span aria-hidden="true" className="promty-search-layer promty-search-border" />
              <div className="promty-search-main">
                <input
                  type="text"
                  aria-label="جستجوی منابع پرامپتی"
                  placeholder="چیزی بنویسید (مثال: 'طراحی عکس تبلیغاتی طلا با میدجرنی' یا 'کد React')"
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="promty-search-input w-full text-sm md:text-base font-medium"
                />
                <span className="promty-search-pink" aria-hidden="true" />
                <Search className="promty-search-icon" aria-hidden="true" />
                {searchQuery && <button type="button" aria-label="پاک کردن جستجو" onClick={() => setSearchQuery('')} className="promty-search-clear">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>}
                <button type="button" className="promty-search-filter" aria-label={showFilters ? 'بستن فیلترهای جستجو' : 'باز کردن فیلترهای جستجو'} aria-expanded={showFilters} aria-controls="archive-filter-dialog"
                  onClick={() => {
                    setShowSuggestions(false);
                    setShowFilters(true);
                  }}>
                  <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <HomepageQuickChips chips={branding.homepageChips} />
            {/* Smart Auto-Suggestions Overlay */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 left-0 z-50 shadow-2xl bg-surface/95 backdrop-blur-md border border-line/80 rounded-2xl mt-2 overflow-hidden text-right max-h-[420px] overflow-y-auto"
                >
                  {/* Real-time Intent & Tool Parser Matching Indicator */}
                  {searchQuery.trim() && searchResults && (
                    <div className="bg-brand-soft/50 px-4 py-3 border-b border-brand/50 flex flex-wrap items-center gap-2 text-xs text-brand">
                      <Sparkle className="w-3.5 h-3.5 text-brand" />
                      <span className="font-bold">تطبیق هوشمند الگو:</span>

                      {searchResults.matchedTools.map(t => (
                        <span key={t} onClick={() => { updateSelections('tool', current => [...current,t]); setShowSuggestions(false); }} className="bg-surface px-2 py-0.5 rounded border border-brand hover:bg-brand-soft cursor-pointer text-primary font-medium">
                          🛠️ ابزار: {getTranslation(t, "tool")}
                        </span>
                      ))}

                      {searchResults.matchedIntents.map(i => (
                        <span key={i} onClick={() => { updateSelections('intent', current => [...current,i]); setShowSuggestions(false); }} className="bg-surface px-2 py-0.5 rounded border border-brand hover:bg-brand-soft cursor-pointer text-primary font-medium">
                          🎯 هدف: {getTranslation(i, "intent")}
                        </span>
                      ))}

                      {searchResults.matchedDomains.map(d => (
                        <span key={d} onClick={() => { updateSelections('domain', current => [...current,d]); setShowSuggestions(false); }} className="bg-surface px-2 py-0.5 rounded border border-brand hover:bg-brand-soft cursor-pointer text-primary font-medium">
                          🌐 حوزه: {getTranslation(d, "domain")}
                        </span>
                      ))}

                      {searchResults.matchedTags.map(tag => (
                        <span key={tag} onClick={() => { setSearchQuery(tag); setShowSuggestions(false); }} className="bg-surface px-2 py-0.5 rounded border border-brand hover:bg-brand-soft cursor-pointer text-primary font-medium">
                          🏷️ برچسب: {tag}
                        </span>
                      ))}

                      {searchResults.matchedTools.length === 0 && searchResults.matchedIntents.length === 0 && searchResults.matchedDomains.length === 0 && (
                        <span className="text-muted font-medium">موتور در حال واکاوی معنایی متن است...</span>
                      )}
                    </div>
                  )}

                  {/* Autocomplete list */}
                  <div className="p-2 space-y-1">
                    {/* Taxonomy-Aware Autocomplete Suggestions */}
                    {taxonomySuggestions.length > 0 && (
                      <div className="border-b border-line pb-2 mb-2">
                        <div className="text-[10px] text-muted font-bold px-3 py-1 bg-surface-soft rounded mb-1.5">پیشنهادهای هوشمند طبقه‌بندی</div>
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
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-soft hover:bg-brand-solid/10 text-brand border border-brand/20 hover:border-brand/40 rounded-xl text-xs font-bold transition-all duration-150 shadow-sm"
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
                        <div className="text-[10px] text-muted font-bold px-3 py-1 bg-surface-soft rounded mb-1">پرامپت‌های تطبیق‌یافته ({searchResults.prompts.length})</div>
                        {searchResults.prompts.slice(0, 5).map((p, idx) => (
                          <Link
                            key={p.id}
                            to={`/prompts/${p.id}`}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl transition group text-right ${idx === activeSuggestionIndex ? "bg-brand-soft/80 border-r-4 border-brand" : "hover:bg-surface-soft"}`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Compass className="w-4 h-4 text-muted group-hover:text-brand shrink-0" />
                              <span className="text-xs font-semibold text-primary group-hover:text-brand truncate">{p.title}</span>
                            </div>
                            <span className="text-[10px] text-muted shrink-0 font-mono bg-surface-soft px-1.5 py-0.5 rounded">{p.tools?.[0] || "عمومی"}</span>
                          </Link>
                        ))}
                      </div>
                    ) : searchQuery.trim() && (
                      <div className="px-4 py-6 text-center text-muted text-xs flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5 text-muted" />
                        <span>هیچ پرامپت مستقیمی یافت نشد. می‌توانید جستجو را با کلیدواژه‌های ساده‌تر انجام دهید.</span>
                      </div>
                    )}

                    {/* Search history */}
                    {searchHistory.length > 0 && (
                      <div>
                        <div className="text-[10px] text-muted font-bold px-3 py-1 bg-surface-soft rounded mb-1">جستجوهای اخیر شما</div>
                        <div className="flex flex-wrap gap-1.5 p-2">
                          {searchHistory.map((hist, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectSuggestion(hist)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-soft hover:bg-surface-soft text-xs text-secondary rounded-lg transition"
                            >
                              <Clock className="w-3 h-3 text-muted" />
                              <span>{hist}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Only display measured aggregate trends when supplied */}
                    {trendingSearches.length > 0 && <div>
                      <div className="text-[10px] text-muted font-bold px-3 py-1 bg-surface-soft rounded mb-1">بیشترین جستجوهای هفته</div>
                      <div className="flex flex-wrap gap-1.5 p-2">
                        {trendingSearches.map((trend, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectSuggestion(trend)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-solid/5 hover:bg-brand-solid/10 text-xs text-brand rounded-lg font-semibold transition"
                          >
                            <Sparkle className="w-3 h-3" />
                            <span>{trend}</span>
                          </button>
                        ))}
                      </div>
                    </div>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <div id="archive-filter-panel" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <button type="button" onClick={()=>{setShowSuggestions(false);setShowFilters(true);}} aria-haspopup="dialog" aria-controls="archive-filter-dialog" aria-expanded={showFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-solid px-4 py-2 text-sm font-bold text-white">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true"/>فیلترها {filterSelectionCount(searchParams)>0&&<span className="rounded-full bg-white/20 px-2 text-xs">{filterSelectionCount(searchParams).toLocaleString('fa-IR')}</span>}
        </button>
        <label className="mr-auto min-w-0 text-xs text-muted"><span className="sr-only">مرتب‌سازی آرشیو</span><select aria-label="مرتب‌سازی آرشیو" value={sortBy} onChange={e=>setSortBy(e.target.value)} className="min-h-11 max-w-full rounded-xl border border-line bg-surface px-2 py-2 text-sm text-primary">
          <option value="relevance">مرتبط‌ترین‌ها</option><option value="usage">بیشترین کپی</option><option value="latest">جدیدترین‌ها</option><option value="title">الفبایی (عنوان)</option>
        </select></label>
      </div>
      {showFilters&&<ArchiveFilterDialog params={searchParams} taxonomies={{tool:tools,intent:intents,domain:domains,difficulty:difficulties,language:languages}} onClose={()=>setShowFilters(false)} onApply={next=>{
        paramsRef.current=next;
        const keepRoute=(!useCaseSlug||(readFilterValues(next,'useCase').length===1&&readFilterValues(next,'useCase')[0]===useCaseSlug))&&(!toolSlug||(readFilterValues(next,'tool').length===1&&readFilterValues(next,'tool')[0]===toolSlug))&&(!domainSlug||(readFilterValues(next,'domain').length===1&&readFilterValues(next,'domain')[0]===domainSlug));
        if(keepRoute)setSearchParams(next);else navigate('/?'+next.toString());
      }}/>}

      {/* Prompts Layout Grid */}
      <div className="space-y-4">
        {(filterHistory.length>0||searchQuery||searchParams.has('sort'))&&<nav aria-label="فیلترهای فعال" style={{top:headerOffset,zIndex:Z.STICKY_BOX}} className="sticky space-y-1 rounded-xl border border-line bg-surface p-2 shadow-sm">
          <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold text-muted">فیلترهای فعال</span><button type="button" onClick={handleClearFilters} className="min-h-11 px-2 text-xs text-danger-text">پاک‌سازی همه</button></div>
          <ActiveFilterChips items={[...(searchQuery?[{type:'q',value:searchQuery,label:`جستجو: ${searchQuery}`}]:[]),...filterHistory,...(searchParams.has('sort')?[{type:'sort',value:sortBy,label:sortBy==='usage'?'بیشترین کپی':sortBy==='title'?'عنوان':sortBy==='latest'?'جدیدترین':'مرتبط‌ترین‌ها'}]:[])]} onRemove={item=>item.type==='q'?setSearchQuery(''):item.type==='sort'?updateFilter('sort',''):removeSelection(item.type,item.value)} onEdit={()=>setShowFilters(true)}/>
        </nav>}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-black text-primary flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand" />
              <span>آرشیو کاربردمحور</span>
            </h2>
            <button
              id="open-contrib-modal-btn"
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1 bg-brand-solid/10 hover:bg-brand-solid/20 text-brand font-extrabold text-[11px] py-1.5 px-3 rounded-xl transition cursor-pointer shrink-0 animate-pulse"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>اشتراک پرامپت شما 💡</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted text-xs hidden sm:inline">
              {loading ? "در حال دریافت..." : `نمایش ${filteredPrompts.length} از ${totalPromptsCount} منبع`}
            </span>


          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted bg-surface border border-line rounded-3xl">
            <Loader className="w-8 h-8 text-brand" />
            <p className="text-xs font-semibold">موتور در حال واکاوی است...</p>
          </div>
        ) : filteredPrompts.length > 0 ? (
          <div className="space-y-8" id="prompt-archive-view">
            <PromptCollection template={branding.promptCardTemplate} prompts={filteredPrompts} bookmarkedIds={bookmarkedIds} sectionId="homepage-latest"
              title={searchQuery.trim() ? 'نتایج جستجو' : filterHistory.length ? 'نتایج فیلترها' : latestSection.title}
              description={searchQuery.trim() ? `منابع مرتبط با «${searchQuery.trim()}»` : filterHistory.length ? 'محتواهای منتشرشده مطابق فیلترهای انتخابی شما' : 'تازه‌ترین پرامپت‌ها، مهارت‌ها و راهنماهای منتشرشده'} />

            {/* Crawlable pagination preserves the full filter URL. */}
            {totalPromptsCount>latestSection.limit&&<nav aria-label="صفحه‌بندی آرشیو" className="flex justify-center items-center gap-4 pt-5">
              {page>1&&<Link className="rounded-xl border border-line px-4 py-3 text-sm" to={(()=>{const p=new URLSearchParams(searchParams);p.set('page',String(page-1));return '?'+p.toString()+'#prompt-archive-view';})()}>صفحهٔ قبل</Link>}
              <span className="text-xs text-muted">صفحهٔ {page.toLocaleString('fa-IR')} از {Math.ceil(totalPromptsCount/latestSection.limit).toLocaleString('fa-IR')}</span>
              {hasMore&&<Link className="rounded-xl border border-line px-4 py-3 text-sm" to={(()=>{const p=new URLSearchParams(searchParams);p.set('page',String(page+1));return '?'+p.toString()+'#prompt-archive-view';})()}>صفحهٔ بعد</Link>}
            </nav>}
          </div>
        ) : (
          <div className="bg-surface border border-line rounded-2xl p-12 text-center text-muted space-y-3 shadow-sm">
            <Sparkle className="w-10 h-10 text-muted mx-auto animate-bounce" />
            <p className="text-sm font-black text-primary">هیچ منبعی پیدا نشد.</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              فیلترهای اعمال‌شده بسیار محدود کننده هستند، یا پرامپتی متناسب با عبارت جستجوی شما یافت نشد. برای نتایج بهتر فیلترها را حذف کنید.
            </p>
            {filterHistory.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleRemoveLastFilter}
                  className="px-6 py-2.5 bg-brand-solid hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>حذف فیلتر [{filterHistory[filterHistory.length - 1].label}]</span>
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 bg-surface-soft hover:bg-surface-inset text-secondary font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  پاک‌سازی کامل فیلترها
                </button>
              </div>
            ) : (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-brand-solid hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                پاک‌سازی کامل فیلترها
              </button>
            )}
          </div>
        )}
      </div>

      {!searchQuery.trim() && filterHistory.length === 0 && <HomepageShelves bookmarkedIds={bookmarkedIds} configuration={branding.homepageSections} template={branding.promptCardTemplate} />}

      {/* Community Contribution Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs text-right overflow-y-auto" style={{ direction: "rtl" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface rounded-3xl shadow-xl border border-line max-w-2xl w-full p-6 md:p-8 space-y-6 relative my-8"
            >
              <button
                onClick={() => { setShowSubmitModal(false); setSubmitSuccess(false); }}
                className="absolute left-4 top-4 p-2 text-muted hover:text-secondary rounded-full hover:bg-surface-soft transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-solid/10 text-brand rounded-full text-[10px] font-black">
                  <Sparkles className="w-3 h-3" />
                  <span>مشارکت در پایگاه دانش</span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-primary">ارسال و اشتراک‌گذاری پرامپت شما 💡</h3>
                <p className="text-xs text-muted leading-relaxed">
                  پرامپت خلاقانه خود را ثبت کنید. پرامپت شما پس از تایید توسط تیم ادمین در آرشیو عمومی منتشر خواهد شد.
                </p>
              </div>

              {submitSuccess ? (
                <div className="p-8 text-center space-y-4 bg-success-soft rounded-2xl border border-success-text animate-fade-in">
                  <CheckCircle2 className="w-12 h-12 text-success-text mx-auto" />
                  <h4 className="text-base font-black text-primary">ارسال موفقیت‌آمیز پرامپت!</h4>
                  <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                    با تشکر از همکاری ارزشمند شما! پرامپت شما به صف بررسی ادمین‌های Promty.ir منتقل شد. پس از بازبینی و طبقه‌بندی هوشمند، در صفحه اول پلتفرم نمایش داده خواهد شد.
                  </p>
                  <button
                    onClick={() => { setShowSubmitModal(false); setSubmitSuccess(false); }}
                    className="px-5 py-2 bg-brand-solid hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    متوجه شدم
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContributionSubmit} className="space-y-4 text-right">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary">عنوان پرامپت <span className="text-danger-text">*</span></label>
                      <input
                        type="text"
                        placeholder="مثال: تولید لوگوی مینیمال"
                        value={subTitle}
                        onChange={(e) => setSubTitle(e.target.value)}
                        className="w-full text-xs p-3 bg-surface-soft border border-line focus:bg-surface focus:border-brand rounded-xl outline-none transition font-medium"
                        required
                      />
                    </div>

                    {/* Tool */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary">ابزار هوش مصنوعی اصلی</label>
                      <select
                        value={subTool}
                        onChange={(e) => setSubTool(e.target.value)}
                        className="w-full text-xs p-3 bg-surface-soft border border-line focus:bg-surface focus:border-brand rounded-xl outline-none transition cursor-pointer font-bold"
                      >
                        {tools.map(opt => (
                          <option key={opt.slug} value={opt.slug}>{opt.titleFa}</option>
                        ))}
                      </select>
                    </div>

                    {/* Domain */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary">حوزه کاربرد موضوعی</label>
                      <select
                        value={subDomain}
                        onChange={(e) => setSubDomain(e.target.value)}
                        className="w-full text-xs p-3 bg-surface-soft border border-line focus:bg-surface focus:border-brand rounded-xl outline-none transition cursor-pointer font-bold"
                      >
                        {domains.map(opt => (
                          <option key={opt.slug} value={opt.slug}>{opt.titleFa}</option>
                        ))}
                      </select>
                    </div>

                    {/* Language */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary">زبان اصلی پرامپت</label>
                      <select
                        value={subLang}
                        onChange={(e) => setSubLang(e.target.value)}
                        className="w-full text-xs p-3 bg-surface-soft border border-line focus:bg-surface focus:border-brand rounded-xl outline-none transition cursor-pointer font-bold"
                      >
                        {languages.map(opt => (
                          <option key={opt.slug} value={opt.slug}>{opt.titleFa}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary">توضیح کوتاه پرامپت (راهنمایی برای کاربر)</label>
                    <input
                      type="text"
                      placeholder="توضیح کوتاهی درباره خروجی این پرامپت و مدل مناسب بنویسید..."
                      value={subDesc}
                      onChange={(e) => setSubDesc(e.target.value)}
                      className="w-full text-xs p-3 bg-surface-soft border border-line focus:bg-surface focus:border-brand rounded-xl outline-none transition font-medium"
                    />
                  </div>

                  {/* Body Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-secondary">متن کامل و خام پرامپت <span className="text-danger-text">*</span></label>
                      <button
                        type="button"
                        onClick={handleAutoAnalyzePublic}
                        disabled={isAnalyzingPublic}
                        className="text-[11px] font-black text-brand hover:text-brand transition flex items-center gap-1 cursor-pointer bg-surface-soft hover:bg-brand-solid/10 px-2.5 py-1 rounded-lg border border-line"
                      >
                        {isAnalyzingPublic ? (
                          <>
                            <Loader className="w-3.5 h-3.5 text-brand" />
                            <span>در حال استخراج معنایی...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-brand" />
                            <span>آنالیز هوشمند و پر کردن خودکار فرم ✨</span>
                          </>
                        )}
                      </button>
                    </div>
                    {analyzePublicError && <p className="text-[10px] text-danger-text font-bold">{analyzePublicError}</p>}
                    <textarea
                      rows={5}
                      placeholder="متن کامل انگلیسی یا فارسی پرامپت خود را همراه با متغیرها به صورت [variable] بنویسید..."
                      value={subBody}
                      onChange={(e) => setSubBody(e.target.value)}
                      className="w-full text-xs p-3 bg-surface-soft border border-line focus:bg-surface focus:border-brand rounded-xl outline-none transition font-mono leading-relaxed"
                      style={{ direction: "ltr" }}
                      required
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary">برچسب‌ها (جدا شده با ویرگول فارسی یا انگلیسی)</label>
                    <input
                      type="text"
                      placeholder="مثال: لوگو, مینیمال, برندینگ, midjourney"
                      value={subTags}
                      onChange={(e) => setSubTags(e.target.value)}
                      className="w-full text-xs p-3 bg-surface-soft border border-line focus:bg-surface focus:border-brand rounded-xl outline-none transition"
                    />
                  </div>

                  <div className="flex gap-2 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-5 py-3 text-xs bg-surface-soft hover:bg-surface-inset text-secondary font-bold rounded-xl transition cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 text-xs bg-brand-solid hover:bg-indigo-600 disabled:bg-surface-inset text-white font-bold rounded-xl shadow-md shadow-brand/10 transition cursor-pointer flex items-center gap-1"
                    >
                      {submitting ? <Loader className="w-3.5 h-3.5" /> : <span>ارسال جهت بازبینی ادمین 🚀</span>}
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

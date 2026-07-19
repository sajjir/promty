import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Prompt, Stats } from "../types";
import { useAuth } from "../components/AuthContext";
import { 
  Plus, Trash2, Edit3, Eye, EyeOff, BarChart3, HelpCircle, 
  LogOut, CheckCircle, Loader2, Sparkles, Settings, Network, 
  Tag, Layers, Sliders, Database, Key, Search, RefreshCw, X, 
  ChevronRight, AlertCircle, HeartCrack, HelpCircle as HelpIcon,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TaxonomyTerm {
  id: string;
  type: "intent" | "domain" | "tool" | "language" | "difficulty" | "outputFormat" | "fieldType";
  slug: string;
  titleEn: string;
  titleFa: string;
  descriptionFa?: string;
  descriptionEn?: string;
  popularity?: number;
  usageCount?: number;
}

interface Relationship {
  id: string;
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  relationType: string;
  confidenceScore: number;
  priority: number;
  weight: number;
}

export default function AdminDashboard() {
  const { setSiteTitle } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"prompts" | "taxonomies" | "graph" | "ai">("prompts");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Settings Integration state
  const [siteTitleLocal, setSiteTitleLocal] = useState("");
  const [n8nAnalyzeWebhook, setN8nAnalyzeWebhook] = useState("");
  const [n8nRefineWebhook, setN8nRefineWebhook] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Taxonomy Tab States
  const [taxonomies, setTaxonomies] = useState<TaxonomyTerm[]>([]);
  const [selectedTaxonomyType, setSelectedTaxonomyType] = useState<string>("tool");
  const [newTaxType, setNewTaxType] = useState<string>("tool");
  const [newTaxSlug, setNewTaxSlug] = useState("");
  const [newTaxTitleEn, setNewTaxTitleEn] = useState("");
  const [newTaxTitleFa, setNewTaxTitleFa] = useState("");
  const [newTaxDescFa, setNewTaxDescFa] = useState("");
  const [taxActionLoading, setTaxActionLoading] = useState(false);
  const [taxSuccess, setTaxSuccess] = useState<string | null>(null);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);

  // Relationships Graph Tab States
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relSourceId, setRelSourceId] = useState("");
  const [relSourceType, setRelSourceType] = useState("Prompt");
  const [relTargetId, setRelTargetId] = useState("");
  const [relTargetType, setRelTargetType] = useState("TaxonomyTerm");
  const [relType, setRelType] = useState("Prompt_To_Tool");
  const [relConfidence, setRelConfidence] = useState("1.0");
  const [relPriority, setRelPriority] = useState("0");
  const [relWeight, setRelWeight] = useState("1.0");
  const [graphActionLoading, setGraphActionLoading] = useState(false);
  const [graphSuccess, setGraphSuccess] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("promty_admin_token");

  // Authentication Guard
  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  // Fetch core Dashboard, Settings, Taxonomies, and Relationships
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch("/api/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.status === 403) {
        localStorage.removeItem("promty_admin_token");
        navigate("/admin/login");
        return;
      }
      const statsData = await statsRes.json();

      // Fetch ALL prompts (including inactive)
      const promptsRes = await fetch("/api/prompts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const promptsData = await promptsRes.json();
      const promptsList = promptsData.data || promptsData.prompts || [];
      setPrompts(promptsList);

      if (promptsData.pagination && typeof promptsData.pagination.total === "number") {
        statsData.totalPrompts = promptsData.pagination.total;
      } else if (promptsList.length > 0) {
        statsData.totalPrompts = promptsList.length;
      }
      setStats(statsData);

      // Fetch network settings
      const settingsRes = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const s = settingsData.settings || {};
        setN8nAnalyzeWebhook(s.n8nAnalyzeWebhook || "");
        setN8nRefineWebhook(s.n8nRefineWebhook || s.n8nWebhookUrl || "");
        setGeminiApiKey(s.geminiApiKey || "");
        setOpenaiApiKey(s.openaiApiKey || "");
        setSiteTitleLocal(s.siteTitle || "Promty.ir");
      }

      // Fetch Taxonomy Terms
      const taxRes = await fetch("/api/taxonomies", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (taxRes.ok) {
        const taxData = await taxRes.json();
        setTaxonomies(taxData.terms || []);
      }

      // Fetch Relationships
      const relRes = await fetch("/api/relationships", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (relRes.ok) {
        const relData = await relRes.json();
        setRelationships(relData.relationships || []);
      }

    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("promty_admin_token");
    navigate("/admin/login");
  };

  // Toggle Prompt Active state
  const handleToggleActive = async (promptId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      setActionLoading(promptId);
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, isActive: !currentStatus } : p));
      }
    } catch (error) {
      console.error("Error toggling active state:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Prompt
  const handleDeletePrompt = async (promptId: string) => {
    if (!window.confirm("آیا از حذف این پرامپت اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) return;
    if (!token) return;

    try {
      setActionLoading(promptId);
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setPrompts(prev => prev.filter(p => p.id !== promptId));
        // Refresh stats
        const statsRes = await fetch("/api/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Save AI Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSettingsLoading(true);
      setSettingsSuccess(null);
      setSettingsError(null);
      
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          n8nAnalyzeWebhook,
          n8nRefineWebhook,
          geminiApiKey,
          openaiApiKey,
          siteTitle: siteTitleLocal
        })
      });
      
      if (res.ok) {
        setSettingsSuccess("تنظیمات مرکز کنترل هوش مصنوعی و نام سایت با موفقیت به‌روزرسانی شد.");
        setSiteTitle(siteTitleLocal);
      } else {
        const errData = await res.json();
        setSettingsError(errData.message || "خطا در تنظیم و ذخیره اطلاعات.");
      }
    } catch (err) {
      setSettingsError("برقراری ارتباط با سرویس‌دهنده ادمین شکست خورد.");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Create or Update Taxonomy Term
  const handleCreateTaxonomy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setTaxActionLoading(true);
      setTaxSuccess(null);
      setTaxError(null);

      const payload = {
        type: newTaxType,
        slug: newTaxSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        titleEn: newTaxTitleEn.trim(),
        titleFa: newTaxTitleFa.trim(),
        descriptionFa: newTaxDescFa.trim()
      };

      const url = editingTaxId ? `/api/taxonomies/${editingTaxId}` : "/api/taxonomies";
      const method = editingTaxId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTaxSuccess(editingTaxId ? `تاکسونومی "${newTaxTitleFa}" با موفقیت ویرایش شد.` : `تاکسونومی جدید "${newTaxTitleFa}" با موفقیت ذخیره شد.`);
        setNewTaxSlug("");
        setNewTaxTitleEn("");
        setNewTaxTitleFa("");
        setNewTaxDescFa("");
        setEditingTaxId(null);
        
        // Refresh taxonomy terms list
        const taxRes = await fetch("/api/taxonomies", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (taxRes.ok) {
          const taxData = await taxRes.json();
          setTaxonomies(taxData.terms || []);
        }
      } else {
        setTaxError(data.message || "خطا در ساخت/ویرایش فیلد معنایی.");
      }
    } catch (err) {
      setTaxError("پاسخی از سرور دریافت نشد.");
    } finally {
      setTaxActionLoading(false);
    }
  };

  const handleEditTaxonomyStart = (term: TaxonomyTerm) => {
    setEditingTaxId(term.id);
    setNewTaxType(term.type);
    setNewTaxSlug(term.slug);
    setNewTaxTitleEn(term.titleEn);
    setNewTaxTitleFa(term.titleFa);
    setNewTaxDescFa(term.descriptionFa || "");
  };

  const handleCancelEditTaxonomy = () => {
    setEditingTaxId(null);
    setNewTaxSlug("");
    setNewTaxTitleEn("");
    setNewTaxTitleFa("");
    setNewTaxDescFa("");
  };

  // Delete Taxonomy Term
  const handleDeleteTaxonomy = async (id: string) => {
    if (!window.confirm("آیا از حذف این فیلد معنایی (تاکسونومی) مطمئن هستید؟")) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/taxonomies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTaxonomies(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete taxonomy term:", err);
    }
  };

  // Create Relationship Graph Link
  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!relSourceId || !relTargetId) {
      setGraphError("شناسه مبدا و مقصد اجباری است.");
      return;
    }

    try {
      setGraphActionLoading(true);
      setGraphSuccess(null);
      setGraphError(null);

      const res = await fetch("/api/relationships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceId: relSourceId,
          sourceType: relSourceType,
          targetId: relTargetId,
          targetType: relTargetType,
          relationType: relType,
          confidenceScore: Number(relConfidence),
          priority: Number(relPriority),
          weight: Number(relWeight)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGraphSuccess("رابطه گراف دانش جدید با موفقیت ایجاد و تثبیت شد.");
        setRelSourceId("");
        setRelTargetId("");
        
        // Refresh relationships
        const relRes = await fetch("/api/relationships", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelationships(relData.relationships || []);
        }
      } else {
        setGraphError(data.message || "خطا در ایجاد رابطه معنایی.");
      }
    } catch (err) {
      setGraphError("برقراری ارتباط با وب‌سرویس شکست خورد.");
    } finally {
      setGraphActionLoading(false);
    }
  };

  // Delete Relationship Graph Link
  const handleDeleteRelationship = async (id: string) => {
    if (!window.confirm("آیا مایل به حذف این ارتباط در گراف دانش هستید؟")) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/relationships/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRelationships(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete relationship link:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C47FF]" />
        <p className="text-xs font-semibold">در حال بارگذاری ایمن مرکز کنترل ادمین...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-right" dir="rtl">
      
      {/* Top Banner Control Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 border border-slate-100 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>🛡️</span>
            <span>مرکز کنترل و مدیریت Promty.ir</span>
          </h1>
          <p className="text-xs text-slate-400">سیستم مدیریت متمرکز پرامپت‌ها، تاکسونومی‌های پویا و گراف دانش پلتفرم بدون نیاز به تغییر کد</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>خروج از ادمین</span>
          </button>

          <Link
            id="create-new-prompt-btn"
            to="/admin/prompts/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#6C47FF] hover:bg-[#5935e6] text-white rounded-xl text-xs font-bold shadow-md shadow-[#6C47FF]/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن پرامپت جدید</span>
          </Link>
        </div>
      </div>

      {/* Stats Board Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-[#6C47FF]/10 text-[#6C47FF] rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">تعداد کل پرامپت‌ها</span>
              <span className="text-2xl font-black text-slate-800 font-mono">{stats.totalPrompts}</span>
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">دفعات کپی و استفاده</span>
              <span className="text-2xl font-black text-slate-800 font-mono">{stats.totalUsages}</span>
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">برترین پرامپت آرشیو</span>
              <span className="text-xs font-black text-slate-700 block truncate max-w-[200px]" title={stats.mostPopular}>
                {stats.mostPopular}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Command Center Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab("prompts")}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "prompts"
              ? "border-[#6C47FF] text-[#6C47FF] bg-[#6C47FF]/5"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>۱. مدیریت پرامپت‌ها</span>
        </button>

        <button
          onClick={() => setActiveTab("taxonomies")}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "taxonomies"
              ? "border-[#6C47FF] text-[#6C47FF] bg-[#6C47FF]/5"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>۲. طبقه‌بندی هوشمند (Taxonomy)</span>
        </button>

        <button
          onClick={() => setActiveTab("graph")}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "graph"
              ? "border-[#6C47FF] text-[#6C47FF] bg-[#6C47FF]/5"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>۳. گراف روابط (Knowledge Graph)</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "ai"
              ? "border-[#6C47FF] text-[#6C47FF] bg-[#6C47FF]/5"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>۴. موتور هوش مصنوعی و بهینه‌سازی</span>
        </button>
      </div>

      {/* Main Tab Contents */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Prompts Listing */}
          {activeTab === "prompts" && (
            <motion.div
              key="prompts-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-800">آرشیو جامع پرامپت‌ها</h3>
                  <p className="text-xs text-slate-400">لیست کامل پرامپت‌های مهندسی‌شده همراه با فیلتر سریع فعال/غیرفعال</p>
                </div>
                <Link
                  to="/admin/prompts/new"
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-[#6C47FF] font-bold text-xs py-2 px-4 rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>پرامپت جدید</span>
                </Link>
              </div>

              {prompts.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm text-right text-slate-600 font-sans">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                      <tr>
                        <th scope="col" className="px-6 py-4">عنوان پرامپت</th>
                        <th scope="col" className="px-6 py-4">ابزار اصلی / موضوع</th>
                        <th scope="col" className="px-6 py-4">سطح کاربری</th>
                        <th scope="col" className="px-6 py-4">میزان استفاده</th>
                        <th scope="col" className="px-6 py-4">وضعیت انتشار</th>
                        <th scope="col" className="px-6 py-4 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prompts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition duration-150">
                          <td className="px-6 py-4 font-bold text-slate-800 max-w-sm">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[200px]">{p.title}</span>
                              {p.id.startsWith("p_contrib_") && !p.isActive && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 animate-pulse shrink-0">
                                  مشارکت در انتظار تایید 📬
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                            {(p.tools && p.tools.length > 0 ? p.tools.join("، ") : null) || (p.domains && p.domains.length > 0 ? p.domains.join("، ") : null) || (p as any).category || "عمومی"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded">
                              {p.difficulty || "Beginner"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">{p.usageCount || 0} استفاده</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleActive(p.id, p.isActive)}
                              disabled={actionLoading === p.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                                p.isActive
                                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                              }`}
                            >
                              {p.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              <span>{p.isActive ? "فعال" : "غیرفعال"}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/admin/prompts/${p.id}/edit`}
                                className="p-1 px-2.5 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>ویرایش</span>
                              </Link>
                              <button
                                onClick={() => handleDeletePrompt(p.id)}
                                disabled={actionLoading === p.id}
                                className="p-1 px-2.5 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Database className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-600">هنوز هیچ پرامپتی اضافه نکرده‌اید.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: Taxonomy Management */}
          {activeTab === "taxonomies" && (
            <motion.div
              key="taxonomies-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-base font-black text-slate-800">۲. مدیریت تاکسونومی‌ها و فیلدهای هوشمند معنایی</h3>
                <p className="text-xs text-slate-400">تاکسونومی‌ها ساختارهای اصلی طبقه‌بندی پلتفرم هستند که موتور جستجو بر پایه آن‌ها الگوها را می‌فهمد.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Taxonomy Creator Form */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-100 inline-block">
                    <Plus className="w-3.5 h-3.5 text-[#6C47FF]" />
                    <span>{editingTaxId ? "ویرایش فیلد معنایی (تاکسونومی)" : "ایجاد فیلد معنایی (تاکسونومی) جدید"}</span>
                  </h4>

                  <form onSubmit={handleCreateTaxonomy} className="space-y-4 text-right">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">نوع تاکسونومی (Type)</label>
                      <select
                        value={newTaxType}
                        onChange={(e) => setNewTaxType(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none text-right font-semibold"
                      >
                        <option value="intent">Intent (قصد/هدف)</option>
                        <option value="domain">Domain (حوزه کاری)</option>
                        <option value="tool">Tool (ابزار هوش مصنوعی)</option>
                        <option value="language">Language (زبان)</option>
                        <option value="difficulty">Difficulty (سطوح سختی)</option>
                        <option value="outputFormat">Output Format (قالب خروجی)</option>
                        <option value="fieldType">Field Type (نوع اینپوت)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">اسلاگ یکتا (Slug - انگلیسی بدون فاصله)</label>
                      <input
                        type="text"
                        placeholder="e.g. video-editing"
                        value={newTaxSlug}
                        onChange={(e) => setNewTaxSlug(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none text-left font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">عنوان انگلیسی (Title English)</label>
                      <input
                        type="text"
                        placeholder="e.g. Video Editing"
                        value={newTaxTitleEn}
                        onChange={(e) => setNewTaxTitleEn(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none text-left"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">عنوان فارسی (توضیح برای کاربر)</label>
                      <input
                        type="text"
                        placeholder="مثال: تدوین ویدیو"
                        value={newTaxTitleFa}
                        onChange={(e) => setNewTaxTitleFa(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none text-right"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">توضیحات فارسی (اختیاری)</label>
                      <textarea
                        rows={2}
                        placeholder="توضیح مختصری درباره کارایی این فیلد..."
                        value={newTaxDescFa}
                        onChange={(e) => setNewTaxDescFa(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none text-right"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={taxActionLoading}
                        className="flex-1 py-2.5 bg-[#6C47FF] hover:bg-[#5935e6] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        {taxActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>{editingTaxId ? "اعمال تغییرات ✍️" : "ذخیره فیلد معنایی 📂"}</span>}
                      </button>
                      
                      {editingTaxId && (
                        <button
                          type="button"
                          onClick={handleCancelEditTaxonomy}
                          className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          انصراف
                        </button>
                      )}
                    </div>

                    {taxSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{taxSuccess}</span>
                      </div>
                    )}

                    {taxError && (
                      <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                        <span>⚠️ {taxError}</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Taxonomy Viewer & Editor */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">فیلتر لیست طبقه‌بندی فعال:</span>
                    <select
                      value={selectedTaxonomyType}
                      onChange={(e) => setSelectedTaxonomyType(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1 px-3 font-semibold outline-none focus:border-[#6C47FF]"
                    >
                      <option value="intent">Intent (اهداف)</option>
                      <option value="domain">Domain (حوزه‌ها)</option>
                      <option value="tool">Tool (ابزارها)</option>
                      <option value="language">Language (زبان‌ها)</option>
                      <option value="difficulty">Difficulty (سطوح سختی)</option>
                      <option value="outputFormat">Output Format (خروجی‌ها)</option>
                      <option value="fieldType">Field Type (ورودی‌ها)</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm text-right text-slate-600 font-sans">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                        <tr>
                          <th scope="col" className="px-6 py-3">عنوان فارسی</th>
                          <th scope="col" className="px-6 py-3">عنوان انگلیسی</th>
                          <th scope="col" className="px-6 py-3">اسلاگ سیستم</th>
                          <th scope="col" className="px-6 py-3 text-left">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {taxonomies.filter(t => t.type === selectedTaxonomyType).map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-bold text-slate-800">{t.titleFa}</td>
                            <td className="px-6 py-3 font-medium text-slate-600">{t.titleEn}</td>
                            <td className="px-6 py-3 font-mono text-slate-400">{t.slug}</td>
                            <td className="px-6 py-3 text-left">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditTaxonomyStart(t)}
                                  className="p-1 px-2.5 border border-blue-100 text-blue-600 hover:bg-blue-50 rounded-lg font-bold transition cursor-pointer"
                                >
                                  ویرایش
                                </button>
                                <button
                                  onClick={() => handleDeleteTaxonomy(t.id)}
                                  className="p-1 px-2.5 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-lg font-bold transition cursor-pointer"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {taxonomies.filter(t => t.type === selectedTaxonomyType).length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400">هیچ عنصری در این دسته‌بندی یافت نشد.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Knowledge Graph Links */}
          {activeTab === "graph" && (
            <motion.div
              key="graph-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-base font-black text-slate-800">۳. مهندسی روابط و گراف دانش (Knowledge Graph Expansion)</h3>
                <p className="text-xs text-slate-400">در گراف دانش پرامپتی، پرامپت‌ها دیگر جزیره‌های جدا افتاده نیستند! ارتباط دادن پرامپت به ابزارها، اهداف و سایر پرامپت‌ها باعث بهبود هوش جستجو و معرفی پرامپت‌های مکمل می‌شود.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Link Form */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-100 inline-block">
                    <Network className="w-3.5 h-3.5 text-[#6C47FF]" />
                    <span>ایجاد ارتباط معنایی در گراف</span>
                  </h4>

                  <form onSubmit={handleCreateRelationship} className="space-y-4 text-right">
                    
                    {/* Source selection */}
                    <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] text-indigo-600 font-bold block">مرحله اول: انتخاب مبدا (Source)</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">نوع مبدا</label>
                          <select
                            value={relSourceType}
                            onChange={(e) => { setRelSourceType(e.target.value); setRelSourceId(""); }}
                            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                          >
                            <option value="Prompt">پرامپت</option>
                            <option value="TaxonomyTerm">تاکسونومی</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">انتخاب عنصر</label>
                          <select
                            value={relSourceId}
                            onChange={(e) => setRelSourceId(e.target.value)}
                            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                            required
                          >
                            <option value="">انتخاب کنید...</option>
                            {relSourceType === "Prompt" 
                              ? prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
                              : taxonomies.map(t => <option key={t.id} value={t.id}>{t.titleFa} ({t.type})</option>)
                            }
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Target selection */}
                    <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] text-emerald-600 font-bold block">مرحله دوم: انتخاب مقصد (Target)</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">نوع مقصد</label>
                          <select
                            value={relTargetType}
                            onChange={(e) => { setRelTargetType(e.target.value); setRelTargetId(""); }}
                            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                          >
                            <option value="TaxonomyTerm">تاکسونومی</option>
                            <option value="Prompt">پرامپت</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">انتخاب عنصر</label>
                          <select
                            value={relTargetId}
                            onChange={(e) => setRelTargetId(e.target.value)}
                            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                            required
                          >
                            <option value="">انتخاب کنید...</option>
                            {relTargetType === "Prompt" 
                              ? prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
                              : taxonomies.map(t => <option key={t.id} value={t.id}>{t.titleFa} ({t.type})</option>)
                            }
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Relation metadata */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">نوع رابطه (Relationship Type)</label>
                      <select
                        value={relType}
                        onChange={(e) => setRelType(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:border-[#6C47FF] outline-none"
                      >
                        <option value="Prompt_To_Tool">Prompt_To_Tool (پرامپت به ابزار)</option>
                        <option value="Prompt_To_Intent">Prompt_To_Intent (پرامپت به قصد)</option>
                        <option value="Prompt_To_Prompt">Prompt_To_Prompt (همبستگی دو پرامپت)</option>
                        <option value="Intent_To_Task">Intent_To_Task (قصد به تسک)</option>
                        <option value="Task_To_Tool">Task_To_Tool (تسک به ابزار)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold">میزان اطمینان</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={relConfidence}
                          onChange={(e) => setRelConfidence(e.target.value)}
                          className="w-full text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold">وزن تعامل (Weight)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={relWeight}
                          onChange={(e) => setRelWeight(e.target.value)}
                          className="w-full text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold">اولویت (Priority)</label>
                        <input
                          type="number"
                          value={relPriority}
                          onChange={(e) => setRelPriority(e.target.value)}
                          className="w-full text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-center"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={graphActionLoading}
                      className="w-full py-2.5 bg-[#6C47FF] hover:bg-[#5935e6] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
                    >
                      {graphActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>تثبیت ارتباط در گراف 🔀</span>}
                    </button>

                    {graphSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{graphSuccess}</span>
                      </div>
                    )}

                    {graphError && (
                      <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                        <span>⚠️ {graphError}</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Relationships list */}
                <div className="lg:col-span-2 space-y-4">
                  <span className="text-xs font-bold text-slate-400">فهرست پیوندهای گراف دانش فعال ({relationships.length}):</span>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm text-right text-slate-600 font-sans">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100 sticky top-0">
                        <tr>
                          <th scope="col" className="px-6 py-3">مبدا (Source)</th>
                          <th scope="col" className="px-6 py-3">نوع رابطه</th>
                          <th scope="col" className="px-6 py-3">مقصد (Target)</th>
                          <th scope="col" className="px-6 py-3 text-center">وزن / اطمینان</th>
                          <th scope="col" className="px-6 py-3 text-left">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {relationships.map((r) => {
                          // Find readable name of source and target
                          let srcName = r.sourceId;
                          let tgtName = r.targetId;

                          if (r.sourceType === "Prompt") {
                            const p = prompts.find(pr => pr.id === r.sourceId);
                            if (p) srcName = p.title;
                          } else {
                            const t = taxonomies.find(ta => ta.id === r.sourceId);
                            if (t) srcName = `${t.titleFa} (${t.type})`;
                          }

                          if (r.targetType === "Prompt") {
                            const p = prompts.find(pr => pr.id === r.targetId);
                            if (p) tgtName = p.title;
                          } else {
                            const t = taxonomies.find(ta => ta.id === r.targetId);
                            if (t) tgtName = `${t.titleFa} (${t.type})`;
                          }

                          return (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="px-6 py-3 font-semibold text-indigo-700 max-w-[150px] truncate" title={srcName}>{srcName}</td>
                              <td className="px-6 py-3 font-mono text-[10px] text-slate-400">{r.relationType}</td>
                              <td className="px-6 py-3 font-semibold text-emerald-700 max-w-[150px] truncate" title={tgtName}>{tgtName}</td>
                              <td className="px-6 py-3 text-center font-mono font-bold text-slate-500">W: {r.weight} | C: {r.confidenceScore}</td>
                              <td className="px-6 py-3 text-left">
                                <button
                                  onClick={() => handleDeleteRelationship(r.id)}
                                  className="text-rose-500 hover:text-rose-700 font-bold text-xs"
                                >
                                  حذف
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {relationships.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400">هنوز هیچ پیوندی در گراف پلتفرم تعریف نشده است.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: AI Settings */}
          {activeTab === "ai" && (
            <motion.div
              key="ai-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <Settings className="w-5 h-5 text-[#6C47FF]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">مرکز کنترل هوش مصنوعی و بهینه‌سازی</h3>
                  <p className="text-[11px] text-slate-400">مسیر وب‌هوک‌های n8n و کلیدهای مستقیم جمینای / اوپنای‌آی جهت بهبود و طبقه‌بندی هوشمند پرامپت‌ها</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Global Brand Settings */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
                    🌐 تنظیمات عمومی برند و وب‌سایت
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="site_title_input_tab" className="text-xs font-bold text-slate-500 block">
                      عنوان وب‌سایت و برند پلتفرم (Site Title)
                    </label>
                    <input
                      id="site_title_input_tab"
                      type="text"
                      value={siteTitleLocal}
                      onChange={(e) => setSiteTitleLocal(e.target.value)}
                      placeholder="Promty.ir"
                      className="w-full text-slate-700 bg-slate-50 placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition text-right font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Webhook block */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
                    🔗 مسیرهای وب‌هوک اتوماسیون (n8n Agent)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="n8n_analyze_input_tab" className="text-xs font-bold text-slate-500 block">
                        آدرس وب‌هوک تحلیل چشمه پرامپت (Analyze Agent)
                      </label>
                      <input
                        id="n8n_analyze_input_tab"
                        type="url"
                        dir="ltr"
                        value={n8nAnalyzeWebhook}
                        onChange={(e) => setN8nAnalyzeWebhook(e.target.value)}
                        placeholder="https://n8n.your-domain.com/webhook/analyze"
                        className="w-full text-slate-700 bg-slate-50 placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition font-mono text-left"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="n8n_refine_input_tab" className="text-xs font-bold text-slate-500 block">
                        آدرس وب‌هوک ارتقای پرامپت کلاینت (Refine Agent)
                      </label>
                      <input
                        id="n8n_refine_input_tab"
                        type="url"
                        dir="ltr"
                        value={n8nRefineWebhook}
                        onChange={(e) => setN8nRefineWebhook(e.target.value)}
                        placeholder="https://n8n.your-domain.com/webhook/refine"
                        className="w-full text-slate-700 bg-slate-50 placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition font-mono text-left"
                      />
                    </div>
                  </div>
                </div>

                {/* API Keys block */}
                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <h4 className="text-xs font-extrabold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
                    🔑 کلیدهای مستقیم مدل‌های هوش مصنوعی (Fallback)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="gemini_key_tab" className="text-xs font-bold text-slate-500 block">
                        کلید مستقیم Gemini API (Fallback)
                      </label>
                      <input
                        id="gemini_key_tab"
                        type="password"
                        dir="ltr"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full text-slate-700 bg-slate-50 placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition font-mono text-left"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="openai_key_tab" className="text-xs font-bold text-slate-500 block">
                        کلید مستقیم OpenAI API (برای توسعه آینده)
                      </label>
                      <input
                        id="openai_key_tab"
                        type="password"
                        dir="ltr"
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full text-slate-700 bg-slate-50 placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition font-mono text-left"
                      />
                    </div>
                  </div>
                </div>

                {/* Search Boosting / Search Rules Configuration */}
                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <h4 className="text-xs font-extrabold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
                    🔍 تنظیم قوانین و ضریب موتور جستجوی هوشمند (Search Rules)
                  </h4>
                  
                  <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-3 text-slate-600">
                    <div className="flex items-center justify-between border-b border-white pb-2">
                      <span className="font-bold">ضریب اولویت کلمات عنوان پرامپت (Title Match Boost)</span>
                      <span className="bg-indigo-100 text-[#6C47FF] font-black px-2 py-0.5 rounded">۵.۰x (بالاترین اولویت)</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white pb-2">
                      <span className="font-bold">ضریب اولویت فیلدهای ابزار و قصد (Tools & Intents Boost)</span>
                      <span className="bg-indigo-100 text-[#6C47FF] font-black px-2 py-0.5 rounded">۳.۵x (اولویت دوم)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold">استفاده از الگوریتم جستجوی فازی لوون‌اشتاین (Levenstein Threshold)</span>
                      <span className="bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded">فعال (آستانه تطبیق: ۷۵٪)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="text-[10px] text-slate-400">
                    💡 تمام تنظیمات ثبت شده در این صفحه، به صورت بلادرنگ در پرونده دیتابیس بومی سامانه ذخیره شده و از تغییر فایل‌های سرور شما را بی‌نیاز می‌کند.
                  </p>
                  
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#6C47FF] hover:bg-[#5935e6] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    {settingsLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال ذخیره‌سازی...</span>
                      </>
                    ) : (
                      <span>ذخیره تنظیمات ادمین 💾</span>
                    )}
                  </button>
                </div>

                {settingsSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                {settingsError && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                    <span>⚠️ {settingsError}</span>
                  </div>
                )}
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Prompt, Stats } from "../types";
import { Plus, Trash2, Edit3, Eye, EyeOff, BarChart3, HelpCircle, LogOut, CheckCircle, Loader2, Sparkles, Settings } from "lucide-react";

export default function AdminDashboard() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Settings Integration state
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const navigate = useNavigate();

  const token = localStorage.getItem("promty_admin_token");

  // Authentication Guard
  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

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
      setStats(statsData);

      // Fetch ALL prompts (including inactive)
      const promptsRes = await fetch("/api/prompts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const promptsData = await promptsRes.json();
      setPrompts(promptsData.prompts || []);

      // Fetch network settings
      const settingsRes = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setN8nWebhookUrl(settingsData.settings?.n8nWebhookUrl || "");
      }
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

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
        body: JSON.stringify({ n8nWebhookUrl })
      });
      
      if (res.ok) {
        setSettingsSuccess("آدرس وب‌هوک دستیار هوش مصنوعی n8n با موفقیت به‌روزرسانی شد.");
        const sortedRes = await fetch("/api/settings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sortedRes.ok) {
          const updated = await sortedRes.json();
          setN8nWebhookUrl(updated.settings?.n8nWebhookUrl || "");
        }
      } else {
        const errData = await res.json();
        setSettingsError(errData.message || "خطا در تنظیم و ذخیره اطلاعات.");
      }
    } catch (err: any) {
      setSettingsError("برقراری ارتباط با سرویس‌دهنده ادمین شکست خورد.");
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("promty_admin_token");
    navigate("/admin/login");
  };

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
        // Update local state
        setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, isActive: !currentStatus } : p));
      } else if (res.status === 403) {
        navigate("/admin/login");
      }
    } catch (error) {
      console.error("Error toggling active state:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (promptId: string) => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C47FF]" />
        <p className="text-xs">در حال بارگذاری اطلاعات داشبورد مدیریت...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-right">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 border border-slate-100 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>🛡️</span>
            <span>پنل مدیریت پرامپتی</span>
          </h1>
          <p className="text-xs text-slate-400">مدیریت لیست پرامپت‌ها و نظارت بر آمار استفاده از پلتفرم</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>

          <Link
            id="create-new-prompt-btn"
            to="/admin/prompts/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#6C47FF] hover:bg-[#5935e6] text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن پرامپت جدید</span>
          </Link>
        </div>
      </div>

      {/* Stats Board */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-[#6C47FF]/10 text-[#6C47FF] rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">کل پرامپت‌های آرشیو</span>
              <span className="text-2xl font-black text-slate-800 font-mono">{stats.totalPrompts}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">مجموع دفعات استفاده</span>
              <span className="text-2xl font-black text-slate-800 font-mono">{stats.totalUsages}</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">محبوب‌ترین پرامپت</span>
              <span className="text-sm font-bold text-slate-700 block truncate max-w-[200px]" title={stats.mostPopular}>
                {stats.mostPopular}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI integration Settings Panel */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm text-right space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
          <Settings className="w-5 h-5 text-[#6C47FF]" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">تنظیمات وب‌هوک دستیار هوش مصنوعی (n8n AI Agent)</h3>
            <p className="text-[11px] text-slate-400">آدرس وب‌هوک n8n خود را برای فعال‌سازی ویژگی بهبود حرفه‌ای و تعاملی پرامپت‌ها تنظیم کنید</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <label htmlFor="n8n_url_input" className="text-xs font-bold text-slate-500 block">آدرس وب‌هوک فراخوانی n8n Webhook Url</label>
              <input
                id="n8n_url_input"
                type="url"
                dir="ltr"
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                placeholder="https://n8n.your-domain.com/webhook/..."
                className="w-full text-slate-700 bg-slate-50 placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={settingsLoading}
              className="w-full md:w-auto px-6 py-2.5 bg-[#6C47FF] hover:bg-[#5935e6] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer h-[42px]"
            >
              {settingsLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ذخیره‌سازی...</span>
                </>
              ) : (
                <span>ذخیره تنظیمات شبکه ⚙️</span>
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
            <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 flex items-center gap-1.5">
              <span>⚠️ {settingsError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Prompts list */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">فهرست پرامپت‌های آرشیو</h3>
          <span className="text-xs text-slate-400">نمایش {prompts.length} ردیف</span>
        </div>

        {prompts.length > 0 ? (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full text-sm text-right text-slate-600 font-sans hidden md:table">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-4">عنوان پرامپت</th>
                  <th scope="col" className="px-6 py-4">دسته‌بندی</th>
                  <th scope="col" className="px-6 py-4">نوع</th>
                  <th scope="col" className="px-6 py-4">تعداد استفاده</th>
                  <th scope="col" className="px-6 py-4">وضعیت انتشار</th>
                  <th scope="col" className="px-6 py-4 text-left">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prompts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition duration-150">
                    <td className="px-6 py-4 font-semibold text-slate-800 max-w-xs truncate">
                      {p.title}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">{p.tool || p.domain || (p as any).category || "عمومی"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.isPremium ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {p.isPremium ? "ویژه" : "رایگان"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{p.usageCount} بار</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(p.id, p.isActive)}
                        disabled={actionLoading === p.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {p.isActive ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>فعال</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>غیرفعال</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          id={`edit-btn-${p.id}`}
                          to={`/admin/prompts/${p.id}/edit`}
                          className="p-1 px-2 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ویرایش</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={actionLoading === p.id}
                          className="p-1 px-2 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
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

            {/* Mobile Stack View */}
            <div className="md:hidden divide-y divide-slate-100">
              {prompts.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">{p.title}</h4>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">{p.tool || p.domain || (p as any).category || "عمومی"}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.isPremium ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {p.isPremium ? "ویژه" : "رایگان"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{p.usageCount} بار</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => handleToggleActive(p.id, p.isActive)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                        p.isActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {p.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{p.isActive ? "فعال" : "غیرفعال"}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/admin/prompts/${p.id}/edit`}
                        className="p-1 px-2 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ویرایش</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 px-2 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">هنوز هیچ پرامپتی ثبت نکرده‌اید.</p>
            <p className="text-xs">روی «افزودن پرامپت جدید» کلیک کنید تا اولین پرامپت مهندسی‌شده را به کاربران نمایش دهید.</p>
          </div>
        )}
      </div>

    </div>
  );
}

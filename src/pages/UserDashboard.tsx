import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import PromptCard from "../components/PromptCard";
import { Sparkles, Bookmark, Loader2, Compass, ArrowRight, User, Phone, Mail, Calendar } from "lucide-react";

export default function UserDashboard() {
  const { user, setPhoneModalOpen, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookmarked" | "profile">("bookmarked");

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Authentication Guard
  useEffect(() => {
    if (!user) {
      setPhoneModalOpen(true);
      navigate("/");
    }
  }, [user, navigate, setPhoneModalOpen]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch("/api/user/dashboard");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBookmarks(data.bookmarks || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (!user) {
    return null; // Let the guard redirect
  }

  const handleSaveName = async () => {
    if (!editName.trim()) {
      setProfileError("نام نمی‌تواند خالی باشد.");
      return;
    }
    try {
      setSavingProfile(true);
      setProfileError("");
      setProfileSuccess("");
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSuccess("نام شما با موفقیت بروزرسانی شد.");
        updateUser(data.user);
        setIsEditing(false);
      } else {
        setProfileError(data.message || "خطایی در بروزرسانی نام رخ داد.");
      }
    } catch (err) {
      setProfileError("ارتباط با سرور برقرار نشد.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Calculate some quick stats
  const dateStr = user.createdAt ? new Date(user.createdAt).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : "";

  return (
    <div id="user-dashboard-wrapper" className="space-y-8 text-right" dir="rtl">
      {/* Profile Hero banner */}
      <div id="profile-hero" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-right">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#6C47FF]/10 text-[#6C47FF] flex items-center justify-center text-2xl font-black shrink-0">
              {user.name?.charAt(0) || "ک"}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">{user.name}</h2>
            </div>
            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>عضویت از {dateStr || "بهار ۱۴۰۵"}</span>
            </p>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-4 shrink-0 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <div className="text-center px-4">
            <span className="text-lg md:text-xl font-black text-slate-800 block">
              {bookmarks.length}
            </span>
            <span className="text-[10px] text-slate-400 font-bold block">پرامپت نشان‌شده</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu navigation */}
      <div id="dashboard-tabs-section" className="border-b border-slate-200 pb-px">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("bookmarked")}
            className={`pb-3 text-xs md:text-sm font-black transition-all border-b-2 cursor-pointer flex items-center gap-2 px-1 ${
              activeTab === "bookmarked"
                ? "border-[#6C47FF] text-[#6C47FF]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>پرامپت‌های نشان‌شده ({bookmarks.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-xs md:text-sm font-black transition-all border-b-2 cursor-pointer flex items-center gap-2 px-1 ${
              activeTab === "profile"
                ? "border-[#6C47FF] text-[#6C47FF]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <User className="w-4 h-4" />
            <span>مشخصات حساب کاربری</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div id="tab-panels-content">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="animate-spin text-[#6C47FF] w-8 h-8 mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">درحال لود اطلاعات داشبورد شما...</p>
          </div>
        ) : activeTab === "bookmarked" ? (
          <div>
            {bookmarks.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
                  <Bookmark className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-700">لیست بوکمارک‌ها خالی است</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    هنوز هیچ پرامپتی را به لیست علاقه‌مندی‌های خود اضافه نکرده‌اید. با گشت و گذار در پلتفرم پرامپت‌های دلخواه خود را نشان کنید.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/")}
                  className="px-5 py-2.5 bg-[#6C47FF] text-white hover:bg-[#5935e6] text-xs font-black rounded-xl inline-flex items-center gap-1.5 transition-all shadow-md shadow-[#6C47FF]/10 cursor-pointer"
                >
                  <span>مرور و کشف پرامپت‌ها</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 rotate-180" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {bookmarks.map((bookmark) => (
                  <PromptCard
                    key={bookmark.id}
                    prompt={bookmark.prompt}
                    isInitiallyBookmarked={true}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 max-w-2xl mx-auto space-y-6">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <span>👤</span>
              <span>جزییات اطلاعات کاربری</span>
            </h3>

            {profileError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-2xl">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl">
                {profileSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100/50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">نام و نام خانوادگی:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full px-3 py-1.5 text-xs font-black text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20"
                    />
                  ) : (
                    <span className="text-xs font-black text-slate-700 block mt-1">{user.name || "ثبت نشده"}</span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveName}
                        disabled={savingProfile}
                        className="px-3 py-1.5 bg-[#6C47FF] hover:bg-[#5935e6] text-white text-[10px] font-black rounded-lg transition cursor-pointer disabled:opacity-50"
                      >
                        {savingProfile ? "در حال ذخیره..." : "ذخیره تغییرات"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(user.name || "");
                          setProfileError("");
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black rounded-lg transition cursor-pointer"
                      >
                        انصراف
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      ویرایش نام ✏️
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>شماره موبایل ارتباطی:</span>
                </span>
                <span className="text-xs font-mono font-black text-slate-700 block" style={{ direction: "ltr" }}>
                  {user.phone || "ثبت نشده"}
                </span>
              </div>

              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>آدرس ایمیل:</span>
                </span>
                <span className="text-xs font-mono font-black text-slate-700 block" style={{ direction: "ltr" }}>
                  {user.email || "ثبت نشده"}
                </span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 text-amber-800 border border-amber-100 rounded-2xl text-xs leading-relaxed font-semibold">
              ⚠️ جهت تغییر شماره همراه یا آدرس ایمیل خود، لطفاً با پشتیبانی پلتفرم Promty در تماس باشید. شماره همراه شما به صورت یکپارچه با سیستم احراز هویت متصل است.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

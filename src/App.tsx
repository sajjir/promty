import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Homepage from "./pages/Homepage";
import PromptDetail from "./pages/PromptDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPromptAddEdit from "./pages/AdminPromptAddEdit";
import UserDashboard from "./pages/UserDashboard";
import { 
  Sparkles, LayoutDashboard, Home, Check, Bookmark, 
  ShieldCheck, Shield, ChevronDown, LogOut, User as UserIcon
} from "lucide-react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import PhoneLoginModal from "./components/PhoneLoginModal";
import { Z } from "./lib/zIndex";

function SeoFooter() {
  const [popularTools, setPopularTools] = useState<{ slug: string; titleFa: string }[]>([]);
  const [popularDomains, setPopularDomains] = useState<{ slug: string; titleFa: string }[]>([]);

  useEffect(() => {
    fetch("/api/taxonomies")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.success) return;
        const list = data.terms || data.taxonomies || [];
        setPopularTools(list.filter((t: any) => t.type === "tool").slice(0, 6));
        setPopularDomains(list.filter((t: any) => t.type === "domain").slice(0, 6));
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-white border-t border-slate-100 pt-12 pb-8 mt-12 text-xs text-slate-500 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
        {/* ستون ۱: برند */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C47FF] to-violet-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-black text-slate-800">Promty.ir</span>
          </div>
          <p className="leading-relaxed text-slate-400 max-w-xs">
            همه‌چیز، با یک پرامپت آغاز می‌شود. آرشیو و شخصی‌سازی پرامپت‌های آماده‌ی هوش مصنوعی.
          </p>
        </div>

        {/* ستون ۲: دسته‌بندی‌ها */}
        <div className="space-y-2">
          <h4 className="text-slate-700 font-bold mb-2">پرامپت‌ها بر اساس ابزار</h4>
          <div className="flex flex-col gap-1.5">
            {popularTools.map((t) => (
              <Link key={t.slug} to={`/tool/${t.slug}`} className="hover:text-[#6C47FF] transition">
                پرامپت‌های {t.titleFa}
              </Link>
            ))}
          </div>
        </div>

        {/* ستون ۳: لینک‌های مفید */}
        <div className="space-y-2">
          <h4 className="text-slate-700 font-bold mb-2">دسته‌بندی‌های پرکاربرد</h4>
          <div className="flex flex-col gap-1.5">
            {popularDomains.map((d) => (
              <Link key={d.slug} to={`/domain/${d.slug}`} className="hover:text-[#6C47FF] transition">
                پرامپت‌های {d.titleFa}
              </Link>
            ))}
            <Link to="/dashboard" className="hover:text-[#6C47FF] transition">داشبورد من</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-10 pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
        <span>کلیه حقوق برای Promty.ir محفوظ است. © ۲۰۲۶</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>توسعه‌یافته با بالاترین استانداردهای مهندسی و کاربری</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const { user, logout, siteTitle, setPhoneModalOpen, isAdmin, isSuperAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 text-amber-700 border border-amber-300/60 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-amber-600" />
          <span>مدیر کل</span>
        </span>
      );
    }
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6C47FF]/10 text-[#6C47FF] border border-[#6C47FF]/20 shadow-xs">
          <Shield className="w-3 h-3 text-[#6C47FF]" />
          <span>مدیر سیستم</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
        کاربر
      </span>
    );
  };

  const displayName = user?.name || (user?.phone ? `۰${user.phone.slice(-10)}` : user?.email) || "کاربر Promty";

  return (
    <div id="app-shell" className="min-h-screen bg-[#FAFAF9] text-[#1C1C1C] font-sans antialiased flex flex-col selection:bg-[#6C47FF]/20 selection:text-[#6C47FF]">
      {/* Navigation Bar */}
      <header id="main-nav-bar" className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-xs" style={{ zIndex: Z.HEADER }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C47FF] to-violet-500 flex items-center justify-center text-white shadow-md shadow-[#6C47FF]/20 transition-all group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-base font-black tracking-tight text-slate-800 block">{siteTitle}</span>
              <span className="text-[10px] text-[#6C47FF] font-bold block">موتور شخصی‌سازی و پرامپت مهندسی</span>
            </div>
          </Link>

          {/* User Session status & Navigation */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">خانه</span>
              </Link>

              {user && (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#6C47FF] hover:bg-[#6C47FF]/5 transition"
                >
                  <Bookmark className="w-4 h-4 text-[#6C47FF]" />
                  <span>داشبورد من</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#6C47FF]" />
                  <span>پنل ادمین</span>
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2 pr-2 border-r border-slate-100">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition cursor-pointer"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        referrerPolicy="no-referrer"
                        alt={displayName}
                        className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-[#6C47FF]/10 text-[#6C47FF] flex items-center justify-center text-xs font-bold shadow-inner">
                        {displayName.charAt(0)}
                      </div>
                    )}
                    <div className="hidden md:block text-right">
                      <span className="text-xs font-black text-slate-800 block truncate max-w-[120px]">{displayName}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {getRoleBadge()}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div 
                      className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 text-right overflow-hidden animate-fade-in font-sans"
                      style={{ zIndex: Z.DROPDOWN }}
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/60">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-800 truncate block">{displayName}</span>
                          {getRoleBadge()}
                        </div>
                        {user.phone && (
                          <span className="text-[11px] text-slate-400 block font-mono font-medium">{user.phone}</span>
                        )}
                        {user.email && (
                          <span className="text-[11px] text-slate-400 block truncate font-mono">{user.email}</span>
                        )}
                      </div>

                      {/* Menu Links */}
                      <div className="p-1 space-y-0.5">
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#6C47FF] hover:bg-[#6C47FF]/5 transition"
                        >
                          <Bookmark className="w-4 h-4 text-[#6C47FF]" />
                          <span>پرامپت‌های ذخیره‌شده و نسخه‌ها</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                          >
                            <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                            <span>پنل مدیریت و تاکسونومی</span>
                          </Link>
                        )}
                      </div>

                      {/* Logout Action */}
                      <div className="pt-1 mt-1 border-t border-slate-50 px-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>خروج از حساب کاربری</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="open-auth-modal-btn"
                  onClick={() => setPhoneModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition shadow-md shadow-slate-900/10 cursor-pointer flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>ورود / ثبت‌نام</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/tool/:toolSlug" element={<Homepage />} />
          <Route path="/domain/:domainSlug" element={<Homepage />} />
          <Route path="/prompts/:id" element={<PromptDetail />} />
          <Route path="/prompt/:id" element={<PromptDetail />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/prompts/new" element={<AdminPromptAddEdit />} />
          <Route path="/admin/prompts/:id/edit" element={<AdminPromptAddEdit />} />
        </Routes>
      </main>

      {/* Footer Area */}
      <SeoFooter />

      {/* Auth Modals */}
      <PhoneLoginModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}

function AppWrapper() {
  const { googleClientId } = useAuth();

  const content = (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}

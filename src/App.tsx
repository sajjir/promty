import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Homepage from "./pages/Homepage";
import PromptDetail from "./pages/PromptDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPromptAddEdit from "./pages/AdminPromptAddEdit";
import UserDashboard from "./pages/UserDashboard";
import { Sparkles, LayoutDashboard, Home, FileCode, Check, Bookmark } from "lucide-react";
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
  const { user, logout, siteTitle, setPhoneModalOpen } = useAuth();
  const isAdmin = user && (user.role === "ADMIN" || user.role === "admin");

  return (
    <div id="app-shell" className="min-h-screen bg-[#FAFAF9] text-[#1C1C1C] font-sans antialiased flex flex-col selection:bg-[#6C47FF]/20 selection:text-[#6C47FF]">
      {/* Navigation Bar */}
      <header id="main-nav-bar" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm" style={{ zIndex: Z.HEADER }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6C47FF] to-violet-500 flex items-center justify-center text-white shadow-md shadow-[#6C47FF]/20 transition-all group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-sm font-black tracking-tight text-slate-800 block">{siteTitle}</span>
              <span className="text-[9px] text-[#6C47FF] font-bold block">موتور شخصی‌سازی پرامپت</span>
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
                  <LayoutDashboard className="w-4 h-4" />
                  <span>پنل ادمین</span>
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2 pr-2 border-r border-slate-100">
              {user ? (
                <div className="flex items-center gap-2">
                  {user.avatar ? (
                    <img src={user.avatar} referrerPolicy="no-referrer" alt={user.name} className="w-8 h-8 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#6C47FF]/10 text-[#6C47FF] flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="hidden md:block text-right">
                    <span className="text-xs font-bold text-slate-800 block">{user.name}</span>
                    <span className="text-[10px] text-slate-400 block">{isAdmin ? "مدیر" : "کاربر"}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-2 py-1 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                  >
                    خروج
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPhoneModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ورود / ثبت‌نام
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

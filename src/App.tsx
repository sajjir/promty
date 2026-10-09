import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Homepage from "./pages/Homepage";
import PromptDetail from "./pages/PromptDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPromptAddEdit from "./pages/AdminPromptAddEdit";
import UserDashboard from "./pages/UserDashboard";
import { Sparkles, Check } from "lucide-react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import PhoneLoginModal from "./components/PhoneLoginModal";
import SiteHeader from "./components/SiteHeader";
import { ThemeProvider } from "./components/ThemeProvider";

function SeoFooter() {
  const { branding, siteTitle } = useAuth();
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
    <footer className="bg-surface border-t border-line pt-12 pb-8 mt-12 text-xs text-muted font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
        {/* ستون ۱: برند */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {branding.siteLogo ? (
              <img src={branding.siteLogo} alt={siteTitle} className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-solid to-violet-500 flex items-center justify-center text-white shadow-sm shadow-brand/20">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <span className="text-sm font-black text-primary">{siteTitle}</span>
          </div>
          <p className="leading-relaxed text-muted max-w-xs">
            {branding.footerAbout || "همه‌چیز، با یک پرامپت آغاز می‌شود. آرشیو و شخصی‌سازی پرامپت‌های آماده‌ی هوش مصنوعی."}
          </p>
        </div>

        {/* ستون ۲: دسته‌بندی‌ها */}
        <div className="space-y-2">
          <h4 className="text-primary font-bold mb-2">پرامپت‌ها بر اساس ابزار</h4>
          <div className="flex flex-col gap-1.5">
            {popularTools.map((t) => (
              <Link key={t.slug} to={`/tool/${t.slug}`} className="hover:text-brand transition">
                پرامپت‌های {t.titleFa}
              </Link>
            ))}
          </div>
        </div>

        {/* ستون ۳: لینک‌های مفید */}
        <div className="space-y-2">
          <h4 className="text-primary font-bold mb-2">دسته‌بندی‌های پرکاربرد</h4>
          <div className="flex flex-col gap-1.5">
            {popularDomains.map((d) => (
              <Link key={d.slug} to={`/domain/${d.slug}`} className="hover:text-brand transition">
                پرامپت‌های {d.titleFa}
              </Link>
            ))}
            <Link to="/dashboard" className="hover:text-brand transition">داشبورد</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-10 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted">
        <span>{branding.footerCopyright || `کلیه حقوق برای ${siteTitle} محفوظ است.`}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-success-text" />
            <span>توسعه‌یافته با بالاترین استانداردهای مهندسی و کاربری</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  return (
    <div id="app-shell" className="min-h-screen bg-canvas text-primary font-sans antialiased flex flex-col selection:bg-brand-solid/20 selection:text-brand">
      <SiteHeader />

      {/* Global Body Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
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
    <ThemeProvider>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </ThemeProvider>
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

import SeoHeadSync from './components/SeoHeadSync';
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import PromptDetail from "./pages/PromptDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPromptAddEdit from "./pages/AdminPromptAddEdit";
import UserDashboard from "./pages/UserDashboard";
import { Sparkles, Instagram, Send } from "lucide-react";
import "./components/site-footer.css";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import PhoneLoginModal from "./components/PhoneLoginModal";
import SiteHeader from "./components/SiteHeader";
import { ThemeProvider } from "./components/ThemeProvider";

function SeoFooter() {
  const { branding, siteTitle } = useAuth();
  const about = branding.footerAbout && !branding.footerAbout.startsWith('پرامپتی مرجع تخصصی') ? branding.footerAbout : 'آرشیو و شخصی‌سازی پرامپت‌های هوش مصنوعی؛ برای رسیدن از ایده به نتیجه.';
  const trending = ['ساخت تصویر سینمایی', 'سناریوی ویدیوی کوتاه', 'برنامه بازاریابی کسب‌وکار', 'تقویم محتوای شبکه‌های اجتماعی', 'برنامه‌ریزی یادگیری', 'خلاصه‌سازی و تحلیل متن'];
  const lessons = ['پرامپت چیست و چگونه کار می‌کند؟', 'نوشتن اولین پرامپت مؤثر', 'نقش، زمینه و هدف در پرامپت', 'ساخت تصویر با هوش مصنوعی', 'پرامپت‌نویسی برای کسب‌وکار', 'ارزیابی و بهبود پاسخ‌های AI'];

  return (
    <footer className="bg-surface border-t border-line pt-12 pb-8 mt-12 text-xs text-muted font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-3 gap-8 text-right">
        <section className="col-span-2 md:col-span-1 space-y-3" aria-label="دربارهٔ پرامپتی">
          <div className="flex items-center gap-2">{branding.siteLogo ? <img src={branding.siteLogo} alt="" width="32" height="32" className="w-8 h-8 object-contain"/> : <Sparkles className="w-7 h-7 text-brand"/>}<h2 className="text-sm font-black text-primary">{siteTitle}</h2></div>
          <p className="max-w-sm leading-7">{about}</p>
        </section>
        {[{title:'پرامپت‌های ترند', items:trending}, {title:'آکادمی پرامپتی', items:lessons}].map(({title,items}) => <div key={title} className="min-w-0 space-y-3">
          <h4 className="text-primary font-bold">{title}</h4>
          <ul className="space-y-2.5 leading-relaxed">{items.map(item => <li key={item}><span aria-disabled="true" className="text-muted">{item}</span></li>)}</ul>
          <p className="text-[10px] text-muted">به‌زودی</p>
        </div>)}
      </div>

      <div className="site-footer-bottom max-w-7xl mx-auto px-4 md:px-6 mt-8 pt-5 border-t border-line">
        <p>{branding.footerCopyright || `کلیه حقوق برای ${siteTitle} محفوظ است.`}</p>
        <div className="site-footer-links"><a href="https://betavan.com" target="_blank" rel="noopener noreferrer" className="site-footer-credit">ساخته‌شده توسط <strong>بتوان</strong></a><nav aria-label="شبکه‌های اجتماعی پرامپتی"><a href="https://www.instagram.com/promty.ir/" target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام پرامپتی" title="اینستاگرام"><Instagram aria-hidden="true"/></a><a href="https://t.me/promty_ir" target="_blank" rel="noopener noreferrer" aria-label="کانال تلگرام پرامپتی" title="تلگرام"><Send aria-hidden="true"/></a></nav></div>
      </div>
    </footer>
  );
}

function AppContent() {
  return (
    <div id="app-shell" className="min-h-screen bg-canvas text-primary font-sans antialiased flex flex-col selection:bg-brand-solid/20 selection:text-brand">
      <SeoHeadSync />
      <SiteHeader />

      {/* Global Body Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/use-case/:useCaseSlug" element={<Homepage />} />
          <Route path="/tool/:toolSlug" element={<Homepage />} />
          <Route path="/domain/:domainSlug" element={<Homepage />} />
          <Route path="/prompts/:id" element={<PromptDetail />} />
          <Route path="/prompt/:id" element={<PromptDetail />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/prompts/new" element={<AdminPromptAddEdit />} />
          <Route path="/admin/prompts/:id/edit" element={<AdminPromptAddEdit />} />
          <Route path="*" element={<section><h1>صفحه پیدا نشد</h1><a href="/">بازگشت به خانه</a></section>} />
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

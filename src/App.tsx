import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Homepage from "./pages/Homepage";
import PromptDetail from "./pages/PromptDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPromptAddEdit from "./pages/AdminPromptAddEdit";
import { Sparkles, LayoutDashboard, Home, FileCode, Check } from "lucide-react";

export default function App() {
  const isAdminLoggedIn = !!localStorage.getItem("promty_admin_token");

  return (
    <BrowserRouter>
      <div id="app-shell" className="min-h-screen bg-[#FAFAF9] text-[#1C1C1C] font-sans antialiased flex flex-col selection:bg-[#6C47FF]/20 selection:text-[#6C47FF]">
        {/* Navigation Bar */}
        <header id="main-nav-bar" className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6C47FF] to-violet-500 flex items-center justify-center text-white shadow-md shadow-[#6C47FF]/20 transition-all group-hover:scale-105">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-sm font-black tracking-tight text-slate-800 block">Promty.ir</span>
                <span className="text-[9px] text-[#6C47FF] font-bold block">ام‌وی‌پی شخصی‌سازی پرامپت</span>
              </div>
            </Link>

            {/* Menu Nav Links */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">خانه</span>
              </Link>

              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>پنل ادمین</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Global Body Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/prompts/:id" element={<PromptDetail />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/prompts/new" element={<AdminPromptAddEdit />} />
            <Route path="/admin/prompts/:id/edit" element={<AdminPromptAddEdit />} />
          </Routes>
        </main>

        {/* Footer Area */}
        <footer className="bg-white border-t border-slate-100 py-8 mt-12 text-center text-xs text-slate-400 font-sans">
          <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-3">
            <p className="font-bold text-slate-600 mb-1">Promty.ir — پلتفرم آرشیو و شخصی‌سازی پرامپت‌های آماده هوش مصنوعی</p>
            <p className="leading-relaxed max-w-xl mx-auto">
              این پلتفرم به عنوان یک محصول کمینه ارزشمند (MVP) جهت کپی سریع کدهای مهندسی شده هوش مصنوعی در ابزارهای تصویرسازی و متنی توسعه یافته است.
            </p>
            <div className="text-[10px] text-slate-400 pt-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>کلیه حقوق برای توسعه‌دهندگان پلتفرم پرامپتی محفوظ است. © ۲۰۲۶</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>توسعه‌یافته مطابق چک‌لیست MVP</span>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

import './components/blog.css';
import SeoHeadSync from './components/SeoHeadSync';
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import PromptDetail from "./pages/PromptDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPromptAddEdit from "./pages/AdminPromptAddEdit";
import UserDashboard from "./pages/UserDashboard";
import SiteFooter from "./components/SiteFooter";
import TrustPage from "./pages/TrustPage";
import "./components/trust-page.css";
import "./components/site-footer.css";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import PhoneLoginModal from "./components/PhoneLoginModal";
import SiteHeader from "./components/SiteHeader";
import { ThemeProvider } from "./components/ThemeProvider";

const BlogPages=React.lazy(()=>import('./pages/BlogPages'));

function AppContent() {
  return (
    <div id="app-shell" className="min-h-screen bg-canvas text-primary font-sans antialiased flex flex-col selection:bg-brand-solid/20 selection:text-brand">
      <SeoHeadSync />
      <SiteHeader />

      {/* Global Body Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/blog" element={<React.Suspense fallback={<p role="status">در حال دریافت آموزش…</p>}><BlogPages /></React.Suspense>} />
          <Route path="/blog/:slug" element={<React.Suspense fallback={<p role="status">در حال دریافت آموزش…</p>}><BlogPages /></React.Suspense>} />
          <Route path="/guide" element={<TrustPage path="/guide" />} />
          <Route path="/about" element={<TrustPage path="/about" />} />
          <Route path="/contact" element={<TrustPage path="/contact" />} />
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
      <SiteFooter />

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

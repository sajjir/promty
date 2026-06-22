import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, AlertTriangle, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("promty_admin_token", data.token);
        navigate("/admin");
      } else {
        setError(data.message || "ایمیل یا رمز عبور نامعتبر است.");
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setError("خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-md w-full space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[#6C47FF]/10 text-[#6C47FF] rounded-2xl mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-800">ورود به پنل مدیریت</h1>
          <p className="text-xs text-slate-400">برای ایجاد، ویرایش و مدیریت پرامپت‌ها وارد شوید</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-xs font-bold text-slate-600 block">پست الکترونیکی</label>
            <div className="relative">
              <input
                type="email"
                id="admin-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@promty.ir"
                className="w-full text-xs py-3 pr-10 pl-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition text-right"
              />
              <Mail className="w-4.5 h-4.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-xs font-bold text-slate-600 block">رمز عبور</label>
            <div className="relative">
              <input
                type="password"
                id="admin-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs py-3 pr-10 pl-3 bg-slate-50 border border-slate-200 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] rounded-xl outline-none transition text-right"
              />
              <Lock className="w-4.5 h-4.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#6C47FF] hover:bg-[#5935e6] text-white font-bold text-xs rounded-xl shadow-md transition duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال بررسی اطلاعات...</span>
              </>
            ) : (
              <span>ورود به پنل ادمین</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

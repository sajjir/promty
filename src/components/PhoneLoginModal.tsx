import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Phone, Key, X, Check, AlertCircle, User, ArrowRight, RotateCw } from "lucide-react";
import { motion } from "motion/react";
import GoogleLoginButton from "./GoogleLoginButton";
import { Z } from "../lib/zIndex";

interface PhoneLoginModalProps {
  contextMessage?: string;
}

export default function PhoneLoginModal({ contextMessage }: PhoneLoginModalProps = {}) {
  const {
    isPhoneModalOpen,
    setPhoneModalOpen,
    phoneModalContextMessage,
    sendOtp,
    verifyOtp,
    completePhoneRegistration,
  } = useAuth();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Timer countdown handler
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isPhoneModalOpen) return null;

  // Convert Persian/Arabic digits to English digits as user types
  const handlePhoneChange = (val: string) => {
    const normalized = val
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[^\d+]/g, "");
    setPhone(normalized);
  };

  const handleCodeChange = (val: string) => {
    const normalized = val
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[^\d]/g, "")
      .slice(0, 5);
    setCode(normalized);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("لطفاً یک شماره موبایل معتبر ۱۱ رقمی وارد نمایید.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await sendOtp(phone);
      if (res.success) {
        setStep("otp");
        setCountdown(res.cooldownSeconds || 120);
        setCode("");
      } else {
        setError(res.message || "خطا در ارسال کد تایید.");
        if (res.cooldownSeconds && res.cooldownSeconds > 0) {
          setCountdown(res.cooldownSeconds);
        }
      }
    } catch (err: any) {
      setError("ارتباط با سامانه ارسال پیامک برقرار نشد.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 5) {
      setError("لطفاً کد تایید ۵ رقمی را کامل وارد کنید.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await verifyOtp(phone, code);
      if (res.success) {
        if (res.isNewUser && (!res.user?.name || res.user.name.startsWith("کاربر "))) {
          setStep("name");
        } else {
          setSuccess(true);
          setTimeout(() => {
            handleClose();
          }, 1200);
        }
      } else {
        setError(res.message || "کد تایید اشتباه است یا منقضی شده است.");
      }
    } catch (err) {
      setError("خطا در تایید کد تایید. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      // Allow skipping name if empty
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 800);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await completePhoneRegistration(phone, name.trim());
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError("خطا در ذخیره نام.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneModalOpen(false);
    setError(null);
    setStep("phone");
    setPhone("");
    setCode("");
    setName("");
    setSuccess(false);
    setLoading(false);
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ zIndex: Z.MODAL }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 font-sans"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-800">
              {contextMessage || phoneModalContextMessage || "ورود یا ثبت‌نام در Promty"}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              دسترسی به تمام قابلیت‌های ساخت، شخصی‌سازی و آرشیو پرامپت‌ها
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-800">ورود با موفقیت انجام شد</h4>
              <p className="text-xs text-slate-400">خوش آمدید! در حال انتقال به پرامپتی...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-600">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {step === "phone" ? (
                <div className="space-y-5">
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>شماره موبایل</span>
                        <span className="text-[11px] text-slate-400 font-normal">ورود بدون رمز با پیامک</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="tel"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          autoFocus
                          className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#6C47FF] focus:outline-none focus:ring-4 focus:ring-[#6C47FF]/10 text-right font-mono font-bold tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 transition"
                          required
                          disabled={loading}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        کد تایید ۵ رقمی از طریق پیامک به این شماره ارسال خواهد شد.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#6C47FF] hover:bg-[#5B3CE0] text-white text-xs font-bold py-3.5 rounded-xl transition shadow-md shadow-[#6C47FF]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>ارسال کد تایید پیامکی</span>
                          <ArrowRight className="w-4 h-4 rotate-180" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100" />
                    </div>
                    <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400">
                      یا ورود سریع با گوگل
                    </span>
                  </div>

                  {/* Google OAuth Button Side-by-Side inside modal */}
                  <div className="flex justify-center pt-1 pb-1">
                    <GoogleLoginButton />
                  </div>
                </div>
              ) : step === "otp" ? (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2 text-right">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">کد تایید ۵ رقمی</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setStep("phone");
                          setError(null);
                        }}
                        className="text-xs font-bold text-[#6C47FF] hover:underline cursor-pointer"
                      >
                        ویرایش شماره ({phone})
                      </button>
                    </div>

                    <div className="relative">
                      <Key className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="•••••"
                        autoFocus
                        maxLength={5}
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 text-lg focus:border-[#6C47FF] focus:outline-none focus:ring-4 focus:ring-[#6C47FF]/10 text-center font-mono tracking-[0.7em] font-black text-slate-800 transition"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>کد ۵ رقمی ارسال‌شده به شماره را وارد کنید</span>
                      {countdown > 0 ? (
                        <span className="font-mono text-slate-500 font-bold">
                          {formatCountdown(countdown)} تا ارسال مجدد
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={loading}
                          className="text-[#6C47FF] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>ارسال مجدد کد</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 5}
                    className="w-full bg-[#6C47FF] hover:bg-[#5B3CE0] text-white text-xs font-bold py-3.5 rounded-xl transition shadow-md shadow-[#6C47FF]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>تایید و ورود به حساب</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 3: Complete user profile name */
                <form onSubmit={handleSaveName} className="space-y-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی (اختیاری)</label>
                    <div className="relative">
                      <User className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: علی احمدی"
                        autoFocus
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#6C47FF] focus:outline-none focus:ring-4 focus:ring-[#6C47FF]/10 text-right font-medium transition"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      نام شما در بالای سایت و برای پرامپت‌های ذخیره‌شده نمایش داده می‌شود.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#6C47FF] hover:bg-[#5B3CE0] text-white text-xs font-bold py-3.5 rounded-xl transition shadow-md shadow-[#6C47FF]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>ذخیره و ورود به سایت</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuccess(true);
                        setTimeout(() => handleClose(), 800);
                      }}
                      className="px-4 py-3.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      رد شدن
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

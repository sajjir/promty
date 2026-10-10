import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Phone, Key, X, Check, AlertCircle, User, ArrowRight, RotateCw, Mail, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import GoogleLoginButton from "./GoogleLoginButton";
import { Z } from "../lib/zIndex";

interface PhoneLoginModalProps {
  contextMessage?: string;
}

export default function PhoneLoginModal({ contextMessage }: PhoneLoginModalProps = {}) {
  const {
    googleClientId,
    isPhoneModalOpen,
    setPhoneModalOpen,
    phoneModalContextMessage,
    sendOtp,
    verifyOtp,
    completePhoneRegistration,
    updateProfile,
  } = useAuth();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
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
        const needsProfile = res.isNewUser || !res.user?.name || res.user.name.startsWith("کاربر ");
        if (needsProfile) {
          setStep("profile");
        } else {
          setSuccess(true);
          setTimeout(() => {
            handleClose();
          }, 900);
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cleanEmail = email.trim() || undefined;
      let res = await updateProfile(name.trim(), cleanEmail);
      if (!res.success) {
        // Fallback
        res = await completePhoneRegistration(phone, name.trim(), cleanEmail);
      }
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1000);
      } else {
        setError(res.message || "خطا در ذخیره اطلاعات.");
      }
    } catch (err) {
      setError("خطا در ذخیره اطلاعات حساب کاربری.");
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
    setEmail("");
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="relative w-full max-w-md bg-surface rounded-3xl shadow-2xl border border-line overflow-hidden z-10 font-sans"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-surface-soft/50">
          <div>
            <h3 id="auth-dialog-title" className="text-base font-black text-primary">
              {contextMessage || phoneModalContextMessage || "ورود یا ثبت‌نام در Promty"}
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              دسترسی به تمام قابلیت‌های ساخت، شخصی‌سازی و آرشیو پرامپت‌ها
            </p>
          </div>
          <button
            aria-label="بستن پنجره ورود"
            onClick={handleClose}
            className="p-2 rounded-xl text-muted hover:text-secondary hover:bg-surface border border-transparent hover:border-line transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-success-text flex items-center justify-center shadow-inner">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-primary">ورود با موفقیت انجام شد</h4>
              <p className="text-xs text-muted">خوش آمدید! در حال انتقال به پرامپتی...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-danger-soft border border-danger-text rounded-xl flex items-start gap-2.5 text-xs text-danger-text">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {step === "phone" ? (
                <div className="space-y-5">
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-primary flex items-center justify-between">
                        <span>شماره موبایل</span>
                        <span className="text-[11px] text-muted font-normal">ورود بدون رمز با پیامک</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-muted" />
                        <input 
                          type="tel"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          autoFocus
                          className="w-full pr-10 pl-4 py-3 rounded-xl border border-line text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 text-right font-mono font-bold tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-muted transition"
                          required
                          disabled={loading}
                        />
                      </div>
                      <p className="text-[10px] text-muted leading-relaxed">
                        کد تایید ۵ رقمی از طریق پیامک به این شماره ارسال خواهد شد.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-solid hover:bg-[#5B3CE0] text-white text-xs font-bold py-3.5 rounded-xl transition shadow-md shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

                  {googleClientId && <>
                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-line" />
                    </div>
                    <span className="relative bg-surface px-3 text-[11px] font-bold text-muted">
                      یا ورود سریع با گوگل
                    </span>
                  </div>

                  {/* Google OAuth Button Side-by-Side inside modal */}
                  <div className="flex justify-center pt-1 pb-1">
                    <GoogleLoginButton />
                  </div>
                  </>}
                </div>
              ) : step === "otp" ? (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2 text-right">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-primary">کد تایید ۵ رقمی</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setStep("phone");
                          setError(null);
                        }}
                        className="text-xs font-bold text-brand hover:underline cursor-pointer"
                      >
                        ویرایش شماره ({phone})
                      </button>
                    </div>

                    <div className="relative">
                      <Key className="absolute right-3.5 top-3.5 w-4 h-4 text-muted" />
                      <input 
                        type="text"
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="•••••"
                        autoFocus
                        maxLength={5}
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-line text-lg focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 text-center font-mono tracking-[0.7em] font-black text-primary transition"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                      <span>کد ۵ رقمی ارسال‌شده به شماره را وارد کنید</span>
                      {countdown > 0 ? (
                        <span className="font-mono text-muted font-bold">
                          {formatCountdown(countdown)} تا ارسال مجدد
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={loading}
                          className="text-brand font-bold hover:underline flex items-center gap-1 cursor-pointer"
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
                    className="w-full bg-brand-solid hover:bg-[#5B3CE0] text-white text-xs font-bold py-3.5 rounded-xl transition shadow-md shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>تایید و ورود به حساب</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 3: Complete user profile name and email */
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="p-3 bg-brand-soft/70 border border-brand rounded-2xl flex items-center gap-2.5 text-xs text-brand">
                    <Sparkles className="w-4 h-4 text-brand shrink-0" />
                    <span className="font-bold">تکمیل اطلاعات حساب کاربری شما در پرامپتی</span>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-primary flex items-center justify-between">
                      <span>نام و نام خانوادگی</span>
                      <span className="text-[10px] text-danger-text font-bold">الزامی</span>
                    </label>
                    <div className="relative">
                      <User className="absolute right-3.5 top-3.5 w-4 h-4 text-muted" />
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: علی رضایی"
                        autoFocus
                        required
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-line text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 text-right font-medium transition"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-primary flex items-center justify-between">
                      <span>ایمیل</span>
                      <span className="text-[10px] text-muted font-medium">اختیاری</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-muted" />
                      <input 
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-line text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 font-mono text-left transition"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-[10px] text-muted leading-relaxed">
                      از ایمیل برای ارسال اعلان‌های مهم و بازیابی اطلاعات استفاده می‌شود.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading || !name.trim()}
                      className="w-full bg-brand-solid hover:bg-[#5B3CE0] text-white text-xs font-bold py-3.5 rounded-xl transition shadow-md shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>تکمیل حساب و ورود به پلتفرم</span>
                      )}
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

import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { Phone, Key, X, Check, AlertCircle, User, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import GoogleLoginButton from "./GoogleLoginButton";

export default function PhoneLoginModal() {
  const { isPhoneModalOpen, setPhoneModalOpen, completePhoneRegistration } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "complete-profile">("phone");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isPhoneModalOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("لطفاً یک شماره تلفن معتبر وارد کنید.");
      return;
    }
    setError("");
    setSending(true);

    // Simulate OTP sending delay
    setTimeout(() => {
      setSending(false);
      setStep("otp");
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code !== "1234") {
      setError("کد تایید اشتباه است. (راهنما: کد پیش‌فرض ۱۲۳۴ است)");
      return;
    }

    setStep("complete-profile");
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("لطفاً نام و ایمیل را وارد کنید.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const res = await completePhoneRegistration(phone, name.trim(), email.trim());
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setPhoneModalOpen(false);
          // reset form
          setPhone("");
          setCode("");
          setName("");
          setEmail("");
          setStep("phone");
          setSuccess(false);
        }, 1500);
      } else {
        setError(res.message || "خطایی در ثبت‌نام رخ داد.");
      }
    } catch (err) {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPhoneModalOpen(false);
    setError("");
    setStep("phone");
    setPhone("");
    setCode("");
    setName("");
    setEmail("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10 font-sans"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">ورود با شماره موبایل</h3>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">ورود با موفقیت انجام شد</h4>
              <p className="text-xs text-slate-400">خوش آمدید! در حال انتقال...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-600">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {step === "phone" ? (
                <div className="space-y-4">
                  {/* Google Login Section (Phase 1.2) */}
                  <div className="space-y-3">
                    <GoogleLoginButton />
                    <div className="flex items-center gap-3 my-4">
                      <div className="h-px bg-slate-100 flex-1" />
                      <span className="text-[11px] font-bold text-slate-400">یا</span>
                      <div className="h-px bg-slate-100 flex-1" />
                    </div>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">شماره موبایل</label>
                      <div className="relative">
                        <Phone className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="مثال: 09123456789"
                          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#6C47FF] focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/10 text-right font-medium"
                          required
                          disabled={sending}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        شماره موبایل خود را بدون صفر یا همراه با صفر وارد نمایید.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#6C47FF] hover:bg-[#5B3CE0] text-white text-xs font-bold py-3 rounded-xl transition shadow-md shadow-[#6C47FF]/10 flex items-center justify-center gap-1.5"
                      disabled={sending}
                    >
                      {sending ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "ارسال کد تایید"
                      )}
                    </button>
                  </form>
                </div>
              ) : step === "otp" ? (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">کد تایید ارسال شده</label>
                    <div className="relative">
                      <Key className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="کد پیش‌فرض ۱۲۳۴ است"
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#6C47FF] focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/10 text-center font-mono tracking-widest font-bold"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed text-right flex justify-between">
                      <span>کد به شماره {phone} ارسال شد.</span>
                      <button 
                        type="button" 
                        onClick={() => setStep("phone")}
                        className="text-[#6C47FF] font-bold hover:underline"
                      >
                        ویرایش شماره
                      </button>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#6C47FF] hover:bg-[#5B3CE0] text-white text-xs font-bold py-3 rounded-xl transition shadow-md shadow-[#6C47FF]/10"
                  >
                    تایید کد و ادامه
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteRegistration} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">نام و نام خانوادگی</label>
                    <div className="relative">
                      <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="نام خود را وارد کنید"
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#6C47FF] focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/10 text-right font-medium"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">ایمیل</label>
                    <div className="relative">
                      <Mail className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#6C47FF] focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/10 text-left font-medium"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#6C47FF] hover:bg-[#5B3CE0] text-white text-xs font-bold py-3 rounded-xl transition shadow-md shadow-[#6C47FF]/10 flex items-center justify-center gap-1.5"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "تکمیل ثبت‌نام"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

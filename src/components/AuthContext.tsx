import { normalizeHomepageChips, type HomepageChip } from '../lib/homepageChips';
import { normalizePromptCardTemplate, type PromptCardTemplate } from '../lib/promptCardTemplates';
import { normalizeHomepageSections, type HomepageSection } from '../lib/homepageSections';
import React, { createContext, useContext, useState, useEffect } from "react";
import { normalizeLogoAppearance, type LogoAppearance } from '../lib/logoAppearance';

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  avatar?: string | null;
  role: "super_admin" | "admin" | "user";
}

export interface PublicSettings {
  siteTitle: string;
  siteSubtitle: string;
  heroTitle: string;
  heroDescription: string;
  footerAbout: string;
  footerCopyright: string;
  siteLogo: string;
  logoAppearance: LogoAppearance;
  homepageSections: HomepageSection[];
  homepageChips: HomepageChip[];
  promptCardTemplate: PromptCardTemplate;
  aiTimeoutSeconds: number;
  isWebhookConfigured: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  siteTitle: string;
  branding: PublicSettings;
  googleClientId: string;
  setSiteTitle: (title: string) => void;
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string; cooldownSeconds?: number }>;
  verifyOtp: (phone: string, code: string) => Promise<{ success: boolean; message?: string; isNewUser?: boolean; user?: User }>;
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithPhoneMock: (phone: string, code: string) => Promise<boolean>;
  completePhoneRegistration: (phone: string, name: string, email?: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  updateProfile: (name: string, email?: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  assignUserRole: (targetIdentifier: string, newRole: "SUPER_ADMIN" | "ADMIN" | "USER") => Promise<{ success: boolean; message?: string; user?: any }>;
  logout: () => Promise<void>;
  isPhoneModalOpen: boolean;
  phoneModalContextMessage?: string;
  setPhoneModalOpen: (open: boolean, message?: string) => void;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  refetchBranding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [siteTitle, setSiteTitleState] = useState<string>("پرامپتی | Promty");
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState<boolean>(false);
  const [phoneModalContextMessage, setPhoneModalContextMessage] = useState<string | undefined>();
  const [branding, setBranding] = useState<PublicSettings>({
    siteTitle: "پرامپتی | Promty",
    siteSubtitle: "موتور شخصی‌سازی و پرامپت مهندسی",
    heroTitle: "قلب تپنده نوآوری با پرامپتی",
    heroDescription: "مرجع جستجو و شخصی‌سازی پرامپت. با جستجو، فیلترها، ابزارها، قالب‌های خروجی و دسته‌بندی‌های معنایی را با یک کلیک کاوش کنید.",
    footerAbout: "پرامپتی مرجع تخصصی مهندسی پرامپت و گراف دانش هوش مصنوعی در ایران است. ما به شما کمک می‌کنیم تا با دقیق‌ترین پرامپت‌ها، به بهترین نتایج دست یابید.",
    footerCopyright: "تمامی حقوق مادی و معنوی برای پرامپتی محفوظ است.",
    siteLogo: "",
    logoAppearance: normalizeLogoAppearance(),
    homepageSections: normalizeHomepageSections(),
    homepageChips: normalizeHomepageChips(),
    promptCardTemplate: normalizePromptCardTemplate(),
    aiTimeoutSeconds: 60,
    isWebhookConfigured: false,
  });

  const isAdmin = !!user && (user.role === "admin" || user.role === "super_admin");
  const isSuperAdmin = !!user && user.role === "super_admin";

  const setPhoneModalOpen = (open: boolean, message?: string) => {
    setIsPhoneModalOpen(open);
    setPhoneModalContextMessage(open ? message : undefined);
  };

  const fetchSiteTitleAndConfig = async () => {
    try {
      const resPub = await fetch("/api/settings/public");
      if (resPub.ok) {
        const data = await resPub.json();
        setBranding({
          siteTitle: data.siteTitle || "پرامپتی | Promty",
          siteSubtitle: data.siteSubtitle || "موتور شخصی‌سازی و پرامپت مهندسی",
          heroTitle: data.heroTitle || "قلب تپنده نوآوری با پرامپتی",
          heroDescription: data.heroDescription || "مرجع جستجو و شخصی‌سازی پرامپت. با جستجو، فیلترها، ابزارها، قالب‌های خروجی و دسته‌بندی‌های معنایی را با یک کلیک کاوش کنید.",
          footerAbout: data.footerAbout || "پرامپتی مرجع تخصصی مهندسی پرامپت و گراف دانش هوش مصنوعی در ایران است. ما به شما کمک می‌کنیم تا با دقیق‌ترین پرامپت‌ها، به بهترین نتایج دست یابید.",
          footerCopyright: data.footerCopyright || "تمامی حقوق مادی و معنوی برای پرامپتی محفوظ است.",
          siteLogo: data.siteLogo || "",
          logoAppearance: normalizeLogoAppearance(data.logoAppearance),
          homepageSections: normalizeHomepageSections(data.homepageSections),
          homepageChips: normalizeHomepageChips(data.homepageChips),
          promptCardTemplate: normalizePromptCardTemplate(data.promptCardTemplate),
          aiTimeoutSeconds: typeof data.aiTimeoutSeconds === "number" ? data.aiTimeoutSeconds : 60,
          isWebhookConfigured: !!data.isWebhookConfigured,
        });
        if (data.siteTitle) {
          setSiteTitleState(data.siteTitle);
        }
      }
      const resConf = await fetch("/api/config");
      if (resConf.ok) {
        const data = await resConf.json();
        if (data.googleClientId) {
          setGoogleClientId(data.googleClientId);
        }
      }
    } catch (e) {
      console.error("Failed to fetch public settings:", e);
    }
  };

  const refetchBranding = async () => {
    await fetchSiteTitleAndConfig();
  };

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          // Sync with legacy admin token if role is admin or super_admin
          if (data.user.role === "admin" || data.user.role === "super_admin") {
            localStorage.setItem("promty_admin_token", "active_jwt_session");
          } else {
            localStorage.removeItem("promty_admin_token");
          }
        } else {
          setUser(null);
          localStorage.removeItem("promty_admin_token");
        }
      } else {
        setUser(null);
        localStorage.removeItem("promty_admin_token");
      }
    } catch (e) {
      console.error("Auth me check failed:", e);
      setUser(null);
      localStorage.removeItem("promty_admin_token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteTitleAndConfig();
    refreshUser();
  }, []);

  const sendOtp = async (phone: string): Promise<{ success: boolean; message?: string; cooldownSeconds?: number }> => {
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message, cooldownSeconds: data.cooldownSeconds || 120 };
      }
      return {
        success: false,
        message: data.message || "خطا در ارسال کد تایید.",
        cooldownSeconds: data.remainingSeconds,
      };
    } catch (e: any) {
      console.error("sendOtp error:", e);
      return { success: false, message: "ارتباط با سرور پیامک برقرار نشد." };
    }
  };

  const verifyOtp = async (phone: string, code: string): Promise<{ success: boolean; message?: string; isNewUser?: boolean; user?: User }> => {
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        if (data.user.role === "admin" || data.user.role === "super_admin") {
          localStorage.setItem("promty_admin_token", "active_jwt_session");
        } else {
          localStorage.removeItem("promty_admin_token");
        }
        return { success: true, isNewUser: data.isNewUser, user: data.user };
      }
      return { success: false, message: data.message || "کد تایید اشتباه است یا منقضی شده است." };
    } catch (e: any) {
      console.error("verifyOtp error:", e);
      return { success: false, message: "ارتباط با سرور برقرار نشد." };
    }
  };

  const loginAsAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("promty_admin_token", "active_jwt_session");
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error("Login failed:", e);
      return false;
    }
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          if (data.user.role === "admin" || data.user.role === "super_admin") {
            localStorage.setItem("promty_admin_token", "active_jwt_session");
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error("Google Auth failed:", e);
      return false;
    }
  };

  const loginWithPhoneMock = async (phone: string, code: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/otp-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          if (data.user.role === "admin" || data.user.role === "super_admin") {
            localStorage.setItem("promty_admin_token", "active_jwt_session");
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error("OTP login failed:", e);
      return false;
    }
  };

  const completePhoneRegistration = async (phone: string, name: string, email?: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const res = await fetch("/api/auth/phone-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, email: email || "" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        if (data.user.role === "admin" || data.user.role === "super_admin") {
          localStorage.setItem("promty_admin_token", "active_jwt_session");
        }
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || "خطایی در ثبت‌نام رخ داد." };
    } catch (e) {
      console.error("Phone register failed:", e);
      return { success: false, message: "ارتباط با سرور برقرار نشد." };
    }
  };

  const assignUserRole = async (
    targetIdentifier: string,
    newRole: "SUPER_ADMIN" | "ADMIN" | "USER"
  ): Promise<{ success: boolean; message?: string; user?: any }> => {
    try {
      const res = await fetch("/api/admin/roles/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIdentifier, newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, message: data.message || "خطا در تغییر دسترسی کاربر." };
    } catch (e) {
      return { success: false, message: "ارتباط با سرور برقرار نشد." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout request failed:", e);
    }
    setUser(null);
    localStorage.removeItem("promty_admin_token");
  };

  const setSiteTitle = (title: string) => {
    setSiteTitleState(title);
  };

  const updateProfile = async (name: string, email?: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, message: data.message || "خطا در ویرایش پروفایل." };
    } catch (e) {
      console.error("updateProfile error:", e);
      return { success: false, message: "ارتباط با سرور برقرار نشد." };
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
        siteTitle,
        branding,
        googleClientId,
        setSiteTitle,
        sendOtp,
        verifyOtp,
        loginAsAdmin,
        loginWithGoogle,
        loginWithPhoneMock,
        completePhoneRegistration,
        updateProfile,
        assignUserRole,
        logout,
        isPhoneModalOpen,
        phoneModalContextMessage,
        setPhoneModalOpen,
        refreshUser,
        updateUser,
        refetchBranding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

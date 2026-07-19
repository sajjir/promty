import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar?: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  siteTitle: string;
  googleClientId: string;
  setSiteTitle: (title: string) => void;
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithPhoneMock: (phone: string, code: string) => Promise<boolean>;
  completePhoneRegistration: (phone: string, name: string, email: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => Promise<void>;
  isPhoneModalOpen: boolean;
  setPhoneModalOpen: (open: boolean) => void;
  refreshUser: () => Promise<void>;
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
  const [siteTitle, setSiteTitleState] = useState<string>("Promty.ir");
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [isPhoneModalOpen, setPhoneModalOpen] = useState<boolean>(false);

  const fetchSiteTitleAndConfig = async () => {
    try {
      const resPub = await fetch("/api/settings/public");
      if (resPub.ok) {
        const data = await resPub.json();
        if (data.siteTitle) {
          setSiteTitleState(data.siteTitle);
          document.title = data.siteTitle;
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

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          // Sync with legacy admin token if role is admin
          if (data.user.role === "admin") {
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

  const loginAsAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser({
            id: "admin_static",
            email: email,
            name: "مدیر سیستم",
            role: "admin",
          });
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
          if (data.user.role === "admin") {
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
          if (data.user.role === "admin") {
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

  const completePhoneRegistration = async (phone: string, name: string, email: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const res = await fetch("/api/auth/phone-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        if (data.user.role === "admin") {
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
    document.title = title;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        siteTitle,
        googleClientId,
        setSiteTitle,
        loginAsAdmin,
        loginWithGoogle,
        loginWithPhoneMock,
        completePhoneRegistration,
        logout,
        isPhoneModalOpen,
        setPhoneModalOpen,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

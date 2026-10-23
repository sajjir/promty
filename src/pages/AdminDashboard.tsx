import PromptCardTemplateControls from '../components/PromptCardTemplateControls';
import { normalizePromptCardTemplate, type PromptCardTemplate } from '../lib/promptCardTemplates';
import HomepageSectionsControls from '../components/HomepageSectionsControls';
import { normalizeHomepageSections, getHomepageSectionsError, type HomepageSection } from '../lib/homepageSections';
import Loader from "../components/Loader";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Prompt, Stats } from "../types";
import { useAuth } from "../components/AuthContext";
import {
  Plus, Trash2, Edit3, Eye, EyeOff, BarChart3, HelpCircle,
  LogOut, CheckCircle, Sparkles, Settings, Network,
  Tag, Layers, Sliders, Database, Key, Search, RefreshCw, X,
  ChevronRight, AlertCircle, HeartCrack, HelpCircle as HelpIcon,
  Check, Users, Shield, ShieldCheck, ShieldAlert, UserPlus, ArrowUpDown,
  Upload, Image as ImageIcon, FileText, CheckSquare, Square, Pencil, Trash
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LogoAppearanceControls from '../components/LogoAppearanceControls';
import { getLogoAppearanceError, normalizeLogoAppearance, type LogoAppearance } from '../lib/logoAppearance';

interface TaxonomyTerm {
  id: string;
  type: "intent" | "domain" | "tool" | "language" | "difficulty" | "outputFormat" | "fieldType";
  slug: string;
  titleEn: string;
  titleFa: string;
  descriptionFa?: string;
  descriptionEn?: string;
  popularity?: number;
  usageCount?: number;
}

interface Relationship {
  id: string;
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  relationType: string;
  confidenceScore: number;
  priority: number;
  weight: number;
}

interface AdminUserItem {
  id: string;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
  role: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [promptPage, setPromptPage] = useState(1);
  const { setSiteTitle, user, isSuperAdmin, assignUserRole, refetchBranding } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  useEffect(() => { setPromptPage(p => Math.min(p, Math.max(1, Math.ceil(prompts.length / 20)))); }, [prompts.length]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"prompts" | "taxonomies" | "graph" | "branding" | "ai" | "roles">("prompts");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Users & Role Delegation states
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleActionLoading, setRoleActionLoading] = useState<string | null>(null);
  const [roleStatusMessage, setRoleStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [directIdentifier, setDirectIdentifier] = useState("");
  const [directRole, setDirectRole] = useState<"ADMIN" | "USER" | "SUPER_ADMIN">("ADMIN");

  // Selection & Modal states for RBAC Overhaul
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserRole, setEditUserRole] = useState<"SUPER_ADMIN" | "ADMIN" | "USER">("USER");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUserItem | null>(null);
  const [bulkRoleModalOpen, setBulkRoleModalOpen] = useState(false);
  const [bulkTargetRole, setBulkTargetRole] = useState<"SUPER_ADMIN" | "ADMIN" | "USER">("USER");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [promptCardTemplate, setPromptCardTemplate] = useState<PromptCardTemplate>(() => normalizePromptCardTemplate());
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(() => normalizeHomepageSections());

  // Dedicated Branding state
  const [siteTitleLocal, setSiteTitleLocal] = useState("");
  const [siteSubtitleLocal, setSiteSubtitleLocal] = useState("");
  const [heroTitleLocal, setHeroTitleLocal] = useState("");
  const [heroDescriptionLocal, setHeroDescriptionLocal] = useState("");
  const [footerAboutLocal, setFooterAboutLocal] = useState("");
  const [footerCopyrightLocal, setFooterCopyrightLocal] = useState("");
  const [siteLogoLocal, setSiteLogoLocal] = useState("");
  const [logoAppearanceLocal, setLogoAppearanceLocal] = useState<LogoAppearance>(() => normalizeLogoAppearance());
  const [logoUploading, setLogoUploading] = useState(false);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Dedicated AI & Automation state
  const [n8nAnalyzeWebhook, setN8nAnalyzeWebhook] = useState("");
  const [n8nRefineWebhook, setN8nRefineWebhook] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [aiTimeoutSecondsLocal, setAiTimeoutSecondsLocal] = useState<number>(60);
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);
  const [aiSettingsSuccess, setAiSettingsSuccess] = useState<string | null>(null);
  const [aiSettingsError, setAiSettingsError] = useState<string | null>(null);

  // Taxonomy Tab States
  const [taxonomies, setTaxonomies] = useState<TaxonomyTerm[]>([]);
  const [selectedTaxonomyType, setSelectedTaxonomyType] = useState<string>("tool");
  const [newTaxType, setNewTaxType] = useState<string>("tool");
  const [newTaxSlug, setNewTaxSlug] = useState("");
  const [newTaxTitleEn, setNewTaxTitleEn] = useState("");
  const [newTaxTitleFa, setNewTaxTitleFa] = useState("");
  const [newTaxDescFa, setNewTaxDescFa] = useState("");
  const [taxActionLoading, setTaxActionLoading] = useState(false);
  const [taxSuccess, setTaxSuccess] = useState<string | null>(null);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);

  // Relationships Graph Tab States
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relSourceId, setRelSourceId] = useState("");
  const [relSourceType, setRelSourceType] = useState("Prompt");
  const [relTargetId, setRelTargetId] = useState("");
  const [relTargetType, setRelTargetType] = useState("TaxonomyTerm");
  const [relType, setRelType] = useState("Prompt_To_Tool");
  const [relConfidence, setRelConfidence] = useState("1.0");
  const [relPriority, setRelPriority] = useState("0");
  const [relWeight, setRelWeight] = useState("1.0");
  const [graphActionLoading, setGraphActionLoading] = useState(false);
  const [graphSuccess, setGraphSuccess] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("promty_admin_token");

  // Authentication Guard
  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  // Fetch core Dashboard, Settings, Taxonomies, and Relationships
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await fetch("/api/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.status === 403) {
        localStorage.removeItem("promty_admin_token");
        navigate("/admin/login");
        return;
      }
      const statsData = await statsRes.json();

      // Fetch ALL prompts (including inactive)
      const promptsList: Prompt[] = [];
      let promptsData: any = {};
      for (let page = 1; ; page++) {
        const promptsRes = await fetch(`/api/prompts?page=${page}&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!promptsRes.ok) throw new Error("دریافت فهرست مدیریت ناموفق بود");
        promptsData = await promptsRes.json();
        const batch = promptsData.data || [];
        promptsList.push(...batch);
        if (!batch.length || promptsList.length >= (promptsData.pagination?.total || 0)) break;
      }
      setPrompts(promptsList);

      if (promptsData.pagination && typeof promptsData.pagination.total === "number") {
        statsData.totalPrompts = promptsData.pagination.total;
      } else if (promptsList.length > 0) {
        statsData.totalPrompts = promptsList.length;
      }
      setStats(statsData);

      // Fetch network settings
      const settingsRes = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const s = settingsData.settings || {};
        setN8nAnalyzeWebhook(s.n8nAnalyzeWebhook || "");
        setN8nRefineWebhook(s.n8nRefineWebhook || s.n8nWebhookUrl || "");
        setGeminiApiKey(s.geminiApiKey || "");
        setOpenaiApiKey(s.openaiApiKey || "");
        setAiTimeoutSecondsLocal(typeof s.aiTimeoutSeconds === "number" ? s.aiTimeoutSeconds : 60);

        setSiteTitleLocal(s.siteTitle || "پرامپتی | Promty");
        setSiteSubtitleLocal(s.siteSubtitle || "موتور شخصی‌سازی و پرامپت مهندسی");
        setHeroTitleLocal(s.heroTitle || "قلب تپنده نوآوری با پرامپتی");
        setHeroDescriptionLocal(s.heroDescription || "");
        setFooterAboutLocal(s.footerAbout || "");
        setFooterCopyrightLocal(s.footerCopyright || "");
        setSiteLogoLocal(s.siteLogo || "");
        setLogoAppearanceLocal(normalizeLogoAppearance(s.logoAppearance));
        setHomepageSections(normalizeHomepageSections(s.homepageSections));
        setPromptCardTemplate(normalizePromptCardTemplate(s.promptCardTemplate));
      }

      // Fetch Taxonomy Terms
      const taxRes = await fetch("/api/taxonomies", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (taxRes.ok) {
        const taxData = await taxRes.json();
        setTaxonomies(taxData.terms || []);
      }

      // Fetch Relationships
      const relRes = await fetch("/api/relationships", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (relRes.ok) {
        const relData = await relRes.json();
        setRelationships(relData.relationships || []);
      }

      // Fetch users list for RBAC
      await fetchUsers();

    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsersList(data.users || []);
        }
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (targetIdentifier: string, newRole: "SUPER_ADMIN" | "ADMIN" | "USER") => {
    if (!isSuperAdmin) {
      alert("تنها مدیر ارشد سیستم (SUPER_ADMIN) مجاز به تغییر سطح دسترسی کاربران است.");
      return;
    }
    setRoleActionLoading(targetIdentifier);
    setRoleStatusMessage(null);
    try {
      const res = await assignUserRole(targetIdentifier, newRole);
      if (res.success) {
        setRoleStatusMessage({ type: "success", text: res.message || "نقش کاربر با موفقیت به روز شد." });
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === targetIdentifier || u.phone === targetIdentifier || u.email === targetIdentifier
              ? { ...u, role: newRole.toLowerCase() }
              : u
          )
        );
      } else {
        setRoleStatusMessage({ type: "error", text: res.message || "خطا در تغییر نقش کاربر." });
      }
    } catch (e) {
      setRoleStatusMessage({ type: "error", text: "ارتباط با سرور برقرار نشد." });
    } finally {
      setRoleActionLoading(null);
    }
  };

  const handleDirectRoleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directIdentifier.trim()) {
      setRoleStatusMessage({ type: "error", text: "لطفاً شماره موبایل، ایمیل یا شناسه کاربر را وارد کنید." });
      return;
    }
    await handleRoleChange(directIdentifier.trim(), directRole);
    setDirectIdentifier("");
  };

  // User Row Actions & Modals
  const handleOpenEditUser = (u: AdminUserItem) => {
    setEditingUser(u);
    setEditUserName(u.name || "");
    setEditUserEmail(u.email || "");
    setEditUserPhone(u.phone || "");
    const r = u.role.toUpperCase();
    setEditUserRole(r === "SUPER_ADMIN" ? "SUPER_ADMIN" : r === "ADMIN" ? "ADMIN" : "USER");
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setBulkActionLoading(true);
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editUserName.trim(),
          email: editUserEmail.trim() || null,
          phone: editUserPhone.trim() || undefined,
          role: editUserRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoleStatusMessage({ type: "success", text: data.message || "اطلاعات کاربر با موفقیت ویرایش شد." });
        setUsersList((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...data.user } : u))
        );
        setEditingUser(null);
      } else {
        alert(data.message || "خطا در ویرایش اطلاعات کاربر.");
      }
    } catch (err) {
      alert("خطا در برقراری ارتباط با سرور.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      setBulkActionLoading(true);
      const res = await fetch(`/api/admin/users/${deleteConfirmUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRoleStatusMessage({ type: "success", text: data.message || "کاربر با موفقیت حذف شد." });
        setUsersList((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
        setSelectedUserIds((prev) => prev.filter((id) => id !== deleteConfirmUser.id));
        setDeleteConfirmUser(null);
      } else {
        alert(data.message || "خطا در حذف کاربر.");
      }
    } catch (err) {
      alert("خطا در برقراری ارتباط با سرور.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleToggleSelectAll = (filteredIds: string[]) => {
    if (selectedUserIds.length === filteredIds.length && filteredIds.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredIds);
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`آیا از حذف دسته‌جمعی ${selectedUserIds.length} کاربر انتخاب‌شده اطمینان دارید؟ این عمل غیرقابل بازگشت است.`)) {
      return;
    }
    try {
      setBulkActionLoading(true);
      const res = await fetch("/api/admin/users/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedUserIds }),
      });
      const data = await res.json();
      if (data.success) {
        setRoleStatusMessage({ type: "success", text: data.message || "کاربران با موفقیت حذف شدند." });
        setUsersList((prev) => prev.filter((u) => !selectedUserIds.includes(u.id)));
        setSelectedUserIds([]);
      } else {
        alert(data.message || "خطا در حذف کاربران.");
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRoleChange = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      const res = await fetch("/api/admin/users/bulk-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedUserIds, role: bulkTargetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setRoleStatusMessage({ type: "success", text: data.message || "نقش کاربران با موفقیت تغییر یافت." });
        setUsersList((prev) =>
          prev.map((u) =>
            selectedUserIds.includes(u.id) ? { ...u, role: bulkTargetRole.toLowerCase() } : u
          )
        );
        setSelectedUserIds([]);
        setBulkRoleModalOpen(false);
      } else {
        alert(data.message || "خطا در تغییر نقش دسته‌جمعی.");
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("promty_admin_token");
    navigate("/admin/login");
  };

  // Toggle Prompt Active state
  const handleToggleActive = async (promptId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      setActionLoading(promptId);
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, isActive: !currentStatus } : p));
      }
    } catch (error) {
      console.error("Error toggling active state:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Prompt
  const handleDeletePrompt = async (promptId: string) => {
    if (!window.confirm("آیا از حذف این پرامپت اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) return;
    if (!token) return;

    try {
      setActionLoading(promptId);
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setPrompts(prev => prev.filter(p => p.id !== promptId));
        // Refresh stats
        const statsRes = await fetch("/api/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Save Branding Settings
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const sectionsError = getHomepageSectionsError(homepageSections);
    if (sectionsError) { setBrandingError(sectionsError); return; }
    const logoError = getLogoAppearanceError(logoAppearanceLocal);
    if (logoError) { setBrandingError(logoError); return; }
    try {
      setBrandingLoading(true);
      setBrandingSuccess(null);
      setBrandingError(null);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          siteTitle: siteTitleLocal,
          siteSubtitle: siteSubtitleLocal,
          heroTitle: heroTitleLocal,
          heroDescription: heroDescriptionLocal,
          footerAbout: footerAboutLocal,
          footerCopyright: footerCopyrightLocal,
          siteLogo: siteLogoLocal,
          logoAppearance: logoAppearanceLocal,
          homepageSections,
          promptCardTemplate,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBrandingSuccess("تنظیمات هویت بصری و برندینگ با موفقیت ذخیره شد.");
        setSiteTitle(siteTitleLocal);
        await refetchBranding();
      } else {
        setBrandingError(data.message || "خطا در ذخیره تنظیمات برندینگ.");
      }
    } catch (err: any) {
      setBrandingError("خطا در برقراری ارتباط با سرور: " + err.message);
    } finally {
      setBrandingLoading(false);
    }
  };

  const handleSaveLogoAppearance = async () => {
    const error = getLogoAppearanceError(logoAppearanceLocal);
    if (error) { setBrandingError(error); return; }
    setBrandingLoading(true);
    setBrandingSuccess(null);
    setBrandingError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ logoAppearance: logoAppearanceLocal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'ذخیره تنظیمات لوگو ناموفق بود.');
      await refetchBranding();
      setBrandingSuccess('تنظیمات اندازه و جلوه لوگو ذخیره و روی سایت اعمال شد.');
    } catch (error: any) {
      setBrandingError(error.message || 'ارتباط با سرور برقرار نشد.');
    } finally {
      setBrandingLoading(false);
    }
  };

  // Upload Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      setLogoUploading(true);
      setBrandingSuccess(null);
      setBrandingError(null);

      const res = await fetch("/api/admin/settings/logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSiteLogoLocal(data.siteLogo);
        setBrandingSuccess("لوگوی اختصاصی پلتفرم با موفقیت آپلود و ذخیره شد.");
        await refetchBranding();
      } else {
        setBrandingError(data.message || "خطا در بارگذاری لوگو.");
      }
    } catch (err: any) {
      setBrandingError("خطا در ارسال فایل لوگو: " + err.message);
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // Save AI Settings
  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setAiSettingsLoading(true);
      setAiSettingsSuccess(null);
      setAiSettingsError(null);

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          n8nAnalyzeWebhook,
          n8nRefineWebhook,
          geminiApiKey,
          openaiApiKey,
          aiTimeoutSeconds: aiTimeoutSecondsLocal,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiSettingsSuccess("تنظیمات وب‌هوک و هوش مصنوعی با موفقیت به‌روزرسانی شد.");
      } else {
        setAiSettingsError(data.message || "خطا در ذخیره تنظیمات هوش مصنوعی.");
      }
    } catch (err) {
      setAiSettingsError("ارتباط با سرویس هوش مصنوعی برقرار نشد.");
    } finally {
      setAiSettingsLoading(false);
    }
  };

  // Create or Update Taxonomy Term
  const handleCreateTaxonomy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setTaxActionLoading(true);
      setTaxSuccess(null);
      setTaxError(null);

      const payload = {
        type: newTaxType,
        slug: newTaxSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        titleEn: newTaxTitleEn.trim(),
        titleFa: newTaxTitleFa.trim(),
        descriptionFa: newTaxDescFa.trim()
      };

      const url = editingTaxId ? `/api/taxonomies/${editingTaxId}` : "/api/taxonomies";
      const method = editingTaxId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTaxSuccess(editingTaxId ? `تاکسونومی "${newTaxTitleFa}" با موفقیت ویرایش شد.` : `تاکسونومی جدید "${newTaxTitleFa}" با موفقیت ذخیره شد.`);
        setNewTaxSlug("");
        setNewTaxTitleEn("");
        setNewTaxTitleFa("");
        setNewTaxDescFa("");
        setEditingTaxId(null);

        // Refresh taxonomy terms list
        const taxRes = await fetch("/api/taxonomies", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (taxRes.ok) {
          const taxData = await taxRes.json();
          setTaxonomies(taxData.terms || []);
        }
      } else {
        setTaxError(data.message || "خطا در ساخت/ویرایش فیلد معنایی.");
      }
    } catch (err) {
      setTaxError("پاسخی از سرور دریافت نشد.");
    } finally {
      setTaxActionLoading(false);
    }
  };

  const handleEditTaxonomyStart = (term: TaxonomyTerm) => {
    setEditingTaxId(term.id);
    setNewTaxType(term.type);
    setNewTaxSlug(term.slug);
    setNewTaxTitleEn(term.titleEn);
    setNewTaxTitleFa(term.titleFa);
    setNewTaxDescFa(term.descriptionFa || "");
  };

  const handleCancelEditTaxonomy = () => {
    setEditingTaxId(null);
    setNewTaxSlug("");
    setNewTaxTitleEn("");
    setNewTaxTitleFa("");
    setNewTaxDescFa("");
  };

  // Delete Taxonomy Term
  const handleDeleteTaxonomy = async (id: string) => {
    if (!window.confirm("آیا از حذف این فیلد معنایی (تاکسونومی) مطمئن هستید؟")) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/taxonomies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTaxonomies(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete taxonomy term:", err);
    }
  };

  // Create Relationship Graph Link
  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!relSourceId || !relTargetId) {
      setGraphError("شناسه مبدا و مقصد اجباری است.");
      return;
    }

    try {
      setGraphActionLoading(true);
      setGraphSuccess(null);
      setGraphError(null);

      const res = await fetch("/api/relationships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceId: relSourceId,
          sourceType: relSourceType,
          targetId: relTargetId,
          targetType: relTargetType,
          relationType: relType,
          confidenceScore: Number(relConfidence),
          priority: Number(relPriority),
          weight: Number(relWeight)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGraphSuccess("رابطه گراف دانش جدید با موفقیت ایجاد و تثبیت شد.");
        setRelSourceId("");
        setRelTargetId("");

        // Refresh relationships
        const relRes = await fetch("/api/relationships", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelationships(relData.relationships || []);
        }
      } else {
        setGraphError(data.message || "خطا در ایجاد رابطه معنایی.");
      }
    } catch (err) {
      setGraphError("برقراری ارتباط با وب‌سرویس شکست خورد.");
    } finally {
      setGraphActionLoading(false);
    }
  };

  // Delete Relationship Graph Link
  const handleDeleteRelationship = async (id: string) => {
    if (!window.confirm("آیا مایل به حذف این ارتباط در گراف دانش هستید؟")) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/relationships/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRelationships(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete relationship link:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted">
        <Loader className="w-8 h-8 text-brand" />
        <p className="text-xs font-semibold">در حال بارگذاری ایمن مرکز کنترل ادمین...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-right" dir="rtl">

      {/* Top Banner Control Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface p-6 border border-line rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-primary flex items-center gap-2">
            <span>🛡️</span>
            <span>مرکز کنترل و مدیریت Promty.ir</span>
          </h1>
          <p className="text-xs text-muted">سیستم مدیریت متمرکز پرامپت‌ها، تاکسونومی‌های پویا و گراف دانش پلتفرم بدون نیاز به تغییر کد</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 border border-danger-text hover:bg-danger-soft text-danger-text rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>خروج از ادمین</span>
          </button>

          <Link
            id="create-new-prompt-btn"
            to="/admin/prompts/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-solid hover:bg-brand-solid text-white rounded-xl text-xs font-bold shadow-md shadow-brand/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن پرامپت جدید</span>
          </Link>
        </div>
      </div>

      {/* Stats Board Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 border border-line rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-brand-solid/10 text-brand rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-muted block mb-1">تعداد کل پرامپت‌ها</span>
              <span className="text-2xl font-black text-primary font-mono">{stats.totalPrompts}</span>
            </div>
          </div>

          <div className="bg-surface p-6 border border-line rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 text-success-text rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-muted block mb-1">دفعات کپی و استفاده</span>
              <span className="text-2xl font-black text-primary font-mono">{stats.totalUsages}</span>
            </div>
          </div>

          <div className="bg-surface p-6 border border-line rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-amber-500/10 text-caution-text rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-muted block mb-1">برترین پرامپت آرشیو</span>
              <span className="text-xs font-black text-primary block truncate max-w-[200px]" title={stats.mostPopular}>
                {stats.mostPopular}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Command Center Tabs */}
      <div className="flex border-b border-line gap-1 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab("prompts")}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "prompts"
              ? "border-brand text-brand bg-brand-solid/5"
              : "border-transparent text-muted hover:text-primary hover:bg-surface-soft"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>۱. مدیریت پرامپت‌ها</span>
        </button>

        <button
          onClick={() => setActiveTab("taxonomies")}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "taxonomies"
              ? "border-brand text-brand bg-brand-solid/5"
              : "border-transparent text-muted hover:text-primary hover:bg-surface-soft"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>۲. طبقه‌بندی هوشمند (Taxonomy)</span>
        </button>

        <button
          onClick={() => setActiveTab("graph")}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "graph"
              ? "border-brand text-brand bg-brand-solid/5"
              : "border-transparent text-muted hover:text-primary hover:bg-surface-soft"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>۳. گراف روابط (Knowledge Graph)</span>
        </button>

        <button
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "branding"
              ? "border-brand text-brand bg-brand-solid/5"
              : "border-transparent text-muted hover:text-primary hover:bg-surface-soft"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>۴. برندینگ و ظاهر سایت</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "ai"
              ? "border-brand text-brand bg-brand-solid/5"
              : "border-transparent text-muted hover:text-primary hover:bg-surface-soft"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>۵. موتور هوش مصنوعی و اتوماسیون</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("roles");
            fetchUsers();
          }}
          className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === "roles"
              ? "border-brand text-brand bg-brand-solid/5"
              : "border-transparent text-muted hover:text-primary hover:bg-surface-soft"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>۶. مدیریت کاربران و دسترسی‌ها (RBAC)</span>
          {isSuperAdmin && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/15 text-caution-text border border-caution-text font-black">
              مدیر کل
            </span>
          )}
        </button>
      </div>

      {/* Main Tab Contents */}
      <div className="bg-surface border border-line rounded-3xl p-6 shadow-sm">
        <AnimatePresence mode="wait">

          {/* TAB 1: Prompts Listing */}
          {activeTab === "prompts" && (
            <motion.div
              key="prompts-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-primary">آرشیو جامع پرامپت‌ها</h3>
                  <p className="text-xs text-muted">لیست کامل پرامپت‌های مهندسی‌شده همراه با فیلتر سریع فعال/غیرفعال</p>
                </div>
                <Link
                  to="/admin/prompts/new"
                  className="flex items-center gap-1 bg-surface-soft hover:bg-surface-inset text-brand font-bold text-xs py-2 px-4 rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>پرامپت جدید</span>
                </Link>
              </div>

              {prompts.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-sm text-right text-secondary font-sans">
                    <thead className="bg-surface-soft text-muted text-xs font-bold border-b border-line">
                      <tr>
                        <th scope="col" className="px-6 py-4">عنوان پرامپت</th>
                        <th scope="col" className="px-6 py-4">ابزار اصلی / موضوع</th>
                        <th scope="col" className="px-6 py-4">سطح کاربری</th>
                        <th scope="col" className="px-6 py-4">میزان استفاده</th>
                        <th scope="col" className="px-6 py-4">وضعیت انتشار</th>
                        <th scope="col" className="px-6 py-4 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {prompts.slice((promptPage - 1) * 20, promptPage * 20).map((p) => (
                        <tr key={p.id} className="hover:bg-surface-soft transition duration-150">
                          <td className="px-6 py-4 font-bold text-primary max-w-sm">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[200px]">{p.title}</span>
                              {p.id.startsWith("p_contrib_") && !p.isActive && (
                                <span className="bg-caution-soft text-caution-text text-[10px] font-black px-2 py-0.5 rounded-full border border-caution-text animate-pulse shrink-0">
                                  مشارکت در انتظار تایید 📬
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-muted">
                            {(p.tools && p.tools.length > 0 ? p.tools.join("، ") : null) || (p.domains && p.domains.length > 0 ? p.domains.join("، ") : null) || (p as any).category || "عمومی"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-surface-soft text-secondary font-black px-2 py-0.5 rounded">
                              {p.difficulty || "Beginner"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">{p.usageCount || 0} استفاده</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleActive(p.id, p.isActive)}
                              disabled={actionLoading === p.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                                p.isActive
                                  ? "bg-success-soft text-success-text hover:bg-success-soft"
                                  : "bg-surface-soft text-muted hover:bg-surface-inset"
                              }`}
                            >
                              {p.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              <span>{p.isActive ? "فعال" : "غیرفعال"}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/prompts/${p.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`نمایش ${p.title} در تب جدید`}
                                className="p-1 px-2.5 text-brand hover:bg-brand-soft border border-brand rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>نمایش</span>
                              </Link>
                              <Link
                                to={`/admin/prompts/${p.id}/edit`}
                                className="p-1 px-2.5 text-info-text hover:bg-info-soft border border-info-text rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>ویرایش</span>
                              </Link>
                              <button
                                onClick={() => handleDeletePrompt(p.id)}
                                disabled={actionLoading === p.id}
                                className="p-1 px-2.5 text-danger-text hover:bg-danger-soft border border-danger-text rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <nav aria-label="صفحه‌بندی مدیریت پرامپت‌ها" className="flex items-center justify-between gap-3 p-4">
                    <button disabled={promptPage <= 1} onClick={() => setPromptPage(p => p - 1)}>صفحه قبل</button>
                    <span>صفحه {promptPage} از {Math.max(1, Math.ceil(prompts.length / 20))}</span>
                    <button disabled={promptPage * 20 >= prompts.length} onClick={() => setPromptPage(p => p + 1)}>صفحه بعد</button>
                  </nav>
                </div>
              ) : (
                <div className="p-12 text-center text-muted bg-surface-soft rounded-2xl border border-dashed border-line">
                  <Database className="w-8 h-8 mx-auto text-muted mb-2" />
                  <p className="text-sm font-bold text-secondary">هنوز هیچ پرامپتی اضافه نکرده‌اید.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: Taxonomy Management */}
          {activeTab === "taxonomies" && (
            <motion.div
              key="taxonomies-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-base font-black text-primary">۲. مدیریت تاکسونومی‌ها و فیلدهای هوشمند معنایی</h3>
                <p className="text-xs text-muted">تاکسونومی‌ها ساختارهای اصلی طبقه‌بندی پلتفرم هستند که موتور جستجو بر پایه آن‌ها الگوها را می‌فهمد.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Taxonomy Creator Form */}
                <div className="bg-surface-soft/50 p-5 rounded-2xl border border-line space-y-4">
                  <h4 className="text-xs font-extrabold text-primary flex items-center gap-1 bg-surface px-3 py-1.5 rounded-lg border border-line inline-block">
                    <Plus className="w-3.5 h-3.5 text-brand" />
                    <span>{editingTaxId ? "ویرایش فیلد معنایی (تاکسونومی)" : "ایجاد فیلد معنایی (تاکسونومی) جدید"}</span>
                  </h4>

                  <form onSubmit={handleCreateTaxonomy} className="space-y-4 text-right">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted">نوع تاکسونومی (Type)</label>
                      <select
                        value={newTaxType}
                        onChange={(e) => setNewTaxType(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-surface border border-line rounded-xl focus:border-brand outline-none text-right font-semibold"
                      >
                        <option value="intent">Intent (قصد/هدف)</option>
                        <option value="domain">Domain (حوزه کاری)</option>
                        <option value="tool">Tool (ابزار هوش مصنوعی)</option>
                        <option value="language">Language (زبان)</option>
                        <option value="difficulty">Difficulty (سطوح سختی)</option>
                        <option value="outputFormat">Output Format (قالب خروجی)</option>
                        <option value="fieldType">Field Type (نوع اینپوت)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted">اسلاگ یکتا (Slug - انگلیسی بدون فاصله)</label>
                      <input
                        type="text"
                        placeholder="e.g. video-editing"
                        value={newTaxSlug}
                        onChange={(e) => setNewTaxSlug(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-surface border border-line rounded-xl focus:border-brand outline-none text-left font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted">عنوان انگلیسی (Title English)</label>
                      <input
                        type="text"
                        placeholder="e.g. Video Editing"
                        value={newTaxTitleEn}
                        onChange={(e) => setNewTaxTitleEn(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-surface border border-line rounded-xl focus:border-brand outline-none text-left"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted">عنوان فارسی (توضیح برای کاربر)</label>
                      <input
                        type="text"
                        placeholder="مثال: تدوین ویدیو"
                        value={newTaxTitleFa}
                        onChange={(e) => setNewTaxTitleFa(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-surface border border-line rounded-xl focus:border-brand outline-none text-right"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted">توضیحات فارسی (اختیاری)</label>
                      <textarea
                        rows={2}
                        placeholder="توضیح مختصری درباره کارایی این فیلد..."
                        value={newTaxDescFa}
                        onChange={(e) => setNewTaxDescFa(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-surface border border-line rounded-xl focus:border-brand outline-none text-right"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={taxActionLoading}
                        className="flex-1 py-2.5 bg-brand-solid hover:bg-brand-solid disabled:bg-surface-inset text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        {taxActionLoading ? <Loader className="w-3.5 h-3.5" /> : <span>{editingTaxId ? "اعمال تغییرات ✍️" : "ذخیره فیلد معنایی 📂"}</span>}
                      </button>

                      {editingTaxId && (
                        <button
                          type="button"
                          onClick={handleCancelEditTaxonomy}
                          className="py-2.5 px-4 bg-surface-inset hover:bg-surface-inset text-primary font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          انصراف
                        </button>
                      )}
                    </div>

                    {taxSuccess && (
                      <div className="p-3 bg-success-soft text-success-text text-xs font-bold rounded-xl border border-success-text flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-success-text shrink-0" />
                        <span>{taxSuccess}</span>
                      </div>
                    )}

                    {taxError && (
                      <div className="p-3 bg-danger-soft text-danger-text text-xs font-bold rounded-xl border border-danger-text">
                        <span>⚠️ {taxError}</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Taxonomy Viewer & Editor */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">فیلتر لیست طبقه‌بندی فعال:</span>
                    <select
                      value={selectedTaxonomyType}
                      onChange={(e) => setSelectedTaxonomyType(e.target.value)}
                      className="text-xs bg-surface-soft border border-line rounded-lg py-1 px-3 font-semibold outline-none focus:border-brand"
                    >
                      <option value="intent">Intent (اهداف)</option>
                      <option value="domain">Domain (حوزه‌ها)</option>
                      <option value="tool">Tool (ابزارها)</option>
                      <option value="language">Language (زبان‌ها)</option>
                      <option value="difficulty">Difficulty (سطوح سختی)</option>
                      <option value="outputFormat">Output Format (خروجی‌ها)</option>
                      <option value="fieldType">Field Type (ورودی‌ها)</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-sm text-right text-secondary font-sans">
                      <thead className="bg-surface-soft text-muted text-xs font-bold border-b border-line">
                        <tr>
                          <th scope="col" className="px-6 py-3">عنوان فارسی</th>
                          <th scope="col" className="px-6 py-3">عنوان انگلیسی</th>
                          <th scope="col" className="px-6 py-3">اسلاگ سیستم</th>
                          <th scope="col" className="px-6 py-3 text-left">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-xs">
                        {taxonomies.filter(t => t.type === selectedTaxonomyType).map((t) => (
                          <tr key={t.id} className="hover:bg-surface-soft">
                            <td className="px-6 py-3 font-bold text-primary">{t.titleFa}</td>
                            <td className="px-6 py-3 font-medium text-secondary">{t.titleEn}</td>
                            <td className="px-6 py-3 font-mono text-muted">{t.slug}</td>
                            <td className="px-6 py-3 text-left">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditTaxonomyStart(t)}
                                  className="p-1 px-2.5 border border-info-text text-info-text hover:bg-info-soft rounded-lg font-bold transition cursor-pointer"
                                >
                                  ویرایش
                                </button>
                                <button
                                  onClick={() => handleDeleteTaxonomy(t.id)}
                                  className="p-1 px-2.5 border border-danger-text text-danger-text hover:bg-danger-soft rounded-lg font-bold transition cursor-pointer"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {taxonomies.filter(t => t.type === selectedTaxonomyType).length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-muted">هیچ عنصری در این دسته‌بندی یافت نشد.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Knowledge Graph Links */}
          {activeTab === "graph" && (
            <motion.div
              key="graph-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-base font-black text-primary">۳. مهندسی روابط و گراف دانش (Knowledge Graph Expansion)</h3>
                <p className="text-xs text-muted">در گراف دانش پرامپتی، پرامپت‌ها دیگر جزیره‌های جدا افتاده نیستند! ارتباط دادن پرامپت به ابزارها، اهداف و سایر پرامپت‌ها باعث بهبود هوش جستجو و معرفی پرامپت‌های مکمل می‌شود.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Link Form */}
                <div className="bg-surface-soft/50 p-5 rounded-2xl border border-line space-y-4">
                  <h4 className="text-xs font-extrabold text-primary flex items-center gap-1 bg-surface px-3 py-1.5 rounded-lg border border-line inline-block">
                    <Network className="w-3.5 h-3.5 text-brand" />
                    <span>ایجاد ارتباط معنایی در گراف</span>
                  </h4>

                  <form onSubmit={handleCreateRelationship} className="space-y-4 text-right">

                    {/* Source selection */}
                    <div className="space-y-3 p-3 bg-surface rounded-xl border border-line">
                      <span className="text-[10px] text-brand font-bold block">مرحله اول: انتخاب مبدا (Source)</span>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted font-bold block">نوع مبدا</label>
                          <select
                            value={relSourceType}
                            onChange={(e) => { setRelSourceType(e.target.value); setRelSourceId(""); }}
                            className="w-full text-xs py-1.5 px-2 bg-surface-soft border border-line rounded-lg outline-none"
                          >
                            <option value="Prompt">پرامپت</option>
                            <option value="TaxonomyTerm">تاکسونومی</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-muted font-bold block">انتخاب عنصر</label>
                          <select
                            value={relSourceId}
                            onChange={(e) => setRelSourceId(e.target.value)}
                            className="w-full text-xs py-1.5 px-2 bg-surface-soft border border-line rounded-lg outline-none"
                            required
                          >
                            <option value="">انتخاب کنید...</option>
                            {relSourceType === "Prompt"
                              ? prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
                              : taxonomies.map(t => <option key={t.id} value={t.id}>{t.titleFa} ({t.type})</option>)
                            }
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Target selection */}
                    <div className="space-y-3 p-3 bg-surface rounded-xl border border-line">
                      <span className="text-[10px] text-success-text font-bold block">مرحله دوم: انتخاب مقصد (Target)</span>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted font-bold block">نوع مقصد</label>
                          <select
                            value={relTargetType}
                            onChange={(e) => { setRelTargetType(e.target.value); setRelTargetId(""); }}
                            className="w-full text-xs py-1.5 px-2 bg-surface-soft border border-line rounded-lg outline-none"
                          >
                            <option value="TaxonomyTerm">تاکسونومی</option>
                            <option value="Prompt">پرامپت</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-muted font-bold block">انتخاب عنصر</label>
                          <select
                            value={relTargetId}
                            onChange={(e) => setRelTargetId(e.target.value)}
                            className="w-full text-xs py-1.5 px-2 bg-surface-soft border border-line rounded-lg outline-none"
                            required
                          >
                            <option value="">انتخاب کنید...</option>
                            {relTargetType === "Prompt"
                              ? prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
                              : taxonomies.map(t => <option key={t.id} value={t.id}>{t.titleFa} ({t.type})</option>)
                            }
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Relation metadata */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted">نوع رابطه (Relationship Type)</label>
                      <select
                        value={relType}
                        onChange={(e) => setRelType(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-surface border border-line rounded-xl focus:border-brand outline-none"
                      >
                        <option value="Prompt_To_Tool">Prompt_To_Tool (پرامپت به ابزار)</option>
                        <option value="Prompt_To_Intent">Prompt_To_Intent (پرامپت به قصد)</option>
                        <option value="Prompt_To_Prompt">Prompt_To_Prompt (همبستگی دو پرامپت)</option>
                        <option value="Intent_To_Task">Intent_To_Task (قصد به تسک)</option>
                        <option value="Task_To_Tool">Task_To_Tool (تسک به ابزار)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted font-bold">میزان اطمینان</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={relConfidence}
                          onChange={(e) => setRelConfidence(e.target.value)}
                          className="w-full text-xs py-1.5 px-2 bg-surface border border-line rounded-lg text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted font-bold">وزن تعامل (Weight)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={relWeight}
                          onChange={(e) => setRelWeight(e.target.value)}
                          className="w-full text-xs py-1.5 px-2 bg-surface border border-line rounded-lg text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted font-bold">اولویت (Priority)</label>
                        <input
                          type="number"
                          value={relPriority}
                          onChange={(e) => setRelPriority(e.target.value)}
                          className="w-full text-xs py-1.5 px-2 bg-surface border border-line rounded-lg text-center"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={graphActionLoading}
                      className="w-full py-2.5 bg-brand-solid hover:bg-brand-solid disabled:bg-surface-inset text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
                    >
                      {graphActionLoading ? <Loader className="w-3.5 h-3.5" /> : <span>تثبیت ارتباط در گراف 🔀</span>}
                    </button>

                    {graphSuccess && (
                      <div className="p-3 bg-success-soft text-success-text text-xs font-bold rounded-xl border border-success-text flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-success-text shrink-0" />
                        <span>{graphSuccess}</span>
                      </div>
                    )}

                    {graphError && (
                      <div className="p-3 bg-danger-soft text-danger-text text-xs font-bold rounded-xl border border-danger-text">
                        <span>⚠️ {graphError}</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Relationships list */}
                <div className="lg:col-span-2 space-y-4">
                  <span className="text-xs font-bold text-muted">فهرست پیوندهای گراف دانش فعال ({relationships.length}):</span>

                  <div className="overflow-x-auto rounded-xl border border-line max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm text-right text-secondary font-sans">
                      <thead className="bg-surface-soft text-muted text-xs font-bold border-b border-line sticky top-0">
                        <tr>
                          <th scope="col" className="px-6 py-3">مبدا (Source)</th>
                          <th scope="col" className="px-6 py-3">نوع رابطه</th>
                          <th scope="col" className="px-6 py-3">مقصد (Target)</th>
                          <th scope="col" className="px-6 py-3 text-center">وزن / اطمینان</th>
                          <th scope="col" className="px-6 py-3 text-left">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-xs">
                        {relationships.map((r) => {
                          // Find readable name of source and target
                          let srcName = r.sourceId;
                          let tgtName = r.targetId;

                          if (r.sourceType === "Prompt") {
                            const p = prompts.find(pr => pr.id === r.sourceId);
                            if (p) srcName = p.title;
                          } else {
                            const t = taxonomies.find(ta => ta.id === r.sourceId);
                            if (t) srcName = `${t.titleFa} (${t.type})`;
                          }

                          if (r.targetType === "Prompt") {
                            const p = prompts.find(pr => pr.id === r.targetId);
                            if (p) tgtName = p.title;
                          } else {
                            const t = taxonomies.find(ta => ta.id === r.targetId);
                            if (t) tgtName = `${t.titleFa} (${t.type})`;
                          }

                          return (
                            <tr key={r.id} className="hover:bg-surface-soft">
                              <td className="px-6 py-3 font-semibold text-brand max-w-[150px] truncate" title={srcName}>{srcName}</td>
                              <td className="px-6 py-3 font-mono text-[10px] text-muted">{r.relationType}</td>
                              <td className="px-6 py-3 font-semibold text-success-text max-w-[150px] truncate" title={tgtName}>{tgtName}</td>
                              <td className="px-6 py-3 text-center font-mono font-bold text-muted">W: {r.weight} | C: {r.confidenceScore}</td>
                              <td className="px-6 py-3 text-left">
                                <button
                                  onClick={() => handleDeleteRelationship(r.id)}
                                  className="text-danger-text hover:text-danger-text font-bold text-xs"
                                >
                                  حذف
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {relationships.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-muted">هنوز هیچ پیوندی در گراف پلتفرم تعریف نشده است.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Dedicated Branding & Site Appearance */}
          {activeTab === "branding" && (
            <motion.div
              key="branding-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-line">
                <ImageIcon className="w-5 h-5 text-brand" />
                <div>
                  <h3 className="text-sm font-bold text-primary">برندینگ، لوگو و ظاهر سایت</h3>
                  <p className="text-[11px] text-muted">شخصی‌سازی نام پلتفرم، شعار، عناوین هیرو، متن‌های فوتر و تصویر لوگوی سراسری Promty</p>
                </div>
              </div>

              {/* Logo Upload & Preview Card */}
              <div className="bg-surface-soft/70 border border-line/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-primary flex items-center gap-2">
                  <Upload className="w-4 h-4 text-brand" />
                  <span>لوگوی اختصاصی پلتفرم</span>
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-surface border border-line shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    {siteLogoLocal ? (
                      <img src={siteLogoLocal} alt="لوگوی سایت" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full bg-brand-solid/10 text-brand flex flex-col items-center justify-center p-2 text-center">
                        <Sparkles className="w-6 h-6 mb-1" />
                        <span className="text-[9px] font-bold">بدون لوگو</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-right">
                    <p className="text-xs text-secondary font-medium">
                      فرمت‌های مجاز: <code className="bg-surface px-1.5 py-0.5 rounded border border-line font-mono text-[11px]">WEBP</code>، <code className="bg-surface px-1.5 py-0.5 rounded border border-line font-mono text-[11px]">PNG</code>، <code className="bg-surface px-1.5 py-0.5 rounded border border-line font-mono text-[11px]">SVG</code>
                    </p>
                    <p className="text-[11px] text-muted">
                      لوگو به صورت خودکار در ابعاد متناسب بهینه‌سازی شده و در <code className="bg-surface px-1 py-0.5 rounded font-mono text-[10px]">/dl/brand/logo.webp</code> ذخیره می‌گردد؛ SVG نیز با حفظ شفافیت به تصویر WebP تبدیل می‌شود.
                    </p>
                    <div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/webp,image/svg+xml,image/jpeg"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload-input"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={logoUploading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-soft text-primary text-xs font-bold rounded-xl border border-line shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {logoUploading ? (
                          <>
                            <Loader className="w-3.5 h-3.5 text-brand" />
                            <span>در حال آپلود و بهینه‌سازی...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-brand" />
                            <span>انتخاب و بارگذاری فایل لوگو</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <LogoAppearanceControls src={siteLogoLocal} value={logoAppearanceLocal} onChange={setLogoAppearanceLocal} onSave={handleSaveLogoAppearance} saving={brandingLoading || logoUploading} />
              </div>

              {/* Branding Text Fields */}
              <form onSubmit={handleSaveBranding} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary block">
                      نام برند و عنوان پلتفرم (Site Title)
                    </label>
                    <input
                      type="text"
                      value={siteTitleLocal}
                      onChange={(e) => setSiteTitleLocal(e.target.value)}
                      placeholder="پرامپتی | Promty"
                      className="w-full text-primary bg-surface-soft rounded-xl px-4 py-2.5 text-xs border border-line outline-none focus:bg-surface focus:border-brand transition font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary block">
                      شعار هدر و زیرعنوان (Site Subtitle)
                    </label>
                    <input
                      type="text"
                      value={siteSubtitleLocal}
                      onChange={(e) => setSiteSubtitleLocal(e.target.value)}
                      placeholder="موتور شخصی‌سازی و پرامپت مهندسی"
                      className="w-full text-primary bg-surface-soft rounded-xl px-4 py-2.5 text-xs border border-line outline-none focus:bg-surface focus:border-brand transition font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary block">
                    عنوان اصلی بخش هیرو (Hero Title)
                  </label>
                  <input
                    type="text"
                    value={heroTitleLocal}
                    onChange={(e) => setHeroTitleLocal(e.target.value)}
                    placeholder="قلب تپنده نوآوری با پرامپتی"
                    className="w-full text-primary bg-surface-soft rounded-xl px-4 py-2.5 text-xs border border-line outline-none focus:bg-surface focus:border-brand transition font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary block">
                    توضیحات و پاراگراف اصلی هیرو (Hero Description)
                  </label>
                  <textarea
                    rows={3}
                    value={heroDescriptionLocal}
                    onChange={(e) => setHeroDescriptionLocal(e.target.value)}
                    placeholder="اولین پلتفرم گرافِ دانش پرامپت در ایران..."
                    className="w-full text-primary bg-surface-soft rounded-xl p-3 text-xs border border-line outline-none focus:bg-surface focus:border-brand transition leading-relaxed font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary block">
                    متن «درباره ما» در فوتر (Footer About)
                  </label>
                  <textarea
                    rows={2}
                    value={footerAboutLocal}
                    onChange={(e) => setFooterAboutLocal(e.target.value)}
                    placeholder="پرامپتی مرجع تخصصی مهندسی پرامپت و گراف دانش هوش مصنوعی در ایران است..."
                    className="w-full text-primary bg-surface-soft rounded-xl p-3 text-xs border border-line outline-none focus:bg-surface focus:border-brand transition leading-relaxed font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary block">
                    متن کپی‌رایت فوتر (Footer Copyright)
                  </label>
                  <input
                    type="text"
                    value={footerCopyrightLocal}
                    onChange={(e) => setFooterCopyrightLocal(e.target.value)}
                    placeholder="تمامی حقوق مادی و معنوی برای پرامپتی محفوظ است."
                    className="w-full text-primary bg-surface-soft rounded-xl px-4 py-2.5 text-xs border border-line outline-none focus:bg-surface focus:border-brand transition"
                  />
                </div>

                <PromptCardTemplateControls value={promptCardTemplate} onChange={setPromptCardTemplate} />

                <HomepageSectionsControls value={homepageSections} onChange={setHomepageSections} />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-muted">
                    💡 تغییرات برندینگ فوراً در هدر، فوتر و صفحه اصلی کاربران منعکس می‌شود.
                  </p>
                  <button
                    type="submit"
                    disabled={brandingLoading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-brand-solid hover:bg-brand-solid disabled:bg-surface-inset text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {brandingLoading ? (
                      <>
                        <Loader className="w-3.5 h-3.5" />
                        <span>در حال ذخیره برندینگ...</span>
                      </>
                    ) : (
                      <span>ذخیره تغییرات برندینگ و ظاهر 🎨</span>
                    )}
                  </button>
                </div>

                {brandingSuccess && (
                  <div className="p-3 bg-success-soft text-success-text text-xs font-bold rounded-xl border border-success-text flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-text" />
                    <span>{brandingSuccess}</span>
                  </div>
                )}
                {brandingError && (
                  <div className="p-3 bg-danger-soft text-danger-text text-xs font-bold rounded-xl border border-danger-text flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-danger-text" />
                    <span>{brandingError}</span>
                  </div>
                )}
              </form>
            </motion.div>
          )}

          {/* TAB 5: AI & Automation Engine */}
          {activeTab === "ai" && (
            <motion.div
              key="ai-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-line">
                <Settings className="w-5 h-5 text-brand" />
                <div>
                  <h3 className="text-sm font-bold text-primary">موتور هوش مصنوعی و اتوماسیون</h3>
                  <p className="text-[11px] text-muted">مسیر وب‌هوک‌های n8n، کلیدهای مدل‌های هوش مصنوعی و تنظیم مهلت زمانی پاسخگویی (Timeout)</p>
                </div>
              </div>

              <form onSubmit={handleSaveAiSettings} className="space-y-6">
                {/* Webhook block */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-primary bg-surface-soft px-3 py-1.5 rounded-lg inline-block">
                    🔗 مسیرهای وب‌هوک اتوماسیون (n8n Agent)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="n8n_analyze_input_tab" className="text-xs font-bold text-muted block">
                        آدرس وب‌هوک تحلیل چشمه پرامپت (Analyze Agent)
                      </label>
                      <input
                        id="n8n_analyze_input_tab"
                        type="url"
                        dir="ltr"
                        value={n8nAnalyzeWebhook}
                        onChange={(e) => setN8nAnalyzeWebhook(e.target.value)}
                        placeholder="https://n8n.your-domain.com/webhook/analyze"
                        className="w-full text-primary bg-surface-soft placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-line outline-none focus:bg-surface focus:ring-2 focus:ring-brand/20 focus:border-brand transition font-mono text-left"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="n8n_refine_input_tab" className="text-xs font-bold text-muted block">
                        آدرس وب‌هوک ارتقای پرامپت کلاینت (Refine Agent)
                      </label>
                      <input
                        id="n8n_refine_input_tab"
                        type="url"
                        dir="ltr"
                        value={n8nRefineWebhook}
                        onChange={(e) => setN8nRefineWebhook(e.target.value)}
                        placeholder="https://n8n.your-domain.com/webhook/refine"
                        className="w-full text-primary bg-surface-soft placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-line outline-none focus:bg-surface focus:ring-2 focus:ring-brand/20 focus:border-brand transition font-mono text-left"
                      />
                    </div>
                  </div>
                </div>

                {/* API Keys block */}
                <div className="space-y-3 pt-4 border-t border-line">
                  <h4 className="text-xs font-extrabold text-primary bg-surface-soft px-3 py-1.5 rounded-lg inline-block">
                    🔑 کلیدهای مستقیم مدل‌های هوش مصنوعی (Fallback)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="gemini_key_tab" className="text-xs font-bold text-muted block">
                        کلید مستقیم Gemini API (Fallback)
                      </label>
                      <input
                        id="gemini_key_tab"
                        type="password"
                        dir="ltr"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full text-primary bg-surface-soft placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-line outline-none focus:bg-surface focus:ring-2 focus:ring-brand/20 focus:border-brand transition font-mono text-left"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="openai_key_tab" className="text-xs font-bold text-muted block">
                        کلید مستقیم OpenAI API (برای توسعه آینده)
                      </label>
                      <input
                        id="openai_key_tab"
                        type="password"
                        dir="ltr"
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full text-primary bg-surface-soft placeholder-slate-300 rounded-xl px-4 py-2.5 text-xs border border-line outline-none focus:bg-surface focus:ring-2 focus:ring-brand/20 focus:border-brand transition font-mono text-left"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Timeout Configuration */}
                <div className="space-y-3 pt-4 border-t border-line">
                  <h4 className="text-xs font-extrabold text-primary bg-surface-soft px-3 py-1.5 rounded-lg inline-block">
                    ⏱️ تنظیم مهلت زمانی پاسخگویی هوش مصنوعی (Timeout)
                  </h4>

                  <div className="max-w-md space-y-1.5">
                    <label htmlFor="ai_timeout_input" className="text-xs font-bold text-muted block">
                      حداکثر مدت زمان انتظار پاسخ (ثانیه)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="ai_timeout_input"
                        type="number"
                        min={10}
                        max={300}
                        value={aiTimeoutSecondsLocal}
                        onChange={(e) => setAiTimeoutSecondsLocal(Number(e.target.value))}
                        className="w-28 text-primary bg-surface-soft rounded-xl px-4 py-2.5 text-xs border border-line outline-none focus:bg-surface focus:border-brand transition font-mono font-bold text-center"
                        required
                      />
                      <span className="text-xs text-muted font-medium">ثانیه (پیش‌فرض: ۶۰، حداقل: ۱۰، حداکثر: ۳۰۰)</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1">
                      در صورتی که ایجنت‌های تحلیل یا بهینه‌سازی n8n پس از این مدت پاسخی ارسال نکنند، درخواست لغو شده و خطای صریح به کاربر نمایش داده می‌شود.
                    </p>
                  </div>
                </div>

                {/* Search Boosting / Search Rules Configuration */}
                <div className="space-y-3 pt-4 border-t border-line">
                  <h4 className="text-xs font-extrabold text-primary bg-surface-soft px-3 py-1.5 rounded-lg inline-block">
                    🔍 تنظیم قوانین و ضریب موتور جستجوی هوشمند (Search Rules)
                  </h4>

                  <div className="bg-surface-soft p-4 rounded-xl text-xs space-y-3 text-secondary">
                    <div className="flex items-center justify-between border-b border-white pb-2">
                      <span className="font-bold">ضریب اولویت کلمات عنوان پرامپت (Title Match Boost)</span>
                      <span className="bg-brand-soft text-brand font-black px-2 py-0.5 rounded">۵.۰x (بالاترین اولویت)</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white pb-2">
                      <span className="font-bold">ضریب اولویت فیلدهای ابزار و قصد (Tools & Intents Boost)</span>
                      <span className="bg-brand-soft text-brand font-black px-2 py-0.5 rounded">۳.۵x (اولویت دوم)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold">استفاده از الگوریتم جستجوی فازی لوون‌اشتاین (Levenstein Threshold)</span>
                      <span className="bg-success-soft text-success-text font-black px-2 py-0.5 rounded">فعال (آستانه تطبیق: ۷۵٪)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="text-[10px] text-muted">
                    💡 تمام تنظیمات وب‌هوک و هوش مصنوعی بلادرنگ در سیستم اعمال می‌شوند.
                  </p>

                  <button
                    type="submit"
                    disabled={aiSettingsLoading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-brand-solid hover:bg-brand-solid disabled:bg-surface-inset text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {aiSettingsLoading ? (
                      <>
                        <Loader className="w-3.5 h-3.5" />
                        <span>در حال ذخیره‌سازی...</span>
                      </>
                    ) : (
                      <span>ذخیره تنظیمات هوش مصنوعی 💾</span>
                    )}
                  </button>
                </div>

                {aiSettingsSuccess && (
                  <div className="p-3 bg-success-soft text-success-text text-xs font-bold rounded-xl border border-success-text flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-success-text" />
                    <span>{aiSettingsSuccess}</span>
                  </div>
                )}

                {aiSettingsError && (
                  <div className="p-3 bg-danger-soft text-danger-text text-xs font-bold rounded-xl border border-danger-text flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-danger-text" />
                    <span>⚠️ {aiSettingsError}</span>
                  </div>
                )}
              </form>
            </motion.div>
          )}

          {/* TAB 6: Role-Based Access Control (RBAC) & User Management */}
          {activeTab === "roles" && (
            <motion.div
              key="roles-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header banner */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-brand-solid/5 to-amber-500/10 border border-brand/15">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-brand-solid text-white">
                      <Users className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-black text-primary">مدیریت دسترسی‌ها و کاربران (RBAC)</h3>
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    سیستم کنترل دسترسی نقش‌محور شامل سه سطح دسترسی: <strong className="text-caution-text">مدیر ارشد (SUPER_ADMIN)</strong>، <strong className="text-brand">مدیر (ADMIN)</strong>، و <strong className="text-secondary">کاربر عادی (USER)</strong>.
                  </p>
                </div>
                {isSuperAdmin ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-caution-text text-caution-text text-xs font-bold shrink-0">
                    <ShieldCheck className="w-4 h-4 text-caution-text" />
                    <span>شما با سطح دسترسی مدیر کل (Super Admin) وارد شده‌اید.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-soft border border-line text-secondary text-xs font-medium shrink-0">
                    <ShieldAlert className="w-4 h-4 text-muted" />
                    <span>تعیین و تغییر نقش‌ها منحصراً در اختیار مدیر ارشد (Super Admin) است.</span>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {roleStatusMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
                    roleStatusMessage.type === "success"
                      ? "bg-success-soft text-success-text border border-success-text"
                      : "bg-danger-soft text-danger-text border border-danger-text"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {roleStatusMessage.type === "success" ? (
                      <CheckCircle className="w-4 h-4 text-success-text" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-danger-text" />
                    )}
                    <span>{roleStatusMessage.text}</span>
                  </div>
                  <button
                    onClick={() => setRoleStatusMessage(null)}
                    className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Role Delegation Form (Super Admin only) */}
              {isSuperAdmin && (
                <div className="p-5 rounded-2xl bg-surface border border-line/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-black text-primary flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-brand" />
                    <span>انتساب سریع نقش به کاربر</span>
                  </h4>
                  <form onSubmit={handleDirectRoleAssign} className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={directIdentifier}
                      onChange={(e) => setDirectIdentifier(e.target.value)}
                      placeholder="شماره موبایل (مثلاً ۰۹۱۲۳۴۵۶۷۸۹) یا ایمیل کاربر"
                      className="flex-1 w-full px-4 py-2.5 rounded-xl border border-line text-xs font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 text-right"
                      required
                    />
                    <select
                      value={directRole}
                      onChange={(e) => setDirectRole(e.target.value as any)}
                      className="w-full sm:w-48 px-3 py-2.5 rounded-xl border border-line text-xs font-bold text-primary focus:border-brand focus:outline-none bg-surface"
                    >
                      <option value="ADMIN">مدیر سیستم (ADMIN)</option>
                      <option value="USER">کاربر عادی (USER)</option>
                      <option value="SUPER_ADMIN">مدیر ارشد (SUPER_ADMIN)</option>
                    </select>
                    <button
                      type="submit"
                      disabled={roleActionLoading === directIdentifier.trim()}
                      className="w-full sm:w-auto px-5 py-2.5 bg-brand-solid hover:bg-brand-solid text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {roleActionLoading === directIdentifier.trim() ? (
                        <Loader className="w-4 h-4" />
                      ) : (
                        <span>اعمال نقش</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Users List, Search & Multi-Selection Toolbar */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-3 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="جستجوی کاربر بر اساس نام، موبایل یا ایمیل..."
                      className="w-full pr-9 pl-4 py-2 rounded-xl border border-line text-xs font-medium focus:border-brand focus:outline-none text-right"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted">
                    <button
                      onClick={fetchUsers}
                      className="flex items-center gap-1 px-3 py-2 border border-line hover:bg-surface-soft rounded-xl font-bold transition cursor-pointer"
                    >
                      {usersLoading ? <Loader className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>به‌روزرسانی لیست</span>
                    </button>
                    <span className="bg-surface-soft px-3 py-2 rounded-xl font-bold font-mono">
                      {usersList.length} کاربر
                    </span>
                  </div>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedUserIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 bg-brand-solid/10 border border-brand/20 rounded-2xl"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-brand-solid text-white text-[11px] font-black rounded-lg">
                        {selectedUserIds.length} کاربر انتخاب‌شده
                      </span>
                      <button
                        onClick={() => setSelectedUserIds([])}
                        className="text-[11px] text-muted hover:text-primary underline cursor-pointer"
                      >
                        لغو انتخاب
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSuperAdmin && (
                        <button
                          onClick={() => setBulkRoleModalOpen(true)}
                          disabled={bulkActionLoading}
                          className="px-3 py-1.5 bg-surface hover:bg-surface-soft text-brand border border-brand/30 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>تغییر نقش دسته‌جمعی</span>
                        </button>
                      )}

                      <button
                        onClick={handleBulkDelete}
                        disabled={bulkActionLoading}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {bulkActionLoading ? (
                          <Loader className="w-3.5 h-3.5" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>حذف کاربران انتخاب‌شده</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Table of Users */}
                {(() => {
                  const filteredUsers = usersList.filter((u) => {
                    if (!userSearchQuery.trim()) return true;
                    const q = userSearchQuery.toLowerCase();
                    return (
                      (u.name && u.name.toLowerCase().includes(q)) ||
                      (u.phone && u.phone.includes(q)) ||
                      (u.email && u.email.toLowerCase().includes(q))
                    );
                  });

                  const allFilteredSelected =
                    filteredUsers.length > 0 &&
                    filteredUsers.every((u) => selectedUserIds.includes(u.id));

                  return (
                    <div className="overflow-x-auto rounded-2xl border border-line shadow-xs">
                      <table className="w-full text-right text-xs text-secondary font-sans">
                        <thead className="bg-surface-soft text-muted font-bold border-b border-line">
                          <tr>
                            <th className="px-4 py-3.5 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={allFilteredSelected}
                                onChange={() => handleToggleSelectAll(filteredUsers.map((u) => u.id))}
                                className="rounded border-line-strong text-brand focus:ring-brand cursor-pointer"
                                title="انتخاب همه"
                              />
                            </th>
                            <th className="px-5 py-3.5">کاربر</th>
                            <th className="px-5 py-3.5">اطلاعات تماس</th>
                            <th className="px-5 py-3.5">نقش فعلی</th>
                            <th className="px-5 py-3.5">تاریخ عضویت</th>
                            <th className="px-5 py-3.5 text-left">عملیات و نقش</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {filteredUsers.map((u) => {
                            const roleLower = u.role.toLowerCase();
                            const isSuper = roleLower === "super_admin";
                            const isAdminRole = roleLower === "admin";
                            const isSelected = selectedUserIds.includes(u.id);
                            const isActionTarget = roleActionLoading === u.id;

                            return (
                              <tr
                                key={u.id}
                                className={`transition ${isSelected ? "bg-brand-solid/5" : "hover:bg-surface-soft/60"}`}
                              >
                                <td className="px-4 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectUser(u.id)}
                                    className="rounded border-line-strong text-brand focus:ring-brand cursor-pointer"
                                  />
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2.5">
                                    {u.avatar ? (
                                      <img
                                        src={u.avatar}
                                        alt={u.name || "کاربر"}
                                        className="w-8 h-8 rounded-xl object-cover border border-line"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-xl bg-brand-solid/10 text-brand flex items-center justify-center font-bold text-xs">
                                        {(u.name || u.phone || "ک").charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-bold text-primary block">
                                        {u.name || (u.phone ? `کاربر ${u.phone.slice(-4)}` : "بدون نام")}
                                      </span>
                                      <span className="text-[10px] text-muted font-mono block">
                                        شناسه: {u.id.slice(0, 8)}...
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="space-y-0.5">
                                    {u.phone && (
                                      <span className="font-mono text-primary block font-semibold" dir="ltr">
                                        {u.phone}
                                      </span>
                                    )}
                                    {u.email && (
                                      <span className="font-mono text-muted text-[11px] block" dir="ltr">
                                        {u.email}
                                      </span>
                                    )}
                                    {!u.phone && !u.email && (
                                      <span className="text-muted text-[10px]">-</span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  {isSuper ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 text-caution-text border border-caution-text">
                                      <ShieldCheck className="w-3 h-3 text-caution-text" />
                                      <span>مدیر کل (Super Admin)</span>
                                    </span>
                                  ) : isAdminRole ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-solid/10 text-brand border border-brand/20">
                                      <Shield className="w-3 h-3 text-brand" />
                                      <span>مدیر (ADMIN)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-soft text-secondary border border-line">
                                      کاربر عادی (USER)
                                    </span>
                                  )}
                                </td>

                                <td className="px-5 py-4 text-muted font-mono text-[11px]">
                                  {new Date(u.createdAt).toLocaleDateString("fa-IR")}
                                </td>

                                <td className="px-5 py-4 text-left">
                                  <div className="flex items-center justify-end gap-2">
                                    {isActionTarget ? (
                                      <Loader className="w-4 h-4 text-brand" />
                                    ) : (
                                      <>
                                        {/* Direct Role Change Selector */}
                                        <select
                                          value={u.role.toUpperCase()}
                                          onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                          disabled={!isSuperAdmin}
                                          className="text-[11px] font-bold py-1 px-2 rounded-lg border border-line bg-surface text-primary focus:outline-none focus:border-brand disabled:opacity-50 cursor-pointer"
                                          title={isSuperAdmin ? "تغییر مستقیم نقش" : "فقط مدیر ارشد مجاز است"}
                                        >
                                          <option value="USER">کاربر عادی</option>
                                          <option value="ADMIN">مدیر</option>
                                          {isSuperAdmin && <option value="SUPER_ADMIN">مدیر کل</option>}
                                        </select>

                                        {/* Edit Button */}
                                        <button
                                          onClick={() => handleOpenEditUser(u)}
                                          className="p-1.5 hover:bg-surface-soft text-secondary hover:text-primary rounded-lg transition cursor-pointer"
                                          title="ویرایش کاربر"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                          onClick={() => setDeleteConfirmUser(u)}
                                          disabled={u.id === user?.id}
                                          className="p-1.5 hover:bg-danger-soft text-danger-text hover:text-danger-text rounded-lg transition cursor-pointer disabled:opacity-30"
                                          title={u.id === user?.id ? "حذف حساب جاری غیرمجاز است" : "حذف کاربر"}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {filteredUsers.length === 0 && !usersLoading && (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-muted">
                                هیچ کاربری با مشخصات جستجوشده یافت نشد.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* MODAL 1: Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-surface rounded-3xl p-6 shadow-2xl border border-line space-y-4 font-sans text-right"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-solid/10 text-brand rounded-xl">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-primary">ویرایش اطلاعات کاربر</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-muted hover:text-secondary rounded-lg hover:bg-surface-soft cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-secondary block">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  placeholder="نام کاربر..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line font-medium focus:border-brand focus:outline-none text-right"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-secondary block">ایمیل</label>
                <input
                  type="email"
                  dir="ltr"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line font-medium focus:border-brand focus:outline-none text-left font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-secondary block">شماره موبایل</label>
                <input
                  type="text"
                  dir="ltr"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line font-medium focus:border-brand focus:outline-none text-left font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-secondary block">نقش کاربر</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as any)}
                  disabled={!isSuperAdmin && editUserRole === "SUPER_ADMIN"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line font-bold focus:border-brand focus:outline-none bg-surface text-right"
                >
                  <option value="USER">کاربر عادی (USER)</option>
                  <option value="ADMIN">مدیر سیستم (ADMIN)</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">مدیر کل (SUPER_ADMIN)</option>}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-line text-secondary font-bold rounded-xl hover:bg-surface-soft transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={bulkActionLoading}
                  className="px-5 py-2 bg-brand-solid hover:bg-brand-solid text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {bulkActionLoading ? <Loader className="w-3.5 h-3.5" /> : null}
                  <span>ذخیره تغییرات</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: Delete Confirm Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl border border-line space-y-4 font-sans text-right"
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger-soft text-danger-text rounded-2xl shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-primary">تایید حذف کاربر</h3>
                <p className="text-[11px] text-muted mt-0.5">عملیات غیرقابل بازگشت</p>
              </div>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              آیا از حذف حساب کاربری <strong className="text-primary font-black">{deleteConfirmUser.name || deleteConfirmUser.phone || deleteConfirmUser.id}</strong> اطمینان دارید؟ تمامی اطلاعات، پیش‌تنظیم‌ها و نشان‌شده‌های کاربر پاک خواهد شد.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 border border-line text-secondary text-xs font-bold rounded-xl hover:bg-surface-soft transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                disabled={bulkActionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {bulkActionLoading ? <Loader className="w-3.5 h-3.5" /> : null}
                <span>تایید و حذف کاربر</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: Bulk Role Change Modal */}
      {bulkRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl border border-line space-y-4 font-sans text-right"
            dir="rtl"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Shield className="w-5 h-5 text-brand" />
              <h3 className="text-sm font-black text-primary">
                تغییر نقش {selectedUserIds.length} کاربر
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-secondary block">نقش جدید برای کاربران انتخاب‌شده:</label>
              <select
                value={bulkTargetRole}
                onChange={(e) => setBulkTargetRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line font-bold focus:border-brand focus:outline-none bg-surface text-right"
              >
                <option value="USER">کاربر عادی (USER)</option>
                <option value="ADMIN">مدیر سیستم (ADMIN)</option>
                {isSuperAdmin && <option value="SUPER_ADMIN">مدیر کل (SUPER_ADMIN)</option>}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                onClick={() => setBulkRoleModalOpen(false)}
                className="px-4 py-2 border border-line text-secondary text-xs font-bold rounded-xl hover:bg-surface-soft transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleBulkRoleChange}
                disabled={bulkActionLoading}
                className="px-5 py-2 bg-brand-solid hover:bg-brand-solid text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {bulkActionLoading ? <Loader className="w-3.5 h-3.5" /> : null}
                <span>اعمال نقش بر کاربران</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

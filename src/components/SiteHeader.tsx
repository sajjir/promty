import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BookOpen, TrendingUp, FileText, WandSparkles, Bot, Bookmark, ChevronDown, Home, LayoutDashboard, LogIn, LogOut, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import { Z } from '../lib/zIndex';

export default function SiteHeader() {
  const { user, logout, siteTitle, branding, setPhoneModalOpen, isAdmin, isSuperAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const displayName = user?.name || (user?.phone ? `۰${user.phone.slice(-10)}` : user?.email) || 'کاربر پرامپتی';
  const role = isSuperAdmin ? 'مدیر کل' : isAdmin ? 'مدیر' : 'کاربر';

  useEffect(() => { setMobileOpen(false); setAccountOpen(false); }, [location.pathname]);
  useEffect(() => {
    const outside = (event: PointerEvent | FocusEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
      if (!mobilePanelRef.current?.contains(event.target as Node) && !mobileButtonRef.current?.contains(event.target as Node)) setMobileOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (accountOpen) { setAccountOpen(false); accountButtonRef.current?.focus(); }
      if (mobileOpen) { setMobileOpen(false); mobileButtonRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('focusin', outside); document.removeEventListener('keydown', escape); };
  }, [accountOpen, mobileOpen]);

  const navigation = (mobile = false) => (
    <nav aria-label={mobile ? 'ناوبری موبایل' : 'ناوبری اصلی'} className={mobile ? 'grid gap-1' : 'flex items-center gap-1'}>
      {[
        { to: '/', label: 'خانه', Icon: Home, show: mobile },
        { to: '/dashboard', label: 'داشبورد', Icon: Bookmark, show: !!user },
        { to: '/admin', label: 'مدیریت', Icon: LayoutDashboard, show: isAdmin },
      ].filter(item => item.show).map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand/10 text-brand' : 'text-secondary hover:bg-surface-soft hover:text-primary'}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />{label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <header id="main-nav-bar" className="site-header sticky top-0 border-b border-line" style={{ zIndex: Z.HEADER }}>
      <a href="#main-content" className="skip-link">رفتن به محتوای اصلی</a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:h-[72px] md:px-6">
        <Link to="/" className="brand-link flex min-w-0 items-center gap-2.5" aria-label={`${siteTitle}، صفحه اصلی`}>
          {branding.siteLogo ? <img src={branding.siteLogo} alt="" className="h-9 w-9 rounded-xl object-contain" /> : <span className="brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"><Sparkles className="h-5 w-5" /></span>}
          <span className="min-w-0"><span className="brand-title block text-base font-extrabold"><span className="brand-actual-text block truncate">{siteTitle}</span><span aria-hidden="true" className="brand-hover-text block truncate">{siteTitle}</span></span><span className="hidden max-w-[240px] truncate text-[11px] text-muted lg:block">{branding.siteSubtitle || 'ایده‌های بهتر، با پرامپت‌های بهتر'}</span></span>
        </Link>
        <div className="hidden md:block">{navigation()}</div>
        <div className="flex shrink-0 items-center gap-2">
          <NavLink to="/" end aria-label="صفحه اصلی" title="صفحه اصلی" className="flex h-11 w-11 items-center justify-center rounded-xl text-secondary hover:bg-surface-soft"><Home className="h-5 w-5" aria-hidden="true" /></NavLink>
          {user ? (
            <div className="relative" ref={accountRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false); }}>
              <button ref={accountButtonRef} aria-label="حساب کاربری" aria-expanded={accountOpen} aria-controls="account-panel" onClick={() => { setAccountOpen(!accountOpen); setMobileOpen(false); }} className="flex items-center gap-2 rounded-xl border border-line p-1.5 text-primary hover:bg-surface-soft">
                {user.avatar ? <img src={user.avatar} referrerPolicy="no-referrer" alt="" className="h-8 w-8 rounded-lg object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand font-bold">{displayName.charAt(0)}</span>}
                <span className="hidden max-w-[110px] truncate text-xs md:block">{displayName}</span><ChevronDown className="h-3.5 w-3.5" />
              </button>
              {accountOpen && <div id="account-panel" className="absolute left-0 mt-3 w-[min(272px,calc(100vw-32px))] rounded-2xl border border-line bg-surface-elevated p-2 shadow-xl" style={{ zIndex: Z.DROPDOWN }}>
                <div className="border-b border-line px-3 py-3"><p className="truncate text-sm font-bold text-primary">{displayName}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5" />{role}</p>{user.email && <p className="mt-1 truncate text-xs text-muted" dir="ltr">{user.email}</p>}{user.phone && <p className="mt-1 text-xs text-muted" dir="ltr">{user.phone}</p>}</div>
                <Link className="header-account-link" to="/dashboard">داشبورد و ذخیره‌شده‌ها</Link>
                {isAdmin && <Link className="header-account-link" to="/admin">پنل مدیریت و تنظیمات</Link>}
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger-text hover:bg-danger-soft" onClick={() => { setAccountOpen(false); logout(); }}><LogOut className="h-4 w-4" />خروج از حساب</button>
              </div>}
            </div>
          ) : <button id="open-auth-modal-btn" title="ورود / ثبت‌نام" onClick={() => setPhoneModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-brand-solid px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"><LogIn className="h-4 w-4" /><span className="hidden sm:inline">ورود / ثبت‌نام</span></button>}
          <button ref={mobileButtonRef} aria-label={mobileOpen ? 'بستن منوی اصلی' : 'باز کردن منوی اصلی'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="rounded-xl p-2 text-secondary hover:bg-surface-soft" onClick={() => { setMobileOpen(!mobileOpen); setAccountOpen(false); }}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {mobileOpen && <div ref={mobilePanelRef} id="mobile-navigation" className="border-t border-line bg-surface px-4 py-3 max-h-[calc(100dvh-72px)] overflow-y-auto"><div className="max-w-7xl mx-auto grid gap-4 md:grid-cols-2">{navigation(true)}<nav aria-label="بخش‌های آینده" className="grid gap-1">{[
            {label:'آموزش پرامپت‌ها', Icon:BookOpen}, {label:'ترندها', Icon:TrendingUp}, {label:'پرامپت‌ها', Icon:FileText}, {label:'مهارت‌ها (Skills)', Icon:WandSparkles}, {label:'AGENTS.md', Icon:Bot},
          ].map(({label,Icon}) => <span key={label} aria-disabled="true" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-secondary"><Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{label}<span className="mr-auto text-[10px] text-muted">به‌زودی</span></span>)}</nav><div className="border-t border-line pt-3 md:col-span-2"><p className="mb-2 text-xs text-muted">حالت نمایش</p><ThemeSwitcher /></div></div></div>}
    </header>
  );
}

import AdminShortcuts from './AdminShortcuts';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, TrendingUp, FileText, WandSparkles, Bot, Bookmark, Home, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeProvider';
import ThemeSwitcher from './ThemeSwitcher';
import UserMenu from './UserMenu';
import BrandLogo from './BrandLogo';
import { Z } from '../lib/zIndex';
import './hamburger.css';

export default function SiteHeader() {
  const { user, logout, siteTitle, branding, setPhoneModalOpen, isAdmin, isSuperAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const displayName = user?.name || (user?.phone ? `۰${user.phone.slice(-10)}` : user?.email) || 'کاربر پرامپتی';
  const role = isSuperAdmin ? 'مدیر کل' : isAdmin ? 'مدیر' : 'کاربر';

  useEffect(() => { setMobileOpen(false); setAccountOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!mobileOpen) return;
    const outside = (event: PointerEvent | FocusEvent) => {
      if (!mobilePanelRef.current?.contains(event.target as Node) && !mobileButtonRef.current?.contains(event.target as Node)) setMobileOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); mobileButtonRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('focusin', outside); document.removeEventListener('keydown', escape); };
  }, [mobileOpen]);

  const headerStyle = {
    zIndex: Z.HEADER,
    '--header-logo-desktop': `${branding.logoAppearance.desktopSize}px`,
    '--header-logo-mobile': `${branding.logoAppearance.mobileSize}px`,
  } as CSSProperties;

  return (
    <header id="main-nav-bar" className="site-header sticky top-0 border-b border-line" style={headerStyle}>
      <a href="#main-content" className="skip-link">رفتن به محتوای اصلی</a>
      <div className="site-header-row mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <Link to="/" className="brand-link flex min-w-0 items-center gap-2.5" aria-label={`${siteTitle}، صفحه اصلی`}>
          <BrandLogo src={branding.siteLogo} appearance={branding.logoAppearance} />
          <span className="min-w-0"><span className="brand-title block text-base font-extrabold"><span className="brand-actual-text block truncate">{siteTitle}</span><span aria-hidden="true" className="brand-hover-text block truncate">{siteTitle}</span></span><span className="hidden max-w-[240px] truncate text-[11px] text-muted lg:block">{branding.siteSubtitle || 'ایده‌های بهتر، با پرامپت‌های بهتر'}</span></span>
        </Link>
        <AdminShortcuts/>
        <div className="flex shrink-0 items-center gap-2">
          {user ? <UserMenu user={{name:displayName,email:user.email || user.phone || '',avatarSrc:user.avatar || undefined,plan:role}}
            showName theme={theme} onThemeChange={setTheme} open={accountOpen}
            onOpenChange={open=>{setAccountOpen(open);if(open)setMobileOpen(false);}}
            items={[
              {label:'داشبورد و ذخیره‌شده‌ها',icon:<Bookmark size={17} />,onSelect:()=>navigate('/dashboard')},
              ...(isAdmin ? [{label:'پنل مدیریت و تنظیمات',icon:<LayoutDashboard size={17} />,onSelect:()=>navigate('/admin')}] : []),
            ]}
            onSignOut={logout} />
          : <button id="open-auth-modal-btn" title="ورود / ثبت‌نام" onClick={() => setPhoneModalOpen(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-solid px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"><LogIn className="h-4 w-4" /><span className="hidden sm:inline">ورود / ثبت‌نام</span></button>}
          <button ref={mobileButtonRef} aria-label={mobileOpen ? 'بستن منوی اصلی' : 'باز کردن منوی اصلی'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="promty-hamburger flex h-11 w-11 items-center justify-center rounded-xl text-secondary hover:bg-surface-soft" onClick={() => { setMobileOpen(!mobileOpen); setAccountOpen(false); }}><svg viewBox="0 0 32 32" aria-hidden="true"><path className="hamburger-line hamburger-top-bottom" d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"/><path className="hamburger-line" d="M7 16 27 16"/></svg></button>
        </div>
      </div>
      {mobileOpen && <div ref={mobilePanelRef} id="mobile-navigation" className="header-navigation-panel border-t border-line bg-surface px-4 py-3 overflow-y-auto"><div className="max-w-7xl mx-auto grid gap-3 md:grid-cols-2">
        <nav aria-label="منوی اصلی" className="grid content-start gap-1">
          <NavLink to="/" end className={({isActive})=>`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive?'bg-brand/10 text-brand':'text-secondary hover:bg-surface-soft'}`}><Home className="h-4 w-4" />خانه</NavLink>
          <NavLink to="/blog" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-secondary hover:bg-surface-soft"><BookOpen className="h-4 w-4"/>بلاگ و آموزش</NavLink>
          <Link to="/?sort=usage#prompt-archive-view" className="menu-style-link"><TrendingUp aria-hidden="true"/>ترندها<span className="mr-auto text-[10px] text-muted">بیشترین کپی</span></Link>
        </nav>
        <nav aria-label="انواع محتوا" className="grid content-start gap-1">{[{label:'پرامپت‌ها',Icon:FileText,type:'prompt'},{label:'مهارت‌ها (Skills)',Icon:WandSparkles,type:'skill'},{label:'AGENTS.md',Icon:Bot,type:'agent-guide'}].map(({label,Icon,type})=><Link key={type} to={`/?resourceType=${type}#prompt-archive-view`} aria-current={location.pathname==='/'&&location.search===`?resourceType=${type}`?'page':undefined} className="menu-style-link"><Icon aria-hidden="true"/>{label}</Link>)}</nav>
        {!user && <div className="border-t border-line pt-3 md:col-span-2"><p className="mb-2 text-xs text-muted">حالت نمایش</p><ThemeSwitcher /></div>}
      </div></div>}
    </header>
  );
}

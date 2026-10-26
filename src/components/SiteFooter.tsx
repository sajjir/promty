import {useEffect,useState} from 'react';
import {Sparkles,Instagram,Send,ChevronLeft} from 'lucide-react';
import {useAuth,type PublicSettings} from './AuthContext';
import {footerDiscoveryLinks,type FooterLink} from '../lib/footerLinks';
type FooterSettings=Pick<PublicSettings,'siteLogo'|'footerAbout'|'footerCopyright'>;
export function FooterContent({branding,siteTitle,discoveryLinks=footerDiscoveryLinks({})}:{branding:FooterSettings;siteTitle:string;discoveryLinks?:FooterLink[]}){
 const about=branding.footerAbout&&!branding.footerAbout.startsWith('پرامپتی مرجع تخصصی')?branding.footerAbout:'آرشیو و شخصی‌سازی پرامپت‌های هوش مصنوعی؛ برای رسیدن از ایده به نتیجه.';
 return <footer className="bg-surface border-t border-line pt-10 pb-8 mt-12 text-xs text-muted font-sans" dir="rtl">
  <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-3 gap-8 text-right">
   <section className="col-span-2 md:col-span-1 space-y-3" aria-label="دربارهٔ پرامپتی"><div className="flex items-center gap-2">{branding.siteLogo?<img src={branding.siteLogo} alt="" width="32" height="32" className="w-8 h-8 object-contain"/>:<Sparkles className="w-7 h-7 text-brand"/>}<h2 className="text-sm font-black text-primary">{siteTitle}</h2></div><p className="max-w-sm leading-7">{about}</p></section>
   {[{title:'دسترسی سریع آرشیو',links:discoveryLinks},{title:'راهنما و ارتباط',links:[{label:'بلاگ و آموزش',href:'/blog'},{label:'راهنمای استفاده',href:'/guide'},{label:'درباره پرامپتی',href:'/about'},{label:'تماس و گزارش مشکل',href:'/contact'}]}].map(group=><nav key={group.title} aria-label={group.title}><h2 className="text-primary font-bold mb-3">{group.title}</h2><ul className="site-footer-navigation">{group.links.map(link=><li key={link.href}><a href={link.href} className="menu-style-link"><ChevronLeft aria-hidden="true"/><span>{link.label}</span></a></li>)}</ul></nav>)}
  </div>
  <div className="site-footer-bottom max-w-7xl mx-auto px-4 md:px-6 mt-8 pt-5 border-t border-line"><p>{branding.footerCopyright||`کلیه حقوق برای ${siteTitle} محفوظ است.`}</p><div className="site-footer-links"><a href="https://betavan.com" target="_blank" rel="noopener noreferrer" className="site-footer-credit">ساخته‌شده توسط <strong>بتوان</strong></a><nav aria-label="شبکه‌های اجتماعی پرامپتی"><a href="https://www.instagram.com/promty.ir/" target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام پرامپتی" title="اینستاگرام"><Instagram aria-hidden="true"/></a><a href="https://t.me/promty_ir" target="_blank" rel="noopener noreferrer" aria-label="کانال تلگرام پرامپتی" title="تلگرام"><Send aria-hidden="true"/></a></nav></div></div>
 </footer>;
}
export default function SiteFooter(){
 const {branding,siteTitle}=useAuth();
 const [links,setLinks]=useState<FooterLink[]>(()=>footerDiscoveryLinks({}));
 useEffect(()=>{const controller=new AbortController();void fetch('/api/facets',{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(!controller.signal.aborted)setLinks(footerDiscoveryLinks(data));}).catch(()=>{});return()=>controller.abort();},[]);
 return <FooterContent branding={branding} siteTitle={siteTitle} discoveryLinks={links}/>;
}

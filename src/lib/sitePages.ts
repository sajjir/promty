import {STATIC_TRUST_PAGES} from './trustPages';
import {cleanRichHtml} from './richContent';
export interface SitePage{slug:string;title:string;excerpt:string;contentHtml:string;status:'DRAFT'|'PUBLISHED';updatedAt:string|null;createdAt?:string;}
export const pageHref=(slug:string)=>['guide','about','contact','blog'].includes(slug)?'/'+slug:'/pages/'+encodeURIComponent(slug);
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
export const DEFAULT_SITE_PAGES:SitePage[]=[...Object.values(STATIC_TRUST_PAGES).map(p=>({slug:p.path.slice(1),title:p.h1,excerpt:p.description,contentHtml:cleanRichHtml(p.sections.map(s=>`<h2>${esc(s.heading)}</h2><p>${esc(s.body)}</p>`+(s.bullets?'<ul>'+s.bullets.map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul>':'')+(s.links?'<p>'+s.links.map(l=>`<a href="${esc(l.href)}">${esc(l.label)}</a>`).join(' · ')+'</p>':'')).join('')),status:'PUBLISHED' as const,updatedAt:null})),{slug:'blog',title:'بلاگ و آموزش پرامپتی',excerpt:'راهنماهای کاربردی برای استفاده از پرامپت‌ها؛ از تصویر محصول تا محتوای فروشگاهی.',contentHtml:'',status:'PUBLISHED',updatedAt:null}];
export const defaultPage=(slug:string)=>DEFAULT_SITE_PAGES.find(p=>p.slug===slug)||null;

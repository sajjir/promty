import React from 'react';
import {Sparkles} from 'lucide-react';
import {chipHref,type HomepageChip} from '../lib/homepageChips';
export default function QuickChipLinks({chips,counts,renderLink}:{chips:HomepageChip[];counts:Record<string,number>;renderLink?:(href:string,content:React.ReactNode,className:string,key:string)=>React.ReactNode}){
 return <nav aria-label="سناریوهای آماده" className="flex flex-wrap justify-center gap-2 mt-5">{chips.filter(c=>c.enabled).map(c=>{
  const count=counts[c.id];
  const content=<>{c.icon?<img src={c.icon} alt="" width="20" height="20" className="w-5 h-5 object-contain"/>:<Sparkles className="w-4 h-4" aria-hidden="true"/>}{c.title}{count!==undefined&&<span className="text-muted">({count.toLocaleString('fa-IR')})</span>}</>;
  const style='flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs text-secondary min-h-11';
  if(count===undefined||count<=0)return <span key={c.id} aria-disabled="true" aria-busy={count===undefined} title={count===undefined?'در حال بررسی محتوای این سناریو':'هنوز محتوایی برای این سناریو منتشر نشده است'} className={style+' opacity-40'}>{content}</span>;
  const href=chipHref(c)+'#prompt-archive-view',className=style+' hover:border-brand hover:text-brand';
  return renderLink?renderLink(href,content,className,c.id):<a href={href} className={className} key={c.id}>{content}</a>;
 })}</nav>;
}

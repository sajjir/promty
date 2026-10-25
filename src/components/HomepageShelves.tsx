import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Prompt } from '../types';
import type { HomepageSection } from '../lib/homepageSections';
import PromptCollection from './PromptCollection';
import type { PromptCardTemplate } from '../lib/promptCardTemplates';
import Loader from './Loader';

type Shelf = HomepageSection & {prompts:Prompt[];total:number};
export default function HomepageShelves({bookmarkedIds,configuration,template}:{bookmarkedIds:Set<string>;configuration:HomepageSection[];template:PromptCardTemplate}) {
  const [shelves,setShelves] = useState<Shelf[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(false);
  const [retry,setRetry] = useState(0);
  const configKey = JSON.stringify(configuration);
  useEffect(()=>{
    let disposed=false;
    let controller:AbortController;
    const refresh=async()=>{
      controller?.abort(); controller=new AbortController(); const request=controller;
      try {
        setError(false);
        const response=await fetch('/api/homepage/sections',{signal:request.signal});
        if(!response.ok)throw new Error('homepage sections failed');
        const data=await response.json();
        if(!data.success || !Array.isArray(data.sections))throw new Error('invalid homepage sections');
        if(!disposed && !request.signal.aborted)setShelves(data.sections);
      } catch(error:any) { if(!disposed && !request.signal.aborted && error.name!=='AbortError')setError(true); }
      finally { if(!disposed && !request.signal.aborted)setLoading(false); }
    };
    void refresh(); window.addEventListener('promty:prompt-copied',refresh);
    return ()=>{ disposed=true; controller?.abort(); window.removeEventListener('promty:prompt-copied',refresh); };
  },[configKey,retry]);
  if(loading)return <div className="flex items-center justify-center gap-2 p-8 text-xs text-muted" role="status"><Loader className="h-4 w-4" />در حال دریافت بخش‌های منتخب...</div>;
  if(error)return <div className="rounded-2xl border border-line p-6 text-sm text-muted" role="status">دریافت بخش‌های منتخب انجام نشد. <button type="button" onClick={()=>{setLoading(true);setRetry(n=>n+1);}} className="text-brand underline">تلاش دوباره</button></div>;
  return <div className="space-y-10" data-homepage-shelves>
    {shelves.map(shelf=><div key={shelf.id} data-homepage-section={shelf.id} className="space-y-3">
      {shelf.prompts.length ? <>
        <PromptCollection template={template} prompts={shelf.prompts} bookmarkedIds={bookmarkedIds} sectionId={`homepage-${shelf.id}`} title={shelf.title}
          description={shelf.source==='trending' ? 'محتواهایی با بیشترین کپی ثبت‌شده از زمان انتشار' : 'جدیدترین محتواهای منتشرشده در دستهٔ منتخب'} />
        {shelf.total > shelf.prompts.length && <Link className="inline-block text-xs text-brand font-bold" to={shelf.source==='trending' ? '/?sort=usage#prompt-archive-view' : shelf.useCase ? `/use-case/${encodeURIComponent(shelf.useCase)}#prompt-archive-view` : `/?group=${encodeURIComponent(shelf.group)}#prompt-archive-view`}>مشاهدهٔ همهٔ {shelf.total.toLocaleString('fa-IR')} منبع ←</Link>}
      </> : <section className="rounded-3xl border border-line bg-surface p-8 text-center" aria-label={shelf.title}><h2 className="text-lg font-bold text-primary">{shelf.title}</h2><p className="mt-3 text-sm text-muted">{shelf.source==='trending' ? 'هنوز کپی‌ای برای نمایش در ترندها ثبت نشده است.' : 'در این دسته هنوز محتوایی منتشر نشده است.'}</p></section>}
    </div>)}
  </div>;
}

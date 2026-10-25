import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { chipHref, type HomepageChip } from '../lib/homepageChips';
export default function HomepageQuickChips({ chips }: {
    chips: HomepageChip[];
}) {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const key = JSON.stringify(chips);
    useEffect(() => { const controller = new AbortController(); void fetch('/api/homepage/chips', { signal: controller.signal }).then(r => r.ok ? r.json() : Promise.reject()).then(d => setCounts(d.counts || {})).catch(() => { }); return () => controller.abort(); }, [key]);
    return <nav aria-label="سناریوهای آماده" className="flex flex-wrap justify-center gap-2 mt-5">{chips.filter(c => c.enabled).map(c => {
            const content = <>{c.icon ? <img src={c.icon} alt="" className="w-5 h-5 object-contain"/> : <Sparkles className="w-4 h-4" aria-hidden="true"/>}{c.title}{counts[c.id] !== undefined && <span className="text-muted">({counts[c.id].toLocaleString('fa-IR')})</span>}</>;
            const style = 'flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs text-secondary min-h-11';
            return counts[c.id] === 0 ? <span key={c.id} aria-disabled="true" title="هنوز محتوایی برای این سناریو منتشر نشده است" className={style + ' opacity-40'}>{content}</span> : <Link key={c.id} to={chipHref(c) + '#prompt-archive-view'} className={style + ' hover:border-brand hover:text-brand'}>{content}</Link>;
        })}</nav>;
}

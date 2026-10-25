import { useEffect, useState } from 'react';
import { useCases } from '../lib/archiveCatalog';
import type { HomepageChip } from '../lib/homepageChips';
import MediaLibraryButton from './MediaLibraryButton';
export default function HomepageChipsControls({ value, onChange }: {
    value: HomepageChip[];
    onChange: (v: HomepageChip[]) => void;
}) {
    const [tools, setTools] = useState<any[]>([]);
    useEffect(() => { fetch('/api/taxonomies').then(r => r.json()).then(d => setTools((d.terms || []).filter((x: any) => x.type === 'tool'))).catch(() => { }); }, []);
    const patch = (index: number, next: Partial<HomepageChip>) => onChange(value.map((x, i) => i === index ? { ...x, ...next } : x));
    const move = (i: number, by: number) => { const next = [...value]; [next[i], next[i + by]] = [next[i + by], next[i]]; onChange(next); };
    const input = 'border border-line rounded-xl bg-surface p-2 text-xs w-full';
    return <section className="space-y-4" aria-label="سناریوهای تک‌کلیکی هوم‌پیج"><h4 className="font-bold">سناریوهای آمادهٔ زیر جستجو</h4><p className="text-xs text-muted">حداکثر ۸ چیپ، به ترتیب دلخواه. ابزار اختیاری است و فقط با انتخاب ادمین محدود می‌شود.</p>
 {value.map((chip, i) => <div key={chip.id} className="rounded-xl border border-line p-4 space-y-3"><div className="flex flex-wrap gap-3 items-center"><label className="text-xs"><input type="checkbox" checked={chip.enabled} onChange={e => patch(i, { enabled: e.target.checked })}/> فعال</label><button type="button" disabled={!i} onClick={() => move(i, -1)} className="text-xs disabled:opacity-30">↑ بالا</button><button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="text-xs disabled:opacity-30">↓ پایین</button><button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-danger-text text-xs mr-auto">حذف سناریو</button></div>
 <div className="grid sm:grid-cols-3 gap-3"><label className="text-xs space-y-1">عنوان<input maxLength={60} value={chip.title} onChange={e => patch(i, { title: e.target.value })} className={input}/></label><label className="text-xs space-y-1">کاربرد<select value={chip.useCase} onChange={e => patch(i, { useCase: e.target.value })} className={input}>{useCases.map(u => <option key={u.slug} value={u.slug}>{u.title}</option>)}</select></label><label className="text-xs space-y-1">ابزار اختیاری<select value={chip.tool} onChange={e => patch(i, { tool: e.target.value })} className={input}><option value="">همهٔ ابزارها</option>{tools.map(t => <option key={t.slug} value={t.slug}>{t.titleFa}</option>)}</select></label></div>
 <div className="flex items-center flex-wrap gap-3">{chip.icon && <img src={chip.icon} alt="" className="h-10 w-10 object-contain"/>}<MediaLibraryButton label="آپلود آیکن SVG / انتخاب از کتابخانه" onSelect={urls => patch(i, { icon: urls[0] })}/>{chip.icon && <button type="button" onClick={() => patch(i, { icon: '' })} className="text-xs text-muted">برداشتن آیکن</button>}</div></div>)}
 <button type="button" disabled={value.length >= 8} className="border border-line rounded-xl p-3 text-xs text-brand disabled:opacity-30" onClick={() => onChange([...value, { id: crypto.randomUUID(), title: 'سناریوی جدید', useCase: useCases[0].slug, tool: '', icon: '', enabled: true }])}>+ افزودن سناریو</button></section>;
}

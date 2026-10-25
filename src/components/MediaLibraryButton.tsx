import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './AuthContext';
import { Z } from '../lib/zIndex';
type Item = {
    url: string;
    name: string;
    bytes: number;
    uses: number;
    createdAt: string;
};
function Thumbnail({ url, name, token }: {
    url: string;
    name: string;
    token: string | null;
}) {
    const [src, setSrc] = useState('');
    useEffect(() => { const controller = new AbortController(); let blobUrl = ''; void fetch('/api/admin/media/file?url=' + encodeURIComponent(url), { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }).then(r => r.ok ? r.blob() : Promise.reject()).then(blob => { if (!controller.signal.aborted) {
        blobUrl = URL.createObjectURL(blob);
        setSrc(blobUrl);
    } }).catch(() => { }); return () => { controller.abort(); if (blobUrl)
        URL.revokeObjectURL(blobUrl); }; }, [url, token]);
    return src ? <img src={src} alt={name} className="w-full h-24 object-contain rounded-lg bg-surface-soft"/> : <span className="flex h-24 items-center justify-center text-[10px] text-muted">در حال دریافت تصویر…</span>;
}
export default function MediaLibraryButton({ onSelect, multiple = false, label = 'انتخاب از کتابخانه' }: {
    onSelect: (urls: string[]) => void;
    multiple?: boolean;
    label?: string;
}) {
    const { token } = useAuth();
    const dialog = useRef<HTMLDialogElement>(null);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const headers = { Authorization: `Bearer ${token}` };
    const load = async () => { const res = await fetch('/api/admin/media', { headers }); const data = await res.json(); if (!res.ok)
        throw Error('دریافت کتابخانه انجام نشد.'); setItems(data.items); };
    useEffect(() => { if (!open)
        return; let alive = true; setSelected([]); setQuery(''); setError(''); dialog.current?.showModal(); void load().catch(e => { if (alive)
        setError(e.message); }); return () => { alive = false; dialog.current?.close(); }; }, [open]);
    const upload = async (file?: File) => { if (!file)
        return; setBusy(true); setError(''); try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/admin/media', { method: 'POST', headers, body: form });
        const data = await res.json();
        if (!res.ok)
            throw Error(data.message);
        await load();
        setSelected(old => multiple ? [...old, data.url] : [data.url]);
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } };
    const apply = async () => { setBusy(true); setError(''); try {
        const urls = [];
        for (const url of selected) {
            const res = await fetch('/api/admin/media/reuse', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
            const data = await res.json();
            if (!res.ok)
                throw Error(data.message);
            urls.push(data.url);
        }
        onSelect(urls);
        setOpen(false);
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } };
    const remove = async (item: Item) => { if (!window.confirm('این فایلِ بدون استفاده از کتابخانه کنار گذاشته شود؟'))
        return; setBusy(true); try {
        const res = await fetch('/api/admin/media?url=' + encodeURIComponent(item.url), { method: 'DELETE', headers });
        const data = await res.json();
        if (!res.ok)
            throw Error(data.message);
        setSelected(old => old.filter(x => x !== item.url));
        await load();
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } };
    return <><button type="button" className="rounded-xl border border-line px-3 py-2 text-xs font-bold text-brand min-h-11" onClick={() => setOpen(true)}>{label}</button>{open && createPortal(<dialog ref={dialog} style={{ zIndex: Z.MODAL }} className="media-library-dialog bg-surface text-primary rounded-2xl border border-line p-0 w-[min(900px,95vw)] max-h-[90dvh]" onCancel={() => setOpen(false)} onClick={e => { if (e.target === dialog.current) {
            const b = dialog.current.getBoundingClientRect();
            if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)
                setOpen(false);
        } }} aria-labelledby="media-library-title">
  <div className="p-5 space-y-4" dir="rtl"><div className="flex justify-between gap-3"><h2 id="media-library-title" className="font-bold">کتابخانهٔ رسانهٔ ادمین‌ها</h2><button type="button" onClick={() => setOpen(false)} aria-label="بستن کتابخانه" className="min-h-11 px-3">×</button></div>
  <p className="text-xs text-muted">تصاویر همهٔ ادمین‌ها؛ انتخاب تصویر آن را در فرم قرار می‌دهد و با ذخیرهٔ فرم اعمال می‌شود. SVG امن هنگام آپلود به WebP تبدیل می‌شود.</p>
  <div className="flex flex-wrap gap-3"><input aria-label="جستجوی رسانه" value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در نام فایل‌ها" className="border border-line bg-surface-soft rounded-xl p-3 text-sm flex-1 min-w-0"/><label className="cursor-pointer rounded-xl bg-brand-solid text-white p-3 text-xs">آپلود تصویر جدید<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={busy} className="sr-only" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }}/></label></div>
  {error && <p role="alert" className="text-danger-text text-sm">{error}</p>}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[50dvh] overflow-y-auto">{items.filter(x => x.name.includes(query)).map(item => <div key={item.url} className={`border rounded-xl p-2 ${selected.includes(item.url) ? 'border-brand bg-brand-soft' : 'border-line'}`}><button type="button" disabled={busy} aria-pressed={selected.includes(item.url)} className="w-full text-right" onClick={() => setSelected(old => old.includes(item.url) ? old.filter(x => x !== item.url) : multiple ? [...old, item.url] : [item.url])}><Thumbnail url={item.url} name={item.name} token={token}/><span className="block text-[10px] truncate my-2" dir="ltr">{item.name}</span></button><div className="text-[10px] text-muted flex justify-between items-center"><span>{item.uses} محل استفاده</span><button type="button" disabled={busy || item.uses > 0 || item.url === '/dl/brand/logo.webp'} onClick={() => void remove(item)} className="text-danger-text disabled:opacity-40 px-2 min-h-9">حذف</button></div></div>)}</div>
  {!items.length && <p className="text-sm text-muted">هنوز تصویری در کتابخانه نیست.</p>}
  <div className="flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="border border-line rounded-xl px-4 py-3 text-xs">انصراف</button><button type="button" disabled={busy || !selected.length} onClick={() => void apply()} className="bg-brand-solid text-white rounded-xl px-4 py-3 text-xs disabled:opacity-40">{busy ? 'در حال انجام…' : `انتخاب (${selected.length})`}</button></div></div>
 </dialog>, document.body)}</>;
}

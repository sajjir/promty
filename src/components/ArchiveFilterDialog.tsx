import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Search, SlidersHorizontal, X, ChevronDown, FileText, Bot, WandSparkles, Gift, Crown, ImagePlus } from 'lucide-react';
import { archiveFilterKeys, readFilterValues, type SelectionUpdate } from '../lib/archiveFilters';
import { applyFilterDraft, clearFilterDraft, createFilterDraft, filterSelectionCount, updateFilterDraft } from '../lib/filterDraft';
import { useCases, useCaseGroups, useCaseInGroups, getUseCase, resourceTypes, outputLabels } from '../lib/archiveCatalog';
import { Z } from '../lib/zIndex';
import './archive-filter-dialog.css';
type Option = {
    value: string;
    label: string;
    icon?: typeof FileText;
};
type Taxonomy = {
    slug: string;
    titleFa: string;
};
type Counts = Record<string, Record<string, number>>;
type Preview = {
    total: number;
    archiveFacets: Counts;
    facets: Counts;
};
type Props = {
    params: URLSearchParams;
    taxonomies: {
        tool: Taxonomy[];
        intent: Taxonomy[];
        domain: Taxonomy[];
        difficulty: Taxonomy[];
        language: Taxonomy[];
    };
    onApply: (params: URLSearchParams) => void;
    onClose: () => void;
};
const normalize = (value: string) => value.toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, ' ');
export function FacetChoices({ label, options, selected, counts, pending, onChange, searchable = false, tiles = false }: {
    label: string;
    options: Option[];
    selected: string[];
    counts?: Record<string, number>;
    pending: boolean;
    onChange: (update: SelectionUpdate) => void;
    searchable?: boolean;
    tiles?: boolean;
}) {
    const id = useId();
    const [query, setQuery] = useState('');
    const visible = options.filter(item => !query || normalize(item.label + ' ' + item.value).includes(normalize(query.trim())));
    return <div className={`af-choices ${tiles ? "af-tiles" : ""}`} >
  {searchable && options.length > 6 && <label className="af-search"><Search aria-hidden="true"/><input aria-label={`جستجو در ${label}`} value={query} onChange={e => setQuery(e.target.value)} placeholder={`جستجو در ${label}…`}/></label>}
  <div className="af-option-list" role="group" aria-label={label}>{visible.map(item => {
            const checked = selected.includes(item.value);
            const count = counts?.[item.value.toLowerCase()];
            const disabled = !pending && count === 0 && !checked;
            return <label key={item.value} className="af-option" data-disabled={disabled} htmlFor={`${id}-${item.value}`}><input id={`${id}-${item.value}`} type="checkbox" checked={checked} disabled={disabled} onChange={() => onChange(current => current.includes(item.value) ? current.filter(x => x !== item.value) : [...current, item.value])}/>{tiles && item.icon && <item.icon className="af-tile-icon" aria-hidden="true"/>}<span>{item.label}</span><span className="af-count" aria-label={count === undefined ? 'شمارنده در حال دریافت' : `${count} منبع`}>{pending ? '…' : (count ?? 0).toLocaleString('fa-IR')}</span></label>;
        })}{!visible.length && <p className="af-hint">گزینه‌ای مطابق این عبارت پیدا نشد.</p>}</div>
 </div>;
}
export default function ArchiveFilterDialog({ params, taxonomies, onApply, onClose }: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const body = useRef<HTMLDivElement>(null);
    const [draft, setDraft] = useState(() => createFilterDraft(params));
    const [useCaseQuery, setUseCaseQuery] = useState('');
    const [response, setResponse] = useState<{
        key: string;
        data?: Preview;
        error?: string;
    }>({ key: '' });
    const [retry, setRetry] = useState(0);
    const key = draft.toString();
    const pending = response.key !== key || (!response.data && !response.error);
    const data = response.data;
    const groups = readFilterValues(draft, 'group');
    const selectedCases = readFilterValues(draft, 'useCase');
    const roots = useCaseGroups.filter(g => !g.parent);
    const change = (facet: string, update: SelectionUpdate) => setDraft(current => updateFilterDraft(current, facet, update));
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        dialog.current?.showModal();
        document.body.style.overflow = 'hidden';
        return () => { dialog.current?.close(); document.body.style.overflow = overflow; if (previous?.isConnected)
            previous.focus(); };
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            const query = new URLSearchParams(draft);
            query.set('isActive', 'true');
            query.set('limit', '1');
            query.set('page', '1');
            try {
                const result = await fetch('/api/prompts?' + query.toString(), { signal: controller.signal });
                const json = await result.json();
                if (!result.ok || !json.success || !Number.isFinite(json.pagination?.total))
                    throw Error('دریافت شمارنده‌ها انجام نشد.');
                if (!controller.signal.aborted)
                    setResponse({ key, data: { total: json.pagination.total, archiveFacets: json.archiveFacets || {}, facets: json.facets || {} } });
            }
            catch (error: any) {
                if (!controller.signal.aborted)
                    setResponse({ key, error: error.message || 'دریافت نتایج انجام نشد.' });
            }
        }, 180);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [key, retry]);
    const count = filterSelectionCount(draft);
    const cases = useCases.filter(u => (useCaseInGroups(u.slug, groups) || selectedCases.includes(u.slug)) && (!useCaseQuery || normalize([u.title, ...u.aliases].join(' ')).includes(normalize(useCaseQuery.trim()))))
        .filter(u => selectedCases.includes(u.slug) || !!data && (data.archiveFacets.useCases?.[u.slug] || 0) > 0)
        .sort((a, b) => Number(selectedCases.includes(b.slug)) - Number(selectedCases.includes(a.slug)) || (data?.archiveFacets.useCases?.[b.slug] || 0) - (data?.archiveFacets.useCases?.[a.slug] || 0) || a.title.localeCompare(b.title, 'fa'));
    const label = (facet: string, value: string) => facet === 'group' ? useCaseGroups.find(g => g.slug === value)?.title || value : facet === 'useCase' ? getUseCase(value)?.title || value : facet === 'resourceType' ? resourceTypes[value as keyof typeof resourceTypes] || value : facet === 'outputFormat' ? outputLabels[value] || value : facet === 'access' ? (value === 'premium' ? 'پریمیوم' : 'رایگان') : facet === 'referenceImage' ? 'نیازمند تصویر ورودی' : taxonomies[facet as keyof typeof taxonomies]?.find(x => x.slug.toLowerCase() === value)?.titleFa || value;
    const facets = [{ key: 'tool', title: 'ابزارهای هوش مصنوعی', counts: data?.facets.tools, options: taxonomies.tool.map(x => ({ value: x.slug.toLowerCase(), label: x.titleFa })) }, { key: 'outputFormat', title: 'خروجی مورد انتظار', counts: data?.archiveFacets.outputFormats, options: Object.entries(outputLabels).map(([value, label]) => ({ value, label })) }, ...(['intent', 'domain', 'difficulty', 'language'] as const).map(facet => ({ key: facet, title: { intent: 'هدف مکمل', domain: 'حوزهٔ موضوعی', difficulty: 'سطح دشواری', language: 'زبان' }[facet], counts: data?.facets[{ intent: 'intents', domain: 'domains', difficulty: 'difficulties', language: 'languages' }[facet]], options: taxonomies[facet].map(x => ({ value: x.slug.toLowerCase(), label: x.titleFa })) }))];
    const keepFocus = (event: ReactKeyboardEvent<HTMLDialogElement>) => {
        if (event.key !== 'Tab') return;
        const elements = Array.from((event.currentTarget as HTMLDialogElement).querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex]:not([tabindex="-1"])')).filter(node => node.tabIndex >= 0 && node.getClientRects().length > 0);
        const first = elements[0], last = elements[elements.length - 1];
        if (first && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    return createPortal(<dialog ref={dialog} id="archive-filter-dialog" onKeyDown={keepFocus} className="af-dialog" style={{ zIndex: Z.MODAL }} aria-labelledby="af-title" aria-describedby="af-description" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) {
        const rect = dialog.current.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
            onClose();
    } }}>
  <header className="af-header"><div><h2 id="af-title"><SlidersHorizontal aria-hidden="true"/>فیلترهای آرشیو</h2><p id="af-description">در هر بخش می‌توانید چند گزینه انتخاب کنید.</p></div><button type="button" onClick={onClose} className="af-close" aria-label="بستن فیلترها بدون اعمال"><X aria-hidden="true"/></button></header>
  <div className="af-body" ref={body}>
   {draft.get('q') && <p className="af-context">در جستجوی «{draft.get('q')}»</p>}
   {count > 0 && <section className="af-selected" aria-label="انتخاب‌های داخل پنجره"><div className="af-section-heading"><h3>انتخاب‌های شما <span>{count.toLocaleString('fa-IR')}</span></h3><button type="button" onClick={() => setDraft(current => clearFilterDraft(current))}>پاک‌سازی فیلترها</button></div><div className="af-selected-list">{archiveFilterKeys.flatMap(facet => readFilterValues(draft, facet).map(value => <button type="button" key={`${facet}:${value}`} aria-label={`برداشتن ${label(facet, value)}`} onClick={() => change(facet, current => current.filter(x => x !== value))}>{label(facet, value)}<X aria-hidden="true"/></button>))}</div></section>}
   <section className="af-priority" aria-label="فیلترهای اصلی محتوا">
    <section className="af-section"><h3>نوع محتوا <small>چندانتخابی</small></h3><FacetChoices tiles label="نوع محتوا" options={[{value:'prompt',label:'پرامپت',icon:FileText},{value:'skill',label:'اسکیل',icon:WandSparkles},{value:'agent-guide',label:'ایجنت',icon:Bot}]} selected={readFilterValues(draft,'resourceType')} counts={data?.archiveFacets.resourceTypes} pending={pending} onChange={values=>change('resourceType',values)}/></section>
    <section className="af-section"><h3>وضعیت محتوا <small>چندانتخابی</small></h3><FacetChoices tiles label="وضعیت محتوا" options={[{value:'free',label:'رایگان',icon:Gift},{value:'premium',label:'پریمیوم',icon:Crown}]} selected={readFilterValues(draft,'access')} counts={data?.archiveFacets.access} pending={pending} onChange={values=>change('access',values)}/></section>
    <section className="af-section"><h3>براساس تصویر مرجع</h3><FacetChoices tiles label="تصویر مرجع" options={[{value:'required',label:'نیازمند عکس یا اسکرین‌شات',icon:ImagePlus}]} selected={readFilterValues(draft,'referenceImage')} counts={data?.archiveFacets.referenceImage} pending={pending} onChange={values=>change('referenceImage',values)}/></section>
   </section>
   <section className="af-section" aria-labelledby="af-groups"><div className="af-section-heading"><h3 id="af-groups">چه کاری می‌خواهید انجام دهید؟</h3><span className="af-hint">چند دسته قابل انتخاب است</span></div><FacetChoices label="دسته‌های کاربرد" options={roots.map(g => ({ value: g.slug, label: g.title }))} selected={groups} counts={data?.archiveFacets.groups} pending={pending} onChange={values => change('group', values)}/>
    <div className="af-section-heading af-usecase-heading"><h3>کاربرد مشخص</h3><span className="af-hint">اختیاری · چندانتخابی</span></div>
    <label className="af-search"><Search aria-hidden="true"/><input autoComplete="off" aria-label="جستجوی کاربرد" placeholder="مثلاً تصویر محصول، کپشن یا یادگیری…" value={useCaseQuery} onChange={e => setUseCaseQuery(e.target.value)}/></label>
    {pending && !data ? <p className="af-hint" role="status">در حال دریافت کاربردهای دارای محتوا…</p> : <FacetChoices label="کاربردهای مشخص" options={cases.map(u => ({ value: u.slug, label: u.title }))} selected={selectedCases} counts={data?.archiveFacets.useCases} pending={pending} onChange={values => change('useCase', values)}/>}
   </section>

   <div className="af-facets">{facets.map(facet => <details key={facet.key} className="af-facet"><summary><span>{facet.title}</span>{readFilterValues(draft, facet.key).length > 0 && <span className="af-badge">{readFilterValues(draft, facet.key).length.toLocaleString('fa-IR')}</span>}<ChevronDown aria-hidden="true"/></summary><FacetChoices label={facet.title} options={facet.options} counts={facet.counts} selected={readFilterValues(draft, facet.key)} pending={pending} onChange={values => change(facet.key, values)} searchable/></details>)}</div>
  </div>
  <footer className="af-footer"><div className="af-status" role="status" aria-live="polite">{pending ? 'در حال شمردن نتایج…' : response.error ? <><span role="alert">دریافت شمارنده‌ها انجام نشد.</span><button type="button" onClick={() => { setResponse({ key: '' }); setRetry(n => n + 1); }}>تلاش دوباره</button></> : data?.total === 0 ? 'با این ترکیب نتیجه‌ای نداریم؛ چند گزینه را بردارید.' : `${(data?.total || 0).toLocaleString('fa-IR')} منبع با انتخاب‌های شما`}</div><div className="af-actions"><button type="button" className="af-cancel" onClick={onClose}>انصراف</button><button type="button" className="af-apply" disabled={pending || !!response.error || !data || data.total === 0} onClick={() => { onApply(applyFilterDraft(draft)); onClose(); }}>نمایش {!pending && data ? data.total.toLocaleString('fa-IR') : ''} نتیجه</button></div></footer>
 </dialog>, document.body);
}

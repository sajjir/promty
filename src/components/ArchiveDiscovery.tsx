import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Search, ImagePlus } from 'lucide-react';
import { useCases, useCaseGroups, useCaseInGroups, resourceTypes, outputLabels, groupAncestors, getUseCase, expandGroupFilters, type ResourceType } from '../lib/archiveCatalog';
import { readFilterValues, type SelectionUpdate } from '../lib/archiveFilters';
import { resourceTypeIcons } from '../lib/resourceTypeIcons';
import ArchiveMultiSelect from './ArchiveMultiSelect';

type Counts = Record<string, Record<string, number>>;
const normalizeQuery = (value: string) => value.toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, ' ');

const GroupUseCases: React.FC<{
  group: { slug: string; title: string }; counts: Record<string, number>; selected: string[]; onChange: (values: SelectionUpdate) => void;
}> = ({ group, counts, selected, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const items = useCases.filter(item => useCaseInGroups(item.slug, [group.slug]) && ((counts[item.slug] || 0) > 0 || selected.includes(item.slug)))
    .sort((a, b) => (counts[b.slug] || 0) - (counts[a.slug] || 0) || a.title.localeCompare(b.title, 'fa'));
  const filtered = items.filter(item => !query || normalizeQuery([item.title, ...item.aliases].join(' ')).includes(normalizeQuery(query.trim())));
  const selectedItems = filtered.filter(item => selected.includes(item.slug));
  const visible = expanded || query ? filtered : [...selectedItems, ...filtered.filter(item => !selected.includes(item.slug)).slice(0, Math.max(0, 6 - selectedItems.length))];
  return <section aria-label={`کاربردهای ${group.title}`} className="rounded-xl border border-line bg-surface-soft p-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-bold text-primary">{group.title}</h3>
      {items.some(item => selected.includes(item.slug)) && <button type="button" className="text-xs text-brand underline min-h-9" onClick={() => onChange(current => current.filter(slug => !useCaseInGroups(slug, [group.slug])))}>پاک کردن انتخاب‌های این دسته</button>}
    </div>
    <p className="text-xs text-muted">انتخاب کاربرد اختیاری است؛ برای محدود کردن نتیجه، یک یا چند مورد را انتخاب کنید.</p>
    {items.length > 6 && <div className="relative">
      <Search className="absolute right-3 top-3 h-4 w-4 text-muted" aria-hidden="true" />
      <input aria-label={`جستجوی کاربرد در ${group.title}`} value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجو در کاربردهای همین دسته" className="w-full rounded-lg border border-line bg-surface px-3 pr-9 py-2.5 text-xs text-primary" />
    </div>}
    <div className="flex flex-wrap gap-2" role="group" aria-label={`انتخاب کاربرد در ${group.title}`}>
      {visible.map(item => <button key={item.slug} type="button" aria-pressed={selected.includes(item.slug)} title={item.expectedResult} onClick={() => onChange(current => current.includes(item.slug) ? current.filter(slug => slug !== item.slug) : [...current, item.slug])}
        className={`min-h-11 rounded-lg border px-3 py-2 text-xs transition-colors ${selected.includes(item.slug) ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-secondary hover:border-brand'}`}>
        {item.title}<span className="mr-2 text-muted">{counts[item.slug] || 0}</span>
      </button>)}
    </div>
    {!items.length && <p className="text-xs text-muted">با فیلترهای فعلی، کاربرد دارای محتوا در این دسته پیدا نشد.</p>}
    {!!items.length && !filtered.length && <p className="text-xs text-muted">کاربردی مطابق جستجوی شما پیدا نشد.</p>}
    {!query && (expanded || filtered.length > visible.length) && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="flex items-center gap-1 min-h-11 text-xs font-bold text-brand">
      {expanded ? 'نمایش کمتر' : `نمایش همه کاربردهای این دسته (${items.length})`}<ChevronDown className={`h-4 w-4 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>}
  </section>;
}

export default function ArchiveDiscovery({ params, counts, onChange }: {
  params: URLSearchParams; counts: Counts; onChange: (key: string, values: SelectionUpdate) => void;
}) {
  const tabsId = useId();
  const reducedMotion = useReducedMotion();
  const tabsViewport = useRef<HTMLDivElement>(null);
  const groups = expandGroupFilters(readFilterValues(params, 'group'));
  const selectedUseCases = readFilterValues(params, 'useCase');
  const needsReferenceImage = readFilterValues(params, 'referenceImage').includes('required');
  const roots = useCaseGroups.filter(group => !group.parent);
  const activeRoots = roots.filter(root => groups.some(selected => groupAncestors(selected).includes(root.slug)) || selectedUseCases.some(slug => groupAncestors(getUseCase(slug)?.group).includes(root.slug)));
  // URL order records the last selected category, including restored filter links.
  const orderedRoots = [...groups, ...(!groups.length ? selectedUseCases.map(slug => getUseCase(slug)?.group || '') : [])]
    .map(slug => groupAncestors(slug).find(ancestor => roots.some(root => root.slug === ancestor)))
    .filter(Boolean);
  const selectionKey = groups.join(',');
  const [focus, setFocus] = useState<{ selectionKey: string; slug: string } | null>(null);
  // Discard manual focus when the category selection changes, even if an old URL returns.
  if (focus && focus.selectionKey !== selectionKey) setFocus(null);
  const focusedSlug = focus?.selectionKey === selectionKey && activeRoots.some(root => root.slug === focus.slug)
    ? focus.slug : orderedRoots[orderedRoots.length - 1];
  const focusedGroup = activeRoots.find(root => root.slug === focusedSlug) || activeRoots[activeRoots.length - 1];
  useEffect(() => {
    const viewport = tabsViewport.current;
    const activeTab = viewport?.querySelector('input:checked + label');
    if (!viewport || !activeTab) return;
    const bounds = viewport.getBoundingClientRect();
    const tabBounds = activeTab.getBoundingClientRect();
    const distance = tabBounds.left < bounds.left ? tabBounds.left - bounds.left
      : tabBounds.right > bounds.right ? tabBounds.right - bounds.right : 0;
    if (distance) viewport.scrollBy({ left: distance, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [focusedGroup?.slug, selectionKey, reducedMotion]);
  const toggleGroup = (slug: string) => onChange('group', current => {
    const selected = expandGroupFilters(current);
    return selected.includes(slug) ? selected.filter(item => item !== slug && !groupAncestors(item).includes(slug)) : [...selected.filter(item => !groupAncestors(item).includes(slug)), slug];
  });
  return <section aria-label="مرور بر اساس کاربرد" className="rounded-2xl border border-line bg-surface p-5 space-y-4">
    <div><h2 className="font-bold text-lg text-primary">چه کاری می‌خواهید انجام دهید؟</h2>
      <p className="text-sm text-muted mt-1">ابتدا دسته را انتخاب کنید؛ کاربردهای آخرین دسته انتخاب‌شده در کادر زیر نمایش داده می‌شوند.</p>
      <p className="text-xs text-muted mt-2">می‌توانید چند دسته یا کاربرد را انتخاب کنید؛ ابزار، نوع منبع و خروجی فیلترهای مکمل‌اند.</p></div>
    <div className="rounded-xl border border-brand/30 bg-brand-soft/40 p-3 sm:p-4 space-y-2" aria-label="فیلتر تصویر ورودی">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-primary"><ImagePlus className="h-4 w-4 text-brand" aria-hidden="true" />با تصویر خودتان کار می‌کنید؟</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="نیاز به تصویر ورودی">
          <button type="button" aria-pressed={!needsReferenceImage} onClick={() => onChange('referenceImage', [])}
            className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold ${!needsReferenceImage ? 'border-brand bg-surface text-brand' : 'border-line bg-surface text-secondary'}`}>همه منابع</button>
          <button type="button" aria-pressed={needsReferenceImage} onClick={() => onChange('referenceImage', ['required'])}
            className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold ${needsReferenceImage ? 'border-brand bg-brand-solid text-white' : 'border-line bg-surface text-secondary hover:border-brand'}`}>
            نیازمند تصویر ورودی <span className="mr-1.5">({(counts.referenceImage?.required || 0).toLocaleString('fa-IR')})</span>
          </button>
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed">برای ویرایش، تحلیل یا بازآفرینی عکس و اسکرین‌شات خودتان. این گزینه نیاز به تصویر ورودی را مشخص می‌کند؛ خروجی می‌تواند تصویر، متن یا کد باشد.</p>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="گروه کاربردها">
      <button type="button" aria-pressed={!groups.length} onClick={() => onChange('group', [])} className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${!groups.length ? 'border-brand bg-brand-soft text-brand' : 'border-line text-secondary'}`}>همه کاربردها</button>
      {roots.map(item => <button key={item.slug} type="button" aria-pressed={groups.includes(item.slug)} onClick={() => toggleGroup(item.slug)}
        className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${groups.includes(item.slug) ? 'border-brand bg-brand-soft text-brand' : 'border-line text-secondary'}`}>
        {item.title} ({counts.groups?.[item.slug] || 0})
      </button>)}
    </div>
    {focusedGroup && <div className="space-y-3" aria-label="کاربردهای دسته‌های انتخاب‌شده">
      {activeRoots.length > 1 && <div className="space-y-2">
        <p className="text-xs text-muted">کاربردهای کدام دسته؟</p>
        <div ref={tabsViewport} className="max-w-full overflow-x-auto pb-2">
          <div className="tabs relative inline-flex min-w-max gap-1 rounded-full border border-line bg-surface p-2 shadow-sm" role="radiogroup" aria-label="نمایش کاربردهای یک دسته منتخب">
            {activeRoots.map(group => {
              const active = group.slug === focusedGroup.slug;
              const selectedCount = selectedUseCases.filter(slug => useCaseInGroups(slug, [group.slug])).length;
              return <div key={group.slug} className="relative shrink-0">
                <input type="radio" id={`${tabsId}-${group.slug}`} name={tabsId} checked={active} className="peer sr-only"
                  aria-controls="focused-use-cases" onChange={() => setFocus({ selectionKey, slug: group.slug })} />
                <label htmlFor={`${tabsId}-${group.slug}`} className={`tab relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand sm:px-4 ${active ? 'text-brand' : 'text-secondary hover:text-brand'}`}>
                  {active && <motion.span layoutId={`${tabsId}-glider`} className="glider pointer-events-none absolute inset-0 rounded-full bg-brand-soft" transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }} aria-hidden="true" />}
                  <span className="relative">{group.title}</span>
                  {selectedCount > 0 && <span className={`notification relative flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] ${active ? 'bg-brand text-white' : 'bg-brand-soft text-brand'}`}>
                    <span aria-hidden="true">{selectedCount.toLocaleString('fa-IR')}</span>
                    <span className="sr-only">{selectedCount.toLocaleString('fa-IR')} کاربرد انتخاب‌شده</span>
                  </span>}
                </label>
              </div>;
            })}
          </div>
        </div>
      </div>}
      <div id="focused-use-cases">
        <GroupUseCases key={focusedGroup.slug} group={focusedGroup} counts={counts.useCases || {}} selected={selectedUseCases} onChange={values => onChange('useCase', values)} />
      </div>
    </div>}
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1 text-sm text-secondary"><span>نوع منبع</span>
        <ArchiveMultiSelect label="نوع منبع" placeholder="همه منابع" selected={readFilterValues(params,'resourceType')} onChange={values => onChange('resourceType', values)}
          options={Object.entries(resourceTypes).map(([value,label]) => ({value,label,icon:resourceTypeIcons[value as ResourceType],count:counts.resourceTypes?.[value] || 0}))} />
      </div>
      <div className="space-y-1 text-sm text-secondary"><span>خروجی مورد انتظار</span>
        <ArchiveMultiSelect label="خروجی مورد انتظار" placeholder="همه خروجی‌ها" selected={readFilterValues(params,'outputFormat')} onChange={values => onChange('outputFormat', values)}
          options={Object.entries(outputLabels).map(([value,label]) => ({value,label,count:counts.outputFormats?.[value] || 0}))} />
      </div>
    </div>
  </section>;
}

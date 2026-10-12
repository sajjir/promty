import { useCases, useCaseGroups, useCaseInGroups, resourceTypes, outputLabels, groupAncestors } from '../lib/archiveCatalog';
import { readFilterValues, SelectionUpdate } from '../lib/archiveFilters';
import ArchiveMultiSelect from './ArchiveMultiSelect';

type Counts = Record<string, Record<string, number>>;
export default function ArchiveDiscovery({ params, counts, onChange }: {
  params: URLSearchParams; counts: Counts; onChange: (key: string, values: SelectionUpdate) => void;
}) {
  const groups = readFilterValues(params, 'group');
  const selectedUseCases = readFilterValues(params, 'useCase');
  const toggleGroup = (slug: string) => onChange('group', current => current.includes(slug) ? current.filter(item => item !== slug) : [...current.filter(item => !groupAncestors(item).includes(slug)), slug]);
  const roots = useCaseGroups.filter(group => !group.parent);
  const children = useCaseGroups.filter(group => group.parent && groups.some(selected => groupAncestors(selected).includes(group.parent!)));
  return <section aria-label="مرور بر اساس کاربرد" className="rounded-2xl border border-line bg-surface p-5 space-y-4">
    <div><h2 className="font-bold text-lg text-primary">چه کاری می‌خواهید انجام دهید؟</h2>
      <p className="text-sm text-muted mt-1">از کاربرد شروع کنید؛ ابزار و نوع خروجی را در صورت نیاز محدود کنید.</p>
      <p className="text-xs text-muted mt-2">در هر فیلتر می‌توانید چند مورد انتخاب کنید؛ نتیجه شامل یکی از آن‌هاست و فیلترهای مختلف با هم اعمال می‌شوند.</p></div>
    <div className="flex flex-wrap gap-2" aria-label="گروه کاربردها">
      <button type="button" aria-pressed={!groups.length} onClick={() => onChange('group', [])} className={`rounded-xl border px-3 py-2 text-sm ${!groups.length ? 'border-brand bg-brand-soft text-brand' : 'border-line text-secondary'}`}>همه کاربردها</button>
      {roots.map(item => <button key={item.slug} type="button" aria-pressed={groups.includes(item.slug)} onClick={() => toggleGroup(item.slug)}
        className={`rounded-xl border px-3 py-2 text-sm ${groups.includes(item.slug) ? 'border-brand bg-brand-soft text-brand' : 'border-line text-secondary'}`}>
        {item.title} ({counts.groups?.[item.slug] || 0})
      </button>)}
    </div>
    {!!children.length && <div className="flex items-center flex-wrap gap-2 border-r-2 border-brand pr-3" aria-label="زیرمجموعه‌های کسب‌وکار">
      <span className="text-xs text-muted">شاخه‌های کسب‌وکار:</span>
      {children.map(item => <button key={item.slug} type="button" aria-pressed={groups.includes(item.slug)} onClick={() => {
        // Selecting a child narrows its parent; sibling/other groups stay independent.
        onChange('group', current => {
          const withoutParent = current.filter(group => group !== item.parent);
          return current.includes(item.slug) ? withoutParent.filter(group => group !== item.slug) : [...withoutParent, item.slug];
        });
      }} className={`rounded-xl border px-3 py-2 text-sm ${groups.includes(item.slug) ? 'border-brand bg-brand-soft text-brand' : 'border-line text-secondary'}`}>{item.title} ({counts.groups?.[item.slug] || 0})</button>)}
    </div>}
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1 text-sm text-secondary"><span>کاربرد مشخص</span>
        <ArchiveMultiSelect label="کاربرد مشخص" placeholder="همه کاربردهای گروه‌های انتخابی" selected={selectedUseCases} onChange={values => onChange('useCase', values)}
          options={useCases.filter(item => useCaseInGroups(item.slug, groups) || selectedUseCases.includes(item.slug)).map(item => ({ value: item.slug, label: item.title, count: counts.useCases?.[item.slug] || 0 }))} />
      </div>
      <div className="space-y-1 text-sm text-secondary"><span>نوع منبع</span>
        <ArchiveMultiSelect label="نوع منبع" placeholder="همه منابع" selected={readFilterValues(params,'resourceType')} onChange={values => onChange('resourceType', values)}
          options={Object.entries(resourceTypes).map(([value,label]) => ({value,label,count:counts.resourceTypes?.[value] || 0}))} />
      </div>
      <div className="space-y-1 text-sm text-secondary"><span>خروجی مورد انتظار</span>
        <ArchiveMultiSelect label="خروجی مورد انتظار" placeholder="همه خروجی‌ها" selected={readFilterValues(params,'outputFormat')} onChange={values => onChange('outputFormat', values)}
          options={Object.entries(outputLabels).map(([value,label]) => ({value,label,count:counts.outputFormats?.[value] || 0}))} />
      </div>
    </div>
  </section>;
}

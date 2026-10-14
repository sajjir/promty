import { useEffect, useId, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { SelectionUpdate } from '../lib/archiveFilters';

type Option = { value: string; label: string; count?: number; icon?: LucideIcon };
export default function ArchiveMultiSelect({ label, options, selected, onChange, placeholder = 'همه موارد' }: {
  label: string; options: Option[]; selected: string[]; onChange: (values: SelectionUpdate) => void; placeholder?: string;
}) {
  const id = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent | FocusEvent) => {
      const details = detailsRef.current;
      if (details?.open && !details.contains(event.target as Node)) details.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      const details = detailsRef.current;
      if (event.key === 'Escape' && details?.open) {
        details.open = false;
        details.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  const [query, setQuery] = useState('');
  const visible = options.filter(option => !query || `${option.label} ${option.value}`.toLowerCase().includes(query.toLowerCase()));
  return <details ref={detailsRef} name="archive-filters" className="relative min-w-0 rounded-xl border border-line bg-surface group">
    <summary aria-label={label} className="cursor-pointer px-3 py-3 text-sm text-primary select-none rounded-xl focus-visible:outline-2 focus-visible:outline-brand">
      {selected.length ? `${label}: ${selected.length} انتخاب` : placeholder}
    </summary>
    <div className="absolute top-full mt-2 right-0 z-40 w-full min-w-56 rounded-xl border border-line bg-surface p-3 shadow-xl" role="group" aria-label={`گزینه‌های ${label}`}>
      <div className="flex justify-between items-center mb-2 text-xs"><span>{label} — انتخاب چندگانه</span><button type="button" className="text-brand underline" onClick={() => onChange([])}>پاک کردن انتخاب‌ها</button></div>
      {options.length > 8 && <input aria-label={`جستجو در ${label}`} value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در گزینه‌ها" className="w-full border border-line bg-surface-soft rounded-lg px-2 py-2 mb-2 text-xs text-primary" />}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {visible.map(option => <label key={option.value} htmlFor={`${id}-${option.value}`} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-surface-soft text-sm text-primary">
          <input id={`${id}-${option.value}`} type="checkbox" checked={selected.includes(option.value)} onChange={() => onChange(current => current.includes(option.value) ? current.filter(value => value !== option.value) : [...current, option.value])} className="accent-violet-500 shrink-0" />
          <span className="min-w-0 flex-1 flex items-center gap-2">{option.icon && <option.icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />}<span>{option.label}</span></span>{option.count !== undefined && <span className="text-xs text-muted">{option.count}</span>}
        </label>)}
        {!visible.length && <p className="text-xs text-muted p-2">گزینه‌ای پیدا نشد.</p>}
      </div>
    </div>
  </details>;
}

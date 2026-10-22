import { getGroup, getUseCase, useCaseInGroups } from './archiveCatalog';

export interface HomepageSection {
  id: string;
  source: 'latest' | 'trending' | 'category';
  title: string;
  enabled: boolean;
  group: string;
  useCase: string;
  limit: number;
}

export function defaultHomepageSections(): HomepageSection[] {
  return [
    {id:'latest',source:'latest',title:'آخرین محتواهای منتشرشده',enabled:true,group:'',useCase:'',limit:20},
    {id:'trending',source:'trending',title:'ترندها',enabled:true,group:'',useCase:'',limit:12},
    ...[
      ['business','منتخب کسب‌وکار و مدیریت'],['social','منتخب سوشال مدیا'],
      ['visual','منتخب طراحی بصری'],['software','منتخب توسعه و اتوماسیون'],
    ].map(([group,title],i)=>({id:`featured-${i+1}`,source:'category' as const,title,enabled:true,group,useCase:'',limit:12})),
  ];
}

/** Read old/missing settings safely; only allowlisted public fields leave storage. */
export function normalizeHomepageSections(value?: unknown): HomepageSection[] {
  const rows = Array.isArray(value) ? value : [];
  return defaultHomepageSections().map(base => {
    const row = rows.find(v => v && typeof v === 'object' && v.id === base.id);
    if (!row) return base;
    const group = base.source === 'category' && typeof row.group === 'string' && (row.group === '' || getGroup(row.group)) ? row.group : base.group;
    const useCase = base.source === 'category' && typeof row.useCase === 'string' && getUseCase(row.useCase)
      && useCaseInGroups(row.useCase,[group]) ? row.useCase : '';
    return {...base,
      title: base.id === 'trending' ? 'ترندها' : typeof row.title === 'string' && row.title.trim() ? row.title.trim().slice(0,80) : base.title,
      enabled: base.id === 'latest' ? true : typeof row.enabled === 'boolean' ? row.enabled : base.enabled,
      group, useCase,
      limit: Number.isInteger(row.limit) && row.limit >= 4 && row.limit <= 24 ? row.limit : base.limit,
    };
  });
}

export function getHomepageSectionsError(value: unknown): string | null {
  const defaults = defaultHomepageSections();
  if (!Array.isArray(value) || value.length !== 6) return 'چیدمان صفحه اصلی باید دقیقاً شش جایگاه داشته باشد.';
  for (let i=0;i<6;i++) {
    const row=value[i], base=defaults[i];
    if (!row || typeof row !== 'object' || row.id !== base.id || row.source !== base.source)
      return 'ترتیب یا نوع جایگاه‌های صفحه اصلی معتبر نیست.';
    if (typeof row.title !== 'string' || !row.title.trim() || row.title.trim().length > 80)
      return `نام جایگاه ${i+1} باید بین ۱ تا ۸۰ نویسه باشد.`;
    if (typeof row.enabled !== 'boolean' || (i === 0 && !row.enabled)) return 'بخش آخرین محتوا و نتایج جستجو باید فعال بماند.';
    if (!Number.isInteger(row.limit) || row.limit < 4 || row.limit > 24) return 'تعداد کارت هر بخش باید بین ۴ تا ۲۴ باشد.';
    if (typeof row.group !== 'string' || typeof row.useCase !== 'string') return 'دسته‌بندی جایگاه معتبر نیست.';
    if (base.source === 'category') {
      if (row.group && !getGroup(row.group)) return `دستهٔ جایگاه ${i+1} شناخته‌شده نیست.`;
      if (row.enabled && !row.group) return `برای جایگاه ${i+1} یک دسته انتخاب کنید.`;
      if (row.useCase && (!getUseCase(row.useCase) || !row.group || !useCaseInGroups(row.useCase,[row.group])))
        return `کاربرد جایگاه ${i+1} باید متعلق به دستهٔ انتخاب‌شده باشد.`;
    } else if (row.group || row.useCase) return 'بخش آخرین‌ها و ترندها دسته‌بندی ثابت ندارد.';
  }
  return null;
}

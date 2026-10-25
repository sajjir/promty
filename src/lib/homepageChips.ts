import { getUseCase } from './archiveCatalog';
export interface HomepageChip {
    id: string;
    title: string;
    useCase: string;
    tool: string;
    icon: string;
    enabled: boolean;
}
const defaults: HomepageChip[] = [['cartoon', 'تبدیل عکس به کارتون', 'vis-09'], ['product', 'تصویر محصول', 'product-image'], ['social', 'کپشن اینستاگرام', 'soc-04'], ['logo', 'طراحی لوگو', 'vis-06'], ['debug', 'رفع خطای کد', 'dev-10'], ['description', 'توضیحات محصول', 'bus-15']].filter(x => getUseCase(x[2])).map(([id, title, useCase]) => ({ id, title, useCase, tool: '', icon: '', enabled: true }));
export function getHomepageChipsError(value: unknown): string | null {
    if (!Array.isArray(value) || value.length > 8)
        return 'حداکثر ۸ سناریو تعریف کنید.';
    const ids = new Set();
    for (const x of value) {
        if (!x || typeof x !== 'object' || Object.keys(x).some(k => !['id', 'title', 'useCase', 'tool', 'icon', 'enabled'].includes(k)) || typeof x.id !== 'string' || !/^[-a-zA-Z0-9]{1,80}$/.test(x.id) || ids.has(x.id) || typeof x.title !== 'string' || !x.title.trim() || x.title.length > 60 || !getUseCase(x.useCase) || typeof x.enabled !== 'boolean' || typeof x.tool !== 'string' || !/^[-a-z0-9]{0,80}$/.test(x.tool) || typeof x.icon !== 'string' || (x.icon !== '' && !/^\/dl\/library\/[a-zA-Z0-9_-]+\.webp$/.test(x.icon)))
            return 'عنوان، کاربرد و آیکن سناریوها را بررسی کنید.';
        ids.add(x.id);
    }
    return null;
}
export const normalizeHomepageChips = (value?: unknown): HomepageChip[] => getHomepageChipsError(value) ? structuredClone(defaults) : structuredClone(value as HomepageChip[]);
export function chipHref(chip: HomepageChip) { return '/use-case/' + encodeURIComponent(chip.useCase) + (chip.tool ? '?tool=' + encodeURIComponent(chip.tool) : ''); }

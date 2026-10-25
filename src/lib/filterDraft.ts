import { archiveFilterKeys, readFilterValues, setFilterValues, type SelectionUpdate } from './archiveFilters';
import { expandGroupFilters, useCaseInGroups } from './archiveCatalog';
export function createFilterDraft(params: URLSearchParams) {
    const next = new URLSearchParams(params);
    const groups = readFilterValues(next, 'group');
    if (groups.length)
        setFilterValues(next, 'group', expandGroupFilters(groups));
    return next;
}
export function updateFilterDraft(params: URLSearchParams, key: string, update: SelectionUpdate) {
    const next = new URLSearchParams(params);
    const current = key === 'group' ? expandGroupFilters(readFilterValues(next, key)) : readFilterValues(next, key);
    const values = typeof update === 'function' ? update(current) : update;
    setFilterValues(next, key, key === 'group' ? expandGroupFilters(values) : values);
    if (key === 'group')
        setFilterValues(next, 'useCase', values.length ? readFilterValues(next, 'useCase').filter(slug => useCaseInGroups(slug, values)) : []);
    next.delete('page');
    return next;
}
export function clearFilterDraft(params: URLSearchParams) { const next = new URLSearchParams(params); for (const key of archiveFilterKeys)
    next.delete(key); next.delete('page'); return next; }
export const filterSelectionCount = (params: URLSearchParams) => archiveFilterKeys.reduce((n, key) => n + readFilterValues(params, key).length, 0);
export function applyFilterDraft(params: URLSearchParams) { const next = new URLSearchParams(params); next.delete('page'); return next; }

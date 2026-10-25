/** Repeated URL keys represent OR choices within a facet; facets combine with AND. */
export const archiveFilterKeys = ['group', 'useCase', 'resourceType', 'outputFormat', 'tool', 'domain', 'intent', 'difficulty', 'language', 'referenceImage', 'access'] as const;
export type FilterSelection = string | string[];
export type SelectionUpdate = string[] | ((current: string[]) => string[]);
export function filterValues(value: unknown): string[] {
  const list = typeof value === 'string' ? [value] : Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  return [...new Set(list.flatMap(item => item.split(',')).map(item => item.trim().slice(0, 100)).filter(Boolean))].slice(0, 30);
}
export function readFilterValues(params: URLSearchParams, key: string): string[] {
  return [...new Set(filterValues(params.getAll(key)).map(value => key === 'intent' && value.toLowerCase() === 'learning' ? 'teaching' : value.toLowerCase()))];
}
export function setFilterValues(params: URLSearchParams, key: string, values: string[]): void {
  params.delete(key);
  filterValues(values).forEach(value => params.append(key, value));
}

import type { FieldSchema } from '../types';

export function parseFieldOption(option: string) {
  const [value, label] = option.split('|');
  return { value: value.trim(), label: (label ?? value).trim() };
}

/** Keep stored values language-neutral; localize only the rendered text. */
export function getPromptFieldDefaults(fields: FieldSchema[]): Record<string, string> {
  return Object.fromEntries(fields.map(field => [field.key,
    field.defaultValue !== undefined ? field.defaultValue :
    field.type === 'switch' ? 'خیر' :
    field.type === 'slider' ? String(field.min ?? 10) :
    ['select', 'radio'].includes(field.type) && field.options?.length ? parseFieldOption(field.options[0]).value : ''
  ]));
}

export function localizePromptFieldValues(fields: FieldSchema[], values: Record<string, string>, language: 'fa' | 'en') {
  const result = { ...values };
  if (language !== 'fa') return result;
  for (const field of fields) {
    const value = values[field.key];
    if (value === undefined) continue;
    if (field.defaultValueFa !== undefined && value === field.defaultValue) {
      result[field.key] = field.defaultValueFa;
      continue;
    }
    const option = field.options?.find(option => parseFieldOption(option).value === value);
    if (option?.includes('|') && !/^\d+(?::\d+)?$/.test(value)) result[field.key] = parseFieldOption(option).label;
  }
  return result;
}

export function missingAdvancedFields(fields: FieldSchema[], values: Record<string, string>) {
  return fields.filter(field => field.advanced && field.required && !values[field.key]?.trim());
}

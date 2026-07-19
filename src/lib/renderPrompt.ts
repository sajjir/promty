export function renderPrompt(
  body: string,
  values: Record<string, string>
): string {
  // جستجو برای متغیرهایی که بین دو کروشه قرار دارند (مانند [[brand_color]])
  return body.replace(/\[\[(\w+)\]\]/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}
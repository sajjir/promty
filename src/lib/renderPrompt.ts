export function renderPrompt(
  body: string,
  values: Record<string, string>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}

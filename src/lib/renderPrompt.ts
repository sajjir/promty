export function renderPrompt(
  body: string,
  values: Record<string, string>
): string {
  return body.replace(/\{\{(\w+)\}\}|\[\[(\w+)\]\]/g, (match, curlyKey, squareKey) => {
    const key = curlyKey || squareKey;
    return values[key] !== undefined ? values[key] : match;
  });
}
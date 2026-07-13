export function renderPrompt(body: string, values: Record<string, string>): string {
  if (!body) return "";

  // مرحله اول: جایگزینی فرمت براکت [[key]]
  let rendered = body.replace(/\[\[(.*?)\]\]/g, (match, key) => {
    const cleanKey = key.trim();
    // اگر کاربر مقداری وارد کرده بود، آن را جایگزین کن. در غیر این صورت همان [[key]] را نشان بده
    return values[cleanKey] !== undefined && values[cleanKey] !== "" 
      ? values[cleanKey] 
      : match;
  });

  // مرحله دوم: جایگزینی فرمت آکولاد {{key}} (برای پشتیبانی از خروجی‌های جدید n8n)
  rendered = rendered.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const cleanKey = key.trim();
    // اگر کاربر مقداری وارد کرده بود، آن را جایگزین کن. در غیر این صورت همان {{key}} را نشان بده
    return values[cleanKey] !== undefined && values[cleanKey] !== "" 
      ? values[cleanKey] 
      : match;
  });

  return rendered;
}
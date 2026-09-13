// src/lib/zIndex.ts
// Single source of truth for the site's stacking order.
// Always import from here instead of hardcoding z-[number] values.
export const Z = {
  DROPDOWN: 20,      // منوهای کشویی/popover های کوچک (مثلاً انتخابگر ابزار "اجرا در...")
  STICKY_BOX: 10,     // باکس چسبان پیش‌نمایش پرامپت
  HEADER: 40,         // نوار بالای سایت
  MODAL: 50,          // مودال‌های تمام‌صفحه (لاگین، ذخیره پرست)
  TOAST: 60,          // اعلان‌های موقت (اگر در آینده اضافه شد)
} as const;

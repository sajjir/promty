# QA/Verifier v005 — بررسی و کاربرد

تاریخ ۲۰۲۶-۱۰-۱۸؛ proposed، بدون شاهد اعمال در n8n.

[متن جاری کامل](current.md)، [System](system-message.txt)، [User برای ویرایشگر](user-message-editor.txt)، [راهنمای مشترک آزمون](../02-design/v006-application-guide.md).

۲۹ fixture ساختاری/منفی، ۱۶ بررسی expression و مرز سازگاری در JavaScript VM، و جایگذاری ۹ ترکیب مرجع در دو زبان پاس شدند. نمونه مرجع دست‌نویس است و بررسی معنایی/گرامری آن بازخوانی انسانیِ همین تألیف است؛ هیچ LLM، n8n یا مدل تصویر اجرا نشد.

[گزارش قرارداد](../02-design/examples/v006/validation-report.json)، [گزارش expression و Code قدیمی](../02-design/examples/v006/expression-report.json)، [مرجع دست‌نویس](../02-design/examples/v006/reference-output.json).

QA در آزمون واقعی باید کاربرد ساختگی، نوع Skill نادرست، گزینه ناسازگار، زبان شکسته، حذف کنترل مفید و ادعای tested بی‌شاهد را اصلاح کند. نودهای دیگر و برنامه در این مرحله تغییر نکرده‌اند.

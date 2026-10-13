# راهنمای استقرار — ارجاع به مرجع جاری
راهنمای قدیمی PostgreSQL/Nginx مستقل کنار گذاشته شده است؛ فرمان‌های آن مبنای استقرار فعلی نیستند.
مرجع اجرای به‌روزرسانی: [SERVER_UPDATE.md](SERVER_UPDATE.md).
هدف پایگاه داده: [PostgreSQL](docs/postgresql.md).
دسترسی محرمانه و تأیید انتشار: [Deployment Agent](docs/deployment-agent.md).
پورت API: 3005. Nginx Proxy Manager کانتینری باید به آدرس قابل دسترس میزبان متصل شود؛ localhost داخل کانتینر همان میزبان نیست. Gateway واقعی قبل از تغییر بررسی شود.

# پرامتی
آرشیو کاربردمحور پرامپت، Skill و راهنمای ایجنت. React/TypeScript/Vite/Tailwind، Express و Prisma/PostgreSQL.

## شروع
مرجع توسعه برنچ release است. [شناخت پروژه](docs/project-context.md) و [AGENTS.md](AGENTS.md) را بخوانید.
نصب: npm ci، تولید کلاینت: npx prisma generate؛ بررسی: npm run lint؛ آزمون: node --import tsx --test tests/*.test.ts؛ ساخت: npm run build؛ اجرا: npm start. پورت API پیش‌فرض 3005 است؛ پیش‌نمایش Vite مستقل 5173.
DATABASE_URL از تنظیمات خصوصی بارگذاری شود. [راهنمای PostgreSQL](docs/postgresql.md)؛ اجرای local خالی با مهاجرت Production متفاوت است. .env.example فقط قالب است. داده واقعی و secrets داخل Git نیستند.

## مراجع
- [تصمیم‌ها](docs/decisions.md) و [نقشه راه](docs/product/roadmap.md)
- [پذیرش لانچ](LAUNCH_CHECKLIST.md)
- [به‌روزرسانی سرور](SERVER_UPDATE.md)
- [دسترسی و پرامپت ایجنت استقرار](docs/deployment-agent.md)
- [ممیزی اولیه؛ سند تاریخی](docs/product/research/launch-audit-2026-10-10.md)

تست محلی و Build اثبات سلامت SMS/Production نیستند. settings/graph هنوز JSON هستند؛ انتقال کامل آن‌ها باقی است. محتوای demo فقط برای local است و کیفیت اجرای AI آن تأیید نشده است.

# مهاجرت به PostgreSQL

هدف تأییدشده: PostgreSQL برای prompts/users/categories/taxonomies/presets/bookmarks. settings و graph فعلی JSON، رسانه روی dl و داده امنیتی .private هستند؛ همه این‌ها باید پشتیبان داشته باشند.

## اجرای محلی جدا
Docker این میزبان نصب است ولی کاربر فعلی مجوز socket ندارد؛ sudo رمز سیستم می‌خواهد. رمز را به چت ارسال نکنید. PostgreSQL محلی باید در volume مستقل، فقط 127.0.0.1:55432 منتشر شود. database جدا مانند promty_local باشد، نه پایگاه سرور. رمز دیتابیس در فایل خصوصی باشد.
پس از آماده‌شدن runtime، DATABASE_URL را به پایگاه محلی تنظیم کنید؛ برای پایگاه تازه و خالی schema را ابتدا جدا بررسی و ایجاد کنید. db push فقط روی پایگاه local خالی مجاز است، نه Production.

## انتقال داده واقعی
۱. مشخص‌کردن ذخیره‌ساز فعلی PM2 و تعداد رکوردهای منبع/مقصد، بدون چاپ secrets.
۲. توقف نویسنده‌ها در زمان نگهداریِ تأییدشده و بکاپ از JSON، PostgreSQL موجود، dl، .env و .private.
۳. rehearsal روی پایگاه جدا و خالی. هیچ جدول PostgreSQL قدیمی reset یا overwrite نشود. شناسه‌ها، روابط parent، نقش‌ها، فارسی، زمان و usageCount حفظ شوند.
۴. ابزار انتقال به صورت پیش‌فرض dry-run است؛ اجرای واقعی به تأیید، backup منطبق با منبع و مقصد خالی نیاز دارد. خطای یک رکورد کل transaction را لغو کند. schema مقصد باید از قبل آماده باشد.
۵. پس از تطبیق تعداد و شناسه‌ها/بدنه‌ها، DATABASE_URL محیط فعال PM2 تنظیم شود. خطای PostgreSQL باعث توقف می‌شود؛ fallback به JSON مجاز نیست.
۶. تست API و مرورگر مدیر/انتشار/نشان/نسخه شخصی؛ حفظ db.json برای settings/graph و بازگشت. هنگام بازگشت داده نوشته‌شده پس از cutover نباید گم شود؛ ابتدا export/تطبیق لازم است.

تا فراهم‌شدن runtime و اطلاعات مقصد، اجرای PostgreSQL یا انتقال داده انجام‌شده اعلام نشود. فعال‌سازی روی سرور به طرح و تأیید جدا نیاز دارد.

## فرمان ابزار انتقال
طرح خواندنی بدون اتصال/نوشتن:
```bash
node scripts/migrate-json-to-postgres.mjs --source /absolute/path/db.json
```
پس از تأیید مالک، بکاپ منطبق، schema آماده و مقصد خالی:
```bash
node scripts/migrate-json-to-postgres.mjs --source /absolute/path/db.json --backup /absolute/private/backup.json --apply --confirm-empty-target
```
DATABASE_URL از محیط خصوصی خوانده می‌شود. ابزار داده را merge/overwrite نمی‌کند؛ تنظیمات/روابط گراف را در JSON نگه می‌دارد. منبع هنگام انتقال نباید نویسنده فعال داشته باشد. صحت count داخل transaction بررسی می‌شود؛ مقایسه بدنه و آزمون رفتار مرحله مستقل است.

## آماده‌سازی runtime توسط مالک روی همین کامپیوتر
در این محیط Docker بدون sudo در دسترس نیست. مالک می‌تواند این فرمان را در ترمینال خودش اجرا کند؛ رمز sudo وارد گفتگو نشود:
```bash
sudo docker compose --env-file /home/sajj/.config/promty/local-postgres.env -f /home/sajj/Documents/Codex/promty/ui-preview/compose.postgres-local.yml up -d
```
فقط یک container/volume جدید محلی و پورت loopback:55432 ایجاد می‌شود. فایل رمز و DATABASE_URL در ~/.config/promty و خارج Git هستند. اجرای این فرمان هنوز انجام نشده و pull تصویر ممکن است به شبکه نیاز داشته باشد. پس از آماده‌شدن، Project Brain schema محلی و rehearsal مهاجرت را اجرا کند. production یا volumeهای دیگر را تغییر ندهید؛ down -v استفاده نشود.

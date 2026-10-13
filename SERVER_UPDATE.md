> به‌روزرسانی ۲۰۲۶-۱۰-۱۴: مالک PostgreSQL را ذخیره‌ساز اصلی تعیین کرده است. JSON+PM2 پایین فقط آخرین وضعیت گزارش‌شده سرور است، نه هدف معماری. برای cutover ابتدا docs/postgresql.md و docs/deployment-agent.md را اجرا کنید. بدون مهاجرت تأییدشده و تطبیق داده‌ها DATABASE_URL را به یک پایگاه خالی تغییر ندهید. دستورهای تاریخی JSON فقط برای حالت سازگاری صریح STORAGE_BACKEND=json هستند؛ راه پیش‌فرض جدید Production نیازمند DATABASE_URL است.

# به‌روزرسانی پرامپتی برای شروع محتواگذاری رسمی

این راهنما مخصوص بسته همراه برنچ `release` است. استقرار واقعی در این جلسه انجام نشده است. پورت برنامه و مقصد Nginx **3005** است. راهنمای قدیمی `DEPLOY.md` برای این ارتقا کافی نیست؛ متغیرهای NextAuth و دستور seed آن را اجرا نکنید.

## ساختار سرور شما طبق آخرین گفتگوی Project Brain

- مسیر نصب: `/var/www/promty`؛ سرویس PM2: `promty-backend` (شناسه قبلی 1).
- ذخیره‌ساز فعال طبق آخرین گزارش: **JSON** در `db.json`؛ داده PostgreSQL قدیمی به این معنا وارد JSON نشده است.
- پروکسی: Nginx Proxy Manager در کانتینر `ngnxproxy-manager-app-1`؛ اتصال گزارش‌شده به میزبان `172.18.0.1:3005`.

این‌ها شواهد گفتگوی قبلی‌اند و سرور در این جلسه مستقیماً بررسی نشده است. `check-release` را اجرا کنید: اگر PostgreSQL گزارش شد، مسیر JSON را ادامه ندهید. نقش مدیر در `db.json` است؛ فایل را جایگزین یا حساب را دوباره ایجاد نکنید.

## قبل از جایگزینی

1. مسیر نصب و working directory سرویس فعلی و نوع ذخیره‌سازی را مشخص کنید. وجود `DATABASE_URL` به معنی انتخاب PostgreSQL است؛ نبود آن در محیط فعال PM2 به معنی JSON است. متغیرهای باقی‌مانده PM2 می‌توانند بر `.env` اولویت داشته باشند؛ هنگام بررسی، محیط سرویس و فایل باید مطابق باشند. اطلاعات ورود را به گفتگو ارسال نکنید.
2. از PostgreSQL (اگر فعال است)، `db.json`، `.env`، `dl/`، `.private/` و مسیرهای خارجی `OTP_STORE_PATH` و `SECURITY_STATE_PATH` بکاپ بگیرید. تنظیمات سایت حتی در حالت PostgreSQL ممکن است در `db.json` باشند. بکاپ خارج از مسیر وب باشد.
برای مشاهده وضعیت سرویس فعال بدون چاپ رمز و توکن، این بررسی خواندنی را اجرا کنید:

```bash
cd /var/www/promty
node --input-type=module <<'JS'
import { execFileSync } from 'node:child_process';
const apps = JSON.parse(execFileSync('pm2', ['jlist'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const app = apps.find(item => item.name === 'promty-backend');
if (!app) throw new Error('promty-backend در فهرست PM2 پیدا نشد.');
const env = app.pm2_env;
console.log({ name: app.name, cwd: env.pm_cwd, storageOverride: env.DATABASE_URL ? 'PostgreSQL' : 'بدون override؛ فایل .env را بررسی کنید', host: env.HOST, port: env.PORT, nodeEnv: env.NODE_ENV, localPreview: env.LOCAL_PREVIEW });
JS
```

اگر محیط PM2 با `.env` تضاد دارد، پیش از توقف/ارتقا آن را حل کنید؛ خروجی کامل `pm2 jlist` را به گفتگو یا فایل عمومی کپی نکنید چون می‌تواند اطلاعات محرمانه داشته باشد.

نسخه قبلی `dist/`، `package.json`، `package-lock.json` و schema را نگه دارید. صفحات عمومی و ورود/انتشار را ابتدا روی staging یا در زمان نگهداری بررسی کنید.

بسته فاقد دیتابیس، اطلاعات کاربران، رسانه و کلیدهاست. محتوای نمونه لوکال به سرور منتقل نمی‌شود. پوشه پروژه را حذف نکنید؛ فایل‌های برنامه را جایگزین کنید و فایل‌های داده و `.env` موجود را حفظ کنید. از `rsync --delete` استفاده نکنید.

## تنظیمات لازم

در `.env` موجود، این نام‌ها را بررسی کنید؛ مقادیر واقعی و کلید JWT قبلی را حفظ کنید مگر عمداً قصد ابطال نشست‌ها دارید:

```env
NODE_ENV=production
LOCAL_PREVIEW=0
HOST=172.18.0.1
PORT=3005
APP_ORIGIN=https://promty.ir
JWT_SECRET=<کلید موجود با حداقل ۳۲ کاراکتر>
ADMIN_EMAIL=<ایمیل مدیر>
ADMIN_PASSWORD=<رمز حداقل ۱۲ کاراکتری و متفاوت از admin123>
MELIPAYAMAK_USERNAME=<نام کاربری سرویس پیامک>
MELIPAYAMAK_PASSWORD=<رمز سرویس پیامک>
MELIPAYAMAK_OTP_BODY_ID=<شناسه عددی مثبت>
OTP_STORE_PATH=.private/otp-store.json
SECURITY_STATE_PATH=.private/security-state.json
# فقط اگر PostgreSQL واقعاً ذخیره‌ساز فعلی شماست:
# DATABASE_URL=<نشانی اتصال موجود>
```

`NEXTAUTH_SECRET` جایگزین `JWT_SECRET` نیست. مقدارهای داخل <> مثال‌اند. مسیرهای امنیتی باید پایدار و متعلق به کاربر سرویس باشند؛ پوشه 0700 و فایل‌ها 0600 مناسب است. در Docker مسیرهای داده را mount کنید و HOST را مطابق شبکه کانتینر تنظیم کنید؛ برای ساختار فعلی شما HOST همان آدرس Gateway شبکه Nginx Proxy Manager است. آن را به loopback تغییر ندهید، چون کانتینر به loopback میزبان دسترسی مستقیم ندارد.

## جایگزینی فایل‌ها و وابستگی‌ها

فرمان‌ها را از مسیر واقعی نصب و با کاربر مالک سرویس اجرا کنید؛ `/var/www/promty` فقط مثال است. بسته را ابتدا در یک پوشه موقت باز کنید و فایل‌های آن را روی فایل‌های برنامه کپی کنید، بدون حذف `.env`، `db.json`، `.private/` و `dl/`.

برای سرویس فعلی `promty-backend`، پیش از تغییر دیتابیس/وابستگی‌ها:

```bash
cd /var/www/promty
pm2 stop promty-backend
npm ci --include=dev
npx --no-install prisma generate
node scripts/check-release.mjs --before-upgrade
```

در systemd/Docker، معادل توقف سرویس خود را اجرا کنید؛ نام سرویس را حدس نزنید. `check-release` فقط خواندنی است و نام متغیر یا ستون ناقص را می‌گوید، نه مقدار محرمانه را. اگر خطا داد، قبل از ادامه آن را رفع کنید. نسخه Node باید با محدودیت وابستگی‌های package-lock سازگار باشد؛ `npm ci` ناموفق را نادیده نگیرید.

## دیتابیس موجود

**اگر JSON است:** هیچ SQL یا دستور Prisma برای تغییر داده اجرا نکنید. `db.json` سرور را حفظ کنید و working directory سرویس را تغییر ندهید. راه‌اندازی تازه در production بدون پرامپت نمونه انجام می‌شود؛ فایل JSON خراب با نمونه جایگزین نمی‌شود.

**اگر PostgreSQL است و بررسی قبل از ارتقا موفق بود:** پس از بکاپ و توقف سرویس:

```bash
npx --no-install prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20261012_use_case_archive/migration.sql
node scripts/check-release.mjs
```

SQL سه ستون `useCase`، `resourceType` و `isDemo` را اضافه و learning را به teaching یکسان می‌کند؛ حذف جدول/محتوا ندارد و داخل یک تراکنش اجرا می‌شود. پرامپت‌های قبلی خودکار به کاربرد حدسی نسبت داده نمی‌شوند؛ مدیر آن‌ها را در فرم ویرایش دسته‌بندی کند.

تاریخچه baseline کامل Prisma در این مخزن وجود ندارد؛ در این ارتقا `prisma migrate deploy`، `migrate reset`، `db push --accept-data-loss` یا seed قدیمی را اجرا نکنید. اگر دیتابیس کاملاً تازه/خالی است، باید schema کامل جداگانه ایجاد شود؛ SQL این بسته به‌تنهایی دیتابیس تازه نمی‌سازد. برای دیتابیس تازه و تأییدشده خالی، `npx --no-install prisma db push` بدون گزینه reset/accept-data-loss قابل استفاده است؛ هر اخطار حذف داده نیازمند توقف و بررسی است.

## اجرای نسخه جدید

```bash
npm run build
node scripts/check-release.mjs
HOST=172.18.0.1 pm2 restart promty-backend --update-env
pm2 logs promty-backend --lines 50 --nostream
```

نام PM2 باید نام واقعی سرویس باشد. برای نصب تازه، پس از کامل شدن schema و تنظیمات، می‌توان `pm2 start npm --name promty -- start` اجرا کرد. بسته `dist` از قبل ساخته شده دارد؛ ساخت مجدد روی سرور با همان package-lock برای تطبیق محیط توصیه می‌شود. `node_modules` لوکال را به سرور منتقل نکنید؛ Prisma Client باید همان‌جا تولید شود.

در Nginx Proxy Manager تنظیم موجود را حفظ کنید: Scheme=`http`، Forward IP=`172.18.0.1` و Port=`3005`؛ SSL و دامنه فعلی را تغییر ندهید. پیش از restart آدرس Gateway را بررسی کنید:

```bash
docker inspect ngnxproxy-manager-app-1 --format '{{range $name, $net := .NetworkSettings.Networks}}{{$name}}: {{$net.Gateway}}{{println}}{{end}}'
```

اگر Gateway تغییر کرده، HOST و Forward IP باید همان آدرس واقعی باشند؛ دستور دارای `172.18.0.1` بالا فقط برای Gateway گزارش‌شده قبلی است. یک Nginx دوم نصب نکنید و سرویس سیستم nginx را فرض نکنید. پس از restart اتصال را از همان کانتینر بررسی کنید:

```bash
docker exec ngnxproxy-manager-app-1 curl -sS -o /dev/null -w 'Backend HTTP: %{http_code}\n' http://172.18.0.1:3005/api/settings/public
```

نتیجه مورد انتظار `200` است؛ سپس دامنه HTTPS و ورود مدیر را بررسی کنید.

## تست قبل از شروع محتواگذاری رسمی

- صفحه اصلی و `/api/prompts` بدون خطای 500؛ عکس‌ها و لوگوی فعلی سالم.
- ورود مدیر؛ افزودن یک پیش‌نویس واقعی با کاربرد مشخص؛ پیش‌نمایش، انتشار، ویرایش و بازگرداندن به پیش‌نویس.
- ورود با پیامک واقعی، دریافت OTP، یک‌بارمصرف بودن کد و ماندگاری نشست بعد از restart.
- سه ابزار و دو کاربرد هم‌زمان، حذف تکی فیلتر، کپی دو بار با حفظ مقادیر، موبایل و RTL.
- تست‌های قبلی را اگر در دیتابیس واقعی هستند دستی بررسی و به پیش‌نویس ببرید؛ هیچ حذف گروهی یا پاک‌سازی خودکار در این بسته انجام نمی‌شود. از `scripts/import-local-archive.ts` یا `prisma/seed.ts` برای محتواگذاری رسمی استفاده نکنید.

تنها پس از موفقیت این تست‌ها نسخه را آماده فعالیت عمومی در نظر بگیرید. کیفیت خروجی منابع و صحت نشان سازگاری ابزارها به تست واقعی محتوای منتشرشده نیاز دارد.

## بازگشت

اگر اجرای نسخه جدید شکست خورد، سرویس را متوقف، فایل‌های برنامه و وابستگی‌های قبلی را بازیابی و از همان working directory اجرا کنید. سه ستون افزوده‌شده را برای بازگشت کد حذف نکنید؛ افزوده بودن آن‌ها معمولاً با کد قبلی سازگار است. بازیابی کامل بکاپ دیتابیس فقط با بررسی تغییرات بعد از بکاپ انجام شود چون محتوای تازه را از دست می‌دهد. فایل‌های نشست/OTP و رسانه را حفظ کنید. به نسخه قدیمی دارای مشکلات امنیتی برای انتشار عمومی برنگردید.

# Launch hardening — codex branch

## Changes implemented

- L01: OTP proof before phone registration; disabled mock; persisted roles on each request; deleted/demoted/reassigned sessions revoked. Email changes are blocked until a verified-email flow exists.
- L02: manager authorization and prompt existence before multipart parsing; 5 MB/file, six files, genuine JPEG/PNG/WebP decoding, dimensions/pixel limits. SVG branding uploads are replaced by validated raster uploads.
- L03: escaped HTML/attributes and safe JSON-LD; removed fabricated ratings; production nonce CSP.
- L04: inactive content hidden from public detail/API/render/search/bookmarks/media/metadata; managers can preview. Premium is still a label, not a paywall.
- L05: fail-closed production credentials/SMS requirements; HTTPS SMS; durable one-use OTP, five attempts, resend/hourly caps; persistent endpoint/request budgets and Origin protection; SameSite=Lax cookies.
- L06/L07: consistent search contract, stale-response protection, Persian normalization; archive filters/sort before pagination; keyword searches can load subsequent pages.
- L08: personalization initialization only on content ID changes; copy validation; factual copy labels.
- L09: both manager roles see drafts; dashboard retrieves all API pages and displays pages of 20; related response reads data.
- L10: browser session history scoped to account/guest; no server-wide personal history.
- L11: default unsupported first/best claims and fake schema votes removed; empty trend section hidden; local refine returns unchanged text with explicit feedback, without image directives or incrementing copy count.

## Verified locally

TypeScript, production build, archive regression with 65 records, persistent OTP regression, isolated HTTP authorization/upload/draft/XSS/revocation tests. API lifecycle: create draft → preview → publish → edit → unpublish. These do not constitute a browser or staging acceptance test.

## Required staging acceptance before launch

- Real SMS delivery and OTP replay across restart; Prisma-backed role mutation and deletion.
- Mobile/desktop search, second page, return from detail, admin contribution queue and complete lifecycle from UI.
- Two consecutive customized copies preserve values; required blanks/unresolved tokens show clear errors; separate accounts cannot read each other's history.
- Production browser CSP/Google login, reverse proxy, HTTPS cookies/Origin, resource limits and legitimate upload dimensions.
- Real AI provider/workflow token and monetary limits. Current application cap counts requests, not money.
- Audit existing persisted privileged accounts and revoke all sessions issued by the old vulnerable authentication implementation before opening the site.
- Review existing persisted branding copy manually; defaults changed, existing authored settings are preserved.

## Deployment configuration

Set NODE_ENV=production; JWT_SECRET at least 32 characters; ADMIN_PASSWORD at least 12 characters and not the old default; ADMIN_EMAIL; HTTPS APP_ORIGIN; MELIPAYAMAK_USERNAME, MELIPAYAMAK_PASSWORD and positive numeric MELIPAYAMAK_OTP_BODY_ID. Never enable LOCAL_PREVIEW on a public deployment. Set HOST explicitly for container routing; default is loopback. Database failure in operational production must not fall back to JSON.

Mount OTP_STORE_PATH and SECURITY_STATE_PATH on persistent private storage, mode 0700 directory/0600 files. Processes must share the same filesystem on one host. Distributed deployments need transactional shared storage; these filesystem locks are not a multi-host solution. A crashed writer can leave a lock: stop/confirm all writers before an operator removes the stale lock; never delete the state files to clear a limit.

Initial password login creates the configured administrator only when no matching account exists. An existing ordinary account is never promoted by email/phone configuration; assign roles through a trusted senior administrator or audited server-side bootstrap.

## Recovery

Keep a private backup of database, media and security state before deployment. Retain the previous application artifact; revert code as a new Git commit if required, preserving persistent revocation/OTP state. Rolling back to the previous insecure authentication implementation is unsuitable for public launch. No production deployment, merge or main push is authorized by this change.

## Known limits

Prisma archive filtering currently loads the permitted dataset then filters in memory; correctness is covered but database-scale optimization remains. Admin initially fetches all API pages; display is paginated. Related suggestions inspect the first public archive page. Email replacement requires a future verified-email feature. No claim of real provider, production browser, or staging validation is made.

## آرشیو کاربردمحور — پیش‌نمایش محلی ۲۰۲۶/۱۰/۱۲

وضعیت: پیاده‌سازی و اعتبارسنجی محلی انجام شد؛ انتشار عمومی یا push انجام نشده است.

- مسیر اصلی: گروه کاربرد ← کاربرد مشخص. ابزار، نوع منبع و خروجی فیلترهای مستقل و مکمل‌اند؛ انتخاب ابزار باعث تکثیر محتوا نمی‌شود.
- منبع واحد تعریف کاربردها: `src/lib/archiveCatalog.ts`. گروه از کاربرد مشتق می‌شود؛ `task` توضیح آزاد قبلی باقی مانده و جایگزین شناسه کاربرد نیست.
- فرم مدیر کاربرد اصلی و نوع منبع را ثبت می‌کند. ذخیره/ویرایش و فیلتر در API و هر دو adapter JSON/Prisma پشتیبانی می‌شود. برای سازگاری، رکوردهای قدیمی بدون کاربرد خواندنی‌اند و باید پیش از انتشار نهایی بازبینی شوند.
- `learning` در خواندن، نوشتن و فیلتر به `teaching` تبدیل می‌شود. کاربرد «برنامه‌ریزی یادگیری» مستقل از این فیلتر مکمل است.
- شمارنده فیلترها محدودیت‌های دیگر را رعایت می‌کند. جستجو حروف عربی/فارسی و نیم‌فاصله را یکسان می‌کند؛ تطابق کامل عبارت کاربرد بر تطابق اتفاقی یک واژه اولویت دارد.
- فایل Markdown نوع بسته‌بندی است؛ خروجی راهنمای نوشتن کتاب «متن» و خروجی Skill ساخت UI «کد» است. منابع Skill و راهنمای ایجنت پس از شخصی‌سازی به صورت `SKILL.md` و `GUIDE.md` دریافت می‌شوند. دانلود به معنی نصب یا اجرای Skill نیست.

### داده محلی و مسیر آزمون

پیش‌نمایش: `http://localhost:5173/`؛ API محلی: `127.0.0.1:3005`.

۱۲ نمونه جدید با `isDemo=true` اضافه شد؛ پنج محتوای قبلی با حفظ متن، شناسه، رسانه، آمار و سایر اطلاعات به کاربرد مناسب متصل شدند. مجموع: ۱۷ منبع (۱۰ پرامپت، ۴ Skill، ۳ راهنمای ایجنت).

| شناسه نمونه | کاربرد اصلی | نوع منبع | خروجی |
| --- | --- | --- | --- |
| demo-clothing-video | ساخت ویدیوی محصول | پرامپت | ویدیو |
| demo-jewelry-image | ساخت تصویر محصول | پرامپت | تصویر |
| demo-android-app | ساخت اپلیکیشن موبایل | پرامپت | کد |
| demo-business-ideas | کشف و ارزیابی ایده | پرامپت | جدول و متن |
| demo-personal-coaching | برنامه‌ریزی برای یک هدف | پرامپت | برنامه و چک‌لیست |
| demo-ui-skill | ساخت رابط کاربری | Skill | کد |
| demo-app-agent-guide | ساخت اپلیکیشن | راهنمای ایجنت | کد |
| demo-book-agent-guide | تدوین کتاب | راهنمای ایجنت | متن |
| demo-business-agent-guide | تدوین برنامه کسب‌وکار | راهنمای ایجنت | گزارش و برنامه |
| demo-accessibility-skill | ارزیابی رابط کاربری | Skill | گزارش و چک‌لیست |
| demo-calendar-skill | برنامه‌ریزی انتشار | Skill | جدول و متن |
| demo-sales-skill | تحلیل عملکرد فروش | Skill | گزارش و نمودار |

متن نمونه‌ها برای تست محصول آماده شده و سازگاری با ابزارها/کیفیت خروجی آن‌ها اعتبارسنجی نشده است. تصویر مرجع باید در ابزار مقصد بارگذاری شود؛ سایت در این مرحله فایل مرجع را به مدل ارسال نمی‌کند.

### شواهد اعتبارسنجی

- `npm run lint` و `npm run build`: موفق؛ هشدار اندازه bundle در build باقی است.
- `node --import tsx --test tests/archive-use-cases.test.ts src/server/repositories/archive.test.ts tests/otp-store.test.ts`: هشت آزمون موفق؛ شامل ۱۲ نمونه، جستجوی فارسی، چند فیلتر، learning/teaching، حفظ داده‌ها و عدم تکرار درون‌ریزی، صفحه‌بندی ۶۵ رکورد و OTP.
- `node --import tsx --test tests/server-security.test.ts`: دو آزمون موفق؛ شامل احراز مجوز، پیش‌نویس/انتشار/ویرایش، ذخیره کاربرد و نوع منبع، رد مقدار نامعتبر و شمارنده فیلترها در سرور موقت.
- مرورگر واقعی لوکال: نمایش ۱۷ مورد؛ گروه معرفی محصول ۴ مورد؛ ترکیب آن با خروجی ویدیو ۱ مورد؛ کاربرد برنامه‌ریزی انتشار ۲ مورد و با فیلتر Skill فقط ۱ مورد؛ فیلتر teaching محتوای یادگیری قبلی را نشان می‌دهد؛ جستجوی «ويديو محصول پوشاك» نمونه مرتبط را در رتبه اول قرار می‌دهد.
- دریافت ناقص Skill مسدود شد؛ دو کپی متوالی مقادیر شخصی‌سازی را حفظ کردند. کلیپ‌بورد و فایل دانلودشده از نظر وجود هر دو مقدار، frontmatter و نبود متغیر حل‌نشده بررسی شدند.
- چرخه فرم مدیر از مرورگر احرازهویت‌شده در این نوبت انجام نشده؛ قرارداد ذخیره و ویرایش از طریق آزمون HTTP معتبر است. تست نصب/اجرای واقعی Skill یا سرویس AI انجام نشده است.

### نگهداری و بازگشت محلی

دیتابیس فعال این پیش‌نمایش در `/home/sajj/developing/promty/.local-preview/db.json` است؛ فایل‌های `db.json` خالی در worktree مقصد درون‌ریزی نیستند. از اسکریپت با مسیر صریح و فقط در حالت `LOCAL_PREVIEW=1` استفاده شود؛ پیش از اجرای آن نویسنده‌های دیتابیس متوقف شوند.

اسکریپت `scripts/import-local-archive.ts` با شناسه ثابت درون‌ریزی را بدون تکرار انجام می‌دهد و نسخه پشتیبان با مجوز 0600 در `.private/archive-backups/` کنار دیتابیس می‌سازد. بکاپ این اجرا: `before-use-cases-1791791212669.json`. تغییرات پس از بکاپ، از جمله فعالیت تستی، هنگام بازیابی کامل از دست می‌روند؛ پیش از بازیابی نیز بکاپ تازه و توقف سرور لازم است.

سرور محلی از فایل ساخته‌شده `ui-preview/dist/server.cjs` با working directory دیتابیس بالا اجرا شده است. تنظیمات و نشست‌های موجود حفظ شدند؛ کد برنامه اصلی و `DEPLOY.md` دست‌نخورده‌اند.

تغییر schema و SQL در `prisma/migrations/20261012_use_case_archive/migration.sql` آماده است؛ PostgreSQL در این نوبت اجرا یا migrate نشده است. مخزن از قبل تاریخچه baseline مهاجرت نداشت؛ پیش از deploy باید baseline و طرح مهاجرت دیتابیس واقعی بررسی شوند. JSON محلی و Prisma Client تولیدشده، به معنی اعتبارسنجی مهاجرت production نیستند. ساخت هاب‌های SEO، بلاگ و توسعه فهرست ابزارها خارج از این اجرای محلی هستند.

## تکمیل دسته‌ها و فیلترهای چندانتخابی — ۲۰۲۶/۱۰/۱۲

این بخش وضعیت جدید را جایگزین ساختار و شمارش پیش‌نمایش مرحله قبل می‌کند. اجرای اصلاحات و کامیت محلی به درخواست صریح مالک تأیید شده است؛ push همچنان نیازمند تأیید اوست.

- «کسب‌وکار» گروه اصلی و «معرفی محصول» زیرمجموعه آن است. انتخاب کسب‌وکار همه کاربردهای مستقیم و کاربردهای معرفی محصول را شامل می‌شود؛ انتخاب زیرمجموعه فقط همان شاخه را نشان می‌دهد. URL و شناسه `product` قبلی معتبر مانده است.
- گروه «سوشال مدیا» شامل تولید محتوای شبکه‌های اجتماعی، استراتژی برند/برند کوچ، عکس پروفایل اینستاگرام، پست و کاروسل، استوری، رشد و فروش در اینستاگرام و برنامه‌ریزی انتشار است. دو منبع تقویم محتوا با حفظ شناسه و متن به این گروه منتقل شدند.
- عنوان گروه طراحی به «طراحی رابط و محتوای بصری» روشن‌تر شد. «تولید محتوا» برای نوشتن مقاله و بازنویسی/خلاصه‌سازی متن کاربردهای مشخص دارد؛ «نوشتن و نشر» تدوین کتاب را پوشش می‌دهد. حوزه، ابزار و نوع خروجی جایگزین کاربرد اصلی نشده‌اند.
- هر نه فیلتر گروه، کاربرد، نوع منبع، خروجی، ابزار، حوزه، هدف مکمل، دشواری و زبان چندانتخابی است. منطق درون یک فیلتر OR و بین فیلترها AND است؛ یک منبع هرگز به دلیل تطابق چند انتخاب تکرار نمی‌شود.
- انتخاب‌ها با کلید تکرارشونده در URL نگهداری می‌شوند؛ آدرس تک‌مقداری و CSV نیز قابل خواندن است. حذف تکی، پاک‌سازی، بارگذاری مجدد و صفحه‌بندی پشتیبانی می‌شوند. تغییر گروه کاربردهای ناسازگار را پاک می‌کند؛ سایر فیلترها باقی می‌مانند.
- فهرست‌های دارای گزینه‌های زیاد جستجو دارند و با کیبورد نیز قابل استفاده‌اند. گزینه صفر مسدود نیست تا کاربر بتواند انتخاب OR دیگری اضافه کند. شمارنده‌ها تمام انتخاب‌های دیگر را رعایت می‌کنند و فیلتر خود را حذف می‌کنند؛ گروه والد هر منبع را یک بار می‌شمارد.
- انتخاب سریع با به‌روزرسانی بر اساس آخرین URL و تابع تغییر انتخاب انجام می‌شود، تا رندر قبلی انتخاب تازه را از بین نبرد. URL قدیمی `intent=learning` در رابط نیز به `teaching` تبدیل می‌شود.
- شش نمونه آزمایشی جدید با شناسه‌های `demo-social-content`، `demo-social-brand`، `demo-social-profile`، `demo-instagram-post`، `demo-instagram-story` و `demo-instagram-growth` وارد لوکال شدند. DeepSeek به تاکسونومی ابزارهای همین پیش‌نمایش اضافه شد. تصویر پروفایل خروجی تصویر دارد؛ نمونه پست و استوری خروجی متن/شرح طراحی دارند و ادعای تولید فایل تصویر نمی‌کنند.
- اکنون مجموع ۲۳ منبع داریم: ۱۶ پرامپت، چهار Skill و سه راهنمای ایجنت. ۱۷ منبع قبلی و داده‌های حساب‌ها، تنظیمات و نشان‌ها حفظ شدند. بکاپ خصوصی پیش از درون‌ریزی جدید: `before-use-cases-1791793670281.json` در همان `.private/archive-backups/` دیتابیس محلی.

### اعتبارسنجی این مرحله

- TypeScript و build موفق‌اند؛ هشدار موجود اندازه bundle باقی است.
- مجموعه آزمون‌ها: ۱۳ آزمون موفق، شامل آرشیو، OR/AND، شمارنده گزینه‌های جایگزین، گروه والد/فرزند، سازگاری URL، درون‌ریزی بدون تکرار، صفحه‌بندی، OTP و مجوزهای HTTP. آزمون آرشیو پس از تکمیل سازگاری learning دوباره موفق بود.
- بررسی زنده API: کل ۲۳؛ کسب‌وکار ۷؛ معرفی محصول ۴؛ سوشال مدیا ۸؛ انتخاب Claude + Midjourney + DeepSeek برابر ۱۱؛ ترکیب همین سه ابزار با کسب‌وکار + سوشال مدیا و متن + تصویر برابر ۷؛ عکس پروفایل + استوری برابر ۲.
- مرورگر: زیرمجموعه معرفی محصول نمایش و انتخاب شد؛ سه ابزار هم‌زمان حفظ شدند؛ دو گروه و دو خروجی به هفت نتیجه رسیدند؛ دو کاربرد به دو نتیجه و حذف یکی به یک نتیجه رسید؛ URL و فیلترها بعد از reload حفظ شدند. انتخاب سریع فارسی + انگلیسی و مبتدی + متوسط هر دو مقدار را حفظ کرد.
- نمونه‌ها و کیفیت اجرای ابزارها همچنان اعتبارسنجی واقعی AI نشده‌اند. PostgreSQL/migration و چرخه فرم مدیر از مرورگر احرازهویت‌شده در این مرحله اجرا نشده است. داده واقعی لوکال، فایل‌های دانلودی و بکاپ‌های خصوصی عضو کامیت نیستند؛ اسکریپت تولید و درون‌ریزی نمونه‌ها نسخه‌بندی می‌شود.

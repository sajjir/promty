# راهنمای استقرار پروژه Promty.ir روی اوبونتو ۲۲.۰۴ (Ubuntu 22.04 LTS)

با استفاده از راهنمای گام‌به‌گام زیر، پلتفرم پرامپتی را بر روی سرور لینوکس ابری خود راه‌اندازی و مدیریت کنید.

---

## ۱. پیش‌نیازها و به‌روزرسانی سیستم

ابتدا به سرور خود متصل شده و لیست پکیج‌های سیستم را به‌روزرسانی نمایید:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## ۲. نصب Node.js نسخه ۲۰ (LTS)

جهت اجرای بهینه پلتفرم و اجرای پروسه بیلد، Node.js نسخه ۲۰ را با دستورات زیر نصب کنید:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

برای تأیید نصب موفقیت‌آمیز دستورات زیر را اجرا کنید:
```bash
node -v
npm -v
```

---

## ۳. نصب و راه‌اندازی پایگاه‌داده PostgreSQL

سیستم مدیریت داده‌های PostgreSQL را نصب نموده و دیتابیس و کاربر مخصوص پروژه را بسازید:

```bash
sudo apt install postgresql postgresql-contrib -y

# ورود به کنسول psql و ساخت دیتابیس و دسترسی‌ها
sudo -u postgres psql -c "CREATE DATABASE promty_db;"
sudo -u postgres psql -c "CREATE USER promty_user WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE promty_db TO promty_user;"
```

---

## ۴. دریافت کدهای پروژه (Clone) و نصب وابستگی‌ها

مخزن پروژه را در دایرکتوری وب خود کلون نموده و پکیج‌های مورد نیاز را نصب کنید:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

# مخزن را کلون کنید
git clone <URL_مخزن_شما> promty
cd promty

# نصب وابستگی‌ها
npm install
```

---

## ۵. تنظیم متغیرهای محیطی (Environment Variables)

یک فایل تنظیماتی به نام `.env` در روت پروژه بسازید:

```bash
nano .env
```

مقادیر زیر را با کلمه عبور دیتابیس و کلیدهای امنیتی خود بروزرسانی کرده و ذخیره نمایید (`Ctrl+O` سپس `Enter` و سپس `Ctrl+X`):

```env
DATABASE_URL="postgresql://promty_user:yourpassword@localhost:5432/promty_db"
NEXTAUTH_URL="https://promty.ir"
NEXTAUTH_SECRET="a_very_long_random_secret_string_here_32_chars"
ADMIN_EMAIL="admin@promty.ir"
ADMIN_PASSWORD="admin123" # در محیط پروداکشن از رمز عبور سخت استفاده کنید
```

---

## ۶. همگام‌سازی دیتابیس با Prisma (Migration & Seed)

طرح پایگاه‌داده را اعمال کرده و داده‌های آزمایشی (سید شده) را تزریق کنید:

```bash
# نصب مایگریشن در دیتابیسpostgresql
npx prisma migrate deploy

# بارگذاری و اجرای داده‌های نمونه اولیه (Seed)
npx prisma db seed
```

---

## ۷. بیلد نهایی پروژه (Build)

پکیج فشرده و بهینه‌سازی شده پروژه را برای اجرا در پروداکشن بسازید:

```bash
npm run build
```

این دستور فایل‌های استاتیک فرانت‌اند را در پوشه `dist` کامپایل کرده و سپس فایل سرور بک‌اند TypeScript یعنی `server.ts` را به صورت یک فایل واحد کدهای جاوا اسکریپت در آدرس `dist/server.cjs` بسته بندی می‌نماید.

---

## ۸. مدیریت پروسه اجرای سرور با PM2

برای زنده نگه داشتن دائمی سرور، ابزار مدیریت پروسه‌ها به نام PM2 را نصب کرده و سرویس اجرای Node.js را تعریف کنید:

```bash
sudo npm install -g pm2

# شروع سرویس پرامپتی در محیط پس‌زمینه
pm2 start npm --name "promty" -- start

# راه‌اندازی خودکار به همراه بالا آمدن سیستم عامل سرور
pm2 startup
pm2 save
```

---

## ۹. تنظیم معکوس پروکسی با Nginx و گواهی امنیتی SSL

پکیج وب‌سرور Nginx را نصب کنید:

```bash
sudo apt install nginx -y
```

یک فایل پیکربندی جدید مخصوص دامنه خود ایجاد کنید:

```bash
sudo nano /etc/nginx/sites-available/promty
```

کانفیگ زیر را وارد نمایید:

```nginx
server {
    listen 80;
    server_name promty.ir www.promty.ir;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

سایت را فعال کرده و Nginx را راه‌اندازی مجدد کنید:

```bash
sudo ln -s /etc/nginx/sites-available/promty /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### فعال‌سازی رایگان گواهی امنیتی HTTPS با Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d promty.ir -d www.promty.ir
```

تبریک می‌گوییم! پلتفرم Promty.ir با موفقیت مستقر گردید. کاربران می‌توانند از طریق آدرس امن به آن دسترسی داشته باشند.

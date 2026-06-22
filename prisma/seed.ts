// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing databases
  await prisma.prompt.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.adminUser.deleteMany({});

  // Seed Categories
  const categories = [
    { name: 'تبلیغات', slug: 'advertising', icon: 'Megaphone' },
    { name: 'وبسایت', slug: 'website', icon: 'Globe' },
    { name: 'ویدیو', slug: 'video', icon: 'Video' },
    { name: 'عکاسی', slug: 'photography', icon: 'Camera' },
  ];

  for (const cat of categories) {
    await prisma.category.create({
      data: cat,
    });
  }

  // Seed Admin User
  await prisma.adminUser.create({
    data: {
      email: 'admin@promty.ir',
      password: 'hashed_password_here', // In production, hash this using bcrypt
    },
  });

  // Seed Prompts
  await prisma.prompt.create({
    data: {
      title: 'تصویر تبلیغاتی محصول جواهرات',
      description: 'یک پرامپت عالی برای ساخت تصاویر تبلیغاتی حرفه‌ای مخصوص طلا، نقره و جواهرات مجلل',
      body: 'یک عکس تبلیغاتی حرفه‌ای از {{product_name}} بساز. رنگ غالب {{brand_color}}. پس‌زمینه سفید خالص. نور استودیویی. کیفیت 4K. در پایین بنویس: {{ad_text}}',
      category: 'تبلیغات',
      tags: ['جواهرات', 'تبلیغات', 'Midjourney', 'طلا'],
      sampleImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
      isPremium: false,
      isActive: true,
      usageCount: 142,
      fieldsSchema: [
        {
          key: 'product_name',
          label: 'نام محصول',
          type: 'text',
          placeholder: 'مثال: گوشواره طلا دست‌ساز',
          required: true
        },
        {
          key: 'brand_color',
          label: 'رنگ غالب برند',
          type: 'color',
          required: false,
          placeholder: ''
        },
        {
          key: 'ad_text',
          label: 'متن تبلیغ',
          type: 'textarea',
          placeholder: 'جمله‌ای که می‌خواهید روی تصویر باشد (انگلیسی یا فارسی)',
          required: false
        }
      ]
    }
  });

  await prisma.prompt.create({
    data: {
      title: 'لندینگ پیج کسب‌وکار',
      description: 'پرامپت توسعه‌دهندگان وب برای دریافت کدهای لندینگ پیج مدرن و سازگار با فریم‌ورک‌های روز',
      body: 'یک لندینگ پیج حرفه‌ای با React و Tailwind CSS برای کسب‌وکار {{business_name}} در حوزه {{business_field}} بساز. رنگ اصلی برند {{brand_color}}. لحن: {{tone}}. شامل: هدر، hero section، بخش خدمات، و فوتر.',
      category: 'وبسایت',
      tags: ['برنامه‌نویسی', 'کد', 'React', 'Tailwind'],
      sampleImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600',
      isPremium: false,
      isActive: true,
      usageCount: 98,
      fieldsSchema: [
        {
          key: 'business_name',
          label: 'نام کسب‌‌وکار',
          type: 'text',
          placeholder: 'مثال: دیجی استایل',
          required: true
        },
        {
          key: 'business_field',
          label: 'حوزه فعالیت',
          type: 'text',
          placeholder: 'مثال: فروشگاه اینترنتی مد و پوشاک',
          required: true
        },
        {
          key: 'brand_color',
          label: 'رنگ سازمانی',
          type: 'color',
          required: false,
          placeholder: ''
        },
        {
          key: 'tone',
          label: 'لحن محتوا',
          type: 'select',
          required: true,
          options: ['رسمی', 'دوستانه', 'هیجان‌انگیز'],
          placeholder: 'یکی را انتخاب کنید'
        }
      ]
    }
  });

  await prisma.prompt.create({
    data: {
      title: 'ویدیو تیزر محصول',
      description: 'پرامپت طلایی برای ساخت ویدیوهای کوتاه تبلیغاتی یا تیزرهای ۱۵ ثانیه‌ای اینستاگرام و یوتیوب',
      body: 'یک تیزر ویدیویی ۱۵ ثانیه‌ای برای {{product_name}} بساز. سبک: {{style}}. موزیک: {{music_mood}}. متن روی صفحه: {{tagline}}',
      category: 'ویدیو',
      tags: ['تیزر', 'ویدیو', 'Kling', 'Sora', 'اینستاگرام'],
      sampleImage: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=600',
      isPremium: true,
      isActive: true,
      usageCount: 235,
      fieldsSchema: [
        {
          key: 'product_name',
          label: 'نام محصول',
          type: 'text',
          placeholder: 'مثال: گوشی هوشمند جدید سامسونگ S24',
          required: true
        },
        {
          key: 'style',
          label: 'سبک ویدیو',
          type: 'select',
          required: true,
          options: ['مدرن', 'کلاسیک', 'پویا و پرانرژی'],
          placeholder: 'انتخاب سبک'
        },
        {
          key: 'music_mood',
          label: 'حال‌وهوای موسیقی',
          type: 'text',
          placeholder: 'مثال: الکترونیک پرانرژی با بیس قوی',
          required: false
        },
        {
          key: 'tagline',
          label: 'شعار تبلیغاتی روی صفحه',
          type: 'text',
          placeholder: 'مثال: نهایت سرعت در دستان شما',
          required: false
        }
      ]
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

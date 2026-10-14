// Local preview catalog from docs/لیست کاربردی‌ها.md. Existing use-case slugs are preserved.
export interface ArchiveUseCase {
  slug: string;
  group: string;
  title: string;
  aliases: string[];
  family?: string;
  expectedResult?: string;
  referenceId?: string;
  referenceIds?: string[];
  legacy?: boolean;
}

export const researchedUseCases: ArchiveUseCase[] = [
  {
    "referenceId": "BUS-01",
    "family": "راهبرد و بازار",
    "title": "کشف و ارزیابی ایده کسب‌وکار",
    "expectedResult": "مقایسه ایده‌ها، فرضیات و آزمایش اولیه",
    "slug": "business-ideas",
    "group": "business",
    "aliases": [
      "ایده پردازی کسب و کار",
      "ایده کسب‌وکار",
      "کشف و ارزیابی ایده"
    ]
  },
  {
    "referenceId": "BUS-02",
    "family": "راهبرد و بازار",
    "title": "تحقیق بازار و نیاز مشتری",
    "expectedResult": "شواهد بازار، مسئله‌ها و پرسش‌های باز",
    "slug": "bus-02",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-03",
    "family": "راهبرد و بازار",
    "title": "تحلیل رقبا و جایگزین‌ها",
    "expectedResult": "مقایسه پیشنهادها و فرصت تمایز",
    "slug": "bus-03",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-04",
    "family": "راهبرد و بازار",
    "title": "تدوین برنامه کسب‌وکار",
    "expectedResult": "مدل درآمد، منابع و برنامه مرحله‌ای",
    "slug": "business-plan",
    "group": "business",
    "aliases": [
      "بیزنس پلن",
      "طرح کسب و کار"
    ]
  },
  {
    "referenceId": "BUS-05",
    "family": "راهبرد و بازار",
    "title": "تعریف پیشنهاد ارزش",
    "expectedResult": "مسئله مشتری، منفعت و دلیل انتخاب",
    "slug": "bus-05",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-06",
    "family": "راهبرد و بازار",
    "title": "تدوین جایگاه و پیام برند",
    "expectedResult": "جایگاه، لحن و پیام‌های اصلی برند",
    "slug": "bus-06",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-07",
    "family": "راهبرد و بازار",
    "title": "برنامه‌ریزی عرضه محصول",
    "expectedResult": "مخاطب، کانال، فعالیت‌ها و معیارهای عرضه",
    "slug": "bus-07",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-08",
    "family": "راهبرد و بازار",
    "title": "طراحی قیمت و بسته پیشنهادی",
    "expectedResult": "گزینه‌های قیمت با فرضیات و مقایسه",
    "slug": "bus-08",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-09",
    "family": "بازاریابی",
    "title": "طراحی کمپین بازاریابی",
    "expectedResult": "هدف، پیام، کانال و سنجش کمپین",
    "slug": "bus-09",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-10",
    "family": "بازاریابی",
    "title": "نوشتن متن تبلیغ و صفحه فروش",
    "expectedResult": "نسخه‌های متن با پیشنهاد ارزش و دعوت به اقدام",
    "slug": "bus-10",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-11",
    "family": "بازاریابی",
    "title": "طراحی ایمیل بازاریابی",
    "expectedResult": "توالی ایمیل، موضوع و متن هر پیام",
    "slug": "bus-11",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-12",
    "family": "معرفی محصول",
    "title": "ساخت تصویر محصول",
    "expectedResult": "تصویر یا دستور ساخت با حفظ ویژگی‌های واقعی کالا",
    "slug": "product-image",
    "group": "product",
    "aliases": [
      "عکس محصول",
      "عکاسی محصول"
    ]
  },
  {
    "referenceId": "BUS-13",
    "family": "معرفی محصول",
    "title": "ساخت ویدیوی محصول",
    "expectedResult": "نماها و دستور تولید ویدیوی معرفی کالا",
    "slug": "product-video",
    "group": "product",
    "aliases": [
      "ویدئو",
      "ویدیو تبلیغاتی",
      "تیزر"
    ]
  },
  {
    "referenceId": "BUS-14",
    "family": "معرفی محصول",
    "title": "نوشتن سناریوی معرفی محصول",
    "expectedResult": "روایت، نماها و پیام تبلیغاتی محصول",
    "slug": "product-script",
    "group": "product",
    "aliases": [
      "سناریوی ویدیو",
      "سناریو معرفی محصول",
      "نوشتن سناریوی تبلیغاتی"
    ]
  },
  {
    "referenceId": "BUS-15",
    "family": "معرفی محصول",
    "title": "نوشتن توضیحات محصول",
    "expectedResult": "متن صفحه محصول بر اساس مشخصات واقعی",
    "slug": "bus-15",
    "group": "product",
    "aliases": []
  },
  {
    "referenceId": "BUS-16",
    "family": "معرفی محصول",
    "title": "تهیه کاتالوگ و مقایسه محصولات",
    "expectedResult": "اطلاعات منظم، تفاوت‌ها و راهنمای انتخاب",
    "slug": "bus-16",
    "group": "product",
    "aliases": []
  },
  {
    "referenceId": "BUS-17",
    "family": "فروش و مشتری",
    "title": "آماده‌سازی جلسه فروش",
    "expectedResult": "پرسش‌های کشف نیاز، ارائه و پیگیری",
    "slug": "bus-17",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-18",
    "family": "فروش و مشتری",
    "title": "نوشتن پیشنهاد همکاری",
    "expectedResult": "پیشنهاد خدمت، محدوده کار و ارزش پیشنهادی",
    "slug": "bus-18",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-19",
    "family": "فروش و مشتری",
    "title": "تمرین مذاکره و پاسخ به اعتراض",
    "expectedResult": "سناریوی گفتگو و گزینه‌های پاسخ",
    "slug": "bus-19",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-20",
    "family": "فروش و مشتری",
    "title": "پاسخ‌گویی به درخواست و شکایت مشتری",
    "expectedResult": "پاسخ پیشنهادی و مسیر حل مسئله",
    "slug": "bus-20",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-21",
    "family": "فروش و مشتری",
    "title": "ساخت پرسش‌های متداول کسب‌وکار",
    "expectedResult": "سؤال و پاسخ از اطلاعات تأییدشده",
    "slug": "bus-21",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-22",
    "family": "فروش و مشتری",
    "title": "تحلیل عملکرد فروش",
    "expectedResult": "شاخص‌ها، روندها و فرضیات اقدام بعدی",
    "slug": "sales-analysis",
    "group": "business",
    "aliases": [
      "فروش ماهانه",
      "گزارش فروش"
    ]
  },
  {
    "referenceId": "BUS-23",
    "family": "عملیات و تیم",
    "title": "تدوین دستورالعمل اجرای کار",
    "expectedResult": "مراحل، مسئولیت‌ها و کنترل کیفیت فرایند",
    "slug": "bus-23",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-24",
    "family": "عملیات و تیم",
    "title": "برنامه‌ریزی پروژه و ظرفیت تیم",
    "expectedResult": "کارها، وابستگی‌ها و تقسیم ظرفیت",
    "slug": "bus-24",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-25",
    "family": "عملیات و تیم",
    "title": "تبدیل جلسه کاری به تصمیم و اقدام",
    "expectedResult": "صورت‌جلسه، مالک اقدام و موعد",
    "slug": "bus-25",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-26",
    "family": "عملیات و تیم",
    "title": "آماده‌سازی فرایند استخدام",
    "expectedResult": "شرح شغل، پرسش مصاحبه و معیار ارزیابی",
    "slug": "bus-26",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-27",
    "family": "عملیات و تیم",
    "title": "طراحی ورود و آموزش نیروی جدید",
    "expectedResult": "برنامه آشنایی، منابع و چک‌لیست نقش",
    "slug": "bus-27",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "BUS-28",
    "family": "مالی و برنامه‌ریزی",
    "title": "تهیه بودجه و سناریوی مالی کسب‌وکار",
    "expectedResult": "جدول مفروضات، هزینه و جریان نقدی قابل بازبینی",
    "slug": "bus-28",
    "group": "business",
    "aliases": []
  },
  {
    "referenceId": "SOC-01",
    "family": "راهبرد حضور",
    "title": "تدوین استراتژی شبکه اجتماعی",
    "expectedResult": "مخاطب، هدف، ستون‌های محتوا و شیوه سنجش",
    "slug": "soc-01",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-02",
    "family": "راهبرد حضور",
    "title": "برنامه‌ریزی تقویم سوشال مدیا",
    "expectedResult": "زمان‌بندی، موضوع و شرح هر محتوا",
    "slug": "content-calendar",
    "group": "social",
    "aliases": [
      "تقویم محتوا",
      "شبکه های اجتماعی",
      "تقویم محتوایی",
      "برنامه‌ریزی انتشار"
    ]
  },
  {
    "referenceId": "SOC-03",
    "family": "تولید محتوا",
    "title": "تهیه بسته محتوای شبکه اجتماعی",
    "expectedResult": "مجموعه هماهنگ متن و ایده بصری برای انتشار",
    "slug": "social-content",
    "group": "social",
    "aliases": [
      "محتوای سوشال مدیا",
      "social media content",
      "تولید محتوای شبکه‌های اجتماعی"
    ]
  },
  {
    "referenceId": "SOC-04",
    "family": "تولید محتوا",
    "title": "نوشتن کپشن و شروع جذاب",
    "expectedResult": "کپشن، دعوت به تعامل و گزینه‌های شروع",
    "slug": "soc-04",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-05",
    "family": "تولید محتوا",
    "title": "ساخت پست و کاروسل",
    "expectedResult": "متن اسلایدها، ترتیب روایت و دستور طراحی",
    "slug": "instagram-post",
    "group": "social",
    "aliases": [
      "پست اینستاگرام",
      "instagram post",
      "اسلاید اینستاگرام",
      "ساخت پست و کاروسل اینستاگرام"
    ]
  },
  {
    "referenceId": "SOC-06",
    "family": "تولید محتوا",
    "title": "ساخت استوری",
    "expectedResult": "توالی قاب‌ها و تعامل مناسب استوری",
    "slug": "instagram-story",
    "group": "social",
    "aliases": [
      "استوری",
      "instagram story",
      "ساخت استوری اینستاگرام"
    ]
  },
  {
    "referenceId": "SOC-07",
    "family": "تولید محتوا",
    "title": "ساخت ریلز و ویدیوی کوتاه اجتماعی",
    "expectedResult": "سناریو، نماها و متن روی ویدیو",
    "slug": "soc-07",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-08",
    "family": "تولید محتوا",
    "title": "آماده‌سازی لایو و گفتگوی اجتماعی",
    "expectedResult": "موضوع، بخش‌ها و پرسش‌های گفتگو",
    "slug": "soc-08",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-09",
    "family": "هویت و پروفایل",
    "title": "ساخت عکس پروفایل شبکه اجتماعی",
    "expectedResult": "تصویر مناسب هویت و ابعاد پروفایل",
    "slug": "social-profile",
    "group": "social",
    "aliases": [
      "عکس پروفایل",
      "instagram profile",
      "آواتار",
      "ساخت عکس پروفایل اینستاگرام"
    ]
  },
  {
    "referenceId": "SOC-10",
    "family": "هویت و پروفایل",
    "title": "نوشتن بیو و معرفی پروفایل",
    "expectedResult": "معرفی کوتاه، پیام و مسیر اقدام",
    "slug": "soc-10",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-11",
    "family": "هویت و پروفایل",
    "title": "تدوین برند شخصی در سوشال مدیا",
    "expectedResult": "جایگاه، لحن و الگوی حضور؛ شامل برند کوچ",
    "slug": "soc-11",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-12",
    "family": "رشد و فروش",
    "title": "طراحی برنامه رشد مخاطب",
    "expectedResult": "فرضیات جذب، آزمایش محتوا و سنجش رشد",
    "slug": "soc-12",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-13",
    "family": "رشد و فروش",
    "title": "طراحی مسیر فروش در شبکه اجتماعی",
    "expectedResult": "محتوا، گفتگو و پیگیری برای تبدیل مخاطب",
    "slug": "soc-13",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-14",
    "family": "تعامل و جامعه",
    "title": "پاسخ‌گویی به کامنت و پیام",
    "expectedResult": "پاسخ‌های متناسب با لحن و مسئله مخاطب",
    "slug": "soc-14",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-15",
    "family": "تعامل و جامعه",
    "title": "تدوین قواعد و مدیریت جامعه",
    "expectedResult": "قواعد مشارکت و الگوی رسیدگی به تنش",
    "slug": "soc-15",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-16",
    "family": "رشد و فروش",
    "title": "آماده‌سازی همکاری با تولیدکننده محتوا",
    "expectedResult": "بریف همکاری، تحویل‌ها و معیار انتخاب",
    "slug": "soc-16",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-17",
    "family": "سنجش و بازاستفاده",
    "title": "تحلیل عملکرد محتوای اجتماعی",
    "expectedResult": "مقایسه محتوا و پیشنهاد آزمایش بعدی",
    "slug": "soc-17",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "SOC-18",
    "family": "سنجش و بازاستفاده",
    "title": "تبدیل محتوا برای چند شبکه اجتماعی",
    "expectedResult": "نسخه‌های متناسب با کانال از یک محتوای مادر",
    "slug": "soc-18",
    "group": "social",
    "aliases": []
  },
  {
    "referenceId": "WRT-01",
    "family": "محتوای وب",
    "title": "نوشتن مقاله و محتوای وب",
    "expectedResult": "طرح و پیش‌نویس مستند برای مخاطب مشخص",
    "slug": "article-writing",
    "group": "publishing",
    "aliases": [
      "مقاله نویسی",
      "وبلاگ",
      "blog"
    ]
  },
  {
    "referenceId": "WRT-02",
    "family": "محتوای وب",
    "title": "برنامه‌ریزی محتوای وب و نشر",
    "expectedResult": "موضوع‌ها، ارتباط مطالب و برنامه انتشار",
    "slug": "wrt-02",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-03",
    "family": "محتوای وب",
    "title": "تهیه بریف مقاله برای جستجوی وب",
    "expectedResult": "نیاز خواننده، ساختار و منابع لازم مقاله",
    "slug": "wrt-03",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-04",
    "family": "محتوای وب",
    "title": "بازبینی محتوای وب برای خوانایی و سئو",
    "expectedResult": "اصلاح ساختار، پوشش موضوع و پیشنهاد عنوان",
    "slug": "wrt-04",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-05",
    "family": "ویرایش و تبدیل",
    "title": "بازنویسی متن برای مخاطب و لحن",
    "expectedResult": "نسخه بازنویسی‌شده با حفظ معنای موردنظر",
    "slug": "wrt-05",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-06",
    "family": "ویرایش و تبدیل",
    "title": "ویراستاری و اصلاح نگارشی",
    "expectedResult": "متن اصلاح‌شده و توضیح تغییرات مهم",
    "slug": "wrt-06",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-07",
    "family": "ویرایش و تبدیل",
    "title": "خلاصه‌سازی متن و سند",
    "expectedResult": "خلاصه وفادار به متن با نکات اصلی",
    "slug": "wrt-07",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-08",
    "family": "زبان",
    "title": "ترجمه متن",
    "expectedResult": "ترجمه با واژه‌نامه و ابهام‌های مشخص",
    "slug": "wrt-08",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-09",
    "family": "زبان",
    "title": "بومی‌سازی متن برای مخاطب مقصد",
    "expectedResult": "انطباق زبان، مثال‌ها و لحن با مخاطب",
    "slug": "wrt-09",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-10",
    "family": "مستندسازی",
    "title": "نوشتن راهنمای استفاده و مستند فنی",
    "expectedResult": "مراحل روشن، مثال و رفع ابهام برای خواننده",
    "slug": "wrt-10",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-11",
    "family": "مستندسازی",
    "title": "نوشتن نامه و سند رسمی",
    "expectedResult": "پیش‌نویس متناسب با مخاطب و هدف مکاتبه",
    "slug": "wrt-11",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-12",
    "family": "ارائه",
    "title": "تهیه متن سخنرانی و ارائه",
    "expectedResult": "روایت، متن گفتار و ساختار اسلایدها",
    "slug": "wrt-12",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-13",
    "family": "کتاب و داستان",
    "title": "طراحی ساختار کتاب",
    "expectedResult": "طرح کتاب، فصل‌ها و مسیر روایت",
    "slug": "wrt-13",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-14",
    "family": "کتاب و داستان",
    "title": "نوشتن و توسعه فصل کتاب",
    "expectedResult": "پیش‌نویس فصل با پیوستگی طرح و لحن",
    "slug": "wrt-14",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-15",
    "family": "کتاب و داستان",
    "title": "بازبینی انسجام و تدوین کتاب",
    "expectedResult": "گزارش ناسازگاری و برنامه اصلاح متن کتاب",
    "slug": "wrt-15",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-16",
    "family": "کتاب و داستان",
    "title": "نوشتن داستان و توسعه روایت",
    "expectedResult": "شخصیت، تعارض و متن روایی",
    "slug": "wrt-16",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-17",
    "family": "کتاب و داستان",
    "title": "نوشتن فیلمنامه و نمایشنامه",
    "expectedResult": "صحنه، دیالوگ و ساختار اثر غیرتبلیغاتی",
    "slug": "wrt-17",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "WRT-18",
    "family": "نشر",
    "title": "تهیه خبرنامه تحریریه‌ای",
    "expectedResult": "گزینش مطالب، روایت و متن خبرنامه",
    "slug": "wrt-18",
    "group": "publishing",
    "aliases": []
  },
  {
    "referenceId": "VIS-01",
    "family": "تصویر",
    "title": "ساخت پرتره با تصویر مرجع",
    "expectedResult": "پرتره با توصیف هویت، سبک و محدودیت‌های حفظ چهره",
    "slug": "reference-portrait",
    "group": "visual",
    "aliases": [
      "پرتره",
      "فشن",
      "عکس چهره"
    ]
  },
  {
    "referenceId": "VIS-02",
    "family": "تصویر",
    "title": "طراحی فضا و صحنه بصری",
    "expectedResult": "تصویر یا کانسپت فضا، معماری و دکور",
    "slug": "vis-02",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-03",
    "family": "تصویر",
    "title": "طراحی شخصیت و کاراکتر",
    "expectedResult": "تعریف بصری و حالت‌های شخصیت",
    "slug": "vis-03",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-04",
    "family": "تصویر",
    "title": "ساخت کانسپت آرت و تصویرسازی",
    "expectedResult": "مجموعه جهت‌های هنری برای یک ایده",
    "slug": "vis-04",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-05",
    "family": "گرافیک",
    "title": "ساخت آیکون و گرافیک برداری",
    "expectedResult": "مجموعه گرافیک هماهنگ با کاربرد مشخص",
    "slug": "vis-05",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-06",
    "family": "گرافیک",
    "title": "طراحی لوگو و نشان بصری",
    "expectedResult": "گزینه‌های بصری و منطق انتخاب نشان",
    "slug": "vis-06",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-07",
    "family": "گرافیک",
    "title": "طراحی پوستر و طرح گرافیکی",
    "expectedResult": "ترکیب‌بندی متن و تصویر برای یک پیام",
    "slug": "vis-07",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-08",
    "family": "جهت هنری",
    "title": "ساخت مودبرد و جهت هنری",
    "expectedResult": "مجموعه مرجع، رنگ و ویژگی‌های سبک",
    "slug": "vis-08",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-09",
    "family": "جهت هنری",
    "title": "بازآفرینی تصویر با سبک و مرجع",
    "expectedResult": "تصویر جدید با ویژگی‌های مرجع تعیین‌شده",
    "slug": "vis-09",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-10",
    "family": "ویرایش تصویر",
    "title": "ترمیم و بهبود کیفیت تصویر",
    "expectedResult": "نسخه اصلاح‌شده با محدودیت‌های تغییر مشخص",
    "slug": "vis-10",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-11",
    "family": "ویرایش تصویر",
    "title": "ویرایش سوژه و پس‌زمینه تصویر",
    "expectedResult": "دستور یا تصویر ویرایش‌شده برای تغییر مشخص",
    "slug": "vis-11",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-12",
    "family": "ویرایش تصویر",
    "title": "اصلاح کادر و گسترش تصویر",
    "expectedResult": "ترکیب‌بندی مناسب اندازه و مقصد جدید",
    "slug": "vis-12",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-13",
    "family": "ویدیو",
    "title": "طراحی استوری‌بورد",
    "expectedResult": "توالی نماها و شرح بصری روایت",
    "slug": "vis-13",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-14",
    "family": "ویدیو",
    "title": "تولید ویدیوی خلاقه",
    "expectedResult": "دستور تولید کلیپ با حرکت و روایت مشخص",
    "slug": "vis-14",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-15",
    "family": "ویدیو",
    "title": "تدوین و بازبینی ویدیو",
    "expectedResult": "طرح برش، ریتم و اصلاح پیوستگی",
    "slug": "vis-15",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-16",
    "family": "ویدیو",
    "title": "بازقاب‌بندی ویدیو برای اندازه جدید",
    "expectedResult": "کادر جدید با حفظ سوژه مهم",
    "slug": "vis-16",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-17",
    "family": "صدا",
    "title": "ساخت گفتار و نریشن",
    "expectedResult": "متن آماده خوانش و دستور اجرای صوت",
    "slug": "vis-17",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-18",
    "family": "صدا",
    "title": "ساخت موسیقی برای یک اثر",
    "expectedResult": "جهت موسیقایی، ساختار و نمونه صوتی مورد انتظار",
    "slug": "vis-18",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-19",
    "family": "صدا",
    "title": "طراحی افکت و فضای صوتی",
    "expectedResult": "توصیف یا بسته صداهای مناسب صحنه",
    "slug": "vis-19",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "VIS-20",
    "family": "صدا",
    "title": "پاک‌سازی و بازبینی کیفیت صوت",
    "expectedResult": "برنامه اصلاح نویز، وضوح و توازن صدا",
    "slug": "vis-20",
    "group": "visual",
    "aliases": []
  },
  {
    "referenceId": "UX-01",
    "family": "شناخت کاربر",
    "title": "طراحی برنامه تحقیق تجربه کاربری",
    "expectedResult": "سؤال تحقیق، روش و برنامه جمع‌آوری شواهد",
    "slug": "ux-01",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-02",
    "family": "شناخت کاربر",
    "title": "آماده‌سازی مصاحبه کاربر",
    "expectedResult": "راهنمای مصاحبه و پرسش‌های غیرالقایی",
    "slug": "ux-02",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-03",
    "family": "شناخت کاربر",
    "title": "تحلیل شواهد و بازخورد کاربران",
    "expectedResult": "الگوها، مسئله‌ها و حدود اطمینان",
    "slug": "ux-03",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-04",
    "family": "شناخت کاربر",
    "title": "تدوین پرسونای مبتنی بر شواهد",
    "expectedResult": "نیاز، رفتار و زمینه استفاده با ارجاع به داده",
    "slug": "ux-04",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-05",
    "family": "ساختار تجربه",
    "title": "ترسیم سفر کاربر",
    "expectedResult": "مراحل، نقاط اصطکاک و فرصت بهبود",
    "slug": "ux-05",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-06",
    "family": "ساختار تجربه",
    "title": "طراحی معماری اطلاعات و ناوبری",
    "expectedResult": "سازمان‌دهی محتوا، نام‌ها و مسیر یافتن",
    "slug": "ux-06",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-07",
    "family": "ساختار تجربه",
    "title": "طراحی جریان انجام کار",
    "expectedResult": "مسیر اصلی، استثناها و حالت‌های تعامل",
    "slug": "ux-07",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-08",
    "family": "رابط",
    "title": "ساخت وایرفریم و نمونه اولیه",
    "expectedResult": "ساختار صفحات و نمونه قابل بررسی",
    "slug": "ux-08",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-09",
    "family": "رابط",
    "title": "ساخت رابط کاربری",
    "expectedResult": "رابط و در صورت نیاز کد نمایشی آن",
    "slug": "ui-building",
    "group": "ux",
    "aliases": [
      "ui",
      "طراحی رابط",
      "کامپوننت"
    ]
  },
  {
    "referenceId": "UX-10",
    "family": "رابط",
    "title": "تدوین دیزاین سیستم",
    "expectedResult": "قواعد، اجزا و حالت‌های هماهنگ رابط",
    "slug": "ux-10",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-11",
    "family": "رابط",
    "title": "طراحی رابط واکنش‌گرا",
    "expectedResult": "رفتار و چیدمان مناسب نمایشگرهای مختلف",
    "slug": "ux-11",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-12",
    "family": "رابط",
    "title": "نوشتن میکروکپی رابط",
    "expectedResult": "متن روشن دکمه، راهنما و پیام‌ها",
    "slug": "ux-12",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-13",
    "family": "رابط",
    "title": "طراحی فرم و حالت‌های رابط",
    "expectedResult": "ورود داده، خطا، خالی، بارگذاری و موفقیت",
    "slug": "ux-13",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-14",
    "family": "ارزیابی",
    "title": "طراحی آزمون کاربردپذیری",
    "expectedResult": "سناریو، وظیفه و معیار مشاهده رفتار",
    "slug": "ux-14",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-15",
    "family": "ارزیابی",
    "title": "بازبینی کاربردپذیری رابط",
    "expectedResult": "مسئله‌ها، شدت و پیشنهاد اصلاح",
    "slug": "ux-15",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "UX-16",
    "family": "ارزیابی",
    "title": "ارزیابی دسترس‌پذیری رابط",
    "expectedResult": "یافته‌های مستند و اصلاحات قابل بررسی",
    "slug": "ux-16",
    "group": "ux",
    "aliases": []
  },
  {
    "referenceId": "DEV-01",
    "family": "ساخت محصول نرم‌افزاری",
    "title": "ساخت اپلیکیشن موبایل",
    "expectedResult": "پروژه موبایل، مراحل اجرا و معیارهای پذیرش",
    "slug": "mobile-app",
    "group": "software",
    "aliases": [
      "اندروید",
      "اندرویدی",
      "android",
      "اپ موبایل"
    ]
  },
  {
    "referenceId": "DEV-02",
    "family": "ساخت محصول نرم‌افزاری",
    "title": "ساخت اپلیکیشن وب",
    "expectedResult": "پروژه وب با امکانات و مسیر اجرای مشخص",
    "slug": "dev-02",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-03",
    "family": "ساخت محصول نرم‌افزاری",
    "title": "ساخت برنامه دسکتاپ و ابزار محلی",
    "expectedResult": "برنامه متناسب با محیط و وظیفه کاربر",
    "slug": "dev-03",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-04",
    "family": "معماری",
    "title": "تبدیل نیازمندی به مشخصات نرم‌افزار",
    "expectedResult": "محدوده، سناریوها و معیار پذیرش فنی",
    "slug": "dev-04",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-05",
    "family": "معماری",
    "title": "طراحی معماری و ماژول‌های نرم‌افزار",
    "expectedResult": "اجزا، وابستگی‌ها و انتخاب‌های مستدل",
    "slug": "dev-05",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-06",
    "family": "ساخت اجزا",
    "title": "ساخت API و سرویس بک‌اند",
    "expectedResult": "قرارداد ورودی/خروجی، سرویس و مدیریت خطا",
    "slug": "dev-06",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-07",
    "family": "ساخت اجزا",
    "title": "طراحی مدل داده و مهاجرت پایگاه داده",
    "expectedResult": "طرح داده و مسیر انتقال قابل آزمون",
    "slug": "dev-07",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-08",
    "family": "ساخت اجزا",
    "title": "پیاده‌سازی احراز هویت و سطح دسترسی",
    "expectedResult": "قواعد و کد کنترل دسترسی قابل بازبینی",
    "slug": "dev-08",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-09",
    "family": "نگهداری",
    "title": "فهم و مستندسازی کد موجود",
    "expectedResult": "توضیح رفتار، وابستگی‌ها و نقاط حساس",
    "slug": "dev-09",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-10",
    "family": "نگهداری",
    "title": "رفع باگ و تحلیل لاگ خطا",
    "expectedResult": "علت احتمالی، اصلاح و روش بازتولید",
    "slug": "dev-10",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-11",
    "family": "نگهداری",
    "title": "بازبینی کیفیت کد",
    "expectedResult": "یافته‌ها، اولویت و پیشنهاد تغییر",
    "slug": "dev-11",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-12",
    "family": "نگهداری",
    "title": "بازآرایی کد",
    "expectedResult": "ساختار خواناتر با حفظ رفتار مورد انتظار",
    "slug": "dev-12",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-13",
    "family": "کیفیت",
    "title": "طراحی و نوشتن آزمون نرم‌افزار",
    "expectedResult": "سناریوهای مؤثر، آزمون‌ها و روش اجرا",
    "slug": "dev-13",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-14",
    "family": "کیفیت",
    "title": "بررسی امنیت دفاعی نرم‌افزار",
    "expectedResult": "ضعف‌های قابل اثبات و پیشنهاد اصلاح",
    "slug": "dev-14",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-15",
    "family": "کیفیت",
    "title": "بهینه‌سازی عملکرد نرم‌افزار",
    "expectedResult": "گلوگاه اندازه‌گیری‌شده و تغییر قابل سنجش",
    "slug": "dev-15",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-16",
    "family": "نگهداری",
    "title": "انتقال فناوری و ارتقای وابستگی‌ها",
    "expectedResult": "برنامه سازگاری، تغییر و بازگشت",
    "slug": "dev-16",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-17",
    "family": "انتشار",
    "title": "آماده‌سازی ساخت و انتشار نرم‌افزار",
    "expectedResult": "تنظیمات ساخت، کنترل‌های انتشار و راهنمای بازگشت",
    "slug": "dev-17",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-18",
    "family": "انتشار",
    "title": "تنظیم زیرساخت و محیط اجرای برنامه",
    "expectedResult": "پیکربندی و راهنمای اجرا برای محیط مشخص",
    "slug": "dev-18",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-19",
    "family": "اتوماسیون",
    "title": "ساخت گردش کار خودکار",
    "expectedResult": "محرک، مراحل، شروط و مدیریت شکست",
    "slug": "dev-19",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-20",
    "family": "اتوماسیون",
    "title": "اتصال سرویس‌ها و ساخت یکپارچه‌سازی",
    "expectedResult": "تبادل داده و مدیریت خطا بین سرویس‌ها",
    "slug": "dev-20",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-21",
    "family": "ایجنت",
    "title": "طراحی دستیار و گردش کار ایجنتی",
    "expectedResult": "نقش، ابزارها، مجوزها و شیوه ارزیابی دستیار",
    "slug": "dev-21",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DEV-22",
    "family": "ایجنت",
    "title": "تدوین راهنمای ایجنت توسعه پروژه",
    "expectedResult": "قواعد مخزن، روش توسعه، آزمون و تحویل",
    "slug": "dev-22",
    "group": "software",
    "aliases": []
  },
  {
    "referenceId": "DAT-01",
    "family": "آماده‌سازی داده",
    "title": "استخراج اطلاعات ساختاریافته از اسناد",
    "expectedResult": "جدول داده همراه با ارجاع و موارد نامطمئن",
    "slug": "dat-01",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-02",
    "family": "آماده‌سازی داده",
    "title": "پاک‌سازی و یکسان‌سازی داده",
    "expectedResult": "داده اصلاح‌شده و ثبت قواعد تغییر",
    "slug": "dat-02",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-03",
    "family": "آماده‌سازی داده",
    "title": "ترکیب مجموعه‌داده‌ها",
    "expectedResult": "داده ادغام‌شده با کنترل تطبیق و تکرار",
    "slug": "dat-03",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-04",
    "family": "ابزار تحلیل",
    "title": "ساخت فرمول و محاسبه صفحه گسترده",
    "expectedResult": "فرمول‌ها و نمونه کنترل نتیجه",
    "slug": "dat-04",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-05",
    "family": "ابزار تحلیل",
    "title": "نوشتن پرس‌وجو برای تحلیل داده",
    "expectedResult": "SQL یا پرس‌وجو با هدف تحلیلی مشخص",
    "slug": "dat-05",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-06",
    "family": "تحلیل",
    "title": "تحلیل اکتشافی مجموعه‌داده",
    "expectedResult": "الگوها، کیفیت داده و پرسش‌های بعدی",
    "slug": "dat-06",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-07",
    "family": "تحلیل",
    "title": "مقایسه آماری و آزمون فرضیه",
    "expectedResult": "محاسبه، مفروضات و تفسیر محدودیت‌ها",
    "slug": "dat-07",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-08",
    "family": "تحلیل",
    "title": "طراحی و تحلیل آزمایش",
    "expectedResult": "طرح آزمایش، شاخص و تحلیل عدم قطعیت",
    "slug": "dat-08",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-09",
    "family": "نمایش و گزارش",
    "title": "ساخت نمودار و داشبورد تحلیلی",
    "expectedResult": "نمایش روشن داده و منطق انتخاب نمودار",
    "slug": "dat-09",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-10",
    "family": "نمایش و گزارش",
    "title": "تهیه گزارش تحلیلی مستند",
    "expectedResult": "نتیجه‌ها، شواهد و تفکیک تفسیر از داده",
    "slug": "dat-10",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-11",
    "family": "پژوهش",
    "title": "تدوین سؤال و برنامه پژوهش",
    "expectedResult": "سؤال محدود، روش و برنامه جمع‌آوری منابع",
    "slug": "dat-11",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-12",
    "family": "پژوهش",
    "title": "جستجو و مرور منابع معتبر",
    "expectedResult": "فهرست منابع با دامنه و دلیل ارتباط",
    "slug": "dat-12",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-13",
    "family": "پژوهش",
    "title": "مقایسه و ترکیب یافته‌های منابع",
    "expectedResult": "توافق‌ها، اختلاف‌ها و شکاف شواهد",
    "slug": "dat-13",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-14",
    "family": "پژوهش",
    "title": "بررسی صحت ادعا و ارجاع",
    "expectedResult": "نتیجه بررسی، منشأ ادعا و حدود اطمینان",
    "slug": "dat-14",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-15",
    "family": "پژوهش",
    "title": "طراحی پرسش‌نامه پژوهشی",
    "expectedResult": "سؤال‌ها، شیوه نمونه‌گیری و محدودیت‌ها",
    "slug": "dat-15",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "DAT-16",
    "family": "پژوهش",
    "title": "تحلیل متن و پاسخ‌های پژوهشی",
    "expectedResult": "کدگذاری، مضمون‌ها و نمونه شواهد",
    "slug": "dat-16",
    "group": "data",
    "aliases": []
  },
  {
    "referenceId": "EDU-01",
    "family": "یادگیرنده",
    "title": "تدوین برنامه یادگیری یک مهارت",
    "expectedResult": "مسیر، پیش‌نیازها، تمرین و نقاط ارزیابی",
    "slug": "learning-plan",
    "group": "education",
    "aliases": [
      "مسیر یادگیری",
      "آموزش مهارت",
      "برنامه‌ریزی یادگیری"
    ]
  },
  {
    "referenceId": "EDU-02",
    "family": "یادگیرنده",
    "title": "توضیح مفهوم با سطح‌بندی",
    "expectedResult": "توضیح متناسب با دانش قبلی و مثال",
    "slug": "edu-02",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-03",
    "family": "یادگیرنده",
    "title": "تمرین با مربی پرسش‌محور",
    "expectedResult": "گفتگو و پرسش برای رسیدن به پاسخ",
    "slug": "edu-03",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-04",
    "family": "یادگیرنده",
    "title": "ساخت تمرین و مسئله آموزشی",
    "expectedResult": "تمرین‌های متناسب با هدف و سطح",
    "slug": "edu-04",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-05",
    "family": "یادگیرنده",
    "title": "دریافت بازخورد بر پاسخ و تکلیف",
    "expectedResult": "خطا، دلیل و تمرین اصلاحی؛ با کنترل مدرس در کاربرد رسمی",
    "slug": "edu-05",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-06",
    "family": "یادگیرنده",
    "title": "آماده‌سازی برای آزمون",
    "expectedResult": "برنامه مرور، آزمون تمرینی و تحلیل ضعف",
    "slug": "edu-06",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-07",
    "family": "یادگیرنده",
    "title": "تمرین زبان و مکالمه",
    "expectedResult": "نقش گفتگو، اصلاح و واژه‌های متناسب",
    "slug": "edu-07",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-08",
    "family": "یادگیرنده",
    "title": "ساخت فلش‌کارت و برنامه مرور",
    "expectedResult": "کارت‌های یادگیری و توالی مرور",
    "slug": "edu-08",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-09",
    "family": "مدرس",
    "title": "طراحی برنامه درس و دوره",
    "expectedResult": "اهداف، ترتیب مطالب و فعالیت‌ها",
    "slug": "edu-09",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-10",
    "family": "مدرس",
    "title": "تهیه طرح درس و فعالیت کلاس",
    "expectedResult": "مراحل تدریس، زمان‌بندی و مواد لازم",
    "slug": "edu-10",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-11",
    "family": "مدرس",
    "title": "انطباق آموزش با نیاز یادگیرنده",
    "expectedResult": "نسخه‌های سطح‌بندی‌شده و پشتیبانی آموزشی",
    "slug": "edu-11",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-12",
    "family": "مدرس",
    "title": "ساخت آزمون و معیار ارزیابی",
    "expectedResult": "پرسش، پاسخ مرجع و روبریک قابل بازبینی",
    "slug": "edu-12",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-13",
    "family": "مدرس",
    "title": "تحلیل پیشرفت یادگیری",
    "expectedResult": "گزارش از داده بدون هویت و پیشنهاد تمرین",
    "slug": "edu-13",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "EDU-14",
    "family": "مدرس",
    "title": "تولید محتوای آموزشی چندرسانه‌ای",
    "expectedResult": "متن درس، مثال و طرح رسانه برای آموزش",
    "slug": "edu-14",
    "group": "education",
    "aliases": []
  },
  {
    "referenceId": "LIF-01",
    "family": "رشد فردی",
    "title": "برنامه‌ریزی برای یک هدف شخصی",
    "expectedResult": "هدف روشن، مراحل و بازبینی پیشرفت",
    "slug": "personal-goal",
    "group": "personal",
    "aliases": [
      "کوچینگ",
      "توسعه فردی",
      "رشد فردی",
      "برنامه‌ریزی برای یک هدف"
    ]
  },
  {
    "referenceId": "LIF-02",
    "family": "رشد فردی",
    "title": "طراحی عادت و پیگیری استمرار",
    "expectedResult": "اقدام کوچک، محرک و برنامه پیگیری",
    "slug": "lif-02",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-03",
    "family": "بهره‌وری",
    "title": "اولویت‌بندی کارهای شخصی",
    "expectedResult": "ترتیب کارها با زمان و محدودیت‌ها",
    "slug": "lif-03",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-04",
    "family": "بهره‌وری",
    "title": "برنامه‌ریزی روز و هفته",
    "expectedResult": "برنامه واقع‌بینانه و فضای بازنگری",
    "slug": "lif-04",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-05",
    "family": "رشد فردی",
    "title": "بازاندیشی و ژورنال‌نویسی هدایت‌شده",
    "expectedResult": "پرسش‌های تأمل و ثبت تجربه",
    "slug": "lif-05",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-06",
    "family": "رشد فردی",
    "title": "مقایسه گزینه‌های تصمیم شخصی",
    "expectedResult": "معیارها، پیامدها و ابهام‌ها",
    "slug": "lif-06",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-07",
    "family": "مسیر شغلی",
    "title": "بررسی مسیر و تغییر شغل",
    "expectedResult": "گزینه‌ها و آزمایش‌های کم‌هزینه مسیر شغلی",
    "slug": "lif-07",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-08",
    "family": "مسیر شغلی",
    "title": "نوشتن و بهبود رزومه",
    "expectedResult": "رزومه مبتنی بر تجربه واقعی",
    "slug": "lif-08",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-09",
    "family": "مسیر شغلی",
    "title": "نوشتن معرفی و نامه درخواست شغل",
    "expectedResult": "متن متناسب با موقعیت و سوابق واقعی",
    "slug": "lif-09",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-10",
    "family": "مسیر شغلی",
    "title": "تمرین مصاحبه شغلی",
    "expectedResult": "شبیه‌سازی گفتگو و بازخورد پاسخ‌ها",
    "slug": "lif-10",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-11",
    "family": "مسیر شغلی",
    "title": "تهیه پورتفولیو حرفه‌ای",
    "expectedResult": "انتخاب نمونه‌ها و روایت سهم شخص",
    "slug": "lif-11",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-12",
    "family": "مسیر شغلی",
    "title": "آماده‌سازی مذاکره پیشنهاد شغلی",
    "expectedResult": "سؤال‌ها، اولویت‌ها و سناریوهای مذاکره",
    "slug": "lif-12",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-13",
    "family": "زندگی روزمره",
    "title": "برنامه‌ریزی سفر",
    "expectedResult": "برنامه با بودجه و اطلاعات نیازمند بررسی روز",
    "slug": "lif-13",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-14",
    "family": "زندگی روزمره",
    "title": "برنامه‌ریزی غذا و خرید روزمره",
    "expectedResult": "برنامه بر اساس ترجیح و مواد موجود",
    "slug": "lif-14",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-15",
    "family": "زندگی روزمره",
    "title": "سامان‌دهی خانه و کارهای شخصی",
    "expectedResult": "فهرست، تقسیم زمان و برنامه نگهداری",
    "slug": "lif-15",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-16",
    "family": "زندگی روزمره",
    "title": "برنامه‌ریزی مناسبت و رویداد شخصی",
    "expectedResult": "فعالیت‌ها، نیازها و زمان‌بندی",
    "slug": "lif-16",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-17",
    "family": "زندگی روزمره",
    "title": "مقایسه کالا برای خرید شخصی",
    "expectedResult": "معیارها و مقایسه مبتنی بر منابع روز",
    "slug": "lif-17",
    "group": "personal",
    "aliases": []
  },
  {
    "referenceId": "LIF-18",
    "family": "زندگی روزمره",
    "title": "تنظیم بودجه شخصی",
    "expectedResult": "ثبت دخل‌وخرج و سناریوی مدیریت هزینه",
    "slug": "lif-18",
    "group": "personal",
    "aliases": []
  }
];

// Ambiguous old concepts stay readable/editable; no automatic data reclassification.
export const legacyUseCases: ArchiveUseCase[] = [
  {
    "slug": "app-development",
    "group": "software",
    "title": "ساخت اپلیکیشن",
    "aliases": [
      "ساخت برنامه",
      "توسعه اپ"
    ],
    "legacy": true,
    "referenceIds": [
      "DEV-01",
      "DEV-02",
      "DEV-03"
    ],
    "family": "کاربردهای ثبت‌شده قبلی",
    "expectedResult": "پروژه موبایل، مراحل اجرا و معیارهای پذیرش؛ پروژه وب با امکانات و مسیر اجرای مشخص؛ برنامه متناسب با محیط و وظیفه کاربر"
  },
  {
    "slug": "ui-review",
    "group": "ux",
    "title": "ارزیابی رابط کاربری",
    "aliases": [
      "دسترس پذیری",
      "accessibility",
      "بازبینی ui"
    ],
    "legacy": true,
    "referenceIds": [
      "UX-15",
      "UX-16"
    ],
    "family": "کاربردهای ثبت‌شده قبلی",
    "expectedResult": "مسئله‌ها، شدت و پیشنهاد اصلاح؛ یافته‌های مستند و اصلاحات قابل بررسی"
  },
  {
    "slug": "book-writing",
    "group": "publishing",
    "title": "تدوین کتاب",
    "aliases": [
      "نوشتن کتاب",
      "نویسندگی",
      "فصل کتاب"
    ],
    "legacy": true,
    "referenceIds": [
      "WRT-13",
      "WRT-14",
      "WRT-15"
    ],
    "family": "کاربردهای ثبت‌شده قبلی",
    "expectedResult": "طرح کتاب، فصل‌ها و مسیر روایت؛ پیش‌نویس فصل با پیوستگی طرح و لحن؛ گزارش ناسازگاری و برنامه اصلاح متن کتاب"
  },
  {
    "slug": "social-brand",
    "group": "social",
    "title": "تدوین استراتژی برند در سوشال مدیا",
    "aliases": [
      "برند کوچ",
      "brand coach",
      "هویت برند",
      "برند شخصی"
    ],
    "legacy": true,
    "referenceIds": [
      "SOC-11",
      "SOC-01"
    ],
    "family": "کاربردهای ثبت‌شده قبلی",
    "expectedResult": "جایگاه، لحن و الگوی حضور؛ شامل برند کوچ؛ مخاطب، هدف، ستون‌های محتوا و شیوه سنجش"
  },
  {
    "slug": "instagram-growth",
    "group": "social",
    "title": "رشد و فروش در اینستاگرام",
    "aliases": [
      "کسب و کار اینستاگرام",
      "کسب‌وکار اینستاگرام",
      "instagram business"
    ],
    "legacy": true,
    "referenceIds": [
      "SOC-12",
      "SOC-13"
    ],
    "family": "کاربردهای ثبت‌شده قبلی",
    "expectedResult": "فرضیات جذب، آزمایش محتوا و سنجش رشد؛ محتوا، گفتگو و پیگیری برای تبدیل مخاطب"
  },
  {
    "slug": "text-editing",
    "group": "publishing",
    "title": "بازنویسی و خلاصه‌سازی متن",
    "aliases": [
      "ویرایش متن",
      "خلاصه سازی",
      "بازنویسی"
    ],
    "legacy": true,
    "referenceIds": [
      "WRT-05",
      "WRT-06",
      "WRT-07"
    ],
    "family": "کاربردهای ثبت‌شده قبلی",
    "expectedResult": "نسخه بازنویسی‌شده با حفظ معنای موردنظر؛ متن اصلاح‌شده و توضیح تغییرات مهم؛ خلاصه وفادار به متن با نکات اصلی"
  }
];

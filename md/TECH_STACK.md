# پشته فنی تأییدشده

بازبینی پیاده‌سازی: ۲۰۲۶/۱۱/۲۰؛ فهرست نسخه‌های ثبت‌شده مربوط به ۲۰۲۶/۱۱/۰۶ است. مرجع نسخه‌های ثبت‌شده package.json و package-lock.json همین پروژه است؛ بررسی اولیه npm registry در ۲۰۲۶/۱۱/۰۲ انجام شده است.

NextAuth جایگزین Better Auth شده و مدیر پکیج فقط npm است.

Prisma CLI با وجود برچسب latest روی نسخه RC، عمداً روی آخرین نسخه پایدار 7.10.1 هماهنگ با client و adapter انتخاب شد.

## نسخه‌های نصب‌شده

| پکیج                      | نسخه ثبت‌شده |
| ------------------------- | ------------ |
| @fontsource/vazirmatn     | 5.3.0        |
| @gsap/react               | 2.1.2        |
| @hookform/resolvers       | 7.0.1        |
| @next/env                 | 16.4.6       |
| @next-auth/prisma-adapter | 1.0.7        |
| @prisma/adapter-pg        | 7.10.1       |
| @prisma/client            | 7.10.1       |
| @radix-ui/react-slot      | 1.5.0        |
| @tanstack/react-query     | 5.105.1      |
| class-variance-authority  | 0.7.1        |
| clsx                      | 2.1.1        |
| gsap                      | 3.15.0       |
| lenis                     | 1.3.27       |
| lucide-react              | 1.66.0       |
| next                      | 16.4.6       |
| next-auth                 | 4.24.15      |
| next-intl                 | 4.14.9       |
| pg                        | 8.23.1       |
| react                     | 19.3.1       |
| react-dom                 | 19.3.1       |
| react-hook-form           | 7.91.0       |
| server-only               | 0.0.1        |
| tailwind-merge            | 3.7.0        |
| zod                       | 4.6.7        |

## ابزارهای توسعه

| پکیج                 | نسخه ثبت‌شده                      |
| -------------------- | --------------------------------- |
| @tailwindcss/postcss | 4.3.3                             |
| @types/node          | 24.19.2                           |
| @types/pg            | 8.23.1                            |
| @types/react         | 19.3.0                            |
| @types/react-dom     | 19.3.0                            |
| @typescript/native   | npm:typescript@7.0.2              |
| oxlint               | 1.90.0                            |
| prettier             | 3.9.10                            |
| prisma               | 7.10.1                            |
| shadcn               | 4.23.0                            |
| tailwindcss          | 4.3.3                             |
| tsx                  | 4.23.15                           |
| tw-animate-css       | 1.4.0                             |
| typescript           | npm:@typescript/typescript6@6.0.2 |
| vitest               | 5.0.5                             |

## تصمیم‌ها

برای عکس دسته‌بندی SDK رسمی `@supabase/supabase-js` نسخهٔ ثابت 2.119.2 اضافه شد. تبدیل تصویر با Sharp موجود و ذخیره در bucket خصوصی انجام می‌شود؛ جزئیات در [معماری، مدیریت کاتالوگ](ARCHITECTURE.md#مدیریت-کاتالوگ) است. فعال‌شدن ذخیره‌سازی به کلید سروری Storage وابسته است.

صفحه‌بندی از Next Link، فرم Next.js و اجزای استاندارد daisyUI در یک کامپوننت مشترک استفاده می‌کند. مرجع [صفحه‌بندی مشترک](DESIGN_SYSTEM.md#صفحه‌بندی-مشترک) است.

پنل از وابستگی‌های موجود استفاده می‌کند: daisyUI برای جدول، badgeهای نقش، کنترل‌ها، tooltipهای رنگی و گروه‌های بومی details/summary سایدبار؛ dialog بومی و useActionState برای تأیید عملیات؛ GSAP برای گذار opacity نتایج و ورود کشوی موبایل؛ SplitText برای تیتر و زیرتیتر در layout ثابت هر مسیر؛ Web Animations API مشترک برای جابه‌جایی زبان. موج‌های نقطه‌ای همان Canvas مشترک صفحهٔ حساب هستند. مشخصات ظاهر در [سیستم طراحی](DESIGN_SYSTEM.md#پنل-مدیریت) ثبت شده است.

- Next.js App Router و React با TypeScript strict.
- Tailwind و daisyUI برای تم و اجزای استاندارد؛ Lucide و فونت فارسی Vazirmatn. ابزار shadcn فعلاً نصب مانده است.
- Tailwind روش اصلی استایل‌نویسی مستقیم در JSX است؛ CSS خام فقط برای موارد خاص و پیچیده استفاده می‌شود. قرارداد کامل در [DESIGN_SYSTEM.md#قواعد-رابط-و-حرکت](DESIGN_SYSTEM.md#قواعد-رابط-و-حرکت) است.
- GSAP و useGSAP برای تعویض محصولات و drag، و SplitText برای Title/Subtitle فعال‌اند. هاور دکمه با transitionهای Tailwind اجرا می‌شود. ScrollTrigger و Lenis نصب‌اند ولی در هیروی فعلی استفاده نمی‌شوند؛ جزئیات در [DESIGN_SYSTEM.md#قواعد-رابط-و-حرکت](DESIGN_SYSTEM.md#قواعد-رابط-و-حرکت) و [ARCHITECTURE.md#صفحه-اصلی-و-نمایش-محصول](ARCHITECTURE.md#صفحه-اصلی-و-نمایش-محصول) است.
- next-intl برای فارسی/انگلیسی و RTL/LTR؛ کاتالوگ‌های موضوعی در messages، کلیدهای بررسی‌شده با TypeScript، قالب‌های ICU و کنترل AST متن مستقیم در تست Vitest. قرارداد در [ARCHITECTURE.md#مرز-متن-قابل-ترجمه](ARCHITECTURE.md#مرز-متن-قابل-ترجمه) ثبت شده است.
- TanStack Query، React Hook Form و Zod.
- PostgreSQL روی پروژه موجود Supabase در Frankfurt؛ اتصال سروری Prisma 7.10.1 و pg با Session pooler و اعتبارسنجی کامل TLS با SELECT 1 تأیید شد. سه migration اولیه و حفاظت مالک روی همین Supabase اعمال شده‌اند؛ ۱۲ جدول کاربردی و متادیتای Prisma ایجاد شده و تست واقعی ثبت‌نام، ورود، نشست و خروج موفق است. دستورها و نتایج در [DEVELOPMENT.md](DEVELOPMENT.md#اتصال-دیتابیس) هستند.
- NextAuth پایدار 4.24.15؛ نسخه ۵ هنوز beta است و نصب نشده.
- adapter رسمی @next-auth/prisma-adapter نسخه 1.0.7 برای NextAuth 4 نصب شده است. ورود ایمیل/رمز با Credentials، نشست JWT و هش scrypt داخلی Node اجرا می‌شود؛ سرویس Supabase Auth استفاده نشده است.
- Oxlint و Prettier؛ ESLint اولیه حذف شد.
- تست سبک Vitest؛ بدون Playwright و axe در نصب پایه.
- Nodemailer فعلاً به علت تعارض نسخه امن با peer dependency احراز هویت حذف شد.
- Sharp نسخه 0.35.5 برای اعتبارسنجی و تبدیل عکس پروفایل به WebP استفاده می‌شود. ذخیره‌سازی تصاویر محصول با Supabase Storage در برنامه آینده قرار دارد. دامنه کار در [TODO.md](TODO.md#ذخیره-و-آپلود-عکس) ثبت شده است.
- میزبانی برنامه، پیامک، درگاه و AI هنوز انتخاب نشده‌اند.

## منابع

- https://next-auth.js.org/getting-started/example
- https://authjs.dev/getting-started/installation
- نسخه دقیق نصب‌شده و وابستگی‌های انتقالی: package-lock.json

## هویت و تم سایت

تمام ۳۵ تم رسمی daisyUI 5.7.50 برای انتخاب مستقیم چهار تم در پنل در دسترس‌اند؛ TechLight/TechDark از این صفحه و ورودی ذخیرهٔ مدیر حذف شده‌اند. پنجرهٔ کاربر همیشه با تم اصلی ثابت شروع و با رنگ دلخواه ختم می‌شود؛ چهار انتخاب مدیر بین آن‌ها هستند. رنگ دلخواه برای روشن/تیره از پیش‌فرض برند شروع می‌شود. نام‌ها با next-intl ترجمه می‌شوند؛ تعامل و جایگزینی قدیمی‌ترین انتخاب با React و گذار opacity با Tailwind انجام می‌شود و وابستگی تازه‌ای اضافه نشده است. مرجع [DESIGN_SYSTEM.md#تم-و-رنگ](DESIGN_SYSTEM.md#تم-و-رنگ) است.

## مهاجرت به daisyUI

daisyUI نسخه 5.7.50 به devDependencies اضافه شد. برای فهرست تم‌ها و نگاشت حالت روشن و تیره به مرجع جاری رجوع کنید. مرجع جاری [DESIGN_SYSTEM.md#تم-و-رنگ](DESIGN_SYSTEM.md#تم-و-رنگ) است.

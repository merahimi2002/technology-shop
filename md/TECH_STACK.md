# پشته فنی تأییدشده

همگام‌سازی با مخزن: ۲۰۲۶/۱۱/۰۶. مرجع نسخه‌های ثبت‌شده package.json و package-lock.json همین پروژه است؛ بررسی اولیه npm registry در ۲۰۲۶/۱۱/۰۲ انجام شده است.

NextAuth جایگزین Better Auth شده و مدیر پکیج فقط npm است.

Prisma CLI با وجود برچسب latest روی نسخه RC، عمداً روی آخرین نسخه پایدار 7.10.1 هماهنگ با client و adapter انتخاب شد.

## نسخه‌های نصب‌شده

| پکیج                      | نسخه ثبت‌شده |
| ------------------------- | ------------ |
| @fontsource/vazirmatn     | 5.3.0        |
| @gsap/react               | 2.1.2        |
| @hookform/resolvers       | 7.0.1        |
| @next/env                 | 16.4.3       |
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
| next                      | 16.4.3       |
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

پالت navy با primary hsl(244 100% 36%) و secondary #008879 نهایی است. cobalt و violet تم‌های جایگزین‌اند. هر سه حالت روشن/تیره دارند؛ گزینه custom نیز رنگ اصلی/دوم هر دو حالت را با انتخاب‌گر بومی و ذخیره محلی ارائه می‌دهد. مرجع پیاده‌سازی و نتایج بررسی در [DESIGN_SYSTEM.md#تم-و-رنگ](DESIGN_SYSTEM.md#تم-و-رنگ) است. تم‌ها با daisyUI 5.7.50 مدیریت می‌شوند؛ سیستم توکن سفارشی قبلی حذف شده است.

## مهاجرت به daisyUI

daisyUI نسخه 5.7.50 به devDependencies اضافه شد. تم‌های داخلی nord/night، winter/dim و cupcake/dracula مبنا هستند و فقط رنگ برند تغییر می‌کند. مرجع جاری [DESIGN_SYSTEM.md#تم-و-رنگ](DESIGN_SYSTEM.md#تم-و-رنگ) است.

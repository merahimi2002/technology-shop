# پشته فنی تأییدشده

تاریخ بررسی: ۲۰۲۶/۱۱/۰۲. منبع نسخه‌ها npm registry و package-lock.json همین پروژه است.

NextAuth جایگزین Better Auth شده و مدیر پکیج فقط npm است.

Prisma CLI با وجود برچسب latest روی نسخه RC، عمداً روی آخرین نسخه پایدار 7.10.1 هماهنگ با client و adapter انتخاب شد.

## نسخه‌های نصب‌شده

| پکیج                     | نسخه ثبت‌شده |
| ------------------------ | ------------ |
| @fontsource/vazirmatn    | 5.3.0        |
| @gsap/react              | 2.1.2        |
| @hookform/resolvers      | 7.0.1        |
| @prisma/adapter-pg       | 7.10.1       |
| @prisma/client           | 7.10.1       |
| @radix-ui/react-slot     | 1.5.0        |
| @tanstack/react-query    | 5.105.1      |
| class-variance-authority | 0.7.1        |
| clsx                     | 2.1.1        |
| gsap                     | 3.15.0       |
| lenis                    | 1.3.27       |
| lucide-react             | 1.66.0       |
| next                     | 16.4.3       |
| next-auth                | 4.24.15      |
| next-intl                | 4.14.9       |
| pg                       | 8.23.1       |
| react                    | 19.3.1       |
| react-dom                | 19.3.1       |
| react-hook-form          | 7.91.0       |
| server-only              | 0.0.1        |
| tailwind-merge           | 3.7.0        |
| zod                      | 4.6.7        |

## ابزارهای توسعه

| پکیج                   | نسخه ثبت‌شده                      |
| ---------------------- | --------------------------------- |
| @tailwindcss/turbopack | 4.3.3                             |
| @types/node            | 24.19.2                           |
| @types/pg              | 8.23.1                            |
| @types/react           | 19.3.0                            |
| @types/react-dom       | 19.3.0                            |
| @typescript/native     | npm:typescript@7.0.2              |
| oxlint                 | 1.90.0                            |
| prettier               | 3.9.10                            |
| prisma                 | 7.10.1                            |
| shadcn                 | 4.23.0                            |
| tailwindcss            | 4.3.3                             |
| tsx                    | 4.23.15                           |
| tw-animate-css         | 1.4.0                             |
| typescript             | npm:@typescript/typescript6@6.0.2 |
| vitest                 | 5.0.5                             |

## تصمیم‌ها

- Next.js App Router و React با TypeScript strict.
- Tailwind، shadcn/ui و Lucide؛ فونت فارسی Vazirmatn.
- GSAP، ScrollTrigger و Lenis؛ فعال‌سازی در مرحله طراحی.
- next-intl برای فارسی/انگلیسی و RTL/LTR.
- TanStack Query، React Hook Form و Zod.
- PostgreSQL با Prisma و pg؛ سرویس دیتابیس هنوز راه‌اندازی نشده.
- NextAuth پایدار 4.24.15؛ نسخه ۵ هنوز beta است و نصب نشده.
- Oxlint و Prettier؛ ESLint اولیه حذف شد.
- تست سبک Vitest؛ بدون Playwright و axe در نصب پایه.
- Nodemailer فعلاً به علت تعارض نسخه امن با peer dependency احراز هویت حذف شد.
- میزبانی، فایل S3، پیامک، درگاه و AI هنوز انتخاب نشده‌اند.

## منابع

- https://next-auth.js.org/getting-started/example
- https://authjs.dev/getting-started/installation
- نسخه دقیق نصب‌شده و وابستگی‌های انتقالی: package-lock.json

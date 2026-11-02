# لوگوی Tech Shop — نسخه تأییدشده

هندسه سبد TS با دسته‌های متصل و S خواناتر توسط مالک تأیید شد. رنگ برند پیش‌فرض نهایی: primary #142D4E و secondary #008879. دسته‌ها و S رنگ دوم و بدنه، لبه و T رنگ اول دارند. حلقه، ستاره و نوشته بیرونی ندارد.

دو رنگ جایگزین نمونه‌های ۲ و ۳ به عنوان تم سایت حفظ شدند؛ راهنمای کامل در [THEME.md](THEME.md) است. فایل‌های شش نمونه اولیه صرفاً آرشیو پیشنهادها هستند و پالت‌های ۴ تا ۶ در انتخاب تم سایت فعال نیستند.

## استفاده

```tsx
import { Logo } from '@/components/logo';

// با تم فعال سایت هماهنگ است.
<Logo width={96} height={96} />

// رنگ ثابت یا تک‌رنگ مستقل از تم.
<Logo primaryColor="#142D4E" secondaryColor="#008879" width={96} height={96} />
<Logo primaryColor="currentColor" secondaryColor="currentColor" className="text-white" width={64} height={64} />
```

متغیرهای --logo-primary و --logo-secondary به --color-primary و --color-secondary در تم فعال daisyUI متصل‌اند. فایل SVG مستقل در نبود CSS، رنگ نهایی سرمه‌ای/سبزآبی را نمایش می‌دهد. برای img یا نرم‌افزار طراحی، مقادیر var(--logo-primary, #142D4E) و var(--logo-secondary, #008879) را با رنگ دلخواه جایگزین کنید. رنگ والد HTML به فایل SVG داخل img/next/image منتقل نمی‌شود.

## فایل‌ها

- public/logo.svg و public/logo-mark.svg: هندسه یکسان، SVG شفاف با viewBox برابر 0 0 240 240 و بدون فونت یا bitmap.
- components/logo.tsx: نسخه React با دو پراپ رنگ.
- scripts/generate-logo.mjs: منبع مشترک تولید؛ تغییر هندسه از این فایل انجام شود.
- app/icon.svg و app/favicon.ico: نسخه پیش‌فرض برند؛ ICO با اندازه‌های 16، 32 و 48.
- public/favicons: نسخه هر سه پالت برای تعویض favicon در مرورگر.

favicon روی زمینه روشن ثابت قرار می‌گیرد تا روی تب‌های روشن و تیره دیده شود. با تغییر تم، رنگ آن نیز هماهنگ می‌شود. شکل اصلی لوگو تغییر نکرده است.

تولید مجدد با npm run assets:generate؛ بررسی‌ها و محدودیت‌های واقعی در THEME.md ثبت شده‌اند.

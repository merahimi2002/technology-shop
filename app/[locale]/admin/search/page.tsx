import { Suspense } from 'react';
import Link from 'next/link';
import { createTranslator } from 'next-intl';
import { requireAdminUser } from '@/lib/auth/admin-session';
import { listUsers, parseUserFilters } from '@/lib/admin/users';
import { getDb } from '@/lib/db';
import en from '@/messages/en.json';
import fa from '@/messages/fa.json';

const pages = [
  ['', 'admin.dashboard'],
  ['/users', 'admin.heading'],
  ['/products', 'adminProducts.heading'],
  ['/products/new', 'adminProducts.newProduct'],
  ['/categories', 'adminProducts.categories'],
  ['/categories/new', 'adminProducts.newCategory'],
  ['/settings/theme', 'siteSettings.title'],
  ['/settings/theme', 'siteSettings.theme'],
] as const;

async function SearchResults({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/search'>) {
  const { locale } = await params;
  const viewer = await requireAdminUser(locale, '/search');
  const t = searchTranslator(locale);
  const query = parseUserFilters(await searchParams).q;
  if (!query) return <p>{t('admin.searchPrompt')}</p>;

  const root = `/${locale}/admin`;
  const contains = query.replace(/[\\%_]/g, '\\$&');
  const match = { contains, mode: 'insensitive' } as const;
  const nameMatches = [{ nameFa: match }, { nameEn: match }, { slug: match }];
  const db = getDb();
  const [products, categories, { users, total: userTotal }] = await Promise.all(
    [
      db.product.findMany({
        where: { OR: [...nameMatches, { variants: { some: { sku: match } } }] },
        select: { id: true, nameFa: true, nameEn: true },
        orderBy: { id: 'asc' },
        take: 11,
      }),
      db.category.findMany({
        where: { OR: nameMatches },
        select: { id: true, nameFa: true, nameEn: true },
        orderBy: { slug: 'asc' },
        take: 11,
      }),
      listUsers(parseUserFilters({ q: query, pageSize: '10' }), viewer.role),
    ],
  );
  const localizedName = (item: { nameFa: string; nameEn: string }) =>
    locale === 'fa' ? item.nameFa : item.nameEn;
  const listQuery = new URLSearchParams({ q: query });
  const groups = [
    {
      title: t('admin.searchSections'),
      moreHref: null,
      items: pages
        .map(([path, key]) => ({ label: t(key), path }))
        .filter(({ label, path }) =>
          `${label} ${path}`.toLowerCase().includes(query.toLowerCase()),
        )
        .map(({ label, path }) => ({ label, href: root + path, key: label })),
    },
    {
      title: t('adminProducts.heading'),
      moreHref: products.length > 10 ? `${root}/products?${listQuery}` : null,
      items: products.slice(0, 10).map((product) => ({
        key: product.id,
        label: localizedName(product),
        href: `${root}/products/${encodeURIComponent(product.id)}`,
      })),
    },
    {
      title: t('adminProducts.categories'),
      moreHref:
        categories.length > 10 ? `${root}/categories?${listQuery}` : null,
      items: categories.slice(0, 10).map((category) => ({
        key: category.id,
        label: localizedName(category),
        href: `${root}/categories/new?edit=${encodeURIComponent(category.id)}`,
      })),
    },
    {
      title: t('admin.heading'),
      moreHref: userTotal > 10 ? `${root}/users?${listQuery}` : null,
      items: users.map((user) => ({
        key: user.id,
        label: user.name || user.email || t('account.title'),
        href: `${root}/users?${new URLSearchParams({ q: user.email || user.name || query })}`,
      })),
    },
  ].filter(({ items }) => items.length);

  if (!groups.length) return <p>{t('admin.searchNoResults', { query })}</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {groups.map(({ title, items, moreHref }) => (
        <section key={title} className="min-w-0">
          <h2 className="mb-2 font-semibold">{title}</h2>
          <ul className="menu w-full rounded-box bg-base-200">
            {items.map(({ key, label, href }) => (
              <li key={key}>
                <Link href={href} dir="auto" className="wrap-anywhere">
                  {label}
                </Link>
              </li>
            ))}
            {moreHref && (
              <li>
                <Link href={moreHref} className="font-semibold text-primary">
                  {t('admin.searchMore', { section: title })}
                </Link>
              </li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default async function Page(props: PageProps<'/[locale]/admin/search'>) {
  const { locale } = await props.params;
  const t = searchTranslator(locale);

  return (
    <main className="w-full min-w-0 flex-1 px-4 py-4 sm:px-6 lg:p-0">
      <div className="glass-header rounded-[20px] p-4 sm:p-5">
        <h1 className="mb-5 text-xl font-bold">{t('admin.searchResults')}</h1>
        <Suspense
          fallback={
            <div className="skeleton h-24 w-full motion-reduce:animate-none" />
          }
        >
          <SearchResults {...props} />
        </Suspense>
      </div>
    </main>
  );
}

function searchTranslator(locale: string) {
  return createTranslator({
    locale: locale === 'en' ? 'en' : 'fa',
    messages: locale === 'en' ? en : fa,
  });
}

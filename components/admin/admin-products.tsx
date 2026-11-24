'use client';

import Link from 'next/link';
import Form from 'next/form';
import { useRouter } from 'next/navigation';
import { useLocale, useFormatter, useTranslations } from 'next-intl';
import { Package, Pencil, Search } from 'lucide-react';
import { useSkeletonPreview } from '@/components/dev-skeleton-preview';
import { ProductDeleteButton } from './product-delete-button';
import { ImagePreview } from '@/components/ui/image-preview';
import { productImageUrl } from '@/lib/admin/product-image-config';
import {
  TableViewport,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import {
  productStatuses,
  type ProductInput,
  type parseProductFilters,
} from '@/lib/admin/product-input';
type Category = { id: string; slug: string; nameFa: string; nameEn: string };
type Props = {
  filters: ReturnType<typeof parseProductFilters>;
  categories: Category[];
  products: (ProductInput & { coverPath: string | null })[];
  total?: number;
  loading?: boolean;
  page: number;
  pages: number;
};

export function AdminProducts({
  filters,
  categories,
  products,
  total,
  page,
  pages,
  loading = false,
}: Props) {
  const t = useTranslations('adminProducts');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const preview = useSkeletonPreview();
  const skeleton = loading || preview;
  const path = `/${locale}/admin/products`;
  const query = new URLSearchParams({
    q: filters.q,
    status: filters.status,
    category: filters.category,
  });
  const localized = (item: { nameFa: string; nameEn: string }) =>
    locale === 'fa' ? item.nameFa : item.nameEn;
  const filterGroups = [
    {
      field: 'status',
      label: t('status'),
      reset: t('allStatuses'),
      options: productStatuses.map((status) => ({
        value: status,
        label: t(`statuses.${status}`),
      })),
    },
    {
      field: 'category',
      label: t('category'),
      reset: t('allCategories'),
      options: categories.map((category) => ({
        value: category.id,
        label: localized(category),
      })),
    },
  ] as const;
  const activeQuery = new URLSearchParams(query);
  activeQuery.set('pageSize', String(filters.pageSize));

  return (
    <div
      aria-busy={skeleton || undefined}
      className="min-w-0 p-4 motion-reduce:[&_.skeleton]:animate-none sm:p-5"
    >
      {skeleton && (
        <span role="status" className="sr-only">
          {t('loading')}
        </span>
      )}
      {!loading && !categories.length && (
        <p role="status" className="alert alert-info mb-4 text-sm">
          {t('categoryFirst')}
        </p>
      )}
      <div inert={skeleton} className="mb-4 grid min-w-0 gap-3">
        <Form
          action={path}
          scroll={false}
          role="search"
          aria-label={t('search')}
          className="input w-full rounded-full bg-base-200/80 sm:max-w-md"
        >
          <button
            type="submit"
            aria-label={t('search')}
            className="btn btn-ghost btn-circle btn-xs shrink-0 text-primary"
          >
            <Search size={18} aria-hidden="true" />
          </button>
          <input
            type="search"
            name="q"
            aria-label={t('search')}
            defaultValue={filters.q}
            key={filters.q}
            maxLength={120}
            className="text-start"
            placeholder={t('searchPlaceholder')}
          />
          <input type="hidden" name="status" value={filters.status} />
          <input type="hidden" name="category" value={filters.category} />
          <input type="hidden" name="pageSize" value={filters.pageSize} />
        </Form>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          {filterGroups.map(({ field, label, reset, options }, index) => {
            const otherFilters = new URLSearchParams(activeQuery);
            otherFilters.delete(field);
            return (
              <div
                key={field}
                className="flex min-w-0 max-w-full items-center gap-3"
              >
                {index > 0 && (
                  <div
                    className="divider divider-horizontal divider-secondary mx-0 my-0 hidden self-stretch sm:flex"
                    aria-hidden="true"
                  />
                )}
                <span className="shrink-0 text-base font-bold text-base-content">
                  {label}
                </span>
                <Form
                  key={activeQuery.toString()}
                  action={path}
                  scroll={false}
                  aria-label={label}
                  className="filter min-w-0 gap-y-1 [&_input[type=radio]]:max-w-full [&_input[type=radio]]:truncate"
                  onChange={(event) => event.currentTarget.requestSubmit()}
                  onReset={(event) => {
                    event.preventDefault();
                    router.push(`${path}?${otherFilters}`, { scroll: false });
                  }}
                >
                  {Array.from(otherFilters, ([key, value]) => (
                    <input key={key} type="hidden" name={key} value={value} />
                  ))}
                  <input
                    type="reset"
                    value="×"
                    aria-label={reset}
                    className="btn btn-square btn-sm btn-soft btn-error"
                  />
                  {options.map((option) => (
                    <input
                      key={option.value}
                      type="radio"
                      name={field}
                      value={option.value}
                      aria-label={option.label}
                      title={option.label}
                      defaultChecked={filters[field] === option.value}
                      className="btn btn-sm btn-soft btn-primary"
                    />
                  ))}
                </Form>
              </div>
            );
          })}
          {(filters.q || filters.status || filters.category) && (
            <>
              <div
                className="divider divider-horizontal divider-secondary mx-0 my-0 hidden self-stretch sm:flex"
                aria-hidden="true"
              />
              <Link
                href={`${path}?pageSize=${filters.pageSize}`}
                scroll={false}
                className="btn btn-sm btn-soft btn-error"
              >
                {t('clear')}
              </Link>
            </>
          )}
        </div>
      </div>
      <TableViewport>
        <Table
          aria-label={t('heading')}
          aria-hidden={skeleton || undefined}
          className="min-w-[52rem]"
        >
          <TableHeader>
            <TableRow>
              <TableHead className="w-64 max-md:group-data-[compact=true]/table:w-36">
                {t('product')}
              </TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('price')}</TableHead>
              <TableHead>{t('stock')}</TableHead>
              <TableHead>{t('variants')}</TableHead>
              <TableHead className="w-28">{t('productOperations')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeleton
              ? Array.from(
                  {
                    length: loading
                      ? Math.min(5, filters.pageSize)
                      : products.length,
                  },
                  (_, index) => (
                    <TableRow key={index}>
                      <th scope="row" className="md:static md:bg-transparent">
                        <div className="flex min-h-10 items-center gap-3">
                          <span className="skeleton size-10 shrink-0 rounded-box" />
                          <div className="min-w-0 flex-1">
                            <span className="skeleton block h-5 w-32 max-w-full" />
                            <span className="skeleton mt-1 block h-4 w-24 max-w-full" />
                          </div>
                        </div>
                      </th>
                      {['category', 'status', 'price', 'stock', 'variants'].map(
                        (column) => (
                          <TableCell key={column}>
                            <span className="skeleton block h-5 w-16 max-w-full" />
                          </TableCell>
                        ),
                      )}
                      <TableCell>
                        <div className="flex gap-2">
                          <span className="skeleton size-8 rounded-field" />
                          <span className="skeleton size-8 rounded-field" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )
              : products.map((product) => {
                  const category = categories.find(
                    (item) => item.id === product.categoryId,
                  );
                  const active = product.variants.filter((v) => v.isActive);
                  const price = active.reduce<string | null>(
                    (min, v) =>
                      min === null || BigInt(v.price) < BigInt(min)
                        ? v.price
                        : min,
                    null,
                  );
                  return (
                    <TableRow
                      key={product.id}
                      className="hover:bg-base-content/5"
                    >
                      <th
                        scope="row"
                        className="max-w-64 font-normal md:static md:bg-transparent"
                      >
                        <div className="flex min-h-10 items-center gap-3">
                          <span className="size-10 shrink-0 text-primary">
                            <ImagePreview
                              image={productImageUrl(product.coverPath)}
                              alt={localized(product)}
                              size={40}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">
                              {localized(product)}
                            </span>
                            <span
                              dir="ltr"
                              className={`mt-1 block truncate text-xs font-normal text-base-content/50 ${locale === 'fa' ? 'text-right' : 'text-left'}`}
                            >
                              {product.slug}
                            </span>
                          </div>
                        </div>
                      </th>
                      <TableCell className="whitespace-nowrap">
                        {category && localized(category)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`badge badge-soft whitespace-nowrap ${product.status === 'ACTIVE' ? 'badge-success' : product.status === 'ARCHIVED' ? 'badge-neutral' : 'badge-warning'}`}
                        >
                          {t(`statuses.${product.status}`)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {price === null ? (
                          t('noActiveVariant')
                        ) : (
                          <>
                            {format.number(BigInt(price))}{' '}
                            <span className="text-xs text-base-content/60">
                              {t('irr')}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {format.number(active.reduce((n, v) => n + v.stock, 0))}
                      </TableCell>
                      <TableCell>
                        {format.number(product.variants.length)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="tooltip tooltip-primary tooltip-top focus-within:tooltip-open"
                            data-tip={t('edit')}
                          >
                            <Link
                              href={`${path}/${product.id}`}
                              className="btn btn-square btn-sm btn-soft btn-primary"
                              aria-label={t('editProduct', {
                                name: localized(product),
                              })}
                            >
                              <Pencil size={16} aria-hidden="true" />
                            </Link>
                          </span>
                          <ProductDeleteButton
                            id={product.id}
                            updatedAt={product.updatedAt}
                            name={localized(product)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
        {!loading && !products.length && (
          <div className="grid justify-items-center gap-3 px-4 py-20 text-center text-base-content/60">
            <Package size={36} aria-hidden="true" />
            <p>{t('empty')}</p>
          </div>
        )}
      </TableViewport>
      <div inert={skeleton}>
        <Pagination
          total={total}
          className="mt-5"
          pathname={path}
          query={query.toString()}
          page={page}
          pageCount={pages}
          pageSize={filters.pageSize}
        />
      </div>
    </div>
  );
}

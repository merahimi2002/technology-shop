'use client';
import Link from 'next/link';
import { useSkeletonPreview } from '@/components/dev-skeleton-preview';
import { CategoryDeleteButton } from './category-delete-button';
import { CategoryThumbnail } from './category-thumbnail';
import { useLocale, useTranslations, useFormatter } from 'next-intl';
import { FolderTree, Hash, Package, Pencil } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import {
  TableViewport,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
type Category = {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  imagePath: string | null;
  _count: { products: number };
};
export function AdminCategories({
  categories,
  page,
  pages,
  pageSize,
  total,
  searchQuery = '',
  loading = false,
}: {
  categories: Category[];
  page: number;
  pages: number;
  pageSize: number;
  total?: number;
  searchQuery?: string;
  loading?: boolean;
}) {
  const t = useTranslations('adminProducts');
  const locale = useLocale();
  const format = useFormatter();
  const preview = useSkeletonPreview();
  const skeleton = loading || preview;
  const rows: Category[] = categories.length
    ? categories
    : skeleton
      ? Array.from({ length: Math.min(5, pageSize) }, (_, index) => ({
          id: 'loading-' + index,
          slug: '',
          nameFa: '',
          nameEn: '',
          imagePath: null,
          _count: { products: 0 },
        }))
      : [];

  return (
    <div
      aria-busy={skeleton || undefined}
      className="motion-reduce:[&_.skeleton]:animate-none"
    >
      {skeleton && (
        <span role="status" className="sr-only">
          {t('loadingCategories')}
        </span>
      )}
      <TableViewport className="mx-3 mt-4 mb-3 sm:mx-5 sm:mb-5">
        <Table
          aria-label={t('categories')}
          aria-hidden={skeleton || undefined}
          className={`[&_tbody_:is(th,td)]:text-start! ${locale === 'fa' ? '[&_tbody_[dir]]:text-right' : '[&_tbody_[dir]]:text-left'}`}
        >
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">
                <span className="flex items-center gap-2">
                  <FolderTree size={16} aria-hidden="true" />
                  {t('category')}
                </span>
              </TableHead>
              <TableHead>
                <span className="flex items-center gap-2">
                  <Hash size={16} aria-hidden="true" />
                  {t('slug')}
                </span>
              </TableHead>
              <TableHead>
                <span className="flex items-center gap-2">
                  <Package size={16} aria-hidden="true" />
                  {t('heading')}
                </span>
              </TableHead>
              <TableHead className="w-28">
                <span className="flex items-center gap-2">
                  <Pencil size={16} aria-hidden="true" />
                  {t('edit')}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <th
                  scope="row"
                  className="font-normal md:static md:bg-transparent"
                >
                  <div className="flex items-center gap-3">
                    {skeleton ? (
                      <span className="skeleton size-10 shrink-0 rounded-box" />
                    ) : (
                      <CategoryThumbnail
                        key={c.imagePath}
                        id={c.id}
                        path={c.imagePath}
                        name={locale === 'fa' ? c.nameFa : c.nameEn}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      {skeleton ? (
                        <span className="skeleton block h-4 w-32 max-w-full" />
                      ) : (
                        <>
                          <span
                            dir="auto"
                            className={`block truncate font-semibold ${locale === 'fa' ? 'text-right' : 'text-left'}`}
                          >
                            {locale === 'fa' ? c.nameFa : c.nameEn}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </th>
                <TableCell>
                  {skeleton ? (
                    <span className="skeleton block h-4 w-36 max-w-full" />
                  ) : (
                    <span
                      dir="ltr"
                      className={`block truncate ${locale === 'fa' ? 'text-right' : 'text-left'}`}
                    >
                      {c.slug}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {skeleton ? (
                    <span className="skeleton inline-block h-6 w-8 rounded-full" />
                  ) : (
                    <Link
                      className="badge badge-soft badge-primary"
                      aria-label={t('categoryProducts', {
                        name: locale === 'fa' ? c.nameFa : c.nameEn,
                      })}
                      href={`/${locale}/admin/products?category=${c.id}`}
                    >
                      {format.number(c._count.products)}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-start gap-2">
                    {skeleton ? (
                      <>
                        <span className="skeleton size-8 rounded-field" />
                        <span className="skeleton size-8 rounded-field" />
                      </>
                    ) : (
                      <>
                        <span
                          className="tooltip tooltip-primary tooltip-top focus-within:tooltip-open"
                          data-tip={t('editCategory')}
                        >
                          <Link
                            href={`/${locale}/admin/categories/new?edit=${c.id}`}
                            className="btn btn-square btn-sm btn-soft btn-primary"
                            aria-label={t('editCategory')}
                          >
                            <Pencil size={18} aria-hidden="true" />
                          </Link>
                        </span>
                        <CategoryDeleteButton
                          category={{
                            id: c.id,
                            slug: c.slug,
                            nameFa: c.nameFa,
                            nameEn: c.nameEn,
                            imagePath: c.imagePath,
                          }}
                        />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!skeleton && !categories.length && (
          <p className="p-6 text-center text-sm text-base-content/60">
            {t(searchQuery ? 'noMatchingCategories' : 'categoryFirst')}
          </p>
        )}
      </TableViewport>
      <div
        inert={skeleton}
        className="border-t border-base-content/10 px-6 py-4 sm:px-8"
      >
        <Pagination
          total={total}
          pathname={`/${locale}/admin/categories`}
          query={
            searchQuery
              ? new URLSearchParams({ q: searchQuery }).toString()
              : ''
          }
          page={page}
          pageCount={pages}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}

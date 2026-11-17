'use client';

import Link from 'next/link';
import Form from 'next/form';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ellipsis,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { getPaginationItems, PAGE_SIZE_OPTIONS } from '@/lib/pagination';
import { cn } from '@/lib/utils';

export type PaginationProps = {
  page: number;
  pageCount: number;
  pathname: string;
  query?: string;
  pageParam?: string;
  scroll?: boolean;
  className?: string;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  pageSizeParam?: string;
};

export function Pagination({
  page,
  pageCount,
  pathname,
  query = '',
  pageParam = 'page',
  scroll = false,
  className,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  pageSizeParam = 'pageSize',
}: PaginationProps) {
  const t = useTranslations('pagination');
  const format = useFormatter();
  const pages = Number.isFinite(pageCount)
    ? Math.max(1, Math.trunc(pageCount))
    : 1;
  const current = Number.isFinite(page)
    ? Math.min(pages, Math.max(1, Math.trunc(page)))
    : 1;
  const retainedParams = [...new URLSearchParams(query)].filter(
    ([key]) => key !== pageParam && key !== pageSizeParam,
  );

  function href(number: number) {
    const params = new URLSearchParams(query);
    params.set(pageParam, String(number));
    if (pageSize !== undefined) params.set(pageSizeParam, String(pageSize));
    return `${pathname}?${params}`;
  }

  function boundaryLink(
    target: number,
    label: 'first' | 'last',
    Icon: typeof ChevronsLeft,
    disabled: boolean,
  ) {
    const icon = (
      <Icon size={17} className="rtl:rotate-180" aria-hidden="true" />
    );
    return (
      <li>
        {disabled ? (
          <span
            aria-disabled="true"
            aria-label={t(label)}
            className="btn btn-square btn-sm btn-disabled"
          >
            {icon}
          </span>
        ) : (
          <Link
            href={href(target)}
            scroll={scroll}
            prefetch={false}
            aria-label={t(label)}
            className="btn btn-square btn-sm btn-ghost"
          >
            {icon}
          </Link>
        )}
      </li>
    );
  }

  function pageList() {
    return (
      <ul className="flex max-w-full flex-wrap items-center justify-center gap-1">
        {boundaryLink(1, 'first', ChevronsLeft, current === 1)}
        <li>
          {current > 1 ? (
            <Link
              href={href(current - 1)}
              scroll={scroll}
              prefetch={false}
              rel="prev"
              aria-label={t('previous')}
              className="btn btn-square btn-sm btn-ghost"
            >
              <ChevronLeft
                size={17}
                className="rtl:rotate-180"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              aria-label={t('previous')}
              className="btn btn-square btn-sm btn-disabled"
            >
              <ChevronLeft
                size={17}
                className="rtl:rotate-180"
                aria-hidden="true"
              />
            </span>
          )}
        </li>
        {getPaginationItems(current, pages, 2).map((item) => (
          <li key={item}>
            {typeof item === 'number' ? (
              item === current ? (
                <span
                  aria-current="page"
                  aria-label={t('goToPage', { page: item })}
                  className="btn btn-square btn-sm btn-primary"
                >
                  {format.number(item)}
                </span>
              ) : (
                <Link
                  href={href(item)}
                  scroll={scroll}
                  prefetch={false}
                  aria-label={t('goToPage', { page: item })}
                  className="btn btn-square btn-sm btn-ghost"
                >
                  {format.number(item)}
                </Link>
              )
            ) : (
              <span
                className="grid size-8 place-items-center text-base-content/50"
                aria-hidden="true"
              >
                <Ellipsis size={17} />
              </span>
            )}
          </li>
        ))}
        <li>
          {current < pages ? (
            <Link
              href={href(current + 1)}
              scroll={scroll}
              prefetch={false}
              rel="next"
              aria-label={t('next')}
              className="btn btn-square btn-sm btn-ghost"
            >
              <ChevronRight
                size={17}
                className="rtl:rotate-180"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              aria-label={t('next')}
              className="btn btn-square btn-sm btn-disabled"
            >
              <ChevronRight
                size={17}
                className="rtl:rotate-180"
                aria-hidden="true"
              />
            </span>
          )}
        </li>
        {boundaryLink(pages, 'last', ChevronsRight, current === pages)}
      </ul>
    );
  }

  return (
    <nav
      aria-label={t('label')}
      className={cn(
        'grid w-full min-w-0 justify-items-center gap-x-4 gap-y-3 px-2 py-1 2xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
        className,
      )}
    >
      <div className="min-w-0 max-w-full 2xl:col-start-2 2xl:row-start-1">
        {pageList()}
      </div>
      {pageSize !== undefined && (
        <Form
          action={pathname}
          scroll={scroll}
          className="2xl:col-start-3 2xl:row-start-1 2xl:justify-self-end"
          onChange={(event) => event.currentTarget.requestSubmit()}
        >
          {retainedParams.map(([key, value], index) => (
            <input key={key + index} type="hidden" name={key} value={value} />
          ))}
          <input type="hidden" name={pageParam} value="1" />
          <label className="flex items-center gap-2 text-xs text-base-content/70">
            {t('perPage')}
            <select
              name={pageSizeParam}
              key={pageSize}
              defaultValue={pageSize}
              className="select select-sm w-auto min-w-16"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {format.number(size)}
                </option>
              ))}
            </select>
          </label>
        </Form>
      )}
    </nav>
  );
}

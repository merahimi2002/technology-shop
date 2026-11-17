export type PaginationItem = number | 'start-gap' | 'end-gap';
export const PAGE_SIZE_OPTIONS = [1, 10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export function getPaginationItems(
  page: number,
  pageCount: number,
  siblings = 2,
): PaginationItem[] {
  if (pageCount <= 1) return [1];
  const start = Math.max(1, page - siblings);
  const end = Math.min(pageCount, page + siblings);
  const items: PaginationItem[] = [];
  if (start > 1) items.push('start-gap');
  for (let number = start; number <= end; number++) items.push(number);
  if (end < pageCount) items.push('end-gap');
  return items;
}

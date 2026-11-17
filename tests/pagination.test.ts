import { expect, it } from 'vitest';
import { getPaginationItems } from '@/lib/pagination';

it('shows exactly two neighbors and gaps outside the current range', () => {
  expect(getPaginationItems(50, 100)).toEqual([
    'start-gap',
    48,
    49,
    50,
    51,
    52,
    'end-gap',
  ]);
  expect(getPaginationItems(1, 100)).toEqual([1, 2, 3, 'end-gap']);
  expect(getPaginationItems(100, 100)).toEqual(['start-gap', 98, 99, 100]);
});

it('does not expose a page outside the range even for a single missing page', () => {
  expect(getPaginationItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  expect(getPaginationItems(1, 4)).toEqual([1, 2, 3, 'end-gap']);
  expect(getPaginationItems(4, 7)).toEqual([
    'start-gap',
    2,
    3,
    4,
    5,
    6,
    'end-gap',
  ]);
});

it('keeps compact ranges ordered and bounded for mobile', () => {
  for (let pages = 1; pages <= 100; pages++) {
    for (let page = 1; page <= pages; page++) {
      const items = getPaginationItems(page, pages, 0);
      const numbers = items.filter((item) => typeof item === 'number');
      expect(new Set(items).size).toBe(items.length);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
      expect(numbers).toContain(page);
      expect(numbers).toEqual([page]);
      expect(items.length).toBeLessThanOrEqual(5);
    }
  }
});

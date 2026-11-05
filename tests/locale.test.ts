import { describe, expect, it } from 'vitest';
import en from '../messages/en.json';
import fa from '../messages/fa.json';

type Catalog = { [key: string]: string | Catalog };
function flatten(catalog: Catalog, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(catalog).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'string'
        ? [[path, value]]
        : Object.entries(flatten(value, path));
    }),
  );
}
const english = flatten(en);
const persian = flatten(fa);
describe('store translations', () => {
  it('keeps every nested translation key complete in both languages', () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(persian).sort());
    for (const message of [
      ...Object.values(english),
      ...Object.values(persian),
    ]) {
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });
  it('contains English copy throughout the English catalog', () => {
    for (const message of Object.values(english))
      expect(message).not.toMatch(/[\u0600-\u06ff]/u);
  });
  it('keeps interpolation variables consistent across languages', () => {
    const variables = (message: string) =>
      [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    for (const key of Object.keys(english))
      expect(variables(persian[key])).toEqual(variables(english[key]));
  });
});

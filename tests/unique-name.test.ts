import { describe, expect, it } from 'vitest';
import { uniqueNameFromEnglish } from '@/lib/admin/unique-name';

describe('unique name suggestions', () => {
  it('normalizes English names without copying their display formatting', () => {
    expect(uniqueNameFromEnglish('  Café & Audio 2026! ')).toBe(
      'cafe-audio-2026',
    );
    expect(uniqueNameFromEnglish('Headphones / Black')).toBe(
      'headphones-black',
    );
  });
  it('keeps suggestions inside the server identifier limits', () => {
    expect(uniqueNameFromEnglish('عکس')).toBe('');
    expect(uniqueNameFromEnglish('A '.repeat(100))).toHaveLength(119);
    expect(uniqueNameFromEnglish('A '.repeat(100))).not.toMatch(/^-|-$|--/);
  });
});

import { expect, it, vi } from 'vitest';
import sharp from 'sharp';
import {
  encodeCategoryImage,
  isCategoryImagePath,
  uploadCategoryImage,
} from '@/lib/category-image';
import { MAX_CATEGORY_IMAGE_BYTES } from '@/lib/category-image-config';
vi.mock('server-only', () => ({}));

it('validates actual bytes and converts large valid images to bounded WebP', async () => {
  const bytes = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: '#112233' },
  })
    .png()
    .toBuffer();
  const result = await encodeCategoryImage(
    new File([bytes], 'test.png', { type: 'image/png' }),
  );
  const meta = await sharp(result).metadata();
  expect(meta.format).toBe('webp');
  expect(meta.width).toBe(640);
  expect(meta.height).toBeLessThanOrEqual(640);
  expect(meta.exif).toBeUndefined();
});
it('rejects empty, oversized, spoofed, SVG and huge-pixel files', async () => {
  const huge = await sharp({
    create: { width: 5000, height: 4000, channels: 3, background: '#112233' },
  })
    .png()
    .toBuffer();
  for (const file of [
    new File([], 'x.png'),
    new File([new Uint8Array(MAX_CATEGORY_IMAGE_BYTES + 1)], 'x.png'),
    new File(['not an image'], 'x.png', { type: 'image/png' }),
    new File(
      ['<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/>'],
      'x.png',
    ),
    new File([huge], 'large.png'),
  ])
    await expect(encodeCategoryImage(file)).rejects.toMatchObject({
      reason: 'invalidImage',
    });
});
it('does not accept paths outside category objects', () => {
  expect(isCategoryImagePath('12345678-1234-1234-1234-123456789abc.webp')).toBe(
    true,
  );
  for (const path of [
    '../x.webp',
    'https://example.test/x.webp',
    'users/x.webp',
    '1234.webp',
  ])
    expect(isCategoryImagePath(path)).toBe(false);
});
it('reports missing storage configuration without exposing secrets', async () => {
  vi.stubEnv('SUPABASE_SECRET_KEY', '');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
  await expect(uploadCategoryImage(Buffer.from('x'))).rejects.toMatchObject({
    reason: 'storageUnavailable',
  });
  vi.unstubAllEnvs();
});

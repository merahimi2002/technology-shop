import { beforeEach, expect, it, vi } from 'vitest';
import { saveCategoryWithImage } from '@/app/[locale]/admin/categories/image-actions';
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  encode: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getCurrentUser: m.actor }));
vi.mock('@/lib/db', () => ({
  getDb: () => ({
    category: { findUnique: m.find, updateMany: m.update, create: m.create },
  }),
}));
vi.mock('next/cache', () => ({ revalidatePath: m.revalidate }));
vi.mock('@/lib/category-image', () => ({
  CategoryImageError: class extends Error {},
  encodeCategoryImage: m.encode,
  uploadCategoryImage: m.upload,
  removeCategoryImage: m.remove,
  isCategoryImagePath: (path: string) => /^[0-9a-f-]{36}\.webp$/.test(path),
}));
const old = '12345678-1234-1234-1234-123456789abc.webp';
const next = '87654321-1234-1234-1234-123456789abc.webp';
const previous = {
  id: 'category',
  nameFa: 'تست',
  nameEn: 'Test',
  slug: 'test',
  imagePath: old,
};
function form(image = false) {
  const f = new FormData();
  f.set('nameFa', 'تست');
  f.set('nameEn', 'Test');
  f.set('slug', 'test');
  if (image)
    f.set('image', new File(['image'], 'test.png', { type: 'image/png' }));
  return f;
}
beforeEach(() => {
  vi.resetAllMocks();
  m.actor.mockResolvedValue({ role: 'ADMIN' });
  m.find.mockResolvedValue(previous);
  m.update.mockResolvedValue({ count: 1 });
  m.encode.mockResolvedValue(Buffer.from('encoded'));
  m.upload.mockResolvedValue(next);
});
it.each([null, { role: 'CUSTOMER' }])(
  'rejects unauthorized uploads (%s)',
  async (actor) => {
    m.actor.mockResolvedValue(actor);
    expect(await saveCategoryWithImage(previous, form(true))).toBe('forbidden');
    expect(m.upload).not.toHaveBeenCalled();
  },
);
it('creates a category with an uploaded file only after validation', async () => {
  expect(await saveCategoryWithImage(null, form(true))).toBe('saved');
  expect(m.encode).toHaveBeenCalled();
  expect(m.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ imagePath: next }),
  });
});
it('preserves an existing photo when no file is selected', async () => {
  expect(await saveCategoryWithImage(previous, form())).toBe('saved');
  expect(m.update).toHaveBeenCalledWith({
    where: previous,
    data: expect.objectContaining({ imagePath: old }),
  });
  expect(m.upload).not.toHaveBeenCalled();
  expect(m.remove).not.toHaveBeenCalled();
});
it('replaces the photo and removes only the old server-loaded object', async () => {
  expect(await saveCategoryWithImage(previous, form(true))).toBe('saved');
  expect(m.remove).toHaveBeenCalledWith(old);
  expect(m.remove).not.toHaveBeenCalledWith(next);
});
it('removes a photo on confirmation', async () => {
  const f = form();
  f.set('removeImage', 'true');
  expect(await saveCategoryWithImage(previous, f)).toBe('saved');
  expect(m.update).toHaveBeenCalledWith({
    where: previous,
    data: expect.objectContaining({ imagePath: null }),
  });
  expect(m.remove).toHaveBeenCalledWith(old);
});
it('rejects stale photos before uploading', async () => {
  m.find.mockResolvedValue({ ...previous, imagePath: next });
  expect(await saveCategoryWithImage(previous, form(true))).toBe('conflict');
  expect(m.upload).not.toHaveBeenCalled();
});
it('cleans up the new upload if a concurrent edit wins', async () => {
  m.update.mockResolvedValue({ count: 0 });
  expect(await saveCategoryWithImage(previous, form(true))).toBe('conflict');
  expect(m.remove).toHaveBeenCalledWith(next);
  expect(m.remove).not.toHaveBeenCalledWith(old);
});
it('compensates for database failures without removing the current photo', async () => {
  m.update.mockRejectedValue({ code: 'P2002' });
  expect(await saveCategoryWithImage(previous, form(true))).toBe('duplicate');
  expect(m.remove).toHaveBeenCalledWith(next);
  expect(m.remove).not.toHaveBeenCalledWith(old);
});

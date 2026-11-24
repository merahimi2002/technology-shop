import { beforeEach, expect, it, vi } from 'vitest';
import {
  updateCategory,
  deleteCategory,
} from '@/app/[locale]/admin/categories/actions';

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  find: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getCurrentUser: mocks.actor }));
vi.mock('@/lib/db', () => ({
  getDb: () => ({
    category: {
      updateMany: mocks.update,
      deleteMany: mocks.remove,
      findUnique: mocks.find,
    },
  }),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
const previous = {
  id: 'category',
  nameFa: 'تست',
  nameEn: 'Test',
  slug: 'test',
  imagePath: null,
};
const data = { nameFa: 'جدید', nameEn: 'New', slug: 'new' };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue({ role: 'ADMIN' });
  mocks.update.mockResolvedValue({ count: 1 });
  mocks.remove.mockResolvedValue({ count: 1 });
});
it.each([null, { role: 'CUSTOMER' }])(
  'blocks unauthorized category changes (%s)',
  async (actor) => {
    mocks.actor.mockResolvedValue(actor);
    expect(await updateCategory({ previous, data })).toBe('forbidden');
    expect(await deleteCategory(previous)).toBe('forbidden');
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  },
);
it.each(['ADMIN', 'OWNER'])(
  'allows %s to update using the original values',
  async (role) => {
    mocks.actor.mockResolvedValue({ role });
    expect(await updateCategory({ previous, data })).toBe('saved');
    expect(mocks.update).toHaveBeenCalledWith({ where: previous, data });
    expect(mocks.revalidate).toHaveBeenCalled();
  },
);
it('rejects malformed updates before writing', async () => {
  expect(
    await updateCategory({ previous, data: { ...data, slug: 'bad/slug' } }),
  ).toBe('invalid');
  expect(await deleteCategory({ id: '' })).toBe('invalid');
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.remove).not.toHaveBeenCalled();
});
it('rejects stale updates and unique slugs', async () => {
  mocks.update.mockResolvedValue({ count: 0 });
  expect(await updateCategory({ previous, data })).toBe('conflict');
  mocks.update.mockRejectedValue({ code: 'P2002' });
  expect(await updateCategory({ previous, data })).toBe('duplicate');
});
it('deletes only an unchanged category without products', async () => {
  expect(await deleteCategory(previous)).toBe('saved');
  expect(mocks.remove).toHaveBeenCalledWith({
    where: { ...previous, products: { none: {} } },
  });
});
it('protects categories with products and handles concurrent assignments', async () => {
  mocks.remove.mockResolvedValue({ count: 0 });
  mocks.find.mockResolvedValue({ _count: { products: 1 } });
  expect(await deleteCategory(previous)).toBe('hasProducts');
  mocks.remove.mockRejectedValue({ code: 'P2003' });
  expect(await deleteCategory(previous)).toBe('hasProducts');
});
it('rejects stale or already deleted categories', async () => {
  mocks.remove.mockResolvedValue({ count: 0 });
  mocks.find.mockResolvedValue(null);
  expect(await deleteCategory(previous)).toBe('conflict');
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it('returns safe failure messages', async () => {
  mocks.update.mockRejectedValue(new Error('private'));
  mocks.remove.mockRejectedValue(new Error('private'));
  expect(await updateCategory({ previous, data })).toBe('unavailable');
  expect(await deleteCategory(previous)).toBe('unavailable');
});

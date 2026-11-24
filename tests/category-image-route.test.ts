import { beforeEach, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/admin/categories/[id]/image/route';
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  find: vi.fn(),
  download: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getCurrentUser: m.actor }));
vi.mock('@/lib/db', () => ({
  getDb: () => ({ category: { findUnique: m.find } }),
}));
vi.mock('@/lib/category-image', () => ({ downloadCategoryImage: m.download }));
const request = () =>
  GET(new Request('http://localhost/api/admin/categories/c/image'), {
    params: Promise.resolve({ id: 'c' }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  m.actor.mockResolvedValue({ role: 'ADMIN' });
});
it.each([
  [null, 401],
  [{ role: 'CUSTOMER' }, 403],
])('protects image reads for %s', async (actor, status) => {
  m.actor.mockResolvedValue(actor);
  expect((await request()).status).toBe(status);
  expect(m.find).not.toHaveBeenCalled();
  expect(m.download).not.toHaveBeenCalled();
});
it('returns a safe 404 for a category without a photo', async () => {
  m.find.mockResolvedValue({ imagePath: null });
  expect((await request()).status).toBe(404);
});
it('serves WebP only to administrators without public caching', async () => {
  m.find.mockResolvedValue({ imagePath: 'photo' });
  m.download.mockResolvedValue(new Blob(['webp']));
  const response = await request();
  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toBe('image/webp');
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
});
it('does not leak storage errors', async () => {
  m.find.mockRejectedValue(new Error('private'));
  const response = await request();
  expect(response.status).toBe(503);
  expect(await response.text()).toBe('');
});

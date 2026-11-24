import { beforeEach, expect, it, vi } from 'vitest';
import { productSchema, parseProductFilters } from '@/lib/admin/product-input';
import {
  saveProduct,
  saveCategory,
} from '@/app/[locale]/admin/products/actions';

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  create: vi.fn(),
  categoryCreate: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  variantUpdate: vi.fn(),
  variantCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getCurrentUser: mocks.actor }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/db', () => ({
  getDb: () => ({
    category: { create: mocks.categoryCreate },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        product: {
          create: mocks.create,
          findUnique: mocks.find,
          updateMany: mocks.update,
        },
        productVariant: {
          update: mocks.variantUpdate,
          create: mocks.variantCreate,
        },
      }),
  }),
}));
const version = '2026-11-23T10:00:00.000Z';
const input = () => ({
  id: '',
  updatedAt: '',
  slug: 'test-product',
  nameFa: 'محصول',
  nameEn: 'Product',
  descriptionFa: '',
  descriptionEn: '',
  status: 'DRAFT',
  categoryId: 'category',
  variants: [
    {
      id: '',
      sku: 'TEST-1',
      nameFa: 'اصلی',
      nameEn: 'Default',
      price: '999999999999999999',
      stock: 0,
      isActive: true,
    },
  ],
});
beforeEach(() => {
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue({ role: 'ADMIN' });
  mocks.update.mockResolvedValue({ count: 1 });
  mocks.find.mockResolvedValue({
    updatedAt: new Date(version),
    variants: [{ id: 'v1' }],
  });
});

it('validates integer rial prices without losing decimal precision', () => {
  expect(productSchema.parse(input()).variants[0].price).toBe(
    '999999999999999999',
  );
  for (const price of ['1.5', '-1', '1e6', '1000000000000000000'])
    expect(
      productSchema.safeParse({
        ...input(),
        variants: [{ ...input().variants[0], price }],
      }).success,
    ).toBe(false);
});
it('rejects invalid stock, duplicate SKUs and publication without an active variant', () => {
  expect(
    productSchema.safeParse({
      ...input(),
      variants: [{ ...input().variants[0], stock: -1 }],
    }).success,
  ).toBe(false);
  expect(
    productSchema.safeParse({
      ...input(),
      variants: [input().variants[0], input().variants[0]],
    }).success,
  ).toBe(false);
  expect(
    productSchema.safeParse({
      ...input(),
      status: 'ACTIVE',
      variants: [{ ...input().variants[0], isActive: false }],
    }).success,
  ).toBe(false);
});
it('normalizes hostile filter parameters and enforces allowed page sizes', () => {
  expect(
    parseProductFilters({
      page: '-1',
      pageSize: '999',
      status: 'bad',
      q: ['x'],
    }),
  ).toEqual({ q: '', status: '', category: '', page: 1, pageSize: 20 });
});
it.each([null, { role: 'CUSTOMER' }])(
  'blocks unauthorized direct writes (%s)',
  async (actor) => {
    mocks.actor.mockResolvedValue(actor);
    expect(await saveProduct(input())).toBe('forbidden');
    expect(
      await saveCategory({ slug: 'test', nameFa: 'تست', nameEn: 'Test' }),
    ).toBe('forbidden');
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.categoryCreate).not.toHaveBeenCalled();
  },
);
it.each(['ADMIN', 'OWNER'])(
  'creates products atomically for %s',
  async (role) => {
    mocks.actor.mockResolvedValue({ role });
    expect(await saveProduct(input())).toBe('saved');
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        variants: {
          create: [expect.objectContaining({ price: '999999999999999999' })],
        },
      }),
    });
    expect(mocks.revalidatePath).toHaveBeenCalled();
  },
);
it('rejects stale versions and variants belonging to other products', async () => {
  expect(
    await saveProduct({
      ...input(),
      id: 'p1',
      updatedAt: '2026-11-22T10:00:00.000Z',
    }),
  ).toBe('conflict');
  expect(
    await saveProduct({
      ...input(),
      id: 'p1',
      updatedAt: version,
      variants: [{ ...input().variants[0], id: 'foreign' }],
    }),
  ).toBe('invalid');
  expect(mocks.variantUpdate).not.toHaveBeenCalled();
});
it('retains existing variants and guards concurrent updates', async () => {
  const edit = {
    ...input(),
    id: 'p1',
    updatedAt: version,
    variants: [{ ...input().variants[0], id: 'v1', isActive: false }],
  };
  expect(await saveProduct(edit)).toBe('saved');
  expect(mocks.variantUpdate).toHaveBeenCalled();
  mocks.variantUpdate.mockClear();
  mocks.update.mockResolvedValue({ count: 0 });
  expect(await saveProduct(edit)).toBe('conflict');
  expect(mocks.variantUpdate).not.toHaveBeenCalled();
});
it('reports uniqueness and storage failures without leaking database details', async () => {
  mocks.create.mockRejectedValue({ code: 'P2002' });
  expect(await saveProduct(input())).toBe('duplicate');
  mocks.create.mockRejectedValue(new Error('private'));
  expect(await saveProduct(input())).toBe('unavailable');
  expect(
    await saveCategory({ slug: 'test', nameFa: 'تست', nameEn: 'Test' }),
  ).toBe('saved');
});

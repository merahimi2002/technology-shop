import { beforeEach, expect, it, vi } from 'vitest';
import { productSchema, parseProductFilters } from '@/lib/admin/product-input';
import {
  saveProduct,
  saveCategory,
  deleteProduct,
} from '@/app/[locale]/admin/products/actions';

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  create: vi.fn(),
  categoryCreate: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  variantUpdate: vi.fn(),
  variantCreate: vi.fn(),
  deleteProduct: vi.fn(),
  deleteVariants: vi.fn(),
  referencedVariant: vi.fn(),
  revalidatePath: vi.fn(),
  listImages: vi.fn(),
  deleteImages: vi.fn(),
  createImages: vi.fn(),
  uploadImage: vi.fn(),
  removeImage: vi.fn(),
  findProductBySlug: vi.fn(),
  findVariantsBySku: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getCurrentUser: mocks.actor }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock(import('@/lib/category-image'), async (original) => ({
  ...(await original()),
  encodeCategoryImage: vi.fn().mockResolvedValue(Buffer.from('image')),
  uploadCategoryImage: mocks.uploadImage,
  removeCategoryImage: mocks.removeImage,
}));
vi.mock('@/lib/db', () => ({
  getDb: () => ({
    category: { create: mocks.categoryCreate },
    product: { findUnique: mocks.findProductBySlug },
    productVariant: { findMany: mocks.findVariantsBySku },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        product: {
          create: mocks.create,
          findUnique: mocks.find,
          updateMany: mocks.update,
          delete: mocks.deleteProduct,
        },
        productVariant: {
          update: mocks.variantUpdate,
          create: mocks.variantCreate,
          findFirst: mocks.referencedVariant,
          deleteMany: mocks.deleteVariants,
        },
        productImage: {
          findMany: mocks.listImages,
          deleteMany: mocks.deleteImages,
          createMany: mocks.createImages,
        },
      }),
  }),
}));
const version = '2026-11-23T10:00:00.000Z';

it('deletes unreferenced products and refreshes both catalog lists', async () => {
  expect(await deleteProduct({ id: 'product', updatedAt: version })).toBe(
    'saved',
  );
  expect(mocks.deleteVariants).toHaveBeenCalledWith({
    where: {
      productId: 'product',
      cartItems: { none: {} },
      orderItems: { none: {} },
    },
  });
  expect(mocks.deleteProduct).toHaveBeenCalledWith({
    where: { id: 'product', updatedAt: new Date(version) },
  });
  expect(mocks.revalidatePath).toHaveBeenCalledTimes(2);
});

it('blocks referenced, stale and unauthorized product deletes', async () => {
  mocks.referencedVariant.mockResolvedValue({ id: 'v1' });
  expect(await deleteProduct({ id: 'product', updatedAt: version })).toBe(
    'referenced',
  );
  expect(
    await deleteProduct({ id: 'product', updatedAt: '2026-11-22T00:00:00Z' }),
  ).toBe('conflict');
  mocks.actor.mockResolvedValue({ role: 'CUSTOMER' });
  expect(await deleteProduct({ id: 'product', updatedAt: version })).toBe(
    'forbidden',
  );
  expect(mocks.deleteVariants).not.toHaveBeenCalled();
  expect(mocks.deleteProduct).not.toHaveBeenCalled();
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
});
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
    images: [],
  });
});

it('saves multiple uploaded product images in order', async () => {
  const first = '00000000-0000-4000-8000-000000000001.webp';
  const second = '00000000-0000-4000-8000-000000000002.webp';
  mocks.create.mockResolvedValue({ id: 'product' });
  mocks.uploadImage.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
  const form = new FormData();
  form.append('image', new File(['first'], 'first.webp'));
  form.append('image', new File(['second'], 'second.webp'));
  expect(await saveProduct(input(), form)).toBe('saved');
  expect(mocks.createImages).toHaveBeenCalledWith({
    data: [
      { productId: 'product', position: 0, path: first },
      { productId: 'product', position: 1, path: second },
    ],
  });
  expect(mocks.removeImage).not.toHaveBeenCalled();
});

it('rejects image paths from another product and cleans up uploads on conflict', async () => {
  const path = '00000000-0000-4000-8000-000000000001.webp';
  const edited = { ...input(), id: 'product', updatedAt: version };
  mocks.listImages.mockResolvedValue([]);
  const foreign = new FormData();
  foreign.append('image', path);
  expect(await saveProduct(edited, foreign)).toBe('invalidImage');
  expect(mocks.update).not.toHaveBeenCalled();

  const upload = new FormData();
  upload.append('image', new File(['first'], 'first.webp'));
  mocks.uploadImage.mockResolvedValue(path);
  mocks.find.mockResolvedValue(null);
  expect(await saveProduct(edited, upload)).toBe('conflict');
  expect(mocks.removeImage).toHaveBeenCalledWith(path, 'product-images');
});

it('locates persisted slug and SKU conflicts after a unique constraint failure', async () => {
  mocks.create.mockRejectedValue({ code: 'P2002' });
  mocks.findProductBySlug.mockResolvedValue({ id: 'other-product' });
  mocks.findVariantsBySku.mockResolvedValue([
    { id: 'other-variant', sku: 'TEST-1' },
  ]);
  expect(await saveProduct(input())).toEqual({
    slug: 'test-product',
    skus: ['TEST-1'],
  });
});

it('attaches draft SKU conflicts to both variant fields', () => {
  const product = input();
  product.variants.push({ ...product.variants[0] });
  const result = productSchema.safeParse(product);
  expect(result.error?.issues.map((issue) => issue.path)).toEqual([
    ['variants', 0, 'sku'],
    ['variants', 1, 'sku'],
  ]);
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

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getDb } from '@/lib/db';
import {
  categorySchema,
  productSchema,
  type ProductInput,
} from '@/lib/admin/product-input';
import {
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_IMAGE_UPLOAD_BYTES,
} from '@/lib/admin/product-image-config';
import {
  CategoryImageError,
  encodeCategoryImage,
  isCategoryImagePath,
  productImageBucket,
  removeCategoryImage,
  uploadCategoryImage,
} from '@/lib/category-image';

type CatalogResult =
  'saved' | 'invalid' | 'forbidden' | 'conflict' | 'duplicate' | 'unavailable';
export type ProductResult =
  CatalogResult | 'invalidImage' | 'storageUnavailable';

export type SaveProductResult =
  | ProductResult
  | {
      slug: string | null;
      skus: string[];
    };

async function findProductDuplicates({
  id,
  slug,
  variants,
}: ProductInput): Promise<SaveProductResult> {
  try {
    const db = getDb();
    const requestedIds = new Map(
      variants.map((variant) => [variant.sku, variant.id]),
    );
    const [product, savedVariants] = await Promise.all([
      db.product.findUnique({ where: { slug }, select: { id: true } }),
      db.productVariant.findMany({
        where: { sku: { in: [...requestedIds.keys()] } },
        select: { id: true, sku: true },
      }),
    ]);
    const duplicateSlug = product && product.id !== id ? slug : null;
    const skus = savedVariants
      .filter((variant) => requestedIds.get(variant.sku) !== variant.id)
      .map((variant) => variant.sku);
    return duplicateSlug || skus.length
      ? { slug: duplicateSlug, skus }
      : 'duplicate';
  } catch {
    return 'duplicate';
  }
}

export type DeleteProductResult =
  Exclude<CatalogResult, 'duplicate'> | 'referenced';

function removeProductImages(paths: string[]) {
  return Promise.all(
    paths.map((path) => removeCategoryImage(path, productImageBucket)),
  );
}

const productDeleteSchema = z.object({
  id: z.string().min(1).max(100),
  updatedAt: z.iso.datetime(),
});

export async function deleteProduct(
  input: unknown,
): Promise<DeleteProductResult> {
  let removedImages: string[] = [];
  try {
    const actor = await getCurrentUser();
    if (!actor || !canAccessAdmin(actor.role)) return 'forbidden';
    const parsed = productDeleteSchema.safeParse(input);
    if (!parsed.success) return 'invalid';
    const { id, updatedAt } = parsed.data;
    const version = new Date(updatedAt);
    const result = await getDb().$transaction(
      async (tx) => {
        const product = await tx.product.findUnique({
          where: { id },
          select: { updatedAt: true, images: { select: { path: true } } },
        });
        if (!product || product.updatedAt.getTime() !== version.getTime())
          return 'conflict';

        const referenced = await tx.productVariant.findFirst({
          where: {
            productId: id,
            OR: [{ cartItems: { some: {} } }, { orderItems: { some: {} } }],
          },
          select: { id: true },
        });
        if (referenced) return 'referenced';

        await tx.productVariant.deleteMany({
          where: {
            productId: id,
            cartItems: { none: {} },
            orderItems: { none: {} },
          },
        });
        await tx.product.delete({ where: { id, updatedAt: version } });
        removedImages = product.images.map((image) => image.path);
        return 'saved';
      },
      { isolationLevel: 'Serializable' },
    );
    if (result !== 'saved') return result;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      ['P2003', 'P2025', 'P2034'].includes(String(error.code))
    )
      return 'conflict';
    return 'unavailable';
  }
  await removeProductImages(removedImages);
  revalidatePath('/[locale]/admin/products', 'layout');
  revalidatePath('/[locale]/admin/categories', 'page');
  return 'saved';
}

export async function saveProduct(
  input: unknown,
  imageForm?: FormData,
): Promise<SaveProductResult> {
  const uploaded: string[] = [];
  let removedImages: string[] = [];
  let committed = false;
  let validated: ProductInput | undefined;
  try {
    const actor = await getCurrentUser();
    if (!actor || !canAccessAdmin(actor.role)) return 'forbidden';
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return 'invalid';
    validated = parsed.data;
    const { id, updatedAt, variants, ...data } = parsed.data;
    if (imageForm !== undefined && !(imageForm instanceof FormData))
      return 'invalidImage';
    const images = imageForm?.getAll('image');
    const existingPaths =
      images?.filter((entry): entry is string => typeof entry === 'string') ??
      [];
    if (
      (images && images.length > MAX_PRODUCT_IMAGES) ||
      (!id && existingPaths.length > 0) ||
      new Set(existingPaths).size !== existingPaths.length ||
      existingPaths.some((path) => !isCategoryImagePath(path)) ||
      images?.some(
        (entry) =>
          typeof entry !== 'string' &&
          entry.size > MAX_PRODUCT_IMAGE_UPLOAD_BYTES,
      )
    )
      return 'invalidImage';
    const paths: string[] = [];
    for (const image of images ?? []) {
      if (typeof image === 'string') paths.push(image);
      else {
        const path = await uploadCategoryImage(
          await encodeCategoryImage(image),
          productImageBucket,
        );
        uploaded.push(path);
        paths.push(path);
      }
    }
    const result = await getDb().$transaction(async (tx) => {
      let productId = id;
      if (id) {
        const existing = await tx.product.findUnique({
          where: { id },
          include: { variants: true },
        });
        if (!existing || existing.updatedAt.toISOString() !== updatedAt)
          return 'conflict' as const;
        if (images) {
          const previous = await tx.productImage.findMany({
            where: { productId: id },
            select: { path: true },
          });
          const previousPaths = new Set(previous.map((image) => image.path));
          if (existingPaths.some((path) => !previousPaths.has(path)))
            return 'invalidImage' as const;
          removedImages = previous
            .filter((image) => !paths.includes(image.path))
            .map((image) => image.path);
        }
        // Existing variants are retained to preserve cart and order references.
        if (
          existing.variants.some(
            (v) => !variants.some((next) => next.id === v.id),
          ) ||
          variants.some(
            (v) => v.id && !existing.variants.some((old) => old.id === v.id),
          )
        )
          return 'invalid' as const;
        const changed = await tx.product.updateMany({
          where: { id, updatedAt: new Date(updatedAt) },
          data,
        });
        if (changed.count !== 1) return 'conflict' as const;
        for (const { id: variantId, ...variant } of variants) {
          if (variantId)
            await tx.productVariant.update({
              where: { id: variantId },
              data: variant,
            });
          else
            await tx.productVariant.create({
              data: { ...variant, productId: id },
            });
        }
      } else {
        if (variants.some((v) => v.id)) return 'invalid' as const;
        const created = await tx.product.create({
          data: {
            ...data,
            variants: { create: variants.map(({ id: _id, ...v }) => v) },
          },
        });
        if (paths.length) productId = created.id;
      }
      if (images) {
        if (id) await tx.productImage.deleteMany({ where: { productId } });
        if (paths.length)
          await tx.productImage.createMany({
            data: paths.map((path, position) => ({
              productId,
              position,
              path,
            })),
          });
      }
      return 'saved' as const;
    });
    if (result !== 'saved') return result;
    committed = true;
  } catch (error) {
    if (error instanceof CategoryImageError) return error.reason;
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      error.code === 'P2002' &&
      validated
    )
      return await findProductDuplicates(validated);
    return 'unavailable';
  } finally {
    await removeProductImages(committed ? removedImages : uploaded);
  }
  revalidatePath('/[locale]/admin/products', 'layout');
  revalidatePath('/[locale]/admin/categories', 'page');
  return 'saved';
}

export async function saveCategory(input: unknown): Promise<CatalogResult> {
  try {
    const actor = await getCurrentUser();
    if (!actor || !canAccessAdmin(actor.role)) return 'forbidden';
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return 'invalid';
    await getDb().category.create({ data: parsed.data });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      error.code === 'P2002'
    )
      return 'duplicate';
    return 'unavailable';
  }
  revalidatePath('/[locale]/admin/products', 'layout');
  revalidatePath('/[locale]/admin/categories', 'page');
  return 'saved';
}

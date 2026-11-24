'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getDb } from '@/lib/db';
import { categorySchema, productSchema } from '@/lib/admin/product-input';

export type ProductResult =
  'saved' | 'invalid' | 'forbidden' | 'conflict' | 'duplicate' | 'unavailable';

export async function saveProduct(input: unknown): Promise<ProductResult> {
  try {
    const actor = await getCurrentUser();
    if (!actor || !canAccessAdmin(actor.role)) return 'forbidden';
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return 'invalid';
    const { id, updatedAt, variants, ...data } = parsed.data;
    const result = await getDb().$transaction(async (tx) => {
      if (id) {
        const existing = await tx.product.findUnique({
          where: { id },
          include: { variants: true },
        });
        if (!existing || existing.updatedAt.toISOString() !== updatedAt)
          return 'conflict' as const;
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
        await tx.product.create({
          data: {
            ...data,
            variants: { create: variants.map(({ id: _id, ...v }) => v) },
          },
        });
      }
      return 'saved' as const;
    });
    if (result !== 'saved') return result;
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

export async function saveCategory(input: unknown): Promise<ProductResult> {
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

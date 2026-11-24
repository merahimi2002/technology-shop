import { z } from 'zod';

export const productStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
const text = z.string().trim().min(1).max(160);
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const categorySchema = z.object({
  slug: slugSchema,
  nameFa: text,
  nameEn: text,
});
export const productSchema = z
  .object({
    id: z.string().max(100),
    updatedAt: z.string().max(40),
    slug: slugSchema,
    nameFa: text,
    nameEn: text,
    descriptionFa: z.string().trim().max(10000),
    descriptionEn: z.string().trim().max(10000),
    status: z.enum(productStatuses),
    categoryId: z.string().min(1).max(100),
    variants: z
      .array(
        z.object({
          id: z.string().max(100),
          sku: text,
          nameFa: text,
          nameEn: text,
          price: z.string().regex(/^\d{1,18}$/),
          stock: z.number().int().min(0).max(2147483647),
          isActive: z.boolean(),
        }),
      )
      .min(1)
      .max(50),
  })
  .superRefine((value, ctx) => {
    if (
      new Set(value.variants.map((v) => v.sku)).size !==
        value.variants.length ||
      new Set(value.variants.filter((v) => v.id).map((v) => v.id)).size !==
        value.variants.filter((v) => v.id).length
    )
      ctx.addIssue({
        code: 'custom',
        message: 'duplicate',
        path: ['variants'],
      });
    if (value.id && !z.iso.datetime().safeParse(value.updatedAt).success)
      ctx.addIssue({ code: 'custom', message: 'version', path: ['updatedAt'] });
    if (value.status === 'ACTIVE' && !value.variants.some((v) => v.isActive))
      ctx.addIssue({ code: 'custom', message: 'active', path: ['variants'] });
  });

export type ProductInput = z.infer<typeof productSchema>;

export function parseProductFilters(
  params: Record<string, string | string[] | undefined>,
) {
  return {
    q: typeof params.q === 'string' ? params.q.trim().slice(0, 120) : '',
    status: productStatuses.find((s) => s === params.status) ?? '',
    category:
      typeof params.category === 'string' ? params.category.slice(0, 100) : '',
    page:
      typeof params.page === 'string' && /^\d{1,7}$/.test(params.page)
        ? Math.max(1, Number(params.page))
        : 1,
    pageSize:
      [1, 10, 20, 50, 100].find((n) => String(n) === params.pageSize) ?? 20,
  } as const;
}

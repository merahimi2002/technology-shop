import 'server-only';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { MAX_CATEGORY_IMAGE_BYTES } from './category-image-config';

const bucket = 'category-images';
export const productImageBucket = 'product-images';
type ImageBucket = typeof bucket | typeof productImageBucket;
export class CategoryImageError extends Error {
  constructor(public readonly reason: 'invalidImage' | 'storageUnavailable') {
    super(reason);
  }
}

export async function encodeCategoryImage(file: File) {
  if (!file.size || file.size > MAX_CATEGORY_IMAGE_BYTES)
    throw new CategoryImageError('invalidImage');
  try {
    const source = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 16_000_000,
      failOn: 'warning',
    });
    const meta = await source.metadata();
    if (
      !['jpeg', 'png', 'webp'].includes(meta.format ?? '') ||
      (meta.pages ?? 1) > 1
    )
      throw new Error('invalid');
    return await source
      .rotate()
      .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new CategoryImageError('invalidImage');
  }
}

function storage() {
  const url = process.env.SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new CategoryImageError('storageUnavailable');
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error('https');
    return createClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }).storage;
  } catch {
    throw new CategoryImageError('storageUnavailable');
  }
}

export function isCategoryImagePath(path: string) {
  return /^[0-9a-f-]{36}\.webp$/.test(path);
}

export async function uploadCategoryImage(
  bytes: Buffer,
  target: ImageBucket = bucket,
) {
  const client = storage();
  const existing = await client.getBucket(target);
  if (existing.data?.public) throw new CategoryImageError('storageUnavailable');
  if (existing.error) {
    const created = await client.createBucket(target, {
      public: false,
      fileSizeLimit: MAX_CATEGORY_IMAGE_BYTES,
      allowedMimeTypes: ['image/webp'],
    });
    if (created.error) {
      const check = await client.getBucket(target);
      if (check.error || check.data?.public)
        throw new CategoryImageError('storageUnavailable');
    }
  }
  const path = `${randomUUID()}.webp`;
  const { error } = await client
    .from(target)
    .upload(path, bytes, { contentType: 'image/webp', upsert: false });
  if (error) throw new CategoryImageError('storageUnavailable');
  return path;
}

export async function removeCategoryImage(
  path: string,
  target: ImageBucket = bucket,
) {
  if (!isCategoryImagePath(path)) return;
  try {
    const { error } = await storage().from(target).remove([path]);
    return !error;
  } catch {
    return false;
  }
}

export async function downloadCategoryImage(
  path: string,
  target: ImageBucket = bucket,
) {
  if (!isCategoryImagePath(path)) return null;
  const files = storage().from(target);
  const { data, error } = await (target === productImageBucket
    ? files.download(path, {}, { cache: 'no-store' })
    : files.download(path));
  if (
    error &&
    target === productImageBucket &&
    (!('status' in error) || Number(error.status) !== 404)
  )
    throw new CategoryImageError('storageUnavailable');
  return error ? null : data;
}

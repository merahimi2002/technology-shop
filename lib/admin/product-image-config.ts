export const MAX_PRODUCT_IMAGES = 6;
export const MAX_PRODUCT_IMAGE_UPLOAD_BYTES = 400 * 1024;

export function productImageUrl(path?: string | null) {
  return path ? `/api/admin/products/images/${encodeURIComponent(path)}` : null;
}

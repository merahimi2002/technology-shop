import 'server-only';
import sharp from 'sharp';
import { MAX_AVATAR_BYTES } from './avatar';

export async function encodeAvatar(avatar: string) {
  try {
    const bytes = Buffer.from(avatar, 'base64');
    if (!bytes.length || bytes.length > MAX_AVATAR_BYTES) return undefined;
    const source = sharp(bytes, { limitInputPixels: 16_000_000 });
    const { format, pages } = await source.metadata();
    if (
      !format ||
      !['jpeg', 'png', 'webp'].includes(format) ||
      (pages ?? 1) > 1
    )
      return undefined;
    const resized = await source
      .rotate()
      .resize(160, 160, { fit: 'cover' })
      .webp({ quality: 82 })
      .toBuffer();
    return `data:image/webp;base64,${resized.toString('base64')}`;
  } catch {
    return undefined;
  }
}

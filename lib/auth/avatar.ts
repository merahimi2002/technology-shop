import { IMAGE_FILE_TYPES, MAX_IMAGE_BYTES } from '@/lib/image-input';

export const MAX_AVATAR_BYTES = MAX_IMAGE_BYTES;
export const MAX_AVATAR_BASE64_LENGTH = 4 * Math.ceil(MAX_AVATAR_BYTES / 3);
export const AVATAR_FILE_TYPES = IMAGE_FILE_TYPES;

export function isValidAvatarFile(file: File) {
  return (
    file.size > 0 &&
    file.size <= MAX_AVATAR_BYTES &&
    AVATAR_FILE_TYPES.includes(file.type)
  );
}

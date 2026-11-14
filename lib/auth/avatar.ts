export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_AVATAR_BASE64_LENGTH = 4 * Math.ceil(MAX_AVATAR_BYTES / 3);
export const AVATAR_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function isValidAvatarFile(file: File) {
  return (
    file.size > 0 &&
    file.size <= MAX_AVATAR_BYTES &&
    AVATAR_FILE_TYPES.includes(file.type)
  );
}
export function readAvatarCrop(previewTarget: HTMLElement | null) {
  const canvas = previewTarget?.querySelector<HTMLCanvasElement>(
    'canvas[data-avatar-crop][data-ready]',
  );
  return canvas?.toDataURL('image/png').split(',')[1];
}

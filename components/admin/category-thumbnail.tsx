'use client';
import { ImagePreview } from '@/components/ui/image-preview';
export function CategoryThumbnail({
  id,
  path,
  name,
}: {
  id: string;
  path: string | null;
  name: string;
}) {
  return (
    <span className="size-10 shrink-0 text-primary">
      <ImagePreview
        image={
          path
            ? '/api/admin/categories/' +
              id +
              '/image?v=' +
              encodeURIComponent(path)
            : null
        }
        alt={name}
        size={40}
      />
    </span>
  );
}

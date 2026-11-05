import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ModalCloseButton({
  className,
  label = 'بستن پنجره',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <form method="dialog">
      <button
        type="submit"
        className={cn(
          'btn btn-circle btn-soft btn-error h-8 min-h-8 w-8 shrink-0 p-0',
          className,
        )}
        aria-label={label}
      >
        <X size={18} strokeWidth={1.7} aria-hidden="true" />
      </button>
    </form>
  );
}

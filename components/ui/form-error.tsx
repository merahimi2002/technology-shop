import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FormError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'alert alert-soft alert-error inline-flex w-fit max-w-full items-start gap-2 text-sm',
        className,
      )}
    >
      <CircleAlert
        aria-hidden="true"
        className="mt-[0.2em] size-[1em] shrink-0"
      />
      <span>{children}</span>
    </div>
  );
}

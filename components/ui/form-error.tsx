import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FormError({
  children,
  className,
  id,
  severity = 'error',
  role = 'alert',
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  severity?: 'error' | 'warning';
  role?: 'alert' | 'status';
}) {
  return (
    <span
      id={id}
      role={role}
      className={cn(
        'alert alert-soft mt-2 inline-flex w-fit max-w-full items-start gap-2 py-[5px] text-sm',
        severity === 'error' ? 'alert-error' : 'alert-warning',
        className,
      )}
    >
      <CircleAlert
        aria-hidden="true"
        className="mt-[0.2em] size-[1em] shrink-0"
      />
      <span>{children}</span>
    </span>
  );
}

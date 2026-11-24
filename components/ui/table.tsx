'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function TableViewport({
  className,
  onScroll,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-admin-table-viewport
      className={cn(
        'group/table max-h-[70dvh] min-h-[max(min(70dvh,30rem),var(--admin-results-height,0px))] min-w-0 overflow-auto overscroll-contain rounded-2xl border border-base-content/8',
        className,
      )}
      onScroll={(event) => {
        event.currentTarget.dataset.compact = String(
          Math.abs(event.currentTarget.scrollLeft) > 12,
        );
        onScroll?.(event);
      }}
    />
  );
}

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <table
      {...props}
      className={cn(
        'table table-pin-cols table-fixed w-full text-start max-md:min-w-[40rem] [&_tbody_:is(th,td)]:border-base-content/8 [&_tbody_:is(th,td)]:py-5 [&_tbody_th]:text-start',
        className,
      )}
    />
  );
}

export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return (
    <thead
      {...props}
      className={cn(
        'bg-linear-to-r from-primary/16 to-secondary/16 text-base-content rtl:bg-linear-to-l [&_th]:static [&_th]:bg-transparent [&_th]:py-4 [&_th]:text-start [&_th]:whitespace-normal [&_th]:text-sm [&_th]:font-bold [&_svg]:text-primary max-md:[&_th:first-child]:sticky max-md:[&_th:first-child]:z-20 max-md:[&_th:first-child]:bg-base-200',
        className,
      )}
    />
  );
}

export function TableBody(props: ComponentProps<'tbody'>) {
  return <tbody {...props} />;
}
export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      {...props}
      className={cn(
        'border-b border-base-content/8 align-top even:bg-base-100/10 hover:bg-primary/5 motion-safe:transition-colors motion-safe:duration-150',
        className,
      )}
    />
  );
}
export function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return <th scope="col" {...props} className={cn('text-start', className)} />;
}
export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td {...props} className={cn('text-start', className)} />;
}

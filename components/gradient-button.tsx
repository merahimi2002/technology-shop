import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GradientButtonProps = ComponentPropsWithRef<'button'> & {
  icon?: ReactNode;
  gradient?: 'linear' | 'conic';
};

export function GradientButton({
  children,
  icon,
  className,
  type = 'button',
  gradient = 'conic',
  ...props
}: GradientButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'group btn btn-primary relative isolate h-10 min-h-10 gap-2 overflow-hidden rounded-full border-0 px-4 py-2 text-sm font-medium shadow-none before:pointer-events-none before:absolute before:-z-10 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:before:transition-none disabled:bg-none disabled:before:hidden',
        gradient === 'conic'
          ? 'bg-[conic-gradient(from_90deg,var(--color-primary)_0%,var(--color-secondary)_50%,var(--color-primary)_100%)] before:top-1/2 before:left-1/2 before:aspect-square before:w-[200%] before:-translate-x-1/2 before:-translate-y-1/2 before:bg-[conic-gradient(from_90deg,var(--color-primary)_0%,var(--color-secondary)_50%,var(--color-primary)_100%)] motion-safe:[@media(hover:hover)_and_(pointer:fine)]:enabled:hover:before:rotate-180'
          : 'bg-[linear-gradient(to_left,var(--color-primary),var(--color-secondary))] before:inset-y-0 before:-left-full before:w-[200%] before:bg-[linear-gradient(to_right,var(--color-primary),var(--color-secondary),var(--color-primary))] motion-safe:[@media(hover:hover)_and_(pointer:fine)]:enabled:hover:before:translate-x-1/2',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'relative transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none',
          icon &&
            'pe-6 motion-safe:[@media(hover:hover)_and_(pointer:fine)]:group-enabled:group-hover:-translate-x-6 ltr:motion-safe:[@media(hover:hover)_and_(pointer:fine)]:group-enabled:group-hover:translate-x-6',
        )}
      >
        {children}
      </span>
      {icon && (
        <span
          className="pointer-events-none absolute inset-0 ltr:rotate-180"
          aria-hidden="true"
        >
          <span className="absolute top-1/2 left-4 inline-flex size-4 -translate-y-1/2 items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] [&>svg]:size-full motion-safe:[@media(hover:hover)_and_(pointer:fine)]:group-enabled:group-hover:-translate-x-12 motion-reduce:transition-none">
            {icon}
          </span>
          <span className="absolute top-1/2 right-4 inline-flex size-4 translate-x-12 -translate-y-1/2 items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] [&>svg]:size-full motion-safe:[@media(hover:hover)_and_(pointer:fine)]:group-enabled:group-hover:translate-x-0 motion-reduce:transition-none">
            {icon}
          </span>
        </span>
      )}
    </button>
  );
}

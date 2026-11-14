export function CircuitBackdrop({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 bg-[url('/circuit-traces.svg')] bg-cover bg-right ${className}`}
    />
  );
}

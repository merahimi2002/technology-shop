/** Local SVG flags stay consistent on platforms that do not render flag emoji. */
export function LanguageFlag({ locale }: { locale: 'fa' | 'en' }) {
  return (
    <span
      className="block size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-base-content/15"
      aria-hidden="true"
    >
      {locale === 'fa' ? (
        <svg viewBox="0 0 36 36" className="block size-full">
          <path fill="#fff" d="M0 0h36v36H0z" />
          <path fill="#239f40" d="M0 0h36v12H0z" />
          <path fill="#da0000" d="M0 24h36v12H0z" />
          <g
            fill="none"
            stroke="#da0000"
            strokeWidth="1.2"
            strokeLinecap="round"
          >
            <path d="M18 14v8m-3.5-7.5c-2 3 .2 6 3.5 7.5 3.3-1.5 5.5-4.5 3.5-7.5M16 15c-1 2 .2 4 2 5 1.8-1 3-3 2-5M16.8 13.8l1.2.7 1.2-.7" />
          </g>
          <path
            stroke="#fff"
            strokeWidth=".7"
            strokeDasharray="1.5 1"
            d="M0 11h36M0 25h36"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 36 36" className="block size-full">
          <path fill="#012169" d="M0 0h36v36H0z" />
          <path stroke="#fff" strokeWidth="8" d="m0 0 36 36M36 0 0 36" />
          <path stroke="#c8102e" strokeWidth="3" d="m0 0 36 36M36 0 0 36" />
          <path stroke="#fff" strokeWidth="12" d="M18 0v36M0 18h36" />
          <path stroke="#c8102e" strokeWidth="7" d="M18 0v36M0 18h36" />
        </svg>
      )}
    </span>
  );
}

/** Wordmark with a mark shaped like a citation chip: the core idea of the product. */
export default function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
        <rect x="1" y="5" width="22" height="22" rx="5" className="fill-accent" />
        <path
          d="M7.5 11v11M16.5 11v11M7.5 16.5h9"
          className="stroke-accent-ink"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="23" cy="5" r="4" className="fill-marker" />
      </svg>
      <span className="text-[19px] font-bold tracking-tight text-ink">HyperLex</span>
    </span>
  );
}

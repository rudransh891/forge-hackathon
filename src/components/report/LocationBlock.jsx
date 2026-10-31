import { MapPinIcon } from '@/components/feed/icons'

function MapThumb() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 280 160"
      className="h-auto w-full border border-sand-300 bg-sand-100"
    >
      <rect width="280" height="160" fill="var(--color-sand-100)" />
      <g fill="var(--color-cream-50)">
        <rect x="12" y="12" width="70" height="48" />
        <rect x="102" y="12" width="76" height="48" />
        <rect x="198" y="12" width="70" height="48" />
        <rect x="12" y="80" width="70" height="68" />
        <rect x="198" y="80" width="70" height="68" />
      </g>
      <g stroke="var(--color-sand-300)" strokeWidth="8">
        <path d="M0 70h280" />
        <path d="M92 0v160" />
        <path d="M186 0v160" />
      </g>
      <rect x="126" y="88" width="34" height="34" fill="var(--color-coral-500)" />
      <rect x="136" y="98" width="14" height="14" fill="var(--color-cream-50)" />
    </svg>
  )
}

/** Address line + Map link, with an optional decorative map for the rail. */
export function LocationBlock({ addressBlock, withMap = false }) {
  return (
    <section aria-label="Location">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[15px] text-brown-900">
          <MapPinIcon size={16} className="shrink-0 text-coral-500" />
          {addressBlock}
        </p>
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="text-[14px] font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          Map
        </a>
      </div>

      {withMap ? (
        <div className="mt-3 hidden lg:block">
          <MapThumb />
        </div>
      ) : null}
    </section>
  )
}

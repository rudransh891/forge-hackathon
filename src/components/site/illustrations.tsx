/**
 * Flat, token-driven illustrations. Every fill is a CSS variable from
 * src/index.css, so recolouring never means editing the artwork.
 */

export function MapIllustration() {
  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 520 400"
        role="img"
        aria-label="Map of Ward 7 with three issue hotspots: two open, one urgent"
        className="h-auto w-full rounded-xl border border-hairline bg-cream-100"
      >
        <rect width="520" height="400" fill="var(--color-cream-100)" />

        {/* City blocks */}
        <g fill="var(--color-cream-50)" stroke="var(--color-cream-300)">
          <rect x="24" y="24" width="120" height="94" rx="8" />
          <rect x="24" y="142" width="120" height="86" rx="8" />
          <rect x="24" y="252" width="120" height="124" rx="8" />
          <rect x="168" y="24" width="140" height="94" rx="8" />
          <rect x="168" y="252" width="140" height="124" rx="8" />
          <rect x="332" y="24" width="164" height="94" rx="8" />
          <rect x="332" y="142" width="164" height="86" rx="8" />
          <rect x="332" y="252" width="164" height="124" rx="8" />
        </g>

        {/* Roads */}
        <g stroke="var(--color-cream-300)" strokeWidth="16" strokeLinecap="round">
          <path d="M150 0v400" />
          <path d="M0 124h520" />
          <path d="M0 238h520" />
          <path d="M316 0v400" />
        </g>
        <g stroke="var(--color-cream-50)" strokeWidth="2" strokeDasharray="10 12">
          <path d="M150 0v400" />
          <path d="M316 0v400" />
        </g>

        {/* Park */}
        <g>
          <rect x="168" y="142" width="140" height="86" rx="8" fill="var(--color-green-100)" />
          <circle cx="206" cy="176" r="13" fill="var(--color-green-700)" />
          <circle cx="248" cy="196" r="10" fill="var(--color-green-700)" />
          <circle cx="278" cy="170" r="8" fill="var(--color-green-700)" />
        </g>

        {/* Hotspots */}
        <g>
          <circle cx="92" cy="182" r="13" fill="var(--color-teal-400)" opacity="0.5" />
          <circle cx="92" cy="182" r="7" fill="var(--color-teal-400)" stroke="var(--color-cream-50)" strokeWidth="2" />
          <circle cx="404" cy="186" r="13" fill="var(--color-teal-400)" opacity="0.5" />
          <circle cx="404" cy="186" r="7" fill="var(--color-teal-400)" stroke="var(--color-cream-50)" strokeWidth="2" />
          <circle cx="228" cy="316" r="16" fill="var(--color-coral-500)" opacity="0.4" />
          <circle cx="228" cy="316" r="8" fill="var(--color-coral-500)" stroke="var(--color-cream-50)" strokeWidth="2" />
        </g>

        {/* Labels */}
        <g fill="var(--color-brown-600)" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="0.08em">
          <text x="362" y="112">ELM PARK</text>
          <text x="38" y="306">MAPLE GROVE</text>
          <text x="352" y="312">EAST SIDE</text>
        </g>
      </svg>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-full bg-teal-400" />
          Open issue
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-full bg-coral-500" />
          Urgent
        </span>
        <span className="ml-auto font-mono text-xs">Updated 2 min ago</span>
      </figcaption>
    </figure>
  )
}

type ArtProps = { className?: string }

export function RoadArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 300" aria-hidden className={className}>
      <rect width="400" height="300" fill="var(--color-cream-300)" />
      <path d="M0 168h400v74H0z" fill="var(--color-brown-600)" opacity="0.55" />
      <g stroke="var(--color-cream-50)" strokeWidth="5" strokeDasharray="26 22">
        <path d="M0 205h400" />
      </g>
      <ellipse cx="196" cy="228" rx="34" ry="12" fill="var(--color-brown-900)" />
      <path d="M286 196l16 30h-32z" fill="var(--color-coral-500)" />
      <rect x="281" y="226" width="10" height="16" rx="3" fill="var(--color-coral-700)" />
      <rect x="58" y="96" width="70" height="46" rx="6" fill="var(--color-cream-50)" />
      <rect x="272" y="84" width="86" height="58" rx="6" fill="var(--color-cream-50)" />
    </svg>
  )
}

export function ParkArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 300" aria-hidden className={className}>
      <rect width="400" height="300" fill="var(--color-teal-100)" />
      <ellipse cx="200" cy="252" rx="190" ry="42" fill="var(--color-green-100)" />
      <g>
        <rect x="86" y="196" width="10" height="62" rx="4" fill="var(--color-brown-600)" />
        <circle cx="91" cy="170" r="42" fill="var(--color-green-700)" />
        <rect x="286" y="206" width="9" height="52" rx="4" fill="var(--color-brown-600)" />
        <circle cx="290" cy="184" r="32" fill="var(--color-green-700)" />
      </g>
      <g>
        <rect x="196" y="150" width="7" height="112" rx="3" fill="var(--color-brown-900)" />
        <circle cx="199" cy="146" r="18" fill="var(--color-amber-500)" />
        <path d="M199 128a18 18 0 0 1 18 18" stroke="var(--color-brown-900)" strokeWidth="4" fill="none" />
        <ellipse cx="199" cy="272" rx="46" ry="9" fill="var(--color-amber-500)" opacity="0.35" />
      </g>
    </svg>
  )
}

export function BusArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 300" aria-hidden className={className}>
      <rect width="400" height="300" fill="var(--color-cream-300)" />
      <path d="M0 236h400v64H0z" fill="var(--color-brown-600)" opacity="0.35" />
      <rect x="58" y="96" width="284" height="118" rx="16" fill="var(--color-green-700)" />
      <rect x="80" y="116" width="72" height="42" rx="6" fill="var(--color-cream-50)" />
      <rect x="164" y="116" width="72" height="42" rx="6" fill="var(--color-cream-50)" />
      <rect x="248" y="116" width="72" height="42" rx="6" fill="var(--color-cream-50)" />
      <rect x="58" y="176" width="284" height="8" fill="var(--color-teal-400)" />
      <circle cx="118" cy="222" r="22" fill="var(--color-brown-900)" />
      <circle cx="118" cy="222" r="9" fill="var(--color-cream-300)" />
      <circle cx="282" cy="222" r="22" fill="var(--color-brown-900)" />
      <circle cx="282" cy="222" r="9" fill="var(--color-cream-300)" />
      <circle cx="322" cy="134" r="7" fill="var(--color-amber-500)" />
    </svg>
  )
}

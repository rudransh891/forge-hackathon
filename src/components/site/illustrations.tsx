/**
 * Flat, token-driven illustrations. Every fill is a CSS variable from
 * src/index.css, so recolouring never means editing the artwork.
 */

export function RadioIllustration() {
  return (
    <svg viewBox="0 0 420 330" aria-hidden className="h-auto w-full max-w-[320px] md:max-w-[460px]">
      {/* antenna */}
      <path d="M330 76 372 30" stroke="var(--color-coral-300)" strokeWidth="4" strokeLinecap="square" />
      <rect x="369" y="21" width="12" height="12" fill="var(--color-coral-300)" />

      {/* cabinet */}
      <rect x="30" y="76" width="360" height="204" fill="var(--color-cream-100)" />
      <rect x="30" y="76" width="360" height="16" fill="var(--color-brown-700)" />

      {/* face */}
      <rect x="46" y="106" width="328" height="160" fill="var(--color-cream-300)" />

      {/* speaker grille */}
      <rect x="60" y="120" width="176" height="132" fill="var(--color-sand-300)" />
      <g stroke="var(--color-brown-700)" strokeWidth="3">
        <path d="M68 130h160M68 142h160M68 154h160M68 166h160M68 178h160M68 190h160M68 202h160M68 214h160M68 226h160M68 238h160" />
      </g>

      {/* dial */}
      <rect x="252" y="120" width="106" height="70" fill="var(--color-cream-50)" />
      <rect x="252" y="120" width="106" height="70" fill="none" stroke="var(--color-brown-900)" strokeWidth="2" />
      <g stroke="var(--color-brown-900)" strokeWidth="1.5">
        <path d="M262 160v8M278 156v12M294 152v16M310 150v18M326 152v16M342 156v12M350 160v8" />
      </g>
      <g fill="var(--color-brown-900)" fontFamily="IBM Plex Mono, monospace" fontSize="7">
        <text x="258" y="184">530</text>
        <text x="296" y="184">1000</text>
        <text x="330" y="184">1600</text>
      </g>
      <path d="M312 126v26" stroke="var(--color-coral-500)" strokeWidth="3" />

      {/* knobs */}
      <rect x="259" y="205" width="38" height="38" fill="var(--color-coral-500)" />
      <rect x="272" y="218" width="12" height="12" fill="var(--color-cream-50)" />
      <rect x="315" y="205" width="38" height="38" fill="var(--color-coral-500)" />
      <rect x="328" y="218" width="12" height="12" fill="var(--color-cream-50)" />

      {/* feet */}
      <rect x="58" y="280" width="42" height="14" fill="var(--color-brown-700)" />
      <rect x="320" y="280" width="42" height="14" fill="var(--color-brown-700)" />
    </svg>
  )
}

type ArtProps = { className?: string }

export function RoadArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 300" aria-hidden className={className}>
      <rect width="400" height="300" fill="var(--color-sand-100)" />
      <path d="M0 168h400v74H0z" fill="var(--color-brown-600)" />
      <g stroke="var(--color-cream-50)" strokeWidth="5" strokeDasharray="26 22">
        <path d="M0 205h400" />
      </g>
      <rect x="162" y="216" width="68" height="24" fill="var(--color-brown-950)" />
      <path d="M286 196l16 30h-32z" fill="var(--color-coral-500)" />
      <rect x="281" y="226" width="10" height="16" fill="var(--color-coral-700)" />
      <rect x="58" y="96" width="70" height="46" fill="var(--color-cream-50)" />
      <rect x="272" y="84" width="86" height="58" fill="var(--color-cream-50)" />
    </svg>
  )
}

export function ParkArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 300" aria-hidden className={className}>
      <rect width="400" height="300" fill="var(--color-sand-100)" />
      <rect x="10" y="210" width="380" height="84" fill="var(--color-sand-300)" />
      <g>
        <rect x="86" y="196" width="10" height="62" fill="var(--color-brown-700)" />
        <rect x="49" y="128" width="84" height="84" fill="var(--color-green-700)" />
        <rect x="286" y="206" width="9" height="52" fill="var(--color-brown-700)" />
        <rect x="258" y="152" width="64" height="64" fill="var(--color-green-700)" />
      </g>
      <g>
        <rect x="196" y="150" width="7" height="112" fill="var(--color-brown-900)" />
        <rect x="181" y="128" width="36" height="36" fill="var(--color-coral-500)" />
        <rect x="181" y="122" width="36" height="6" fill="var(--color-brown-900)" />
      </g>
    </svg>
  )
}

export function BusArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 300" aria-hidden className={className}>
      <rect width="400" height="300" fill="var(--color-sand-100)" />
      <path d="M0 236h400v64H0z" fill="var(--color-brown-600)" />
      <rect x="58" y="96" width="284" height="118" fill="var(--color-coral-500)" />
      <rect x="80" y="116" width="72" height="42" fill="var(--color-cream-50)" />
      <rect x="164" y="116" width="72" height="42" fill="var(--color-cream-50)" />
      <rect x="248" y="116" width="72" height="42" fill="var(--color-cream-50)" />
      <rect x="58" y="176" width="284" height="8" fill="var(--color-cream-100)" />
      <rect x="96" y="200" width="44" height="44" fill="var(--color-brown-900)" />
      <rect x="109" y="213" width="18" height="18" fill="var(--color-cream-50)" />
      <rect x="260" y="200" width="44" height="44" fill="var(--color-brown-900)" />
      <rect x="273" y="213" width="18" height="18" fill="var(--color-cream-50)" />
      <rect x="315" y="127" width="14" height="14" fill="var(--color-cream-50)" />
    </svg>
  )
}

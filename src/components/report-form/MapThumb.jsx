/** Flat map thumbnail: decorative, never a real map, never a precise pin. */
export function MapThumb({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 92 92"
      className={`border border-sand-300 bg-sand-100 ${className}`}
    >
      <rect width="92" height="92" fill="var(--color-sand-100)" />
      <g fill="var(--color-cream-50)">
        <rect x="6" y="6" width="26" height="18" />
        <rect x="6" y="32" width="26" height="24" />
        <rect x="40" y="6" width="20" height="18" />
        <rect x="68" y="6" width="18" height="18" />
        <rect x="68" y="32" width="18" height="24" />
        <rect x="40" y="68" width="46" height="18" />
      </g>
      <g stroke="var(--color-sand-300)" strokeWidth="4">
        <path d="M0 26h92M0 62h92M36 0v92M64 0v92" />
      </g>
      <rect x="42" y="40" width="16" height="16" fill="var(--color-coral-500)" />
      <rect x="47" y="45" width="6" height="6" fill="var(--color-cream-50)" />
    </svg>
  )
}

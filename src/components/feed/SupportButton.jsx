import { CheckIcon } from './icons'
import { support as copy } from './feedConfig'

/**
 * The support toggle. Label and announcements come from feedConfig, so the
 * action can be renamed without touching this file.
 */
export function SupportButton({
  title,
  supported,
  onToggle,
  tone = 'cream',
  compact = false,
  className = '',
}) {
  const label = supported ? copy.supportedLabel : copy.label

  if (compact) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={supported}
        aria-label={`${copy.label}: ${title}`}
        className={`grid size-11 shrink-0 place-items-center border focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none ${
          supported
            ? 'border-green-700 bg-green-700 text-cream-50'
            : 'border-green-700 bg-transparent text-green-700'
        } ${className}`}
      >
        <CheckIcon size={18} />
      </button>
    )
  }

  const styles =
    tone === 'brown'
      ? supported
        ? 'border-cream-100 bg-cream-100 text-brown-900'
        : 'border-coral-300 bg-coral-300 text-brown-900 hover:bg-cream-100'
      : tone === 'detail'
        ? supported
          ? 'border-2 border-green-700 bg-sand-100 text-green-700'
          : 'border-green-700 bg-green-700 text-cream-50 hover:bg-brown-900'
        : supported
          ? 'border-green-700 bg-green-700 text-cream-50'
          : 'border-green-700 bg-transparent text-green-700 hover:bg-green-100'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={supported}
      className={`inline-flex h-11 min-w-[104px] items-center justify-center gap-1.5 border px-4 text-sm font-semibold transition-colors duration-[var(--motion-base)] focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none ${styles} ${className}`}
    >
      {supported ? <CheckIcon size={14} /> : null}
      {label}
    </button>
  )
}

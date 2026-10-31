import { labels } from './feedConfig'

/** "Report an issue": the single filled primary action in the feed. */
export function ReportButton({ onOpen, floating = false }) {
  if (floating) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 h-14 bg-green-700 px-5 text-[15px] font-semibold text-cream-50 transition-colors duration-[var(--motion-base)] hover:bg-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
      >
        {labels.reportIssue}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="h-12 w-full bg-green-700 text-[15px] font-semibold text-cream-50 transition-colors duration-[var(--motion-base)] hover:bg-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {labels.reportIssue}
    </button>
  )
}

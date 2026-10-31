import { PollCard } from './PollCard'
import { ReportButton } from './ReportButton'

const COUNTS = [
  { value: '63', label: 'open' },
  { value: '41', label: 'fixed' },
]

/** Desktop rail: primary action, the poll, then two count tiles. */
export function FeedRail({ poll, onReport, className = '' }) {
  return (
    <aside
      aria-label="Ward summary"
      className={`lg:sticky lg:top-[200px] lg:self-start ${className}`}
    >
      <ReportButton onOpen={onReport} />

      {poll ? (
        <div className="mt-4">
          <PollCard poll={poll} />
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {COUNTS.map((tile) => (
          <div key={tile.label} className="bg-sand-100 px-3 py-3">
            <dd className="font-display text-[24px] leading-tight text-brown-900">
              {tile.value}
            </dd>
            <dt className="text-[12px] text-brown-600">{tile.label}</dt>
          </div>
        ))}
      </dl>
    </aside>
  )
}

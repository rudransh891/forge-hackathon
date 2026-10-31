import { CheckIcon, InfoIcon } from '@/components/feed/icons'
import { labels, noResponseNoteAfterDays } from '@/components/feed/feedConfig'

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className="shrink-0"
    >
      <path d="M4 3h12v4h4v14H4V3Zm2 2v14h10V9h-4V5H6Zm2 4h4v2H8V9Zm0 4h4v2H8v-2Zm0 4h4v2H8v-2Z" />
    </svg>
  )
}

/**
 * The report's status history, newest first.
 *
 * These entries are written by the pipeline itself (and by the citizen, when
 * they answer the duplicate question). They are not messages from a government
 * department, so the section says so and no entry is marked verified.
 */
export function OfficialUpdates({ updates, note }) {
  if (!updates || updates.length === 0) return null

  return (
    <section aria-labelledby="updates-heading">
      <h2 id="updates-heading" className="text-[16px] font-semibold text-brown-900">
        Status history
      </h2>
      {note ? <p className="mt-1 max-w-[65ch] text-[12px] text-brown-600">{note}</p> : null}
      <div className="mt-3 flex flex-col gap-3">
        {updates.map((update) => (
          <article key={update.id} className="bg-brown-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-cream-100">
                <span className="text-coral-300">
                  <BuildingIcon />
                </span>
                {update.author}
              </p>
              <span className="shrink-0 text-[12px] text-on-panel-muted">{update.dateLabel}</span>
            </div>
            <p className="mt-2 text-[15px] leading-6 text-cream-100">{update.text}</p>
            {update.verified ? (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-cream-100">
                <CheckIcon size={12} />
                {labels.verified}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

/** Shown instead of the update block when the pipeline has recorded nothing. */
export function NoResponseNote({ ageDays }) {
  if (ageDays <= noResponseNoteAfterDays) return null
  return (
    <p className="flex items-start gap-1.5 text-[13px] text-brown-600">
      <InfoIcon size={14} className="mt-0.5 shrink-0" />
      {labels.noResponse}
    </p>
  )
}

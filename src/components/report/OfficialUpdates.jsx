import { useState } from 'react'
import { CheckIcon, InfoIcon } from '@/components/feed/icons'
import { labels, noResponseNoteAfterDays } from '@/components/feed/feedConfig'

const VISIBLE_HISTORY = 5

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
 *
 * Only the newest entry gets the brown panel — one dark block carries the
 * weight, the rest is an editorial log with a date column. Rendering the whole
 * timeline as panels turned the page into a stack of slabs.
 */
export function OfficialUpdates({ updates, note }) {
  const [expanded, setExpanded] = useState(false)
  if (!updates || updates.length === 0) return null

  const [latest, ...history] = updates
  const earlier = expanded ? history : history.slice(0, VISIBLE_HISTORY)
  const hidden = history.length - earlier.length

  return (
    <section aria-labelledby="updates-heading">
      <h2 id="updates-heading" className="text-[16px] font-semibold text-brown-900">
        Status history
      </h2>
      {note ? <p className="mt-1 max-w-[65ch] text-[12px] text-brown-600">{note}</p> : null}

      <article className="mt-3 bg-brown-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-cream-100">
            <span className="text-coral-300">
              <BuildingIcon />
            </span>
            {latest.author}
          </p>
          <span className="shrink-0 text-[12px] text-on-panel-muted">{latest.dateLabel}</span>
        </div>
        <p className="mt-2 text-[15px] leading-6 text-cream-100">{latest.text}</p>
        {latest.verified ? (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-cream-100">
            <CheckIcon size={12} />
            {labels.verified}
          </p>
        ) : null}
      </article>

      {history.length ? (
        <ol className="mt-4 list-none p-0">
          {earlier.map((update) => (
            <li key={update.id} className="flex gap-3 border-t border-sand-300 py-2.5">
              <span className="w-[64px] shrink-0 font-mono text-[12px] text-brown-600">
                {update.dateLabel}
              </span>
              <p className="min-w-0 flex-1 text-[13px] leading-5 text-brown-900">
                {update.text}
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 h-11 text-[13px] font-semibold text-brown-900 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          Show {hidden} earlier {hidden === 1 ? 'entry' : 'entries'}
        </button>
      ) : null}
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

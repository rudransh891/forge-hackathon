import { useState, useSyncExternalStore } from 'react'
import { CheckIcon } from '@/components/feed/icons'
import {
  getSnapshot,
  subscribe,
  toggleSupport,
} from '@/components/report/reportStore'
import { useCopy } from './formConfig'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden fill="currentColor">
      <path d="M10 3a7 7 0 0 1 5.6 11.2l4.6 4.6-1.4 1.4-4.6-4.6A7 7 0 1 1 10 3Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
    </svg>
  )
}

/**
 * "Already reported nearby?" — a hint, never a block.
 *
 * Support writes to the same store the report page uses, so a support here is
 * the same support there.
 */
export function NearbyCheck({ reports, onView, onStillPost }) {
  const copy = useCopy()
  const store = useSyncExternalStore(subscribe, getSnapshot)
  const [supported, setSupported] = useState(null)

  if (!reports || reports.length === 0) return null

  return (
    <section aria-labelledby="nearby-heading" className="bg-brown-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2
          id="nearby-heading"
          className="flex items-center gap-2 text-[14px] font-semibold text-cream-100"
        >
          <span className="text-coral-300">
            <SearchIcon />
          </span>
          {copy.nearbyTitle}
        </h2>
        <span className="text-[12px] text-on-panel-muted">{reports.length}</span>
      </div>

      <ul className="mt-2 list-none p-0">
        {reports.map((report) => {
          const isSupported = Boolean(store.supported[report.id])
          const count = report.supporters + (isSupported ? 1 : 0)
          return (
            <li
              key={report.id}
              className="flex items-start justify-between gap-3 border-t border-brown-700 py-3"
            >
              <div className="min-w-0">
                <p className="text-[14px] leading-snug text-cream-100">{report.title}</p>
                <p className="mt-1 text-[12px] text-on-panel-muted">{count} supporters</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggleSupport(report.id, report.supporters)
                  setSupported(report.id)
                }}
                aria-pressed={isSupported}
                className="h-11 shrink-0 bg-coral-300 px-3 text-[13px] font-semibold text-brown-900 transition-colors duration-[var(--motion-base)] hover:bg-cream-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
              >
                {isSupported ? <CheckIcon size={14} /> : 'Support'}
              </button>
            </li>
          )
        })}
      </ul>

      {supported ? (
        <div className="mt-1 border-t border-brown-700 pt-3">
          <p className="text-[13px] text-cream-100">{copy.nearbyThanks}</p>
          <div className="mt-1 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => onView(supported)}
              className="h-11 text-[13px] font-semibold text-cream-100 underline decoration-coral-300 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
            >
              {copy.nearbyView}
            </button>
            <button
              type="button"
              onClick={onStillPost}
              className="h-11 text-[13px] font-semibold text-cream-100 underline decoration-coral-300 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
            >
              {copy.nearbyStill}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStillPost}
          className="mt-2 h-11 text-[13px] font-semibold text-cream-100 underline decoration-coral-300 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          {copy.nearbyNew}
        </button>
      )}
    </section>
  )
}

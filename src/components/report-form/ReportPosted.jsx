import { useEffect, useRef } from 'react'
import { copy } from './formConfig'

/** Success screen: one brown panel, focus on the headline. */
export function ReportPosted({ id, onView, onBack }) {
  const titleRef = useRef(null)

  useEffect(() => {
    document.title = 'Report posted · Civic Pulse'
    titleRef.current?.focus()
  }, [])

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-10">
      <div className="bg-brown-900 p-5">
        <p className="text-[12px] tracking-[0.04em] text-on-panel-muted">Posted</p>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="mt-2 font-display text-[28px] leading-tight text-cream-100 focus-visible:outline-none"
        >
          Your report is <span className="text-coral-300">posted</span>
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-on-panel-muted">{copy.postedBody}</p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onView}
            className="h-12 bg-coral-300 text-[15px] font-semibold text-brown-900 transition-colors duration-[var(--motion-base)] hover:bg-cream-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {copy.viewReport}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="h-12 border border-coral-300 text-[15px] font-semibold text-coral-300 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {copy.backToReports}
          </button>
        </div>
      </div>
      {id ? (
        <p className="mt-3 text-[12px] text-brown-600">
          Reference {String(id).slice(0, 8)}
        </p>
      ) : null}
    </main>
  )
}

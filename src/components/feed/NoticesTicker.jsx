import { useState } from 'react'
import { PauseIcon, PlayIcon } from './icons'

/**
 * Notices strip. Scrolls at roughly 30px/s, pauses on hover/focus-within, and
 * exposes an explicit pause button. Under reduced motion it is a static,
 * swipeable row with no animation at all.
 */
export function NoticesTicker({ notices }) {
  const [paused, setPaused] = useState(false)

  if (!notices || notices.length === 0) return null

  const items = (
    <>
      {notices.map((notice) => (
        <span key={notice.id} className="inline-flex shrink-0 items-center gap-3">
          <a
            href={notice.href}
            className="whitespace-nowrap text-[13px] text-brown-900 underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {notice.label}
          </a>
          <span aria-hidden className="size-1.5 shrink-0 bg-brown-900" />
        </span>
      ))}
    </>
  )

  return (
    <div className="ticker flex h-8 items-center bg-teal-400 text-brown-900">
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="ticker-track flex w-max items-center gap-3" data-paused={paused}>
          {items}
          <span aria-hidden className="flex shrink-0 items-center gap-3">
            {items}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((current) => !current)}
        aria-pressed={paused}
        aria-label={paused ? 'Resume notices' : 'Pause notices'}
        className="grid size-11 shrink-0 place-items-center text-brown-900 hover:bg-teal-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
      >
        {paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
      </button>
    </div>
  )
}

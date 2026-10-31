import { useEffect, useState } from 'react'
import { CheckIcon } from '@/components/feed/icons'
import {
  getSnapshot as getStoreSnapshot,
  isHelpful,
  subscribe,
  toggleHelpful,
} from './reportStore'
import { useSyncExternalStore } from 'react'

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="currentColor">
      <path d="M4 3h16v18H4V3Zm2 2v14h12V5H6Zm3 2h6v2H9V7Zm0 4h6v2H9v-2Zm0 4h6v2H9v-2Z" />
    </svg>
  )
}

export function CommentItem({ comment, isTop, announcement, onFlag }) {
  const store = useSyncExternalStore(subscribe, getStoreSnapshot)
  const helpful = isHelpful(comment.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [flagged, setFlagged] = useState(false)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <li
      className="border-b border-sand-300 py-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setMenuOpen(false)
      }}
    >
      <div className="flex gap-3">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center bg-sand-100 text-brown-600"
        >
          <PersonIcon />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-brown-600">
            <span className="font-semibold text-brown-900">Resident</span>
            <span aria-hidden>
              {comment.locality} · {comment.ageLabel}
            </span>
            <span className="sr-only">
              , {comment.locality}, {comment.ageLabel} ago
            </span>
            {isTop ? (
              <span className="bg-teal-100 px-1.5 py-0.5 text-[12px] text-brown-900">
                Top comment
              </span>
            ) : null}
          </p>

          <p className="mt-1 text-[15px] leading-6 text-brown-900">{comment.text}</p>

          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              aria-pressed={helpful}
              onClick={() => {
                const next = toggleHelpful(comment.id)
                announcement(next ? 'Marked helpful' : 'Helpful removed')
              }}
              className={`inline-flex h-11 items-center gap-1.5 text-[13px] focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${
                helpful ? 'text-green-700' : 'text-brown-600'
              }`}
            >
              {helpful ? <CheckIcon size={14} /> : <span aria-hidden>☑</span>}
              Helpful {comment.helpful + (helpful ? 1 : 0)}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="inline-flex h-11 items-center text-[13px] text-brown-600 underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
              >
                {flagged ? 'Reported' : 'Report'}
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  aria-label="Report this comment"
                  className="absolute left-0 z-10 mt-1 min-w-[140px] border border-sand-300 bg-cream-50"
                >
                  {['Spam', 'Abusive', 'Other'].map((reason) => (
                    <button
                      key={reason}
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        setFlagged(true)
                        onFlag(reason)
                      }}
                      className="block h-11 w-full px-3 text-left text-[13px] text-brown-900 hover:bg-sand-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

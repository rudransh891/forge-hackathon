import { useState } from 'react'
import { labels } from '@/components/feed/feedConfig'

/**
 * Comment composer. Auth is not connected, so it never accepts text: focusing
 * explains why, and tapping or pressing a key opens the login view.
 *
 * Opening on focus alone was deliberate at first, but the modal returns focus
 * to its opener on close, which re-focused this input and re-opened the modal
 * immediately — an unclosable loop. Focus now only explains; the explicit
 * gesture opens.
 */
export function CommentComposer({ onRequireAuth }) {
  const [notice, setNotice] = useState('')

  const requireAuth = () => {
    setNotice(labels.logInToComment)
    onRequireAuth()
  }

  return (
    <div className="mt-3">
      <label htmlFor="comment-input" className="sr-only">
        Add a comment
      </label>
      <div className="flex items-center gap-2">
        <input
          id="comment-input"
          type="text"
          readOnly
          onFocus={() => setNotice(labels.logInToComment)}
          onClick={requireAuth}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') requireAuth()
          }}
          placeholder="Add a comment"
          className="h-12 min-w-0 flex-1 border border-brown-600 bg-cream-50 px-3 text-[16px] text-brown-900 placeholder:text-brown-600 focus-visible:border-2 focus-visible:border-green-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={requireAuth}
          className="h-12 shrink-0 border border-green-700 px-4 text-[14px] font-semibold text-green-700 transition-colors duration-[var(--motion-base)] hover:bg-green-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          Post
        </button>
      </div>
      <p className="mt-1.5 text-[13px] text-brown-600">{notice}</p>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getIdToken } from '@/components/auth/authService'
import { postComment } from '@/components/feed/feedService'
import { labels } from '@/components/feed/feedConfig'

/**
 * Comment composer.
 *
 * Signed out: it never accepts text — focusing explains why, and the explicit
 * gesture (tap, Enter, Post) opens the login view.
 *
 * Signed in: it accepts text and posts through the service, which currently
 * answers `not_configured` because the backend has no comments table. The
 * notice says so rather than pretending the comment was saved.
 */
export function CommentComposer({ reportId, onRequireAuth }) {
  const { account } = useAuth()
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  const requireAuth = () => {
    setNotice(labels.logInToComment)
    onRequireAuth()
  }

  const submit = async (event) => {
    event.preventDefault()
    const body = text.trim()
    if (!body || pending) return
    setPending(true)
    await postComment({ reportId, text: body, idToken: await getIdToken() })
    setPending(false)
    setText('')
    setNotice(labels.commentsNotConnected)
  }

  if (!account) {
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

  return (
    <form className="mt-3" onSubmit={submit}>
      <label htmlFor="comment-input" className="sr-only">
        Add a comment
      </label>
      <div className="flex items-center gap-2">
        <input
          id="comment-input"
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={`Comment as ${account.name}`}
          className="h-12 min-w-0 flex-1 border border-brown-600 bg-cream-50 px-3 text-[16px] text-brown-900 placeholder:text-brown-600 focus-visible:border-2 focus-visible:border-green-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="h-12 shrink-0 border border-green-700 px-4 text-[14px] font-semibold text-green-700 transition-colors duration-[var(--motion-base)] hover:bg-green-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none disabled:border-sand-300 disabled:text-brown-600"
        >
          {pending ? 'Posting…' : 'Post'}
        </button>
      </div>
      <p aria-live="polite" className="mt-1.5 text-[13px] text-brown-600">
        {notice}
      </p>
    </form>
  )
}

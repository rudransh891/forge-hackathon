import { useState } from 'react'

/**
 * Web Share when available, clipboard when not, and a visible readonly field
 * when the clipboard is blocked. Announced through its own live region.
 */
export function ShareButton({ title, className = '', fullWidth = false }) {
  const [message, setMessage] = useState('')
  const [manualUrl, setManualUrl] = useState(null)

  const onShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        setMessage('Shared')
        return
      } catch {
        // cancelled or unsupported: fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setMessage('Link copied')
      setManualUrl(null)
    } catch {
      setManualUrl(url)
      setMessage('Copy this link')
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onShare}
        aria-label="Share this report"
        className={`inline-flex h-11 items-center justify-center gap-2 border border-green-700 px-3 text-green-700 transition-colors duration-[var(--motion-base)] hover:bg-green-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${fullWidth ? 'w-full' : ''}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true" fill="currentColor">
          <path d="M18 3h3v6h-2V6.4l-6.3 6.3-1.4-1.4L17.6 5H18V3ZM3 5h8v2H5v12h12v-6h2v8H3V5Z" />
        </svg>
        <span className="hidden text-[14px] font-semibold lg:inline">Share</span>
      </button>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
      {manualUrl ? (
        <input
          readOnly
          value={manualUrl}
          aria-label="Report link"
          onFocus={(event) => event.target.select()}
          className="mt-2 h-11 w-full border border-brown-600 bg-cream-50 px-2 text-[12px] text-brown-900"
        />
      ) : null}
    </div>
  )
}

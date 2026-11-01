import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { copy } from './formConfig'

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/**
 * Leave dialog: the same overlay, Escape, focus-trap and scroll-lock rules as
 * the auth modal, with Keep editing focused by default.
 */
export function LeaveDialog({ onKeepEditing, onSaveAndLeave, onDiscard }) {
  const dialogRef = useRef(null)
  const keepRef = useRef(null)

  useEffect(() => {
    const { body } = document
    const previousOverflow = body.style.overflow
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const previousPadding = body.style.paddingRight
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    keepRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onKeepEditing()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const nodes = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE))
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [onKeepEditing])

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--overlay-scrim)] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onKeepEditing()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        aria-describedby="leave-body"
        className="w-full max-w-[440px] bg-cream-50 p-5"
      >
        <h2 id="leave-title" className="font-display text-[22px] text-brown-900">
          {copy.discardTitle}
        </h2>
        <p id="leave-body" className="mt-2 text-[14px] text-brown-600">
          {copy.discardBody}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            ref={keepRef}
            type="button"
            onClick={onKeepEditing}
            className="h-12 bg-green-700 text-[15px] font-semibold text-cream-50 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {copy.keepEditing}
          </button>
          <button
            type="button"
            onClick={onSaveAndLeave}
            className="h-12 border border-green-700 text-[15px] font-semibold text-green-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {copy.saveAndLeave}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="h-12 text-[15px] font-semibold text-coral-700 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {copy.discardDraft}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

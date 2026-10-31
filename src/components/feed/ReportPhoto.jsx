import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, PhotoIcon } from './icons'
import { labels } from './feedConfig'

/**
 * Framed photo. Space is reserved by aspect ratio so nothing shifts on load.
 * No overlays, no tints, no filters: the photo is evidence, not decoration.
 */
export function ReportPhoto({
  src,
  alt,
  title,
  variant = 'thumb',
  priority = false,
  className = '',
}) {
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  const ratio =
    variant === 'lead'
      ? 'aspect-[16/9] max-h-[92px] lg:aspect-[16/10] lg:max-h-none'
      : 'aspect-square'
  const fallbackAlt = alt || `Photo attached to ${title}`

  const placeholder = (
    <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-sand-100 text-brown-600">
      <PhotoIcon size={variant === 'lead' ? 28 : 20} className="text-sand-300" />
      <span className="text-[12px]">{failed ? labels.photoUnavailable : 'Photo'}</span>
    </span>
  )

  return (
    <figure className={`m-0 ${className}`}>
      {src && !failed ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open photo: ${fallbackAlt}`}
          className={`block w-full ${ratio} overflow-hidden border border-sand-300 bg-sand-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2`}
        >
          <img
            src={src}
            alt={fallbackAlt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        </button>
      ) : (
        <div
          className={`w-full ${ratio} border border-sand-300 focus-visible:outline-none`}
          role="img"
          aria-label={failed ? labels.photoUnavailable : 'No photo attached'}
        >
          {placeholder}
        </div>
      )}

      {variant === 'lead' && src && !failed ? (
        <figcaption className="mt-1 text-[12px] text-brown-600">{labels.photoCredit}</figcaption>
      ) : null}

      {open ? (
        <PhotoLightbox
          photos={[{ src, alt: fallbackAlt }]}
          startIndex={0}
          onClose={() => {
            setOpen(false)
            triggerRef.current?.focus()
          }}
        />
      ) : null}
    </figure>
  )
}

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/**
 * Shared lightbox. The feed passes a single photo, the report gallery passes
 * the whole set plus a start index; arrow keys walk the set.
 */
export function PhotoLightbox({ photos, startIndex = 0, onClose }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const [index, setIndex] = useState(startIndex)
  const current = photos[index] || photos[0] || { src: '', alt: '' }

  useEffect(() => {
    const { body } = document
    const previousOverflow = body.style.overflow
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const previousPadding = body.style.paddingRight
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (photos.length > 1 && event.key === 'ArrowRight') {
        setIndex((value) => (value + 1) % photos.length)
        return
      }
      if (photos.length > 1 && event.key === 'ArrowLeft') {
        setIndex((value) => (value - 1 + photos.length) % photos.length)
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
  }, [onClose, photos.length])

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--overlay-scrim)] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={current.alt}
        className="relative max-h-[90dvh] w-full max-w-[900px] bg-brown-900 p-2"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="absolute -top-12 right-0 grid size-11 place-items-center text-cream-100 hover:bg-brown-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          <CloseIcon size={20} />
        </button>
        <img
          src={current.src}
          alt={current.alt}
          className="mx-auto max-h-[80dvh] w-auto max-w-full object-contain"
        />
        {photos.length > 1 ? (
          <p className="pt-2 text-center text-[12px] text-cream-100">
            {index + 1} / {photos.length}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

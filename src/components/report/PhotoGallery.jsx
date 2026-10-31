import { useEffect, useRef, useState } from 'react'
import { PhotoLightbox } from '@/components/feed/ReportPhoto'
import { PhotoIcon } from '@/components/feed/icons'

/**
 * Swipeable photo gallery. The counter follows an IntersectionObserver on the
 * slides (never a scroll listener), and the whole set reopens in the feed's
 * lightbox at the tapped index.
 */
export function PhotoGallery({ photos, title }) {
  const [index, setIndex] = useState(0)
  const [openAt, setOpenAt] = useState(null)
  const [failed, setFailed] = useState({})
  const trackRef = useRef(null)
  const slides = useRef([])

  useEffect(() => {
    const root = trackRef.current
    if (!root || photos.length === 0) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIndex(Number(entry.target.dataset.slide))
        })
      },
      { root, threshold: 0.6 },
    )
    slides.current.forEach((slide) => slide && observer.observe(slide))
    return () => observer.disconnect()
  }, [photos.length])

  const goTo = (next) => {
    const target = slides.current[Math.max(0, Math.min(next, photos.length - 1))]
    if (!target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      inline: 'start',
      block: 'nearest',
    })
  }

  if (!photos || photos.length === 0) return null

  return (
    <figure className="m-0">
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Photos attached to this report"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            goTo(index + 1)
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            goTo(index - 1)
          }
        }}
        className="ticker-strip relative flex snap-x snap-mandatory overflow-x-auto focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
      >
        {photos.map((photo, photoIndex) => (
          <div
            key={`${photo.src}-${photoIndex}`}
            ref={(element) => {
              slides.current[photoIndex] = element
            }}
            data-slide={photoIndex}
            role="group"
            aria-label={`Photo ${photoIndex + 1} of ${photos.length}`}
            className="w-full shrink-0 snap-start"
          >
            <button
              type="button"
              onClick={() => setOpenAt(photoIndex)}
              aria-label={`Open photo: ${photo.alt}`}
              className={`block aspect-[16/9] w-full overflow-hidden border border-sand-300 bg-sand-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none lg:max-h-[420px]`}
            >
              {failed[photoIndex] ? (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-sand-100 text-brown-600">
                  <PhotoIcon size={28} className="text-sand-300" />
                  <span className="text-[12px]">Photo unavailable</span>
                </span>
              ) : (
                <img
                  src={photo.src}
                  alt={photo.alt || `Photo attached to ${title}`}
                  loading={photoIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={() => setFailed((current) => ({ ...current, [photoIndex]: true }))}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          </div>
        ))}
      </div>

      {photos.length > 1 ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[12px] text-brown-600">Photos submitted by a resident.</p>
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous photo"
              className="hidden size-11 place-items-center border border-sand-300 bg-cream-50 text-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none lg:grid"
            >
              <span aria-hidden>←</span>
            </button>
            <span
              aria-live="polite"
              className="border border-sand-300 bg-cream-50 px-2 py-1 text-[12px] text-brown-900"
            >
              {index + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next photo"
              className="hidden size-11 place-items-center border border-sand-300 bg-cream-50 text-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none lg:grid"
            >
              <span aria-hidden>→</span>
            </button>
          </span>
        </div>
      ) : (
        <figcaption className="mt-2 text-[12px] text-brown-600">
          Photos submitted by a resident.
        </figcaption>
      )}

      {openAt !== null ? (
        <PhotoLightbox
          photos={photos.map((photo) => ({
            src: photo.src,
            alt: photo.alt || `Photo attached to ${title}`,
          }))}
          startIndex={openAt}
          onClose={() => setOpenAt(null)}
        />
      ) : null}
    </figure>
  )
}

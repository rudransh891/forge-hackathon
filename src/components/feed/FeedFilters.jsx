import { useRef } from 'react'
import { categories } from './feedConfig'

/**
 * Category chips. Horizontal scroller on mobile (next chip peeks at the edge,
 * no fade), wrapped row on desktop. 44px tap targets, aria-pressed per chip.
 */
export function FeedFilters({ active, onChange }) {
  const listRef = useRef(null)

  const select = (category, element) => {
    onChange(category)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  return (
    <div
      ref={listRef}
      role="group"
      aria-label="Filter reports by category"
      className="ticker-strip -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
    >
      {categories.map((category) => {
        const selected = category === active
        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected}
            onClick={(event) => select(category, event.currentTarget)}
            className={`h-11 shrink-0 border px-4 text-sm whitespace-nowrap transition-colors duration-[var(--motion-base)] focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${
              selected
                ? 'border-brown-900 bg-brown-900 text-cream-50'
                : 'border-brown-600 bg-transparent text-brown-900 hover:bg-sand-100'
            }`}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}

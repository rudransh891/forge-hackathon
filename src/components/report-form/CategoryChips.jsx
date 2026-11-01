import { useRef } from 'react'
import { CheckIcon } from '@/components/feed/icons'
import { categories } from './formConfig'

/** Single-select chips with radiogroup semantics and arrow-key movement. */
export function CategoryChips({ value, onChange, error }) {
  const groupRef = useRef(null)

  const move = (delta) => {
    const index = categories.indexOf(value)
    const next = categories[(index + delta + categories.length) % categories.length]
    onChange(next)
    const buttons = groupRef.current?.querySelectorAll('[role="radio"]')
    buttons?.[categories.indexOf(next)]?.focus()
  }

  return (
    <div>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="What is it"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'category-error' : undefined}
        className="-mx-4 flex flex-wrap gap-2 px-4 pb-1 lg:mx-0 lg:px-0"
      >
        {categories.map((category) => {
          const selected = value === category
          return (
            <button
              key={category}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (!value && category === categories[0]) ? 0 : -1}
              onClick={() => onChange(category)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  move(1)
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  move(-1)
                }
              }}
              className={`inline-flex h-11 shrink-0 items-center gap-1.5 border px-4 text-[14px] whitespace-nowrap transition-colors duration-[var(--motion-base)] focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${
                selected
                  ? 'border-brown-900 bg-brown-900 text-cream-50'
                  : 'border-brown-600 bg-transparent text-brown-900 hover:bg-sand-100'
              }`}
            >
              {selected ? <CheckIcon size={14} /> : null}
              {category}
            </button>
          )
        })}
      </div>
      {error ? (
        <p id="category-error" className="mt-1.5 text-[13px] text-coral-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

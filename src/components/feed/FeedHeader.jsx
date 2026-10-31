import { BroadcastIcon } from './icons'
import { sortOptions, ward } from './feedConfig'
import { FeedFilters } from './FeedFilters'

function today() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date())
}

/** Sticky feed header: date line + sort on one row, chips underneath. */
export function FeedHeader({ category, sort, onCategoryChange, onSortChange }) {
  return (
    <div className="sticky top-16 z-30 border-b border-sand-300 bg-cream-100">
      <div className="mx-auto w-full max-w-[1120px] px-4 lg:px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-brown-900">
            <BroadcastIcon size={16} className="text-coral-500" />
            {ward} · {today()}
          </p>

          <label className="flex items-center gap-2 text-[13px] text-brown-600">
            Sort
            <span className="relative inline-flex">
              <select
                value={sort}
                onChange={(event) => onSortChange(event.target.value)}
                className="h-11 appearance-none border border-brown-600 bg-cream-50 pr-9 pl-3 text-[13px] text-brown-900 focus:outline-none focus-visible:border-green-700 focus-visible:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-coral-500"
              >
                <path d="M12 16.5 3.5 7.5h17L12 16.5Z" />
              </svg>
            </span>
          </label>
        </div>

        <div className="pt-2 pb-1">
          <FeedFilters active={category} onChange={onCategoryChange} />
        </div>
      </div>
    </div>
  )
}

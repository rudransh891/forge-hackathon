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
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value)}
              className="h-11 border border-brown-600 bg-cream-50 px-2 text-[13px] text-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="pt-2 pb-1">
          <FeedFilters active={category} onChange={onCategoryChange} />
        </div>
      </div>
    </div>
  )
}

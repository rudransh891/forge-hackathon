import { TAB_ORDER, views } from './authModalConfig'

export function AuthTabs({ view, onChange }) {
  const handleKeyDown = (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = TAB_ORDER.indexOf(view)
    const delta = event.key === 'ArrowRight' ? 1 : -1
    const next = TAB_ORDER[(index + delta + TAB_ORDER.length) % TAB_ORDER.length]
    onChange(next)
  }

  return (
    <div
      role="tablist"
      aria-label="Account access"
      onKeyDown={handleKeyDown}
      className="flex gap-1 rounded-[999px] bg-sand-100 p-1"
    >
      {TAB_ORDER.map((id) => {
        const selected = id === view
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={`h-11 flex-1 rounded-[999px] text-sm font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none ${
              selected
                ? 'bg-brown-900 text-cream-50'
                : 'bg-transparent text-brown-900 hover:bg-cream-100'
            }`}
          >
            {views[id].tab}
          </button>
        )
      })}
    </div>
  )
}

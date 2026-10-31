import { useEffect, useState } from 'react'
import { fetchStats } from '@/lib/api'
import { PollCard } from './PollCard'
import { ReportButton } from './ReportButton'

/** Desktop rail: primary action, the poll, then two count tiles. */
export function FeedRail({ poll, onReport, className = '' }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let alive = true
    fetchStats()
      .then((value) => {
        if (alive) setStats(value)
      })
      .catch(() => {
        if (alive) setStats(null)
      })
    return () => {
      alive = false
    }
  }, [])

  const counts = [
    { value: stats ? String(stats.open) : '—', label: 'open' },
    { value: stats ? String(stats.resolved) : '—', label: 'fixed' },
  ]

  return (
    <aside
      aria-label="City summary"
      className={`lg:sticky lg:top-[200px] lg:self-start ${className}`}
    >
      <ReportButton onOpen={onReport} />

      {poll ? (
        <div className="mt-4">
          <PollCard poll={poll} />
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {counts.map((tile) => (
          <div key={tile.label} className="bg-sand-100 px-3 py-3">
            <dd className="font-display text-[24px] leading-tight text-brown-900">
              {tile.value}
            </dd>
            <dt className="text-[12px] text-brown-600">{tile.label}</dt>
          </div>
        ))}
      </dl>
    </aside>
  )
}

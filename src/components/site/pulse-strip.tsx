import { useEffect, useState } from 'react'
import { Container } from '@/components/site/layout'
import { fetchStats } from '@/lib/api'
import type { BackendStats } from '@/lib/api'

/**
 * The four numbers come from GET /stats, so the strip can read zero. An em dash
 * means the API has not answered yet, which is the honest thing to show.
 */
export function PulseStrip() {
  const [stats, setStats] = useState<BackendStats | null>(null)

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

  const tiles = [
    { value: stats?.total, label: 'reports filed' },
    { value: stats?.open, label: 'open issues' },
    { value: stats?.resolved, label: 'resolved' },
    { value: stats?.in_progress, label: 'being analysed' },
  ]

  const format = (value: number | undefined) =>
    typeof value === 'number' ? value.toLocaleString('en-IN') : '—'

  return (
    <section aria-label="Live pulse" className="py-8 md:py-10">
      <div className="bg-coral-450 md:mx-4">
        <Container className="grid grid-cols-2 gap-y-6 py-7 text-white md:grid-cols-4 md:gap-y-0">
          {tiles.map((stat, index) => (
            <div
              key={stat.label}
              className={
                index > 0 ? 'md:border-l md:border-brown-700 md:pl-8' : undefined
              }
            >
              <p className="font-mono text-[26px] leading-none tracking-tight">
                {format(stat.value)}
              </p>
              <p className="mt-2 text-sm">{stat.label}</p>
            </div>
          ))}
        </Container>
      </div>
    </section>
  )
}

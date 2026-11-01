import { useEffect, useState } from 'react'
import { fetchDepartments, fetchStats } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { PollCard } from './PollCard'
import { ReportButton } from './ReportButton'

/**
 * Desktop rail: primary action, the poll, two count tiles, then the bodies that
 * reports were routed to. Every figure comes from a row in the database.
 */
export function FeedRail({ poll, onReport, className = '' }) {
  const { t } = useI18n()
  const [stats, setStats] = useState(null)
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    let alive = true
    fetchStats()
      .then((value) => {
        if (alive) setStats(value)
      })
      .catch(() => {
        if (alive) setStats(null)
      })
    fetchDepartments()
      .then((rows) => {
        if (alive) setDepartments(rows)
      })
      .catch(() => {
        if (alive) setDepartments([])
      })
    return () => {
      alive = false
    }
  }, [])

  const counts = [
    { value: stats ? String(stats.open) : '—', label: t('feed.open') },
    { value: stats ? String(stats.resolved) : '—', label: t('feed.fixed') },
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

      <section aria-labelledby="departments-heading" className="mt-6">
        <h2
          id="departments-heading"
          className="border-b border-sand-300 pb-1 text-[13px] font-semibold text-brown-600"
        >
          {t('feed.departments')}
        </h2>
        {departments.length === 0 ? (
          <p className="mt-2 text-[13px] text-brown-600">
            {t('feed.departmentsEmpty')}
          </p>
        ) : (
          <ul className="mt-2 list-none p-0 text-[13px]">
            {departments.map((row) => (
              <li key={row.department} className="border-b border-sand-300 py-2 last:border-b-0">
                <p className="leading-snug text-brown-900">{row.department}</p>
                <p className="mt-0.5 text-[12px] text-brown-600">
                  {row.total} {row.total === 1 ? 'report' : 'reports'}
                  {row.resolved ? ` · ${row.resolved} fixed` : ''}
                  {row.overdue ? ` · ${row.overdue} past deadline` : ''}
                  {typeof row.avg_hours === 'number' ? ` · ${row.avg_hours} h to fix` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}

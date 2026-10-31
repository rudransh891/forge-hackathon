import { BriefRow } from '@/components/feed/BriefRow'
import { getSnapshot, subscribe, toggleSupport as toggleSupportInStore } from './reportStore'
import { useSyncExternalStore } from 'react'

/** Two brief rows from the same locality, reusing the feed's brief styling. */
export function NearbyReports({ reports }) {
  const store = useSyncExternalStore(subscribe, getSnapshot)

  if (!reports || reports.length === 0) return null

  return (
    <section aria-labelledby="nearby-heading">
      <h2 id="nearby-heading" className="text-[16px] font-semibold text-brown-900">
        Nearby reports
      </h2>
      <ul className="mt-2 list-none p-0">
        {reports.map((report) => (
          <BriefRow
            key={report.id}
            report={report}
            supported={Boolean(store.supported[report.id])}
            onSupport={() => toggleSupportInStore(report.id)}
          />
        ))}
      </ul>
    </section>
  )
}

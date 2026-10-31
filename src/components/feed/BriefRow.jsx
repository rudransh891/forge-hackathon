import { feedNavigation } from '@/components/report/feedNavigation'
import { supportCount } from '@/components/report/reportStore'
import { SupportButton } from './SupportButton'

/** One-line low-priority report: title, count, 44px support toggle. */
export function BriefRow({ report, supported, onSupport }) {
  return (
    <li className="flex items-center gap-3 border-b border-sand-300 py-2.5">
      <h2 className="min-w-0 flex-1 truncate font-display text-[15px] leading-6 text-brown-900">
        <a
          href={`#/issues/${report.id}`}
          onClick={() => {
            feedNavigation.cameFromFeed = true
            feedNavigation.scrollY = window.scrollY
          }}
          className="hover:underline hover:decoration-coral-500 hover:decoration-2 hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          {report.title}
        </a>
      </h2>
      <span className="shrink-0 text-[12px] text-brown-600">
        {supportCount(report.id, report.supporters)} supporters
      </span>
      <SupportButton
        title={report.title}
        supported={supported}
        onToggle={onSupport}
        compact
      />
    </li>
  )
}

import { SupportButton } from './SupportButton'

/** One-line low-priority report: title, count, 44px support toggle. */
export function BriefRow({ report, supported, onSupport }) {
  return (
    <li className="flex items-center gap-3 border-b border-sand-300 py-2.5">
      <h2 className="min-w-0 flex-1 truncate font-display text-[15px] leading-6 text-brown-900">
        {report.title}
      </h2>
      <span className="shrink-0 text-[12px] text-brown-600">
        {report.supporters + (supported ? 1 : 0)} supporters
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

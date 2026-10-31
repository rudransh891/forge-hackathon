import { SupportButton } from '@/components/feed/SupportButton'
import { ShareButton } from './ShareButton'

/** Mobile sticky bar: count, share, support. Fixed above the page, below modals. */
export function SupportBar({ report, supported, onSupport }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-300 bg-cream-50 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] text-brown-900">
          <span className="font-semibold">{report.supporters + (supported ? 1 : 0)}</span>{' '}
          supporters
        </p>
        <div className="flex items-center gap-2">
          <ShareButton title={report.title} />
          <SupportButton
            title={report.title}
            supported={supported}
            onToggle={onSupport}
            tone="detail"
          />
        </div>
      </div>
    </div>
  )
}

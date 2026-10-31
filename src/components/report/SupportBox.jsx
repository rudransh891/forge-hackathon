import { SupportButton } from '@/components/feed/SupportButton'
import { ShareButton } from './ShareButton'

/** Desktop rail support card: big count, primary support, secondary share. */
export function SupportBox({ report, supported, onSupport }) {
  return (
    <section aria-label="Support this report">
      <p className="font-display text-[40px] leading-none text-brown-900">
        {report.supporters + (supported ? 1 : 0)}
      </p>
      <p className="mt-1 text-[13px] text-brown-600">supporters</p>

      <SupportButton
        title={report.title}
        supported={supported}
        onToggle={onSupport}
        tone="detail"
        className="mt-3 w-full"
      />
      <ShareButton title={report.title} fullWidth className="mt-2" />
    </section>
  )
}

import { feedNavigation } from '@/components/report/feedNavigation'
import { supportCount } from '@/components/report/reportStore'
import { CommentIcon } from './icons'
import { useI18n } from '@/lib/i18n'
import { ReportPhoto } from './ReportPhoto'
import { StatusTag, UpdateNote, VerificationMark } from './StatusTag'
import { SupportButton } from './SupportButton'

function metaText(report) {
  return `${report.category}, ${report.locality}, reported ${report.ageDays} days ago`
}

/** Standard report: meta, headline, 72px thumbnail, footer with support. */
export function ReportCard({ report, supported, onSupport }) {
  const { t } = useI18n()
  const headlineId = `report-${report.id}`
  return (
    <article
      aria-labelledby={headlineId}
      className={`relative py-3.5 ${report.urgent ? 'pl-3' : ''}`}
    >
      {report.urgent ? (
        <span aria-hidden className="absolute top-0 bottom-0 left-0 w-1 bg-coral-700" />
      ) : null}

      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-brown-600">
            <StatusTag status={report.status} urgent={report.urgent} />
            <span className="sr-only">
              {metaText(report)}, {report.verification === 'verified' ? 'verified' : 'unverified'}
            </span>
            <span aria-hidden>
              {report.category} · {report.locality} · {report.ageDays}d
            </span>
            <span aria-hidden className="inline-flex items-center gap-1 whitespace-nowrap">
              <VerificationMark verification={report.verification} short />
            </span>
          </p>

          <h2
            id={headlineId}
            className="mt-1.5 font-display text-[17px] leading-[1.25] text-brown-900 md:text-[20px]"
          >
            <a
              href={`#/issues/${report.id}`}
              onClick={() => {
                feedNavigation.cameFromFeed = true
            feedNavigation.scrollY = window.scrollY
                feedNavigation.scrollY = window.scrollY
              }}
              className="hover:underline hover:decoration-coral-500 hover:decoration-2 hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
            >
              {report.title}
            </a>
          </h2>

          <UpdateNote update={report.update} />
        </div>

        {report.photo ? (
          <ReportPhoto
            src={report.photo}
            alt={report.photoAlt}
            title={report.title}
            variant="thumb"
            className="w-14 shrink-0 self-start"
          />
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-3 text-[12px] text-brown-600">
          <span>{supportCount(report.id, report.supporters)} {t('feed.supporters')}</span>
          <span className="inline-flex items-center gap-1">
            <CommentIcon size={13} className="text-coral-500" />
            {report.comments} {t('feed.comments')}
          </span>
        </p>
        <SupportButton
          title={report.title}
          supported={supported}
          onToggle={onSupport}
          tone="cream"
        />
      </div>
    </article>
  )
}

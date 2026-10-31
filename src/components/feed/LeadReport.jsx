import { feedNavigation } from '@/components/report/feedNavigation'
import { CommentIcon } from './icons'
import { ReportPhoto } from './ReportPhoto'
import { StatusTag, VerificationMark } from './StatusTag'
import { SupportButton } from './SupportButton'

/**
 * The lead report: the only brown panel in the feed, and the only larger
 * headline. Photo left / text right on desktop, stacked on mobile.
 */
export function LeadReport({ report, supported, onSupport }) {
  const headlineId = `lead-${report.id}`

  return (
    <article
      aria-labelledby={headlineId}
      className={`relative bg-brown-900 p-3 lg:p-4 ${report.urgent ? 'pl-4 lg:pl-5' : ''}`}
    >
      {report.urgent ? (
        <span aria-hidden className="absolute top-0 bottom-0 left-0 w-1 bg-coral-700" />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[200px_1fr] lg:gap-6">
        <ReportPhoto
          src={report.photo}
          alt={report.photoAlt}
          title={report.title}
          variant="lead"
          priority
          className="lg:w-[200px]"
        />

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-on-panel-muted">
            <StatusTag status={report.status} urgent={report.urgent} />
            <span className="sr-only">
              {report.category}, {report.locality}, reported {report.ageDays} days ago,{' '}
              {report.verification === 'verified' ? 'verified by ward office' : 'unverified'}
            </span>
            <span aria-hidden>
              {report.category} · {report.locality} · {report.ageDays}d
            </span>
            <span aria-hidden className="inline-flex items-center gap-1 whitespace-nowrap">
              <VerificationMark verification={report.verification} />
            </span>
          </div>

          <h2
            id={headlineId}
            className="mt-2 font-display text-[21px] leading-[1.15] text-cream-100 md:text-[28px]"
          >
            <a
              href={`#/issues/${report.id}`}
              onClick={() => {
                feedNavigation.cameFromFeed = true
                feedNavigation.scrollY = window.scrollY
              }}
              className="hover:underline hover:decoration-coral-300 hover:decoration-2 hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
            >
              {report.title}
            </a>
          </h2>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 lg:mt-auto">
            <p className="flex items-center gap-3 text-[12px] text-on-panel-muted">
              <span>{report.supporters + (supported ? 1 : 0)} supporters</span>
              <span className="inline-flex items-center gap-1">
                <CommentIcon size={13} className="text-coral-300" />
                {report.comments} comments
              </span>
            </p>
            <SupportButton
              title={report.title}
              supported={supported}
              onToggle={onSupport}
              tone="brown"
            />
          </div>
        </div>
      </div>
    </article>
  )
}

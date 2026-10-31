import { StatusTag, VerificationMark } from '@/components/feed/StatusTag'
import { InfoIcon } from '@/components/feed/icons'
import { labels, unverifiedNoteAfterDays } from '@/components/feed/feedConfig'

/**
 * The header block. The 4px coral edge is part of the urgent combination and
 * appears nowhere else.
 */
export function ReportHeader({ report }) {
  const staleUnverified =
    report.verification !== 'verified' && report.ageDays > unverifiedNoteAfterDays

  return (
    <header className={report.urgent ? 'border-l-4 border-coral-700 pl-3' : ''}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-brown-600">
        <StatusTag status={report.status} urgent={report.urgent} />
        <span className="sr-only">
          {report.category}, {report.locality}, reported {report.ageDays} days ago.
        </span>
        <span aria-hidden>
          {report.category} · {report.locality} · {report.ageDays} days ago
        </span>
      </div>

      <h1
        id="report-title"
        tabIndex={-1}
        className="mt-2 font-display text-[28px] leading-[1.12] text-brown-900 focus-visible:outline-none lg:text-[40px]"
      >
        {report.title}
      </h1>

      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] text-brown-600">
        <span>Resident report ·</span>
        <VerificationMark verification={report.verification} />
      </p>

      {staleUnverified ? (
        <p className="mt-2 flex items-start gap-1.5 text-[13px] text-brown-600">
          <InfoIcon size={14} className="mt-0.5 shrink-0" />
          {labels.notVerified}
        </p>
      ) : null}
    </header>
  )
}

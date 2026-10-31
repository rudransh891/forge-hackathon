import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { fetchReport, fetchNearbyReports } from '@/components/feed/feedService'
import { labels } from '@/components/feed/feedConfig'
import { answerDuplicate, dateTimeLabel, reanalyse } from '@/lib/api'
import { CommentsSection } from './CommentsSection'
import { LocationBlock } from './LocationBlock'
import { NearbyReports } from './NearbyReports'
import { OfficialUpdates, NoResponseNote } from './OfficialUpdates'
import { PhotoGallery } from './PhotoGallery'
import { ReportDescription } from './ReportDescription'
import { ReportHeader } from './ReportHeader'
import { ReportNotFound } from './ReportNotFound'
import { ReportSkeleton } from './ReportSkeleton'
import { ShareButton } from './ShareButton'
import { TrackerHorizontal, TrackerVertical } from './StatusTracker'
import { SupportBar } from './SupportBar'
import { SupportBox } from './SupportBox'
import { feedNavigation } from './feedNavigation'
import { getSnapshot, subscribe, supportCount, toggleSupport } from './reportStore'

/** A report is unfinished until it has a severity, so poll for a bounded time. */
const POLL_MS = 3000
const MAX_POLLS = 20

const RETRYABLE = new Set(['needs_review', 'needs_better_photo'])

function SectionHeading({ id, children }) {
  return (
    <h2 id={id} className="text-[16px] font-semibold text-brown-900">
      {children}
    </h2>
  )
}

/**
 * Severity, with the evidence behind it. The backend scores five factors and
 * marks the result provisional when one of them could not be checked; showing
 * only the level would hide that.
 */
function SeveritySection({ report, onReanalyse, busy }) {
  const severity = report.severity
  const canRetry = RETRYABLE.has(report.rawStatus)

  const retry = canRetry ? (
    <button
      type="button"
      onClick={onReanalyse}
      disabled={busy}
      className="mt-3 h-11 border border-brown-600 px-4 text-[13px] font-semibold text-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none disabled:text-brown-600"
    >
      {busy ? 'Re-analysing…' : 'Analyse again'}
    </button>
  ) : null

  if (!severity) {
    return (
      <section aria-labelledby="severity-heading" className="mt-6 border-t border-sand-300 pt-4">
        <SectionHeading id="severity-heading">Severity</SectionHeading>
        <p className="mt-1 text-[14px] text-brown-600">
          Not scored yet. A score needs a readable photo, and the road and nearby
          places around it.
        </p>
        {retry}
      </section>
    )
  }

  const factors = severity.factors ? Object.entries(severity.factors) : []
  const level = severity.level ? severity.level.charAt(0).toUpperCase() + severity.level.slice(1) : 'Unscored'

  return (
    <section aria-labelledby="severity-heading" className="mt-6 border-t border-sand-300 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <SectionHeading id="severity-heading">Severity</SectionHeading>
        <p className="font-mono text-[12px] text-brown-600">
          {severity.coverage ?? 'partial'}
        </p>
      </div>

      <div className="mt-2 flex items-end gap-4">
        <p
          className={`font-display text-[48px] leading-none ${
            severity.level === 'critical' ? 'text-coral-700' : 'text-brown-900'
          }`}
        >
          {severity.score ?? '—'}
          <span className="ml-1 align-super font-mono text-[12px] text-brown-600">/100</span>
        </p>
        <div className="pb-1">
          <p className="text-[15px] font-semibold text-brown-900">{level}</p>
          {severity.uncapped_level && severity.uncapped_level !== severity.level ? (
            <p className="text-[12px] text-brown-600">
              Evidence would have reached {severity.uncapped_level}
            </p>
          ) : null}
        </div>
      </div>

      <div aria-hidden className="mt-3 flex gap-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className={`h-2 flex-1 ${
              index < Math.round(((severity.score ?? 0) / 100) * 5)
                ? severity.level === 'critical'
                  ? 'bg-coral-700'
                  : 'bg-coral-500'
                : 'bg-sand-300'
            }`}
          />
        ))}
      </div>

      {severity.provisional ? (
        <p className="mt-2 border-l-4 border-coral-500 pl-3 text-[13px] text-brown-900">
          <span className="font-semibold">Provisional.</span> Some data could not be
          checked, so the score is capped at medium
          {severity.missing?.length ? `: ${severity.missing.join(', ')}` : '.'}
        </p>
      ) : null}

      {severity.reason ? (
        <p className="mt-2 text-[14px] leading-6 text-brown-900">{severity.reason}</p>
      ) : null}

      {factors.length ? (
        <dl className="mt-4 grid text-[13px]">
          {factors.map(([name, factor]) => (
            <div key={name} className="flex gap-2 border-t border-sand-300 py-1.5">
              <dt className="w-[92px] shrink-0 font-medium text-brown-900">{name}</dt>
              <dd className="min-w-0 flex-1 text-brown-600">
                {factor.state === 'scored'
                  ? `${factor.points}/${factor.max}`
                  : factor.state === 'missing'
                    ? 'not checked'
                    : 'not applicable'}
                {' · '}
                {factor.note}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {severity.deadline_at ? (
        <p className="mt-3 text-[13px] text-brown-600">
          Proposed response time: {dateTimeLabel(severity.deadline_at)}.
          {severity.deadline_note ? ` ${severity.deadline_note}.` : ''}
        </p>
      ) : null}

      {retry}
    </section>
  )
}

/**
 * The one question the pipeline genuinely needs an answer to: is this the same
 * problem as an older nearby report? Routing waits on it.
 */
function DuplicatePrompt({ report, onAnswer, busy }) {
  const suggestion = report.duplicate
  if (!suggestion || suggestion.response) return null

  return (
    <section aria-labelledby="duplicate-heading" className="mt-6 border-2 border-brown-900 p-4">
      <SectionHeading id="duplicate-heading">Is this the same problem?</SectionHeading>
      <p className="mt-1 text-[14px] text-brown-600">
        A report {Math.round(suggestion.distance_m)} m away looks similar
        {suggestion.label === 'likely_duplicate' ? ' (likely the same)' : ''}. Confirming
        adds your support to that report instead of opening a second one.
      </p>

      <div className="mt-3 flex gap-3">
        {suggestion.candidate_photo_url ? (
          <img
            src={suggestion.candidate_photo_url}
            alt="The earlier report's photo"
            className="size-20 shrink-0 border border-sand-300 object-cover"
          />
        ) : null}
        <p className="min-w-0 flex-1 text-[14px] leading-6 text-brown-900">
          {suggestion.candidate_summary || 'An earlier report at a nearby location.'}
        </p>
      </div>

      {suggestion.shared_terms?.length ? (
        <p className="mt-2 text-[12px] text-brown-600">
          Shared words: {suggestion.shared_terms.join(', ')}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          disabled={busy}
          className="h-11 bg-green-700 px-4 text-[14px] font-semibold text-cream-50 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none disabled:bg-sand-300 disabled:text-brown-600"
        >
          Yes, same problem
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          disabled={busy}
          className="h-11 border border-brown-600 px-4 text-[14px] font-semibold text-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none disabled:text-brown-600"
        >
          No, something else
        </button>
      </div>
    </section>
  )
}

export function ReportPage({ id }) {
  const [report, setReport] = useState(null)
  const [nearby, setNearby] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [busy, setBusy] = useState(false)
  const [polls, setPolls] = useState(0)
  const { openAuthModal } = useAuthModal()
  const store = useSyncExternalStore(subscribe, getSnapshot)

  // Fetches and replaces the report without touching the loading state, so the
  // poll below can refresh in place. The first statement is an await, which is
  // what keeps this callable from a mount effect.
  const refresh = useCallback(async () => {
    try {
      const found = await fetchReport(id)
      if (!found) {
        setStatus('missing')
        return
      }
      setReport(found)
      setStatus('ready')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'The report could not be loaded.',
      )
      setStatus('error')
    }
  }, [id])

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setStatus('loading')
      await refresh()
    },
    [refresh],
  )

  // The component is keyed by report id, so state starts clean on every report,
  // and `status` already begins as 'loading'.
  useEffect(() => {
    // Every state write in refresh() lands after the await, so this is a fetch on
    // mount, not a synchronous setState cascade.
    // eslint-disable-next-line react/set-state-in-effect
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!report) return
    document.title = `${report.title} · Civic Pulse`
    document.getElementById('report-title')?.focus()
  }, [report])

  useEffect(() => {
    const previous = document.title
    return () => {
      document.title = previous.includes('Civic Pulse') ? 'Civic Pulse — FORGE HACKATHON' : previous
    }
  }, [])

  // A report is unfinished until it has a severity. Poll, then stop.
  const analysing =
    Boolean(report) &&
    !report.severity &&
    (report.rawStatus === 'received' || report.rawStatus === 'analysed')

  useEffect(() => {
    if (!analysing || polls >= MAX_POLLS) return undefined
    const timer = setTimeout(() => {
      setPolls((count) => count + 1)
      load({ silent: true })
    }, POLL_MS)
    return () => clearTimeout(timer)
  }, [analysing, report, polls, load])

  const nearbyId = report?.id
  const nearbyLocality = report?.locality

  useEffect(() => {
    if (!nearbyId || !nearbyLocality) return undefined
    let alive = true
    fetchNearbyReports({ id: nearbyId, locality: nearbyLocality })
      .then((items) => {
        if (alive) setNearby(items)
      })
      .catch(() => {
        if (alive) setNearby([])
      })
    return () => {
      alive = false
    }
  }, [nearbyId, nearbyLocality])

  if (status === 'loading') return <ReportSkeleton />
  if (status === 'missing' || !report) return <ReportNotFound />

  if (status === 'error') {
    return (
      <main className="mx-auto w-full max-w-[1120px] px-4 py-16 lg:px-0">
        <h1 className="font-display text-[28px] leading-tight text-brown-900 lg:text-[36px]">
          That report could not be loaded.
        </h1>
        <p className="mt-2 max-w-[65ch] text-[15px] text-brown-600">{errorMessage}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => load()}
            className="h-11 border border-brown-600 px-4 text-[14px] font-semibold text-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            Try again
          </button>
          <a
            href="#/issues"
            className="inline-flex h-11 items-center px-4 text-[14px] font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4"
          >
            {labels.backToReports}
          </a>
        </div>
      </main>
    )
  }

  const supported = Boolean(store.supported[report.id])
  const count = supportCount(report.id, report.supporters)
  const showTracker = report.officialStatus !== 'reported' || report.updates.length > 0

  const onSupport = () => {
    const nowSupported = toggleSupport(report.id, report.supporters)
    setAnnouncement(nowSupported ? 'You support this report' : 'Support removed')
  }

  const onAnswerDuplicate = async (sameProblem) => {
    setBusy(true)
    try {
      await answerDuplicate(report.id, sameProblem)
      setAnnouncement(
        sameProblem ? 'Merged into the earlier report' : 'Recorded as a separate problem',
      )
      await load({ silent: true })
    } catch (error) {
      setAnnouncement(error instanceof Error ? error.message : 'That answer could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const onReanalyse = async () => {
    setBusy(true)
    try {
      await reanalyse(report.id)
      setPolls(0)
      setAnnouncement('Analysis queued')
      await load({ silent: true })
    } catch (error) {
      setAnnouncement(error instanceof Error ? error.message : 'That request failed.')
    } finally {
      setBusy(false)
    }
  }

  const goBack = () => {
    if (feedNavigation.cameFromFeed) {
      feedNavigation.restoringFeed = true
      window.history.back()
      return
    }
    window.location.hash = '#/issues'
  }

  const mapHref = `https://www.openstreetmap.org/?mlat=${report.lat}&mlon=${report.lng}#map=18/${report.lat}/${report.lng}`

  return (
    <>
      <main className="mx-auto w-full max-w-[1120px] px-4 pb-28 lg:px-0 lg:pb-16">
        <div className="flex h-11 items-center justify-between pt-2">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-11 items-center gap-1.5 text-[14px] text-brown-900 hover:text-coral-700 hover:underline hover:decoration-coral-500 hover:decoration-2 hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            <span aria-hidden>←</span>
            {labels.backToReports}
          </button>
          <div className="lg:hidden">
            <ShareButton title={report.title} />
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
          <article aria-labelledby="report-title" className="pt-2">
            <ReportHeader report={report} />

            {report.status === 'merged' ? (
              <p className="mt-3 border-l-4 border-brown-900 pl-3 text-[14px] text-brown-900">
                Merged into an earlier report
                {report.mergedInto ? (
                  <>
                    {' '}
                    (
                    <a
                      href={`#/issues/${report.mergedInto}`}
                      className="font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4"
                    >
                      {report.mergedInto.slice(0, 8)}
                    </a>
                    )
                  </>
                ) : null}
                .
              </p>
            ) : null}

            {report.status === 'needs_better_photo' ? (
              <p className="mt-3 border-l-4 border-coral-700 pl-3 text-[14px] text-brown-900">
                The photo could not be read as a civic issue.{' '}
                <a
                  href="#/submit"
                  className="font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4"
                >
                  File a new report
                </a>{' '}
                with a clearer photo.
              </p>
            ) : null}

            {report.status === 'needs_review' ? (
              <p className="mt-3 border-l-4 border-coral-700 pl-3 text-[14px] text-brown-900">
                Analysis could not be completed. The report is kept; you can try again below.
              </p>
            ) : null}

            <div className="mt-4">
              {showTracker ? (
                <div className="lg:hidden">
                  <TrackerHorizontal
                    current={report.officialStatus}
                    dates={{
                      seen: report.statusDates?.seen,
                      scheduled: report.statusDates?.scheduled,
                      fixed: report.statusDates?.fixed,
                    }}
                  />
                </div>
              ) : (
                <p className="text-[13px] text-brown-600">
                  {labels.waitingForCity} Reported {report.ageDays} days ago.
                </p>
              )}
            </div>

            {analysing ? (
              <p aria-live="polite" className="mt-3 text-[13px] text-brown-600">
                {polls >= MAX_POLLS ? labels.analysisStalled : labels.analysisRunning}
              </p>
            ) : null}

            {report.photos?.length ? (
              <div className="mt-4">
                <PhotoGallery photos={report.photos} title={report.title} />
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-4 border-t border-sand-300 pt-4">
              {/* The API's title is derived from the description, so showing both
                  would print the same sentence twice. */}
              {report.description &&
              report.description.trim().toLowerCase() !== report.title.trim().toLowerCase() ? (
                <ReportDescription description={report.description} />
              ) : null}
              <LocationBlock
                addressBlock={report.addressBlock}
                mapHref={mapHref}
                coords={`${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`}
              />
            </div>

            <SeveritySection report={report} onReanalyse={onReanalyse} busy={busy} />

            <div className="mt-6 flex flex-col gap-4 border-t border-sand-300 pt-4">
              {report.updates?.length ? (
                <OfficialUpdates
                  updates={report.updates}
                  note="Recorded automatically from the report's own status history. Not a message from a government department."
                />
              ) : (
                <NoResponseNote ageDays={report.ageDays} />
              )}
            </div>

            <DuplicatePrompt report={report} onAnswer={onAnswerDuplicate} busy={busy} />

            <div className="mt-6 border-t border-sand-300 pt-4">
              <CommentsSection
                reportId={report.id}
                commentCount={report.commentCount}
                onRequireAuth={() => openAuthModal('login')}
              />
            </div>

            <div className="mt-6 border-t border-sand-300 pt-4">
              <NearbyReports reports={nearby} />
            </div>
          </article>

          <aside
            aria-label="Report summary"
            className="hidden lg:sticky lg:top-20 lg:block lg:self-start"
          >
            <SupportBox report={report} supported={supported} count={count} onSupport={onSupport} />
            {showTracker ? (
              <div className="mt-4">
                <TrackerVertical
                  current={report.officialStatus}
                  dates={{
                    seen: report.statusDates?.seen,
                    scheduled: report.statusDates?.scheduled,
                    fixed: report.statusDates?.fixed,
                  }}
                />
              </div>
            ) : null}
            <div className="mt-4">
              <LocationBlock addressBlock={report.addressBlock} withMap mapHref={mapHref} />
            </div>
          </aside>
        </div>
      </main>

      <SupportBar report={report} supported={supported} count={count} onSupport={onSupport} />
    </>
  )
}

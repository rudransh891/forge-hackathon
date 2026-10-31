import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { fetchReport } from '@/components/feed/feedService'
import { labels } from '@/components/feed/feedConfig'
import { reports as allReports } from '@/components/feed/feedData'
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
import { getSnapshot, subscribe, toggleSupport } from './reportStore'

function nearbyFor(report) {
  const sameLocality = allReports.filter(
    (candidate) => candidate.id !== report.id && candidate.locality === report.locality,
  )
  const pool = sameLocality.length >= 2 ? sameLocality : allReports.filter((r) => r.id !== report.id)
  return pool.slice(0, 2)
}

export function ReportPage({ id }) {
  const [report, setReport] = useState(null)
  const [status, setStatus] = useState('loading')
  const [announcement, setAnnouncement] = useState('')
  const { openAuthModal } = useAuthModal()
  const store = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    let alive = true
    setStatus('loading')
    document.title = 'Loading report · Civic Pulse'
    fetchReport(id).then((result) => {
      if (!alive) return
      setReport(result)
      setStatus(result ? 'ready' : 'missing')
    })
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (status !== 'ready' || !report) return
    document.title = `${report.title} · Civic Pulse`
    window.scrollTo(0, 0)
    document.getElementById('report-title')?.focus()
  }, [status, report])

  useEffect(() => {
    const previous = document.title
    return () => {
      document.title = previous.includes('Civic Pulse') ? 'Civic Pulse — FORGE HACKATHON' : previous
    }
  }, [])

  if (status === 'loading') return <ReportSkeleton />
  if (status === 'missing' || !report) return <ReportNotFound />

  const supported = Boolean(store.supported[report.id])
  const count = report.supporters + (supported ? 1 : 0)
  const showTracker = report.officialStatus !== 'reported' || (report.updates || []).length > 0

  const onSupport = () => {
    const nowSupported = toggleSupport(report.id)
    setAnnouncement(nowSupported ? 'You support this report' : 'Support removed')
  }

  const goBack = () => {
    if (feedNavigation.cameFromFeed) {
      feedNavigation.restoringFeed = true
      window.history.back()
      return
    }
    window.location.hash = '#/issues'
  }

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

            {report.photos?.length ? (
              <div className="mt-4">
                <PhotoGallery photos={report.photos} title={report.title} />
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-4">
              <ReportDescription description={report.description} />
              <LocationBlock addressBlock={report.addressBlock} />
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {report.updates?.length ? (
                <OfficialUpdates updates={report.updates} />
              ) : (
                <NoResponseNote ageDays={report.ageDays} />
              )}
            </div>

            <div className="mt-6">
              <CommentsSection
                reportId={report.id}
                commentCount={report.commentCount}
                onRequireAuth={() => openAuthModal('login')}
              />
            </div>

            <div className="mt-6">
              <NearbyReports reports={nearbyFor(report)} />
            </div>
          </article>

          <aside
            aria-label="Report summary"
            className="hidden lg:sticky lg:top-20 lg:block lg:self-start"
          >
            <SupportBox report={report} supported={supported} onSupport={onSupport} />
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
              <LocationBlock addressBlock={report.addressBlock} withMap />
            </div>
          </aside>
        </div>
      </main>

      <SupportBar report={report} supported={supported} onSupport={onSupport} />
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { BriefRow } from './BriefRow'
import { FeedHeader } from './FeedHeader'
import { FeedRail } from './FeedRail'
import { LeadReport } from './LeadReport'
import { NoticesTicker } from './NoticesTicker'
import { PollCard } from './PollCard'
import { ReportButton } from './ReportButton'
import { ReportCard } from './ReportCard'
import { AlertIcon } from './icons'
import { briefThreshold, labels } from './feedConfig'
import { fetchNotices, fetchPoll } from './feedService'
import { useFeed } from './useFeed'
import { feedNavigation } from '@/components/report/feedNavigation'

export function FeedPage() {
  const feed = useFeed()
  const { openAuthModal } = useAuthModal()
  const [notices, setNotices] = useState([])
  const [poll, setPoll] = useState(null)
  const sentinel = useRef(null)
  const listTop = useRef(null)
  const firstRender = useRef(true)

  useEffect(() => {
    let alive = true
    fetchNotices().then((result) => {
      if (alive) setNotices(result.items)
    })
    fetchPoll().then((result) => {
      if (alive) setPoll(result)
    })
    return () => {
      alive = false
    }
  }, [])

  // Filter/sort changes scroll the list (not the page) back to its top.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    listTop.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  }, [feed.category, feed.sort])

  // Returning from a report: put the feed back where it was.
  useEffect(() => {
    if (!feedNavigation.cameFromFeed) return
    feedNavigation.cameFromFeed = false
    const y = feedNavigation.scrollY
    requestAnimationFrame(() => window.scrollTo(0, y))
  }, [])

  // Paging: IntersectionObserver only, never a scroll listener.
  useEffect(() => {
    const node = sentinel.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) feed.loadMore()
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [feed.loadMore])

  const lead = feed.items[0]
  const rest = feed.items.slice(1)
  const briefs = rest.filter((report) => !report.photo && report.supporters < briefThreshold)
  const standards = rest.filter((report) => report.photo || report.supporters >= briefThreshold)

  const openReport = () => openAuthModal('signup')

  return (
    <>
      <FeedHeader
        category={feed.category}
        sort={feed.sort}
        onCategoryChange={feed.changeCategory}
        onSortChange={feed.changeSort}
      />
      <NoticesTicker notices={notices} />

      <main className="mx-auto w-full max-w-[1120px] px-4 pb-24 lg:px-0 lg:pb-16">
        <h1 className="sr-only">Reports in Ward 7</h1>
        <p aria-live="polite" className="sr-only">
          {feed.announcement}
        </p>

        <div ref={listTop} className="scroll-mt-[190px]" />

        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6">
          <div>
            {lead ? (
              <div className="pt-4">
                <LeadReport
                  report={lead}
                  supported={Boolean(feed.supported[lead.id])}
                  onSupport={() => feed.toggleSupport(lead.id)}
                />
              </div>
            ) : null}

            <div className="lg:grid lg:grid-cols-2">
              {standards.map((report, index) => (
                <div
                  key={report.id}
                  className={`border-b border-sand-300 lg:[&:nth-child(2n)]:border-l lg:[&:nth-child(2n)]:border-sand-300 lg:[&:nth-child(2n)]:pl-6 lg:[&:nth-child(2n+1)]:pr-6`}
                >
                  <ReportCard
                    report={report}
                    supported={Boolean(feed.supported[report.id])}
                    onSupport={() => feed.toggleSupport(report.id)}
                  />
                  {index === 2 && poll ? (
                    <div className="pb-4 lg:hidden">
                      <PollCard poll={poll} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {briefs.length > 0 ? (
              <section aria-labelledby="briefs-heading" className="mt-6">
                <h2
                  id="briefs-heading"
                  className="border-b border-sand-300 pb-2 text-[13px] font-semibold text-brown-600"
                >
                  Briefs
                </h2>
                <ul className="list-none p-0">
                  {briefs.map((report) => (
                    <BriefRow
                      key={report.id}
                      report={report}
                      supported={Boolean(feed.supported[report.id])}
                      onSupport={() => feed.toggleSupport(report.id)}
                    />
                  ))}
                </ul>
              </section>
            ) : null}

            {feed.status === 'loading' ? (
              <div aria-hidden className="mt-6 flex flex-col gap-3">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="h-16 w-full bg-sand-100" />
                ))}
              </div>
            ) : null}

            {feed.status === 'error' ? (
              <div
                role="alert"
                className="mt-6 flex flex-wrap items-center gap-3 bg-coral-100 px-3 py-3 text-[14px] text-coral-700"
              >
                <AlertIcon size={16} />
                <span>{labels.errorState}</span>
                <button
                  type="button"
                  onClick={feed.retry}
                  className="h-11 border border-coral-700 px-4 text-[13px] font-semibold focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {feed.status !== 'loading' && feed.items.length === 0 ? (
              <div className="mt-6 text-[15px] text-brown-600">
                <p>{labels.emptyState}</p>
                <button
                  type="button"
                  onClick={openReport}
                  className="mt-2 text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
                >
                  {labels.reportIssue}
                </button>
              </div>
            ) : null}

            <div ref={sentinel} aria-hidden className="h-px w-full" />

            {feed.status === 'idle' && feed.hasMore ? (
              <button
                type="button"
                onClick={feed.loadMore}
                className="mt-6 h-12 w-full border border-brown-600 text-[15px] font-semibold text-brown-900 transition-colors duration-[var(--motion-base)] hover:bg-sand-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
              >
                {labels.loadMore}
              </button>
            ) : null}

            {feed.status === 'idle' && !feed.hasMore && feed.items.length > 0 ? (
              <p className="mt-6 text-[15px] text-brown-600">{labels.endState}</p>
            ) : null}
          </div>

          <FeedRail poll={poll} onReport={openReport} className="hidden lg:block" />
        </div>
      </main>

      <ReportButton onOpen={openReport} floating />
    </>
  )
}

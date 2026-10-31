import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, CircleDot, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container, SectionMarker } from '@/components/site/layout'
import { BusArt, ParkArt, RoadArt } from '@/components/site/illustrations'
import { fetchTopReports } from '@/lib/api'
import type { Report } from '@/lib/api'

type Status = 'urgent' | 'open' | 'closing'

const STATUS: Record<Status, { label: string; className: string; Icon: typeof Clock }> = {
  urgent: {
    label: 'Urgent',
    className: 'bg-coral-700 text-cream-50',
    Icon: AlertTriangle,
  },
  open: { label: 'Open', className: 'bg-teal-100 text-brown-900', Icon: CircleDot },
  closing: { label: 'Closing soon', className: 'bg-amber-500 text-brown-900', Icon: Clock },
}

/** The three illustrations only cover three shapes, so the rest reuse the road art. */
function artFor(category: string) {
  if (category === 'Parks') return ParkArt
  if (category === 'Transit') return BusArt
  return RoadArt
}

/** Urgent comes from the score; "closing" means the proposed response time is near. */
function statusFor(report: Report): Status {
  if (report.urgent) return 'urgent'
  if (report.deadlineAt) {
    const deadline = Date.parse(report.deadlineAt)
    if (!Number.isNaN(deadline) && deadline - Date.now() < 48 * 60 * 60 * 1000) return 'closing'
  }
  return 'open'
}

function StatusBadge({ status }: { status: Status }) {
  const { label, className, Icon } = STATUS[status]
  return (
    <span
      className={`label-caps inline-flex items-center gap-1.5 px-2.5 py-1 ${className}`}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  )
}

export function TrendingIssues() {
  const [issues, setIssues] = useState<Report[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    fetchTopReports(3)
      .then((items) => {
        if (alive) setIssues(items)
      })
      .catch(() => {
        if (alive) setIssues([])
      })
      .finally(() => {
        if (alive) setLoaded(true)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <section
      id="issues"
      aria-labelledby="issues-title"
      className="scroll-mt-16 border-b border-sand-300 bg-brown-900 py-14 md:py-20"
    >
      <Container>
        <SectionMarker
          index="02"
          className="text-sand-300"
          numberClassName="text-coral-300"
          dividerClassName="bg-sand-300"
        >
          Most severe right now
        </SectionMarker>
        <h2
          id="issues-title"
          className="mt-4 max-w-[20ch] text-[32px] leading-[1.1] text-cream-100 md:text-[44px] md:leading-[50px]"
        >
          What needs <span className="text-coral-300">attention</span>
        </h2>
        <p className="mt-3 max-w-[58ch] text-on-panel-muted">
          The highest scored reports in Prayagraj, from a weighted score over the photo,
          the road, nearby schools and hospitals, and the weather.
        </p>

        {issues.length > 0 ? (
          <ul className="mt-10 grid list-none gap-6 p-0 md:grid-cols-3">
            {issues.map((issue) => {
              const status = statusFor(issue)
              const Art = artFor(issue.category)
              return (
                <li key={issue.id}>
                  <article
                    className={`flex h-full flex-col overflow-hidden bg-cream-50 ${
                      status === 'urgent' ? 'border-l-4 border-l-coral-700' : ''
                    }`}
                  >
                    <div className="aspect-[4/3] w-full bg-sand-100">
                      <Art className="h-full w-full" />
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <StatusBadge status={status} />
                        <span className="text-xs text-brown-600">
                          {issue.category} · {issue.locality}
                        </span>
                      </div>

                      <h3 className="font-sans text-lg leading-[26px] font-semibold text-brown-900">
                        {issue.title}
                      </h3>

                      <p className="text-sm leading-6 text-brown-600">
                        Reported {issue.ageDays === 0 ? 'today' : `${issue.ageDays} days ago`}.
                        {' '}
                        {issue.supporters} {issue.supporters === 1 ? 'supporter' : 'supporters'}.
                      </p>

                      <a
                        href={`#/issues/${issue.id}`}
                        className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4"
                      >
                        View report
                        <ArrowRight aria-hidden className="size-4 text-coral-500" />
                      </a>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-10 max-w-[58ch] text-on-panel-muted">
            {loaded
              ? 'No reports have been filed yet. The first one sets the board.'
              : 'Loading the most severe reports…'}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.location.hash = '#/issues'
          }}
          className="mt-10 h-12 border border-coral-300 bg-transparent px-5 text-[15px] font-semibold text-coral-300 hover:bg-coral-300 hover:text-brown-900"
        >
          Browse all reports
          <ArrowRight aria-hidden className="size-4" />
        </Button>
      </Container>
    </section>
  )
}

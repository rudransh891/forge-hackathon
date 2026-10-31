import { AlertTriangle, ArrowRight, CircleDot, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container, SectionMarker } from '@/components/site/layout'
import { BusArt, ParkArt, RoadArt } from '@/components/site/illustrations'

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

const ISSUES = [
  {
    title: 'Potholes reopened after the Elm Street resurfacing',
    category: 'Roads',
    locality: 'Elm Park',
    status: 'urgent' as Status,
    summary:
      'Six craters along a two-block stretch, two of them deep enough to damage a wheel. Reported eleven days ago.',
    Art: RoadArt,
  },
  {
    title: 'Lighting for the Maple Grove playground',
    category: 'Parks',
    locality: 'Maple Grove',
    status: 'open' as Status,
    summary:
      'The east half of the playground goes dark before 6 PM. A resident proposal for four lamp posts is open for support.',
    Art: ParkArt,
  },
  {
    title: 'Route 12 cut leaves the east side without a bus',
    category: 'Transit',
    locality: 'East Side',
    status: 'closing' as Status,
    summary:
      'The transit board votes on Friday. Comments close the night before, so this is the last week to weigh in.',
    Art: BusArt,
  },
]

function StatusBadge({ status }: { status: Status }) {
  const { label, className, Icon } = STATUS[status]
  return (
    <span
      className={`label-caps inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 ${className}`}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  )
}

export function TrendingIssues() {
  return (
    <section id="issues" aria-labelledby="issues-title" className="scroll-mt-16 border-b border-hairline py-14 md:py-20">
      <Container>
        <SectionMarker index="02">Trending issues</SectionMarker>
        <h2
          id="issues-title"
          className="mt-4 max-w-[20ch] text-[32px] leading-[1.1] text-ink md:text-[44px] md:leading-[50px]"
        >
          What your neighbors are talking about
        </h2>
        <p className="mt-3 max-w-[58ch] text-ink-muted">
          The issues drawing the most signal this week in Ward 7. Every one of them is
          open for comment.
        </p>

        <ul className="mt-10 grid list-none gap-6 p-0 md:grid-cols-3">
          {ISSUES.map((issue) => (
            <li key={issue.title}>
              <article
                className={`flex h-full flex-col overflow-hidden rounded-xl border border-hairline bg-surface ${
                  issue.status === 'urgent' ? 'border-l-4 border-l-coral-700' : ''
                }`}
              >
                <div className="aspect-[4/3] w-full border-b border-hairline">
                  <issue.Art className="h-full w-full" />
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={issue.status} />
                    <span className="text-xs text-ink-muted">
                      {issue.category} · {issue.locality}
                    </span>
                  </div>

                  <h3 className="font-sans text-lg leading-[26px] font-semibold text-ink">
                    {issue.title}
                  </h3>

                  <p className="text-sm leading-6 text-ink-muted">{issue.summary}</p>

                  <a
                    href="#issues"
                    className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-green-700 underline underline-offset-4 hover:text-brown-900"
                  >
                    View discussion
                    <ArrowRight aria-hidden className="size-4" />
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <Button
          variant="outline"
          className="mt-10 h-12 rounded-md border-green-700 bg-transparent px-5 text-[15px] font-semibold text-green-700 hover:bg-green-100/60 hover:text-brown-900"
        >
          Browse all issues
          <ArrowRight aria-hidden className="size-4" />
        </Button>
      </Container>
    </section>
  )
}

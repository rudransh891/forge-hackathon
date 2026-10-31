import { Container, SectionMarker } from '@/components/site/layout'

const STEPS = [
  {
    index: '1',
    title: 'Explore',
    body: 'Open the map, pick a neighborhood, and read every issue that is already on file.',
  },
  {
    index: '2',
    title: 'Weigh in',
    body: 'Follow an issue, add your own report, or vote on the poll in front of you.',
  },
  {
    index: '3',
    title: 'See impact',
    body: 'Watch the status change as officials respond, and get a signal when it resolves.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="scroll-mt-16 border-b border-hairline bg-cream-50/70 py-14 md:py-20"
    >
      <Container>
        <SectionMarker index="03">How it works</SectionMarker>
        <h2
          id="how-title"
          className="mt-4 max-w-[22ch] text-[32px] leading-[1.1] text-ink md:text-[44px] md:leading-[50px]"
        >
          Three steps to being heard
        </h2>

        <ol className="mt-10 grid list-none gap-4 p-0 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.index}
              className="rounded-xl border border-hairline bg-surface p-6"
            >
              <span
                aria-hidden
                className="grid size-11 place-items-center rounded-sm border border-hairline font-mono text-sm text-ink-muted"
              >
                {step.index}
              </span>
              <h3 className="mt-5 font-sans text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

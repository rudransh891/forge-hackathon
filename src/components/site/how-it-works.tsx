import { Container, SectionMarker } from '@/components/site/layout'

const STEPS = [
  {
    index: '1',
    title: 'Explore',
    body: 'Open the feed, filter by category, and read every report already on file in the city.',
  },
  {
    index: '2',
    title: 'Weigh in',
    body: 'Support a report that matters to you, or file your own with a photo and your location.',
  },
  {
    index: '3',
    title: 'See impact',
    body: 'Follow the status, the score and the proposed response time as each report moves through the pipeline.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="scroll-mt-16 border-b border-sand-300 py-14 md:py-20"
    >
      <Container>
        <SectionMarker
          index="03"
          className="text-brown-600"
          numberClassName="text-coral-700"
          dividerClassName="bg-sand-300"
        >
          How it works
        </SectionMarker>
        <h2
          id="how-title"
          className="mt-4 max-w-[22ch] text-[32px] leading-[1.1] text-brown-900 md:text-[44px] md:leading-[50px]"
        >
          Three steps to <span className="text-coral-500">being heard</span>
        </h2>

        <ol className="mt-10 grid list-none gap-4 p-0 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.index} className="border border-cream-300 bg-cream-50 p-6">
              <span
                aria-hidden
                className="grid size-11 place-items-center font-mono text-sm text-brown-300 font-semibold"
              >
                {step.index}
              </span>
              <h3 className="mt-5 font-sans text-lg font-semibold text-brown-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-brown-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

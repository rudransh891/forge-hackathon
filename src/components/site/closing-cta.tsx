import { Button } from '@/components/ui/button'
import { Container, SectionMarker } from '@/components/site/layout'

export function ClosingCta() {
  return (
    <section
      id="about"
      aria-labelledby="cta-title"
      className="scroll-mt-16 bg-panel py-16 text-on-panel md:py-24"
    >
      <Container className="text-center">
        <SectionMarker index="06" className="justify-center text-on-panel-muted">
          Closing call
        </SectionMarker>

        <h2
          id="cta-title"
          className="mx-auto mt-5 max-w-[16ch] text-[34px] leading-[1.05] font-light text-on-panel md:text-[60px] md:leading-[64px]"
        >
          Join your community’s conversation
        </h2>

        <p className="mx-auto mt-5 max-w-[58ch] text-on-panel-muted">
          Non-partisan, built on public records. Every issue shows where its data came
          from, and we never sell what you tell us.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button className="h-12 rounded-md px-6 text-[15px] font-semibold">
            Create free account
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-md border-on-panel/40 bg-transparent px-6 text-[15px] font-semibold text-on-panel hover:bg-cream-50/10 hover:text-on-panel"
          >
            Learn more
          </Button>
        </div>
      </Container>
    </section>
  )
}

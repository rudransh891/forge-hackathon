import { Button } from '@/components/ui/button'
import { Container, SectionMarker } from '@/components/site/layout'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { pilotCity } from '@/components/feed/feedConfig'

export function ClosingCta() {
  const { openAuthModal } = useAuthModal()

  return (
    <section
      id="about"
      aria-labelledby="cta-title"
      className="scroll-mt-16 bg-brown-900 py-16 text-cream-100 md:py-24"
    >
      <Container className="text-center">
        <SectionMarker
          index="06"
          className="justify-center text-sand-300"
          numberClassName="text-coral-300"
          dividerClassName="bg-sand-300"
        >
          Closing call
        </SectionMarker>

        <h2
          id="cta-title"
          className="mx-auto mt-5 max-w-[16ch] text-[34px] leading-[1.05] font-light text-cream-100 md:text-[60px] md:leading-[64px]"
        >
          Join {pilotCity}’s <span className="text-coral-300">conversation</span>
        </h2>

        <p className="mx-auto mt-5 max-w-[58ch] text-on-panel-muted">
          A non-partisan pilot built on OpenStreetMap, Open-Meteo and an open vision model.
          Every report shows the evidence behind its score, and nothing claims a department
          acted when it did not.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={() => openAuthModal('signup')}
            className="h-12 bg-coral-300 px-6 text-[15px] font-semibold text-brown-900 hover:bg-cream-100 hover:text-brown-900"
          >
            Create free account
          </Button>
          <Button
            variant="outline"
            className="h-12 border border-sand-300 bg-transparent px-6 text-[15px] font-semibold text-cream-100 hover:border-coral-300 hover:bg-transparent hover:text-cream-100"
          >
            Learn more
          </Button>
        </div>
      </Container>
    </section>
  )
}

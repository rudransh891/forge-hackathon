import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ArrowRight, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container, SectionMarker } from '@/components/site/layout'
import { RadioIllustration } from '@/components/site/illustrations'
import { useI18n } from '@/lib/i18n'

export function Hero() {
  const { t } = useI18n()
  const scope = useRef<HTMLDivElement>(null)
  const [area, setArea] = useState('')
  const [checked, setChecked] = useState<string | null>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.from('[data-reveal]', {
        y: 12,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.06,
      })
    },
    { scope },
  )

  return (
    <section aria-labelledby="hero-title" className="border-b border-sand-300">
      <Container className="grid gap-12 py-14 md:grid-cols-[1.28fr_0.72fr] md:items-center md:gap-12 md:py-20">
        <div ref={scope}>
          <SectionMarker
            index="01"
            className="text-brown-600"
            numberClassName="text-coral-700"
            dividerClassName="bg-sand-300"
          >
            <span className="inline-flex items-center gap-1.5">
              <Radio aria-hidden className="size-3.5 text-coral-500" />
              {t('hero.badge')}
            </span>
          </SectionMarker>

          <h1
            id="hero-title"
            data-reveal
            className="mt-5 font-headline text-[40px] leading-[1.04] font-semibold tracking-[-0.01em] text-brown-900 md:text-[64px] md:leading-[68px]"
          >
            {t('hero.lead')}
            <br />
            {t('hero.lead2')}{' '}
            <em className="italic font-headline font-[350] text-coral-500">{t('hero.accent')}</em>
          </h1>

          <p data-reveal className="mt-6 max-w-[52ch] text-lg leading-relaxed text-brown-600">
            {t('hero.body')}
          </p>

          <form
            data-reveal
            className="mt-8 max-w-lg"
            onSubmit={(event) => {
              event.preventDefault()
              setChecked(area.trim())
              window.location.hash = '#/issues'
            }}
          >
            <label htmlFor="area" className="text-sm font-semibold text-brown-900">
              {t('hero.label')}
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="area"
                name="area"
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder={t('hero.placeholder')}
                autoComplete="address-level2"
                className="h-12 min-w-0 flex-1 border border-brown-600 bg-cream-50 px-3 text-base text-brown-900 placeholder:text-brown-600 focus-visible:border-2 focus-visible:border-green-700"
              />
              <Button
                type="submit"
                className="h-12 bg-green-700 px-5 text-[15px] font-semibold text-cream-50"
              >
                {t('hero.button')}
              </Button>
            </div>
            <p aria-live="polite" className="mt-3 text-sm text-brown-600">
              {checked
                ? t('hero.hintChecked')
                : t('hero.hintIdle')}
            </p>
          </form>

          <a
            data-reveal
            href="#how-it-works"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700"
          >
            {t('hero.learn')}
            <ArrowRight aria-hidden className="size-4" />
          </a>
        </div>

        <div data-reveal className="flex flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center gap-6 bg-brown-900 p-6 md:p-8">
            <RadioIllustration />
            <p className="label-caps flex items-center gap-2 text-sand-300">
              <span aria-hidden className="size-1.5 bg-coral-300" />
              {t('hero.panel')}
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}

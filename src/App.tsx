import { SiteHeader } from '@/components/site/site-header'
import { Hero } from '@/components/site/hero'
import { PulseStrip } from '@/components/site/pulse-strip'
import { TrendingIssues } from '@/components/site/trending-issues'
import { HowItWorks } from '@/components/site/how-it-works'
import { FeaturedPoll } from '@/components/site/featured-poll'
import { ClosingCta } from '@/components/site/closing-cta'
import { SiteFooter } from '@/components/site/site-footer'

function App() {
  return (
    <>
      {/* The thin coral page frame from the reference, at 4px per the guidelines. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 border-4 border-coral-500"
      />

      <SiteHeader />

      <main id="top">
        <Hero />
        <PulseStrip />
        <TrendingIssues />
        <HowItWorks />
        <FeaturedPoll />
        <ClosingCta />
      </main>

      <SiteFooter />
    </>
  )
}

export default App

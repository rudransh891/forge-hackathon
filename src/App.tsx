import { SiteHeader } from '@/components/site/site-header'
import { Hero } from '@/components/site/hero'
import { PulseStrip } from '@/components/site/pulse-strip'
import { TrendingIssues } from '@/components/site/trending-issues'
import { HowItWorks } from '@/components/site/how-it-works'
import { FeaturedPoll } from '@/components/site/featured-poll'
import { Faq } from '@/components/site/faq'
import { ClosingCta } from '@/components/site/closing-cta'
import { SiteFooter } from '@/components/site/site-footer'
import { AuthModal } from '@/components/auth/AuthModal'
import { AuthModalProvider } from '@/components/auth/AuthModalProvider'

function App() {
  return (
    <AuthModalProvider>
      {/* Newsprint texture, below every other element. Sections that sit on the
          cream page are transparent so this shows through; brown panels stay opaque. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[url('/newspaper.jpg')] bg-cover bg-center bg-no-repeat opacity-[0.07] blur-[2.4px]"
      />

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
        <Faq />
        <ClosingCta />
      </main>

      <SiteFooter />

      <AuthModal />
    </AuthModalProvider>
  )
}

export default App

import { useEffect, useState } from 'react'
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
import { AuthProvider } from '@/components/auth/AuthProvider'
import { FeedPage } from '@/components/feed/FeedPage'
import { ReportPage } from '@/components/report/ReportPage'
import { ReportFormPage } from '@/components/report-form/ReportFormPage'
import { feedNavigation } from '@/components/report/feedNavigation'

/**
 * No router in this project: the feed is mounted from the URL hash so the
 * landing page stays a single static page and nothing new is installed.
 * "#/issues" -> feed, "#/issues/{id}" -> report, "#/submit" -> report form,
 * anything else -> landing.
 */
function App() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash)
      // The report page scrolls itself to the top once it has content; leaving
      // the feed's scroll intact until then is what lets it be remembered.
      if (!feedNavigation.restoringFeed && !feedNavigation.cameFromFeed) {
        window.scrollTo(0, 0)
      }
      feedNavigation.restoringFeed = false
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const reportMatch = hash.match(/^#\/issues\/([^/]+)$/)
  const reportId = reportMatch ? reportMatch[1] : null
  const showFeed = hash === '#/issues'
  const showSubmit = hash === '#/submit' || hash === '#/report/new'

  return (
    <AuthProvider>
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

      {reportId ? (
        <ReportPage key={reportId} id={reportId} />
      ) : showFeed ? (
        <FeedPage />
      ) : showSubmit ? (
        <ReportFormPage />
      ) : (
        <main id="top">
          <Hero />
          <PulseStrip />
          <TrendingIssues />
          <HowItWorks />
          <FeaturedPoll />
          <Faq />
          <ClosingCta />
        </main>
      )}

      <SiteFooter />

      <AuthModal />
      </AuthModalProvider>
    </AuthProvider>
  )
}

export default App

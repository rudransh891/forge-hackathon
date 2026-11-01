import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/site/layout'
import { useAuth } from '@/components/auth/AuthProvider'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { LANGUAGES, useI18n } from '@/lib/i18n'

const LINKS = [
  { href: '#how-it-works', key: 'nav.howItWorks' },
  { href: '#/issues', key: 'nav.issues' },
  { href: '#/submit', key: 'nav.report' },
  { href: '#/department', key: 'nav.department' },
  { href: '#polls', key: 'nav.polls' },
  { href: '#faq', key: 'nav.faq' },
  { href: '#about', key: 'nav.about' },
]

export function SiteHeader() {
  const { openAuthModal } = useAuthModal()
  const { account, signOut } = useAuth()
  const { lang, setLang, t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-sand-300 bg-cream-100/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-3">
        <a href="#top" className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate font-display text-[20px] leading-none tracking-tight text-brown-900 md:text-[22px]">
            FixItBharat
          </span>
          <span aria-hidden className="size-1.5 shrink-0 bg-coral-500" />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brown-900 transition-colors duration-[var(--motion-fast)] hover:text-coral-700 hover:underline hover:decoration-coral-500 hover:decoration-2 hover:underline-offset-4"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div role="group" aria-label={t('lang.switch')} className="flex border border-brown-600">
            {LANGUAGES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setLang(option.id)}
                aria-pressed={lang === option.id}
                lang={option.id}
                className={`h-11 px-2 text-[13px] font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${
                  lang === option.id
                    ? 'bg-brown-900 text-cream-50'
                    : 'bg-transparent text-brown-900 hover:bg-sand-100'
                }`}
              >
                {option.short}
              </button>
            ))}
          </div>

          {account ? (
            <div className="flex items-center gap-2">
              {account.verified ? null : (
                <button
                  type="button"
                  onClick={() => openAuthModal('verify')}
                  className="hidden h-11 items-center px-2 text-sm font-semibold text-coral-700 underline decoration-coral-500 decoration-2 underline-offset-4 md:inline-flex"
                >
                  {t('auth.verify')}
                </button>
              )}
              <span
                className="hidden max-w-[16ch] truncate text-sm text-brown-900 md:inline"
                title={account.email ?? undefined}
              >
                {account.name}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => signOut()}
                className="h-11 border border-brown-600 bg-transparent px-3 text-[13px] font-semibold text-brown-900 md:text-sm"
              >
                {t('auth.logout')}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => openAuthModal('login')}
              className="h-11 bg-green-700 px-3 text-[13px] font-semibold text-cream-50 md:px-4 md:text-sm"
            >
              <span className="md:hidden">{t('auth.loginShort')}</span>
              <span className="hidden md:inline">{t('auth.login')}</span>
            </Button>
          )}

          {/* Below md the links would not fit in the bar, so they live behind this
              toggle instead of disappearing. */}
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="h-11 border border-brown-600 px-3 text-[13px] font-semibold text-brown-900 md:hidden"
          >
            {menuOpen ? t('nav.close') : t('nav.menu')}
          </button>
        </div>
      </Container>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-t border-sand-300 bg-cream-100 md:hidden"
        >
          <Container className="flex flex-col py-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-sand-300 py-3 text-[15px] font-medium text-brown-900 last:border-b-0"
              >
                {t(link.key)}
              </a>
            ))}
          </Container>
        </nav>
      ) : null}
    </header>
  )
}

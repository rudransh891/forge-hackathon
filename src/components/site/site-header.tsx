import { Button } from '@/components/ui/button'
import { Container } from '@/components/site/layout'
import { useAuthModal } from '@/components/auth/AuthModalProvider'

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#/issues', label: 'Issues' },
  { href: '#/submit', label: 'Report' },
  { href: '#polls', label: 'Polls' },
  { href: '#faq', label: 'FAQ' },
  { href: '#about', label: 'About' },
]

export function SiteHeader() {
  const { openAuthModal } = useAuthModal()

  return (
    <header className="sticky top-0 z-40 border-b border-sand-300 bg-cream-100/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <a href="#top" className="flex items-baseline gap-1.5">
          <span className="font-display text-[22px] leading-none tracking-tight text-brown-900">
            Civic Pulse
          </span>
          <span aria-hidden className="size-1.5 bg-coral-500" />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brown-900 transition-colors duration-[var(--motion-fast)] hover:text-coral-700 hover:underline hover:decoration-coral-500 hover:decoration-2 hover:underline-offset-4"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Button
          type="button"
          onClick={() => openAuthModal('login')}
          className="h-11 bg-green-700 px-4 text-sm font-semibold text-cream-50"
        >
          Login / Sign up
        </Button>
      </Container>
    </header>
  )
}

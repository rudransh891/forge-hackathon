import { Button } from '@/components/ui/button'
import { Container } from '@/components/site/layout'

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#issues', label: 'Issues' },
  { href: '#polls', label: 'Polls' },
  { href: '#about', label: 'About' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-page/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-6">
        <a href="#top" className="flex items-baseline gap-1.5">
          <span className="font-display text-[22px] leading-none tracking-tight text-ink">
            Civic Pulse
          </span>
          <span aria-hidden className="size-1.5 rounded-full bg-coral-500" />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink transition-colors duration-[var(--motion-fast)] hover:text-green-700"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Button className="h-11 rounded-md px-4 text-sm font-semibold">
          Login / Sign up
        </Button>
      </Container>
    </header>
  )
}

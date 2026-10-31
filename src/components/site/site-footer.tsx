import { Container } from '@/components/site/layout'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#about', label: 'Privacy' },
  { href: '#about', label: 'Data sources' },
  { href: '#about', label: 'Contact' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-cream-50/15 bg-panel pb-10 text-on-panel-muted">
      <Container className="flex flex-col gap-6 pt-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[22px] leading-none text-on-panel">Civic Pulse</span>
          <span aria-hidden className="size-1.5 rounded-full bg-coral-500" />
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="underline-offset-4 hover:text-on-panel hover:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="font-mono text-xs">© 2026 Civic Pulse</p>
      </Container>
    </footer>
  )
}

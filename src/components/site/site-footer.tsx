import { Container } from '@/components/site/layout'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#about', label: 'Privacy' },
  { href: '#about', label: 'Data sources' },
  { href: '#about', label: 'Contact' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-brown-700 bg-brown-950 pb-10">
      <Container className="flex flex-col gap-6 pt-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[22px] leading-none text-cream-100">
            Civic Pulse
          </span>
          <span aria-hidden className="size-1.5 rounded-full bg-coral-300" />
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-on-panel-muted decoration-coral-300 decoration-2 underline-offset-4 hover:text-cream-100 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="font-mono text-xs text-on-panel-muted">© 2026 Civic Pulse</p>
      </Container>
    </footer>
  )
}

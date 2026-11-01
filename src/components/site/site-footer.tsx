import { Container } from '@/components/site/layout'
import { useI18n } from '@/lib/i18n'

const LINKS = [
  { href: '#about', key: 'footer.about' },
  { href: '#about', key: 'footer.privacy' },
  { href: '#about', key: 'footer.sources' },
  { href: '#about', key: 'footer.contact' },
]

export function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-brown-700 bg-brown-950 pb-10">
      <Container className="flex flex-col gap-6 pt-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[22px] leading-none text-cream-100">
            FixItBharat
          </span>
          <span aria-hidden className="size-1.5 bg-coral-300" />
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-on-panel-muted decoration-coral-300 decoration-2 underline-offset-4 hover:text-cream-100 hover:underline"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <p className="font-mono text-xs text-on-panel-muted">© 2026 FixItBharat</p>
      </Container>
    </footer>
  )
}

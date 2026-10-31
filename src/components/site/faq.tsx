import { Plus } from 'lucide-react'
import { Container, SectionMarker } from '@/components/site/layout'

const FAQS = [
  {
    q: 'Who can post an issue?',
    a: 'Anyone who lives or works in the ward. Reading is open to everyone; posting needs an account so the ward office knows who to reply to.',
  },
  {
    q: 'Is Civic Pulse run by the city?',
    a: 'No. It is independent and non-partisan. Every issue links to the public record it came from, so you can check the source yourself.',
  },
  {
    q: 'What happens after I submit a report?',
    a: 'It goes to the ward office and appears on the public board. You get a note when the status changes, and the issue stays readable after it closes.',
  },
  {
    q: 'Do you sell my data?',
    a: 'No. Your email is used for status updates and nothing else, and you can delete your account and its reports at any time.',
  },
]

export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-16 border-b border-hairline py-14 md:py-20"
    >
      <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div>
          <SectionMarker index="05">FAQ</SectionMarker>
          <h2
            id="faq-title"
            className="mt-4 max-w-[18ch] text-[32px] leading-[1.1] text-ink md:text-[40px] md:leading-[46px]"
          >
            Questions people ask before they post
          </h2>
        </div>

        <div className="border-t border-hairline">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group border-b border-hairline py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex list-none cursor-pointer items-center justify-between gap-6 font-sans text-lg font-semibold text-ink">
                {item.q}
                <Plus
                  aria-hidden
                  className="size-5 shrink-0 text-ink-muted transition-transform duration-[var(--motion-fast)] group-open:rotate-45"
                />
              </summary>
              <p className="mt-3 max-w-[58ch] text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}

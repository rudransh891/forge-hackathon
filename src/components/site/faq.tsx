import { Minus, Plus } from 'lucide-react'
import { Container, SectionMarker } from '@/components/site/layout'
import { useI18n } from '@/lib/i18n'

const FAQS = [
  {
    q: 'Who can post an issue?',
    a: 'Anyone. Reading is open to everyone, and a report needs only a photo and your location. Accounts are not available yet, so there is nothing to sign up for.',
  },
  {
    q: 'Is FixItBharat run by the city?',
    a: 'No. It is an independent pilot for Prayagraj. Complaints are prepared from the report and emailed to the project’s own test inbox, not to a government department, and the record on each report says so.',
  },
  {
    q: 'What happens after I submit a report?',
    a: 'A vision model reads the photo and picks out the issue. The location is enriched with OpenStreetMap and Open-Meteo data, a severity score and a proposed response time are computed from five weighted factors, and nearby reports of the same type are checked for duplicates. The status history below every report records each step.',
  },
  {
    q: 'Do you sell my data?',
    a: 'No. There is no account system, so no email or phone number is collected. What is stored is the photo, the coordinates, the optional description, and the public context a report needs.',
  },
]

export function Faq() {
  const { t } = useI18n()
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-16 border-b border-sand-300 py-14 md:py-20"
    >
      <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div>
          <SectionMarker
            index="05"
            className="text-brown-600"
            numberClassName="text-coral-700"
            dividerClassName="bg-sand-300"
          >
            {t('faq.marker')}
          </SectionMarker>
          <h2
            id="faq-title"
            className="mt-4 max-w-[18ch] text-[32px] leading-[1.1] text-brown-900 md:text-[40px] md:leading-[46px]"
          >
            {t('faq.title')} <span className="text-coral-500">{t('faq.titleAccent')}</span>
          </h2>
        </div>

        <div className="border-t border-sand-300">
          {FAQS.map((_item, index) => (
            <details
              key={index}
              className="group list-none border-b border-sand-300 py-5 open:border-b-2 open:border-b-brown-900 [&_summary::-webkit-details-marker]:hidden [&_summary]:outline-none [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-offset-2 [&_summary:focus-visible]:outline-[var(--focus-ring)]"
            >
              <summary className="flex list-none cursor-pointer items-center justify-between gap-6 font-sans text-lg font-semibold text-brown-900">
                {t(`faq.q${index + 1}`)}
                <span aria-hidden className="relative size-5 shrink-0">
                  <Plus className="size-5 text-coral-500 group-open:hidden" />
                  <Minus className="hidden size-5 text-coral-700 group-open:block" />
                </span>
              </summary>
              <p className="mt-3 max-w-[58ch] text-brown-600">{t(`faq.a${index + 1}`)}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}

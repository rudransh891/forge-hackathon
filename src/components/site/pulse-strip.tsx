import { Container } from '@/components/site/layout'

const STATS = [
  { value: '12,480', label: 'residents participating' },
  { value: '63', label: 'open issues' },
  { value: '41', label: 'resolved this month' },
  { value: '4', label: 'active polls' },
]

export function PulseStrip() {
  return (
    <section aria-label="Live pulse" className="bg-cream-100 py-8 md:py-10">
      <Container>
        <div className="grid grid-cols-2 gap-y-6 border-y-2 border-brown-900 bg-teal-400 px-6 py-7 text-brown-900 md:grid-cols-4 md:gap-y-0 md:px-8">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={
                index > 0 ? 'md:border-l md:border-brown-700 md:pl-8' : undefined
              }
            >
              <p className="font-mono text-[26px] leading-none tracking-tight">
                {stat.value}
              </p>
              <p className="mt-2 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

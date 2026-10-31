import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container, SectionMarker } from '@/components/site/layout'

const OPTIONS = [
  { id: 'keep', label: 'Keep the lane as it is', votes: 812 },
  { id: 'widen', label: 'Widen it to two lanes', votes: 286 },
  { id: 'remove', label: 'Remove it and restore parking', votes: 402 },
]

export function FeaturedPoll() {
  const [selected, setSelected] = useState<string | null>(null)
  const [voted, setVoted] = useState(false)

  const total = OPTIONS.reduce((sum, option) => sum + option.votes, 0) + (voted ? 1 : 0)
  const pct = (votes: number) => Math.round((votes / total) * 100)

  return (
    <section id="polls" aria-labelledby="poll-title" className="scroll-mt-16 border-b border-hairline py-14 md:py-20">
      <Container className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <SectionMarker index="04">Featured poll</SectionMarker>
          <h2
            id="poll-title"
            className="mt-4 max-w-[24ch] text-[28px] leading-[1.15] text-ink md:text-[34px] md:leading-[40px]"
          >
            Should the city keep the Elm Street bike lane?
          </h2>

          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault()
              if (selected) setVoted(true)
            }}
          >
            <fieldset className="rounded-xl border border-hairline bg-surface p-2">
              <legend className="sr-only">Choose one option</legend>

              {OPTIONS.map((option) => {
                const isSelected = selected === option.id
                return (
                  <label
                    key={option.id}
                    className={`flex h-14 cursor-pointer items-center gap-3 rounded-sm px-4 text-base transition-colors duration-[var(--motion-base)] has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-400 ${
                      isSelected
                        ? 'bg-teal-400 text-brown-900'
                        : 'text-ink hover:bg-cream-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="poll"
                      value={option.id}
                      checked={isSelected}
                      onChange={() => setSelected(option.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                        isSelected ? 'border-brown-900' : 'border-brown-600'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="size-3.5" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span>{option.label}</span>
                  </label>
                )
              })}
            </fieldset>

            <Button
              type="submit"
              disabled={!selected || voted}
              className="mt-4 h-12 rounded-md px-5 text-[15px] font-semibold"
            >
              {voted ? 'Vote counted' : 'Submit my vote'}
            </Button>

            <p aria-live="polite" className="mt-3 text-sm text-ink-muted">
              {voted
                ? 'Thanks — your vote is counted.'
                : `${total.toLocaleString('en-US')} residents have voted. Results update live.`}
            </p>
          </form>
        </div>

        <div className="self-start rounded-xl border border-hairline bg-surface p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-sans text-sm font-semibold text-ink">Live results</h3>
            <span className="font-mono text-sm text-ink-muted">
              {total.toLocaleString('en-US')} votes
            </span>
          </div>

          <ul className="mt-6 list-none space-y-5 p-0">
            {OPTIONS.map((option) => {
              const votes = option.votes + (voted && selected === option.id ? 1 : 0)
              return (
                <li key={option.id}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-ink">{option.label}</span>
                    <span className="font-mono text-ink-muted">{pct(votes)}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-[var(--radius-pill)] bg-cream-300">
                    <div
                      className="h-full rounded-[var(--radius-pill)] bg-green-700 transition-[width] duration-[var(--motion-base)]"
                      style={{ width: `${pct(votes)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>

          <p className="mt-6 text-xs leading-5 text-ink-muted">
            Percentages are shown next to every bar, so the result never relies on colour
            alone. Polls close Friday, 7 November at 6 PM.
          </p>
        </div>
      </Container>
    </section>
  )
}

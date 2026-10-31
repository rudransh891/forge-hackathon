import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Container, SectionMarker } from '@/components/site/layout'

/**
 * The featured poll. There is no poll table behind it yet, so it counts the
 * vote in this browser only and says so. The same three options as the feed's
 * PollCard, so the two never disagree about the question.
 */
const OPTIONS = [
  { id: 'roads', label: 'Potholes and road damage', votes: 0 },
  { id: 'garbage', label: 'Garbage collection', votes: 0 },
  { id: 'lights', label: 'Streetlights not working', votes: 0 },
]

export function FeaturedPoll() {
  const [selected, setSelected] = useState<string | null>(null)
  const [voted, setVoted] = useState(false)

  const counts = OPTIONS.map(
    (option) => option.votes + (voted && selected === option.id ? 1 : 0),
  )
  const total = counts.reduce((sum, count) => sum + count, 0)
  const leader = total > 0 ? Math.max(...counts) : -1
  const pct = (votes: number) => (total > 0 ? Math.round((votes / total) * 100) : 0)

  return (
    <section
      id="polls"
      aria-labelledby="poll-title"
      className="scroll-mt-16 border-b border-sand-300 py-14 md:py-20"
    >
      <Container className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <SectionMarker
            index="04"
            className="text-brown-600"
            numberClassName="text-coral-700"
            dividerClassName="bg-sand-300"
          >
            Poll · not connected yet
          </SectionMarker>
          <h2
            id="poll-title"
            className="mt-4 max-w-[24ch] text-[28px] leading-[1.15] text-brown-900 md:text-[34px] md:leading-[40px]"
          >
            Which fix should the pilot chase{' '}
            <span className="text-coral-500">first this week</span>?
          </h2>

          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault()
              if (selected) setVoted(true)
            }}
          >
            <fieldset className="border border-sand-300 bg-cream-50">
              <legend className="sr-only">Choose one option</legend>

              {OPTIONS.map((option, index) => {
                const isSelected = selected === option.id
                return (
                  <label
                    key={option.id}
                    className={`flex h-14 cursor-pointer items-center gap-3 px-4 text-base transition-colors duration-[var(--motion-base)] has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-400 ${
                      index > 0 ? 'border-t border-sand-300' : ''
                    } ${
                      isSelected
                        ? 'bg-teal-400 text-brown-900'
                        : 'text-brown-900 hover:bg-cream-100'
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
                      className={`grid size-5 shrink-0 place-items-center border-2 ${
                        isSelected ? 'border-brown-900' : 'border-brown-600'
                      }`}
                    >
                      {isSelected ? (
                        <span className="size-2.5 bg-coral-500" />
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
              className="mt-4 h-12 bg-green-700 px-5 text-[15px] font-semibold text-cream-50 disabled:bg-sand-300 disabled:text-brown-600 disabled:opacity-100"
            >
              {voted ? 'Vote counted' : 'Submit my vote'}
            </Button>

            <p aria-live="polite" className="mt-3 text-sm text-brown-600">
              {voted
                ? 'Your vote is counted in this browser only.'
                : 'This poll has no backend behind it yet; the vote stays on this page.'}
            </p>
          </form>
        </div>

        <div className="self-start bg-brown-900 p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-sans text-sm font-semibold text-cream-100">Results</h3>
            <span className="font-mono text-sm text-on-panel-muted">
              {total.toLocaleString('en-IN')} {total === 1 ? 'vote' : 'votes'}
            </span>
          </div>

          <ul className="mt-6 list-none space-y-5 p-0">
            {OPTIONS.map((option, index) => {
              const votes = counts[index]
              const isLeader = leader >= 0 && votes === leader
              return (
                <li key={option.id}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-cream-100">{option.label}</span>
                    <span className="font-mono text-cream-100">{pct(votes)}%</span>
                  </div>
                  <div className="mt-2 h-2.5 bg-brown-700">
                    <div
                      className={`h-full ${isLeader ? 'bg-coral-300' : 'bg-sand-300'}`}
                      style={{ width: `${pct(votes)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>

          <p className="mt-6 text-xs leading-5 text-on-panel-muted">
            Percentages are shown next to every bar, so the result never relies on colour
            alone. Nothing is stored on the server, and there is no closing date until the
            poll is connected.
          </p>
        </div>
      </Container>
    </section>
  )
}

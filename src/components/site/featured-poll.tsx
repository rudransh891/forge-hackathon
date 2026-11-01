import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Container, SectionMarker } from '@/components/site/layout'
import { castVote, fetchActivePoll } from '@/lib/api'
import type { ActivePoll, PollOption } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

/** A stable per-browser key so one browser gets one vote. Not an identity. */
function voterKey(): string {
  try {
    let key = window.localStorage.getItem('fixitbharat.voter')
    if (!key) {
      key =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(16).slice(2)}`
      window.localStorage.setItem('fixitbharat.voter', key)
    }
    return key
  } catch {
    return 'anonymous'
  }
}

/**
 * The featured poll. Votes go to the database: one row per browser key, and the
 * bars are counted from those rows, so the numbers are real.
 */
export function FeaturedPoll() {
  const { t, lang } = useI18n()
  const hi = lang === 'hi'

  /** The question and options are rows, so their Hindi lives beside them. */
  const optionLabel = (option: PollOption) =>
    hi && option.label_hi ? option.label_hi : option.label
  const [poll, setPoll] = useState<ActivePoll | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [voted, setVoted] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true
    fetchActivePoll()
      .then((value) => {
        if (alive) setPoll(value)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selected || !poll || pending) return
    setPending(true)
    try {
      const updated = await castVote(poll.id, selected, voterKey())
      setPoll(updated)
      setVoted(true)
      setMessage('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That vote could not be saved.')
    } finally {
      setPending(false)
    }
  }

  const options = poll?.options ?? []
  const total = poll?.total ?? 0
  const leader = options.reduce((best, option) => Math.max(best, option.votes), 0)
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
            {t('poll.marker')}
          </SectionMarker>
          <h2
            id="poll-title"
            className="mt-4 max-w-[24ch] text-[28px] leading-[1.15] text-brown-900 md:text-[34px] md:leading-[40px]"
          >
            {poll
              ? hi && poll.question_hi
                ? poll.question_hi
                : poll.question
              : t('poll.title')}{' '}
            {poll ? null : (
              <span className="text-coral-500">{t('poll.titleAccent')}</span>
            )}
          </h2>

          <form className="mt-6" onSubmit={onSubmit}>
            <fieldset className="border border-sand-300 bg-cream-50" disabled={voted || pending}>
              <legend className="sr-only">{t('poll.chooseOne')}</legend>

              {options.map((option, index) => {
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
                      {isSelected ? <span className="size-2.5 bg-coral-500" /> : null}
                    </span>
                    <span>{optionLabel(option)}</span>
                  </label>
                )
              })}
            </fieldset>

            <Button
              type="submit"
              disabled={!selected || voted || pending}
              className="mt-4 h-12 bg-green-700 px-5 text-[15px] font-semibold text-cream-50 disabled:bg-sand-300 disabled:text-brown-600 disabled:opacity-100"
            >
              {voted ? t('poll.voted') : pending ? t('poll.saving') : t('poll.submit')}
            </Button>

            <p aria-live="polite" className="mt-3 text-sm text-brown-600">
              {message
                ? message
                : voted
                  ? t('poll.thanks')
                  : t('poll.oneVote')}
            </p>
          </form>
        </div>

        <div className="self-start bg-brown-900 p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-sans text-sm font-semibold text-cream-100">
              {t('poll.results')}
            </h3>
            <span className="font-mono text-sm text-on-panel-muted">
              {total.toLocaleString('en-IN')} {total === 1 ? t('poll.vote') : t('poll.votes')}
            </span>
          </div>

          <ul className="mt-6 list-none space-y-5 p-0">
            {options.map((option) => {
              const isLeader = leader > 0 && option.votes === leader
              return (
                <li key={option.id}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-cream-100">{optionLabel(option)}</span>
                    <span className="font-mono text-cream-100">{pct(option.votes)}%</span>
                  </div>
                  <div className="mt-2 h-2.5 bg-brown-700">
                    <div
                      className={`h-full ${isLeader ? 'bg-coral-300' : 'bg-sand-300'}`}
                      style={{ width: `${pct(option.votes)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>

          <p className="mt-6 text-xs leading-5 text-on-panel-muted">{t('poll.footnote')}</p>
        </div>
      </Container>
    </section>
  )
}

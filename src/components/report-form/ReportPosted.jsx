import { useEffect, useRef, useState } from 'react'
import { fetchReport } from '@/components/feed/feedService'
import { useI18n } from '@/lib/i18n'
import { useCopy } from './formConfig'

const POLL_MS = 3000
const MAX_POLLS = 24

/**
 * Success screen that keeps moving.
 *
 * The report is already saved when this renders; the pipeline runs behind it.
 * Rather than a static "we'll be in touch", this polls the report and ticks each
 * stage off as the row catches up: analysed, located, scored, routed.
 */
export function ReportPosted({ id, onView, onBack }) {
  const copy = useCopy()
  const { t } = useI18n()
  const [report, setReport] = useState(null)
  const [polls, setPolls] = useState(0)
  const titleRef = useRef(null)

  useEffect(() => {
    document.title = 'Report posted · FixItBharat'
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!id) return undefined
    let alive = true
    fetchReport(id)
      .then((found) => {
        if (alive && found) setReport(found)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [id])

  const routed = Boolean(report?.routing)

  useEffect(() => {
    if (!id || routed || polls >= MAX_POLLS) return undefined
    const timer = setTimeout(async () => {
      setPolls((count) => count + 1)
      try {
        const found = await fetchReport(id)
        if (found) setReport(found)
      } catch {
        /* keep the last known state */
      }
    }, POLL_MS)
    return () => clearTimeout(timer)
  }, [id, routed, polls])

  const steps = [
    { key: 'received', done: true },
    {
      key: 'analysed',
      done: Boolean(report && report.rawStatus && report.rawStatus !== 'received'),
    },
    { key: 'located', done: Boolean(report?.context) },
    { key: 'scored', done: Boolean(report?.severity) },
    { key: 'routed', done: routed },
  ]
  const firstOpen = steps.findIndex((step) => !step.done)

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-10">
      <div className="bg-brown-900 p-5">
        <p className="text-[12px] tracking-[0.04em] text-on-panel-muted">Posted</p>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="mt-2 font-display text-[28px] leading-tight text-cream-100 focus-visible:outline-none"
        >
          {t('progress.title')}
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-on-panel-muted">{copy.postedBody}</p>

        <ol className="mt-5 flex list-none flex-col gap-2 p-0 text-[13px]">
          {steps.map((step, index) => {
            const state = step.done ? 'done' : index === firstOpen ? 'now' : 'waiting'
            return (
              <li key={step.key} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`grid size-5 shrink-0 place-items-center ${
                    state === 'done'
                      ? 'bg-green-700 text-cream-50'
                      : state === 'now'
                        ? 'bg-coral-300 text-brown-900'
                        : 'bg-sand-300 text-brown-900'
                  }`}
                >
                  {state === 'done' ? '✓' : index + 1}
                </span>
                <span className={state === 'waiting' ? 'text-on-panel-muted' : 'text-cream-100'}>
                  {t(`progress.${step.key}`)}
                </span>
                <span className="sr-only">
                  {state === 'done'
                    ? t('progress.done')
                    : state === 'now'
                      ? t('progress.now')
                      : t('progress.waiting')}
                </span>
              </li>
            )
          })}
        </ol>

        <p aria-live="polite" className="mt-2 text-[12px] text-on-panel-muted">
          {t('progress.subline')}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onView}
            className="h-12 bg-coral-300 text-[15px] font-semibold text-brown-900 transition-colors duration-[var(--motion-base)] hover:bg-cream-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {t('progress.view')}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="h-12 border border-coral-300 text-[15px] font-semibold text-coral-300 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {t('progress.back')}
          </button>
        </div>
      </div>

      {id ? (
        <p className="mt-3 text-[12px] text-brown-600">Reference {String(id).slice(0, 8)}</p>
      ) : null}
    </main>
  )
}

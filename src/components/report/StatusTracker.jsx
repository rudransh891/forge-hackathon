import { trackerSteps } from '@/components/feed/feedConfig'
import { CheckIcon } from '@/components/feed/icons'
import { useI18n } from '@/lib/i18n'

const ORDER = trackerSteps.map((step) => step.id)

/**
 * A department moves a report through its own vocabulary. The tracker speaks in
 * four steps, so every status has to land on one of them or the rail resets to
 * nothing after a status change.
 */
const STATUS_TO_STEP = {
  received: 'reported',
  analysed: 'reported',
  needs_review: 'reported',
  needs_better_photo: 'reported',
  merged: 'reported',
  routed: 'routed',
  reopened: 'routed',
  acknowledged: 'scheduled',
  in_progress: 'scheduled',
  escalated: 'scheduled',
  resolved: 'fixed',
}

export function stepOf(status) {
  return STATUS_TO_STEP[status] ?? status
}

export function stepState(stepId, currentId) {
  currentId = stepOf(currentId)
  const stepIndex = ORDER.indexOf(stepId)
  const currentIndex = ORDER.indexOf(currentId)
  if (stepIndex < 0 || currentIndex < 0) return 'upcoming'
  if (stepIndex < currentIndex) return 'complete'
  if (stepIndex === currentIndex) return 'current'
  return 'upcoming'
}

const STATE_WORD = {
  complete: 'completed',
  current: 'current step',
  upcoming: 'not started',
}

function Dot({ state, isFixed }) {
  const finished = state === 'complete' || (state === 'current' && isFixed)

  if (finished) {
    return (
      <span
        className={`grid size-4 shrink-0 place-items-center ${
          isFixed && state === 'current' ? 'bg-green-700' : 'bg-brown-900'
        } text-cream-50`}
      >
        <CheckIcon size={11} />
      </span>
    )
  }
  if (state === 'current') {
    return <span className="size-4 shrink-0 bg-cream-50 ring-[3px] ring-coral-500" />
  }
  return <span className="size-4 shrink-0 bg-cream-50 ring-2 ring-sand-300" />
}

function labelClass(state) {
  if (state === 'upcoming') return 'text-brown-600'
  return state === 'current' ? 'font-semibold text-brown-900' : 'text-brown-900'
}

/** Mobile tracker: four dots on a rail with the labels underneath. */
export function TrackerHorizontal({ current, dates = {} }) {
  const { t } = useI18n()
  const currentId = stepOf(current)
  return (
    <ol aria-label={t('tracker.progress')} className="grid grid-cols-4 gap-0">
      {trackerSteps.map((step, index) => {
        const state = stepState(step.id, currentId)
        const isFixed = step.id === 'fixed'
        const segmentDone = ORDER.indexOf(step.id) < ORDER.indexOf(currentId)
        return (
          <li
            key={step.id}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex flex-col items-center"
          >
            <span className="sr-only">
              {t(`tracker.${step.id}`)}, {STATE_WORD[state]}
            </span>
            <div aria-hidden className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${index === 0 ? 'bg-transparent' : segmentDone ? 'bg-brown-900' : 'bg-sand-300'}`}
              />
              <Dot state={state} isFixed={isFixed} />
              <span
                className={`h-0.5 flex-1 ${
                  index === trackerSteps.length - 1
                    ? 'bg-transparent'
                    : segmentDone
                      ? 'bg-brown-900'
                      : 'bg-sand-300'
                }`}
              />
            </div>
            <span aria-hidden className={`mt-2 text-center text-[12px] ${labelClass(state)}`}>
              {t(`tracker.${step.id}`)}
            </span>
            {dates[step.id] ? (
              <span aria-hidden className="text-[12px] text-brown-600">
                {dates[step.id]}
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

/** Desktop tracker: dots down the left, labels and dates to the right. */
export function TrackerVertical({ current, dates = {} }) {
  const { t } = useI18n()
  const currentId = stepOf(current)
  return (
    <ol aria-label={t('tracker.progress')} className="flex flex-col">
      {trackerSteps.map((step, index) => {
        const state = stepState(step.id, currentId)
        const isFixed = step.id === 'fixed'
        const segmentDone = ORDER.indexOf(step.id) < ORDER.indexOf(currentId)
        return (
          <li
            key={step.id}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex min-h-[44px] gap-3"
          >
            <span className="sr-only">
              {step.label}, {STATE_WORD[state]}
            </span>
            <div aria-hidden className="flex flex-col items-center self-stretch">
              <Dot state={state} isFixed={isFixed} />
              {index < trackerSteps.length - 1 ? (
                <span
                  className={`mt-1 w-0.5 flex-1 ${segmentDone ? 'bg-brown-900' : 'bg-sand-300'}`}
                />
              ) : null}
            </div>
            <div className="pb-3" aria-hidden>
              <p className={`text-[13px] ${labelClass(state)}`}>{t(`tracker.${step.id}`)}</p>
              {dates[step.id] ? (
                <p className="text-[12px] text-brown-600">{dates[step.id]}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

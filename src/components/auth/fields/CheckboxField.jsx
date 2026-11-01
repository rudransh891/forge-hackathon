import { useId } from 'react'
import { AlertIcon, CheckIcon } from '../icons'
import { useI18n } from '@/lib/i18n'

export function CheckboxField({ label, checked, onChange, error, id, className = '' }) {
  const fallbackId = useId()
  const inputId = id || fallbackId
  const { t } = useI18n()
  const errorId = `${inputId}-error`

  return (
    <div className={className}>
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          <input
            id={inputId}
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`peer size-5 appearance-none border-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 ${
              error ? 'border-coral-700' : 'border-brown-600'
            } checked:border-brown-900 checked:bg-brown-900`}
          />
          <CheckIcon
            size={14}
            className="pointer-events-none absolute inset-0 m-auto hidden text-cream-50 peer-checked:block"
          />
        </span>
        <span className="text-sm leading-5 text-brown-900">{label}</span>
      </label>
      {error ? (
        <p id={errorId} className="mt-1.5 ml-8 flex items-center gap-1.5 text-sm text-coral-700">
          <AlertIcon size={16} />
          {t(error)}
        </p>
      ) : null}
    </div>
  )
}

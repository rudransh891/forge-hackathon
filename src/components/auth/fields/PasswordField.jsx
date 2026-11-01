import { useState } from 'react'
import { AlertIcon, EyeIcon, EyeOffIcon } from '../icons'
import { useI18n } from '@/lib/i18n'

const BASE =
  'h-12 w-full border bg-cream-100 py-0 pr-12 pl-3 text-[16px] text-brown-900 placeholder:text-brown-600 focus-visible:border-2 focus-visible:border-green-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-400'

export function PasswordField({
  id,
  label,
  error,
  helper,
  disabled = false,
  className = '',
  ...inputProps
}) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)
  const errorId = `${id}-error`
  const helperId = `${id}-helper`
  const describedBy =
    [error ? errorId : null, helper && !error ? helperId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-brown-900">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          className={`${BASE} ${error ? 'border-coral-700' : 'border-brown-600'}`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center text-brown-600 hover:text-brown-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-400 disabled:text-sand-300"
        >
          {visible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-sm text-coral-700">
          <AlertIcon size={16} />
          {t(error)}
        </p>
      ) : helper ? (
        <p id={helperId} className="mt-1.5 text-sm text-brown-600">
          {helper}
        </p>
      ) : null}
    </div>
  )
}

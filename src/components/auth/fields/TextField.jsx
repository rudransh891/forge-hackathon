import { AlertIcon } from '../icons'

const BASE =
  'h-12 w-full rounded-[6px] border bg-cream-100 px-3 text-[16px] text-brown-900 placeholder:text-brown-600 focus-visible:border-2 focus-visible:border-green-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-400'

export function TextField({
  id,
  label,
  error,
  helper,
  inputRef,
  className = '',
  ...inputProps
}) {
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
      <input
        id={id}
        ref={inputRef}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`mt-1.5 ${BASE} ${error ? 'border-coral-700' : 'border-brown-600'}`}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-sm text-coral-700">
          <AlertIcon size={16} />
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="mt-1.5 text-sm text-brown-600">
          {helper}
        </p>
      ) : null}
    </div>
  )
}

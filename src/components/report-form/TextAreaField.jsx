import { AlertIcon } from '@/components/feed/icons'

/** Multi-line field, same visual language as the auth fields. */
export function TextAreaField({
  id,
  label,
  optionalLabel,
  value,
  onChange,
  error,
  counter,
  nearLimit,
  maxLength,
  placeholder,
  rows = 4,
}) {
  const errorId = `${id}-error`
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-semibold text-brown-900">
          {label}
          {optionalLabel ? (
            <span className="ml-1 font-normal text-brown-600">{optionalLabel}</span>
          ) : null}
        </label>
        {counter ? (
          <span
            className={`text-[12px] ${nearLimit ? 'font-semibold text-coral-700' : 'text-brown-600'}`}
          >
            {counter}
          </span>
        ) : null}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1.5 w-full resize-y border bg-cream-50 px-3 py-3 text-[16px] text-brown-900 placeholder:text-brown-600 focus-visible:border-2 focus-visible:border-green-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${
          error ? 'border-coral-700' : 'border-brown-600'
        }`}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-[13px] text-coral-700">
          <AlertIcon size={14} />
          {error}
        </p>
      ) : null}
    </div>
  )
}

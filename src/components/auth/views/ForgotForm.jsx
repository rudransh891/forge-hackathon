import { useState } from 'react'
import { useAuthModal } from '../AuthModalProvider'
import { views } from '../authModalConfig'
import { TextField } from '../fields/TextField'
import { validateIdentifier } from '../authValidation'
import { requestReset } from '../authService'
import { AlertIcon, InfoIcon } from '../icons'

const copy = views.forgot

export function ForgotForm() {
  const { openAuthModal } = useAuthModal()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [pending, setPending] = useState(false)

  const onChange = (value) => {
    setIdentifier(value)
    if (error) setError(validateIdentifier(value))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const next = validateIdentifier(identifier)
    setError(next)
    if (next) {
      document.getElementById('forgot-identifier')?.focus()
      return
    }
    setPending(true)
    await requestReset({ identifier: identifier.trim() })
    setPending(false)
    setBanner({
      kind: 'info',
      text: 'If an account exists for that email or phone, a reset link is on its way. Authentication is not connected yet, so nothing was sent.',
    })
  }

  return (
    <div>
      <h2
        id="auth-modal-title"
        className="font-headline text-[26px] font-semibold leading-[1.15] tracking-[-0.01em] text-brown-900 md:text-[30px]"
      >
        {copy.title.lead}{' '}
        <em className="font-display font-normal text-coral-500 italic">{copy.title.accent}</em>
      </h2>
      <p id="auth-modal-desc" className="mt-1.5 text-sm text-brown-600">
        {copy.helper}
      </p>

      <div aria-live="polite">
        {banner ? (
          <p className="mt-4 flex items-start gap-2 bg-teal-100 px-3 py-2.5 text-sm text-brown-900">
            <InfoIcon size={16} />
            <span>{banner.text}</span>
          </p>
        ) : null}
      </div>

      <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <TextField
          id="forgot-identifier"
          label="Email or phone"
          type="text"
          inputMode="email"
          autoComplete="username"
          required
          placeholder="you@example.com"
          value={identifier}
          error={error}
          onChange={(event) => onChange(event.target.value)}
        />

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full bg-green-700 text-[15px] font-semibold text-cream-50 transition-colors hover:bg-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:bg-sand-300 disabled:text-brown-600"
        >
          {pending ? 'Please wait...' : 'Send reset link'}
        </button>
      </form>

      {error ? null : (
        <p className="mt-3 flex items-start gap-2 text-xs text-brown-600">
          <AlertIcon size={14} />
          For your safety we always show the same message, whether or not an account exists.
        </p>
      )}

      <div className="mt-6 border-t border-sand-300 pt-4 text-center text-sm text-brown-600">
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700"
        >
          Back to log in
        </button>
      </div>
    </div>
  )
}

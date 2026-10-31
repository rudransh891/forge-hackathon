import { useEffect, useRef, useState } from 'react'
import { useAuthModal } from '../AuthModalProvider'
import { views } from '../authModalConfig'
import { resendCode, verifyCode } from '../authService'
import { AlertIcon, InfoIcon } from '../icons'

const copy = views.verify
const LENGTH = 6

export function VerifyForm() {
  const { openAuthModal, identifier } = useAuthModal()
  const [digits, setDigits] = useState(Array(LENGTH).fill(''))
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState({
    kind: 'info',
    text: "Authentication isn't connected yet. No code was sent.",
  })
  const [pending, setPending] = useState(false)
  const [cooldown, setCooldown] = useState(30)
  const inputs = useRef([])

  useEffect(() => {
    if (cooldown === 0) return undefined
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const setDigit = (index, value) => {
    setDigits((current) => current.map((digit, position) => (position === index ? value : digit)))
    if (error) setError(null)
  }

  const fillFrom = (index, raw) => {
    const chars = raw.slice(0, LENGTH - index).split('')
    setDigits((current) =>
      current.map((digit, position) =>
        position >= index && position < index + chars.length ? chars[position - index] : digit,
      ),
    )
    const next = Math.min(index + chars.length, LENGTH - 1)
    inputs.current[next]?.focus()
  }

  const onChange = (index) => (event) => {
    const raw = event.target.value.replace(/\D/g, '')
    if (!raw) {
      setDigit(index, '')
      return
    }
    if (raw.length > 1) {
      fillFrom(index, raw)
      return
    }
    setDigit(index, raw)
    if (index < LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  const onKeyDown = (index) => (event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      inputs.current[index - 1]?.focus()
      setDigit(index - 1, '')
    }
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  const onPaste = (event) => {
    const raw = event.clipboardData.getData('text').replace(/\D/g, '')
    if (!raw) return
    event.preventDefault()
    fillFrom(0, raw)
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const code = digits.join('')
    if (code.length < LENGTH) {
      setError('Enter all six digits')
      inputs.current[digits.findIndex((digit) => !digit)]?.focus()
      return
    }
    setPending(true)
    const result = await verifyCode({ identifier, code })
    setPending(false)
    if (result.status === 'not_configured') {
      setBanner({
        kind: 'info',
        text: "Authentication isn't connected yet. Your details were not sent anywhere.",
      })
    }
  }

  const onResend = async () => {
    if (cooldown > 0) return
    await resendCode({ identifier })
    setCooldown(30)
    setBanner({ kind: 'info', text: "Authentication isn't connected yet. No code was sent." })
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
        We sent a 6-digit code to {identifier || 'your email or phone'}.
      </p>

      <div aria-live="polite">
        {banner ? (
          <p className="mt-4 flex items-start gap-2 rounded-[6px] bg-teal-100 px-3 py-2.5 text-sm text-brown-900">
            <InfoIcon size={16} />
            <span>{banner.text}</span>
          </p>
        ) : null}
      </div>

      <form className="mt-5" onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend className="text-sm font-semibold text-brown-900">Verification code</legend>
          <div className="mt-1.5 flex gap-2" onPaste={onPaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputs.current[index] = element
                }}
                data-autofocus={index === 0 ? 'true' : undefined}
                value={digit}
                onChange={onChange(index)}
                onKeyDown={onKeyDown(index)}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${index + 1}`}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? 'verify-error' : 'auth-modal-desc'}
                maxLength={1}
                className={`h-14 w-12 rounded-[6px] border bg-cream-100 text-center text-xl font-semibold text-brown-900 focus-visible:border-2 focus-visible:border-green-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${
                  error ? 'border-coral-700' : 'border-brown-600'
                }`}
              />
            ))}
          </div>
          {error ? (
            <p
              id="verify-error"
              className="mt-1.5 flex items-center gap-1.5 text-sm text-coral-700"
            >
              <AlertIcon size={16} />
              {error}
            </p>
          ) : null}
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="mt-5 h-12 w-full rounded-[6px] bg-green-700 text-[15px] font-semibold text-cream-50 transition-colors hover:bg-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:bg-sand-300 disabled:text-brown-600"
        >
          {pending ? 'Please wait...' : 'Verify and continue'}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0}
          className="text-sm font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700 disabled:text-brown-600 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
        <button
          type="button"
          onClick={() => openAuthModal('signup')}
          className="text-sm font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700"
        >
          Use a different email or phone
        </button>
      </div>
    </div>
  )
}

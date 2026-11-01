import { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider'
import { useAuthModal } from '../AuthModalProvider'
import { views } from '../authModalConfig'
import { checkVerified, resendVerification } from '../authService'
import { AlertIcon, CheckIcon, InfoIcon } from '../icons'

const copy = views.verify
const COOLDOWN_SECONDS = 30

/**
 * Firebase sends a verification *link*, not a six-digit code, so this screen no
 * longer takes digits. It reports what was sent, lets the citizen re-send it, and
 * checks whether the link has been followed.
 */
export function VerifyForm() {
  const { openAuthModal, closeAuthModal, identifier } = useAuthModal()
  const { account } = useAuth()
  const [banner, setBanner] = useState({
    kind: 'info',
    text: identifier
      ? `We sent a verification link to ${identifier}. Open it, then press "I have verified".`
      : 'Sign in first, then open the link we email you.',
  })
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS)

  useEffect(() => {
    if (cooldown === 0) return undefined
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const onCheck = async () => {
    setError(null)
    setPending(true)
    const result = await checkVerified()
    setPending(false)

    if (result.status !== 'ok') {
      setError(result.message)
      return
    }
    if (result.verified) {
      closeAuthModal()
      return
    }
    setBanner({
      kind: 'info',
      text: 'Not verified yet. Open the link in the email, then press the button again.',
    })
  }

  const onResend = async () => {
    if (cooldown > 0) return
    setError(null)
    setPending(true)
    const result = await resendVerification()
    setPending(false)
    if (result.status === 'ok') {
      setCooldown(COOLDOWN_SECONDS)
      setBanner({ kind: 'info', text: `Sent another link to ${identifier || 'your email'}.` })
      return
    }
    setError(result.message)
  }

  const usingGoogle = account?.provider === 'google'

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
        {usingGoogle
          ? 'Your Google account is already verified, so there is nothing to confirm.'
          : 'Check your email and follow the link to confirm this address.'}
      </p>

      <div aria-live="polite">
        {!usingGoogle ? (
          <p className="mt-4 flex items-start gap-2 bg-teal-100 px-3 py-2.5 text-sm text-brown-900">
            <InfoIcon size={16} />
            <span>{banner.text}</span>
          </p>
        ) : (
          <p className="mt-4 flex items-start gap-2 bg-green-100 px-3 py-2.5 text-sm text-green-700">
            <CheckIcon size={16} />
            <span>Verified with Google.</span>
          </p>
        )}
        {error ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-coral-700">
            <AlertIcon size={16} />
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={usingGoogle ? closeAuthModal : onCheck}
        disabled={pending}
        className="mt-5 h-12 w-full bg-green-700 text-[15px] font-semibold text-cream-50 transition-colors hover:bg-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:bg-sand-300 disabled:text-brown-600"
      >
        {pending ? 'Checking...' : usingGoogle ? 'Continue' : 'I have verified'}
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0 || usingGoogle}
          className="text-sm font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700 disabled:text-brown-600 disabled:no-underline"
        >
          {cooldown > 0 && !usingGoogle ? `Resend link in ${cooldown}s` : 'Resend link'}
        </button>
        <button
          type="button"
          onClick={() => openAuthModal('signup')}
          className="text-sm font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700"
        >
          Use a different email
        </button>
      </div>
    </div>
  )
}

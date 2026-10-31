import { useState } from 'react'
import { useAuthModal } from '../AuthModalProvider'
import { methods, views } from '../authModalConfig'
import { TextField } from '../fields/TextField'
import { PasswordField } from '../fields/PasswordField'
import { CheckboxField } from '../fields/CheckboxField'
import { validateIdentifier, validatePassword } from '../authValidation'
import { login } from '../authService'
import { AlertIcon, CheckIcon, InfoIcon } from '../icons'

const copy = views.login

export function LoginForm() {
  const { openAuthModal } = useAuthModal()
  const [form, setForm] = useState({ identifier: '', password: '', keepLoggedIn: false })
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const [pending, setPending] = useState(false)

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (errors[key]) {
      const next = key === 'identifier' ? validateIdentifier(value) : validatePassword(value)
      setErrors((current) => ({ ...current, [key]: next }))
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const next = {
      identifier: validateIdentifier(form.identifier),
      password: validatePassword(form.password),
    }
    setErrors(next)
    const firstInvalid = ['identifier', 'password'].find((key) => next[key])
    if (firstInvalid) {
      document.getElementById(`login-${firstInvalid}`)?.focus()
      return
    }
    setPending(true)
    const result = await login({
      identifier: form.identifier.trim(),
      password: form.password,
      keepLoggedIn: form.keepLoggedIn,
    })
    setPending(false)
    if (result.status === 'not_configured') {
      setBanner({
        kind: 'info',
        text: "Authentication isn't connected yet. Your details were not sent anywhere.",
      })
    }
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
          <p
            className={`mt-4 flex items-start gap-2 rounded-[6px] px-3 py-2.5 text-sm ${
              banner.kind === 'success'
                ? 'bg-green-100 text-green-700'
                : banner.kind === 'error'
                  ? 'bg-coral-100 text-coral-700'
                  : 'bg-teal-100 text-brown-900'
            }`}
          >
            {banner.kind === 'success' ? (
              <CheckIcon size={16} />
            ) : banner.kind === 'error' ? (
              <AlertIcon size={16} />
            ) : (
              <InfoIcon size={16} />
            )}
            <span>{banner.text}</span>
          </p>
        ) : null}
      </div>

      <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <TextField
          id="login-identifier"
          label="Email or phone"
          type="text"
          inputMode="email"
          autoComplete="username"
          required
          placeholder="you@example.com"
          value={form.identifier}
          error={errors.identifier}
          onChange={(event) => setField('identifier', event.target.value)}
        />

        <div>
          <PasswordField
            id="login-password"
            label="Password"
            autoComplete="current-password"
            required
            placeholder="Your password"
            value={form.password}
            error={errors.password}
            onChange={(event) => setField('password', event.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => openAuthModal('forgot')}
              className="text-sm font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <CheckboxField
          id="login-keep"
          label="Keep me logged in"
          checked={form.keepLoggedIn}
          onChange={(checked) => setForm((current) => ({ ...current, keepLoggedIn: checked }))}
        />

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-[6px] bg-green-700 text-[15px] font-semibold text-cream-50 transition-colors hover:bg-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:bg-sand-300 disabled:text-brown-600"
        >
          {pending ? 'Please wait...' : 'Log in'}
        </button>
      </form>

      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-sand-300" />
          <span className="text-xs text-brown-600">or continue with</span>
          <span aria-hidden className="h-px flex-1 bg-sand-300" />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              disabled={!method.enabled}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] border border-brown-600 bg-transparent text-sm font-semibold text-brown-900 transition-colors hover:bg-sand-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:bg-sand-100 disabled:text-brown-600"
            >
              {method.label}
              {method.enabled ? null : (
                <span className="rounded-[4px] bg-teal-100 px-1.5 py-0.5 text-xs font-semibold text-brown-900">
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-sand-300 pt-4 text-center text-sm text-brown-600">
        First time here?{' '}
        <button
          type="button"
          onClick={() => openAuthModal('signup')}
          className="font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700"
        >
          Create an account
        </button>
      </div>
    </div>
  )
}

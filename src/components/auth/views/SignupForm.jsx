import { useState } from 'react'
import { useAuthModal } from '../AuthModalProvider'
import { methods, views } from '../authModalConfig'
import { TextField } from '../fields/TextField'
import { PasswordField } from '../fields/PasswordField'
import { CheckboxField } from '../fields/CheckboxField'
import {
  passwordStrength,
  validateConfirm,
  validateIdentifier,
  validateName,
  validatePassword,
  validateTerms,
} from '../authValidation'
import { signup } from '../authService'

const copy = views.signup

const STRENGTH_COLORS = {
  1: 'bg-coral-700',
  2: 'bg-amber-500',
  3: 'bg-teal-400',
  4: 'bg-green-700',
}

export function SignupForm() {
  const { openAuthModal, setIdentifier } = useAuthModal()
  const [form, setForm] = useState({
    name: '',
    identifier: '',
    password: '',
    confirm: '',
    terms: false,
    wardUpdates: false,
  })
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState(false)

  const strength = passwordStrength(form.password)

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (!errors[key]) return
    const validators = {
      name: () => validateName(value),
      identifier: () => validateIdentifier(value),
      password: () => validatePassword(value),
      confirm: () => validateConfirm(form.password, value),
      terms: () => validateTerms(value),
    }
    const validator = validators[key]
    if (validator) setErrors((current) => ({ ...current, [key]: validator() }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const next = {
      name: validateName(form.name),
      identifier: validateIdentifier(form.identifier),
      password: validatePassword(form.password),
      confirm: validateConfirm(form.password, form.confirm),
      terms: validateTerms(form.terms),
    }
    setErrors(next)
    const firstInvalid = ['name', 'identifier', 'password', 'confirm', 'terms'].find(
      (key) => next[key],
    )
    if (firstInvalid) {
      document.getElementById(`signup-${firstInvalid}`)?.focus()
      return
    }
    setPending(true)
    const result = await signup({
      name: form.name.trim(),
      identifier: form.identifier.trim(),
      password: form.password,
      wardUpdates: form.wardUpdates,
    })
    setPending(false)
    if (result.status === 'not_configured') {
      setIdentifier(form.identifier.trim())
      openAuthModal('verify')
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

      <div aria-live="polite" />

      <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <TextField
          id="signup-name"
          label="Full name"
          autoComplete="name"
          required
          placeholder="Rae Whitfield"
          value={form.name}
          error={errors.name}
          onChange={(event) => setField('name', event.target.value)}
        />

        <TextField
          id="signup-identifier"
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
            id="signup-password"
            label="Password"
            autoComplete="new-password"
            required
            placeholder="At least 8 characters"
            value={form.password}
            error={errors.password}
            onChange={(event) => setField('password', event.target.value)}
          />
          {form.password ? (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={`h-1 flex-1 ${
                      index < strength.score ? STRENGTH_COLORS[strength.score] : 'bg-sand-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-brown-600">{strength.label}</span>
            </div>
          ) : null}
        </div>

        <PasswordField
          id="signup-confirm"
          label="Confirm password"
          autoComplete="new-password"
          required
          placeholder="Repeat your password"
          value={form.confirm}
          error={errors.confirm}
          onChange={(event) => setField('confirm', event.target.value)}
        />

        <CheckboxField
          id="signup-terms"
          checked={form.terms}
          error={errors.terms}
          onChange={(checked) => setField('terms', checked)}
          label={
            <>
              I agree to the{' '}
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                className="font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700"
              >
                Terms
              </a>{' '}
              and{' '}
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                className="font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700"
              >
                Privacy Policy
              </a>
            </>
          }
        />

        <CheckboxField
          id="signup-ward"
          label="Send me ward updates"
          checked={form.wardUpdates}
          onChange={(checked) => setField('wardUpdates', checked)}
        />

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full bg-green-700 text-[15px] font-semibold text-cream-50 transition-colors hover:bg-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:bg-sand-300 disabled:text-brown-600"
        >
          {pending ? 'Please wait...' : 'Create account'}
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
              onClick={() => method.onSelect?.()}
              className="flex h-12 w-full items-center justify-center gap-2 border border-brown-600 bg-transparent text-sm font-semibold text-brown-900 transition-colors hover:bg-sand-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:bg-sand-100 disabled:text-brown-600"
            >
              {method.label}
              {method.enabled ? null : (
                <span className=" bg-teal-100 px-1.5 py-0.5 text-xs font-semibold text-brown-900">
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-sand-300 pt-4 text-center text-sm text-brown-600">
        Already registered?{' '}
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 hover:text-coral-700"
        >
          Log in
        </button>
      </div>
    </div>
  )
}

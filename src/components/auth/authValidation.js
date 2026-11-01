/**
 * Pure validation helpers. No side effects, no DOM, no network.
 * Every function returns an error string or null.
 *
 * Accounts are email-only: Firebase's email/password provider has no phone
 * field, and phone sign-in needs reCAPTCHA, which this flow does not run.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isEmail(value) {
  return EMAIL.test(String(value).trim())
}

export function validateIdentifier(value) {
  const trimmed = String(value).trim()
  if (!trimmed) return 'auth.err.emailRequired'
  if (isEmail(trimmed)) return null
  return 'auth.err.emailInvalid'
}

export function validateName(value) {
  if (!String(value).trim()) return 'auth.err.name'
  return null
}

export function validatePassword(value) {
  if (!value) return 'auth.err.passwordRequired'
  if (String(value).length < 8) return 'auth.err.passwordShort'
  return null
}

export function validateConfirm(password, confirm) {
  if (!confirm) return 'auth.err.confirmRequired'
  if (password !== confirm) return 'auth.err.confirmMismatch'
  return null
}

export function validateTerms(accepted) {
  if (!accepted) return 'auth.err.terms'
  return null
}

/** 0-4 with a human label, for the signup strength meter. */
export function passwordStrength(value) {
  const password = String(value || '')
  if (!password) return { score: 0, label: 'auth.strength.weak' }
  let score = 0
  if (password.length >= 8) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  const labels = ['auth.strength.weak', 'auth.strength.weak', 'auth.strength.fair', 'auth.strength.good', 'auth.strength.strong']
  return { score, label: labels[score] }
}

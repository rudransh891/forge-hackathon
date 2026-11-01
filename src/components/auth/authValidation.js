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
  if (!trimmed) return 'Enter your email address'
  if (isEmail(trimmed)) return null
  return 'Enter a valid email address'
}

export function validateName(value) {
  if (!String(value).trim()) return 'Enter your full name'
  return null
}

export function validatePassword(value) {
  if (!value) return 'Enter a password'
  if (String(value).length < 8) return 'Use at least 8 characters'
  return null
}

export function validateConfirm(password, confirm) {
  if (!confirm) return 'Confirm your password'
  if (password !== confirm) return "Passwords don't match"
  return null
}

export function validateTerms(accepted) {
  if (!accepted) return 'Please accept the Terms to continue'
  return null
}

/** 0-4 with a human label, for the signup strength meter. */
export function passwordStrength(value) {
  const password = String(value || '')
  if (!password) return { score: 0, label: 'Weak' }
  let score = 0
  if (password.length >= 8) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] }
}

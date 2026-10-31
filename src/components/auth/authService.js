/**
 * Stub auth service. Nothing leaves the browser and nothing is stored.
 * Every call resolves with { status: 'not_configured' } after 600ms so the UI
 * can show the honest "not connected" banner instead of faking a session.
 */

const DELAY = 600

function settle() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ status: 'not_configured' }), DELAY)
  })
}

/**
 * @param {{ identifier: string, password: string, keepLoggedIn: boolean }} payload
 * @returns {Promise<{ status: 'not_configured' }>}
 */
export async function login(payload) {
  // TODO: POST /api/auth/login with payload, store the session cookie
  void payload
  return settle()
}

/**
 * @param {{ name: string, identifier: string, password: string, wardUpdates: boolean }} payload
 * @returns {Promise<{ status: 'not_configured' }>}
 */
export async function signup(payload) {
  // TODO: POST /api/auth/signup, then trigger the verification code
  void payload
  return settle()
}

/**
 * @param {{ identifier: string }} payload
 * @returns {Promise<{ status: 'not_configured' }>}
 */
export async function requestReset(payload) {
  // TODO: POST /api/auth/password-reset
  void payload
  return settle()
}

/**
 * @param {{ identifier: string, code: string }} payload
 * @returns {Promise<{ status: 'not_configured' }>}
 */
export async function verifyCode(payload) {
  // TODO: POST /api/auth/verify with the six-digit code
  void payload
  return settle()
}

/**
 * @param {{ identifier: string }} payload
 * @returns {Promise<{ status: 'not_configured' }>}
 */
export async function resendCode(payload) {
  // TODO: POST /api/auth/verify/resend
  void payload
  return settle()
}

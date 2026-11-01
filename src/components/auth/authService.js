/**
 * The auth seam. Everything here talks to Firebase Auth; nothing here handles
 * passwords, tokens or codes itself.
 *
 * Every function resolves to `{ status: 'ok' | 'error' | 'unconfigured', ... }`
 * so a form never has to wrap a call in try/catch. Firebase error codes are
 * mapped to sentences a citizen can act on.
 */

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { NOT_CONFIGURED_MESSAGE, firebaseAuth, firebaseConfigured } from '@/lib/firebase'

const UNCONFIGURED = { status: 'unconfigured', message: NOT_CONFIGURED_MESSAGE }

const MESSAGES = {
  'auth/invalid-credential': 'That email and password do not match.',
  'auth/wrong-password': 'That email and password do not match.',
  'auth/user-not-found': 'That email and password do not match.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/weak-password': 'Use at least 8 characters.',
  'auth/email-already-in-use': 'An account already exists for that email.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'The sign-in window was blocked. Allow popups and try again.',
  'auth/operation-not-allowed': 'That sign-in method is not enabled in Firebase.',
  'auth/unauthorized-domain': 'This site is not an authorised domain in Firebase Auth.',
  'auth/network-request-failed': 'The network is unreachable. Check your connection.',
  'auth/requires-recent-login': 'Sign in again to do that.',
}

function describe(error) {
  const code = error && typeof error === 'object' ? error.code : null
  return MESSAGES[code] || (error && error.message) || 'Something went wrong.'
}

export function accountFrom(user) {
  if (!user) return null
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || (user.email ? user.email.split('@')[0] : 'Account'),
    verified: Boolean(user.emailVerified),
    provider: user.providerData?.[0]?.providerId ?? 'password',
  }
}

/** @returns {Promise<{ status: string, message?: string }>} */
export async function login({ identifier, password, keepLoggedIn = true }) {
  if (!firebaseConfigured) return UNCONFIGURED
  try {
    // The "Keep me logged in" checkbox maps to Firebase persistence, so it is
    // a real choice rather than decoration.
    await setPersistence(
      firebaseAuth,
      keepLoggedIn ? browserLocalPersistence : browserSessionPersistence,
    )
    await signInWithEmailAndPassword(firebaseAuth, identifier.trim(), password)
    return { status: 'ok' }
  } catch (error) {
    return { status: 'error', message: describe(error) }
  }
}

/** Creates the account, then sends Firebase's verification email. */
export async function signup({ name, identifier, password }) {
  if (!firebaseConfigured) return UNCONFIGURED
  try {
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      identifier.trim(),
      password,
    )
    if (name) {
      await updateProfile(credential.user, { displayName: name })
    }
    // A failed verification mail must not fail the signup.
    await sendEmailVerification(credential.user).catch(() => {})
    return { status: 'ok' }
  } catch (error) {
    return { status: 'error', message: describe(error) }
  }
}

/** Google sign-in. Popup, with the redirect fallback left to Firebase. */
export async function loginWithGoogle() {
  if (!firebaseConfigured) return UNCONFIGURED
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const credential = await signInWithPopup(firebaseAuth, provider)
    const details = getAdditionalUserInfo(credential)
    return { status: 'ok', isNew: Boolean(details?.isNewUser) }
  } catch (error) {
    return { status: 'error', message: describe(error) }
  }
}

/** Always resolves ok: whether an account exists must not be observable. */
export async function requestReset({ identifier }) {
  if (!firebaseConfigured) return UNCONFIGURED
  try {
    await sendPasswordResetEmail(firebaseAuth, identifier.trim())
    return { status: 'ok' }
  } catch (error) {
    const code = error && typeof error === 'object' ? error.code : null
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      return { status: 'ok' }
    }
    return { status: 'error', message: describe(error) }
  }
}

/**
 * Firebase sends a link, not a code, so the verify screen has nothing to type.
 * This reloads the current user and reports whether the link was followed.
 */
export async function checkVerified() {
  if (!firebaseConfigured) return UNCONFIGURED
  const user = firebaseAuth.currentUser
  if (!user) {
    return { status: 'error', message: 'Sign in again to check your email.' }
  }
  try {
    await reload(user)
    return { status: 'ok', verified: Boolean(user.emailVerified) }
  } catch (error) {
    return { status: 'error', message: describe(error) }
  }
}

export async function resendVerification() {
  if (!firebaseConfigured) return UNCONFIGURED
  const user = firebaseAuth.currentUser
  if (!user) {
    return { status: 'error', message: 'Sign in again to resend the link.' }
  }
  try {
    await sendEmailVerification(user)
    return { status: 'ok' }
  } catch (error) {
    return { status: 'error', message: describe(error) }
  }
}

export async function logout() {
  if (!firebaseAuth) return
  await signOut(firebaseAuth)
}

/** The ID token the backend verifies. Null when signed out or unconfigured. */
export async function getIdToken() {
  const user = firebaseAuth?.currentUser
  if (!user) return null
  try {
    return await user.getIdToken()
  } catch {
    return null
  }
}

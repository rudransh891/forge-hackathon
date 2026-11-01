/**
 * Firebase Auth initialisation.
 *
 * Config comes from VITE_FIREBASE_* at build time (see .env.example). When the
 * values are missing the app still runs: `firebaseConfigured` is false, the auth
 * modal shows an honest banner, and nothing throws at import time.
 */
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import type { Auth } from 'firebase/auth'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined
const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined

export const firebaseConfigured = Boolean(apiKey && authDomain && projectId && appId)

// The guard below narrows the four values, so no non-null assertions are needed.
export const firebaseAuth: Auth | null =
  apiKey && authDomain && projectId && appId
    ? getAuth(
        getApps().length
          ? getApp()
          : initializeApp({ apiKey, authDomain, projectId, appId }),
      )
    : null

export const NOT_CONFIGURED_MESSAGE =
  'Auth is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_APP_ID in .env, then restart the dev server.'

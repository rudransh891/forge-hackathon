import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth, firebaseConfigured } from '@/lib/firebase'
import { accountFrom, logout as signOutOfFirebase } from './authService'

/**
 * The signed-in account, kept in sync by Firebase's own observer so a Google
 * popup, a token refresh in another tab, and a logout all land here.
 *
 * @typedef {{ uid: string, email: string | null, name: string, verified: boolean, provider: string }} AuthAccount
 * @typedef {{ account: AuthAccount | null, ready: boolean, configured: boolean, signOut: () => Promise<void> }} AuthApi
 */

/** @type {import('react').Context<AuthApi|null>} */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [ready, setReady] = useState(!firebaseConfigured)

  useEffect(() => {
    if (!firebaseAuth) return undefined
    return onAuthStateChanged(firebaseAuth, (user) => {
      setAccount(accountFrom(user))
      setReady(true)
    })
  }, [])

  const signOut = useCallback(async () => {
    await signOutOfFirebase()
  }, [])

  const value = useMemo(
    () => ({ account, ready, configured: firebaseConfigured, signOut }),
    [account, ready, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * { account, ready, configured, signOut }
 * @returns {AuthApi}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

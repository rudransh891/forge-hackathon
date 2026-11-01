import { useAuth } from '@/components/auth/AuthProvider'

/**
 * Auth is real now (Firebase), so this reads the account rather than stubbing it.
 * The form only uses it to decide whether "Post report" should ask for a login.
 */
export function useIsAuthenticated() {
  const { account, ready } = useAuth()
  return { isAuthenticated: Boolean(account), ready, account }
}

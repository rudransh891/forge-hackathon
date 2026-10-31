import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * @typedef {Object} AuthModalApi
 * @property {boolean} open
 * @property {'login'|'signup'|'forgot'|'verify'|null} view
 * @property {string} identifier
 * @property {(value: string) => void} setIdentifier
 * @property {(view?: 'login'|'signup'|'forgot'|'verify') => void} openAuthModal
 * @property {() => void} closeAuthModal
 */

/** @type {import('react').Context<AuthModalApi|null>} */
const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [view, setView] = useState(null)
  const [identifier, setIdentifier] = useState('')

  const openAuthModal = useCallback((next = 'login') => {
    setView(next)
  }, [])

  const closeAuthModal = useCallback(() => {
    setView(null)
    setIdentifier('')
  }, [])

  const value = useMemo(
    () => ({
      open: view !== null,
      view,
      identifier,
      setIdentifier,
      openAuthModal,
      closeAuthModal,
    }),
    [view, identifier, openAuthModal, closeAuthModal],
  )

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
}

/** { open, view, openAuthModal(view), closeAuthModal() } */
export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) throw new Error('useAuthModal must be used inside <AuthModalProvider>')
  return context
}

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useAuthModal } from './AuthModalProvider'
import { AuthBrandPanel } from './AuthBrandPanel'
import { AuthTabs } from './AuthTabs'
import { authModalBackground, backgroundStyle, needsTint } from './authModalBackground'
import { CloseIcon } from './icons'
import { ForgotForm } from './views/ForgotForm'
import { LoginForm } from './views/LoginForm'
import { SignupForm } from './views/SignupForm'
import { VerifyForm } from './views/VerifyForm'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const VIEWS = {
  login: LoginForm,
  signup: SignupForm,
  forgot: ForgotForm,
  verify: VerifyForm,
}

export function AuthModal() {
  const { open, view, closeAuthModal, openAuthModal } = useAuthModal()
  const dialogRef = useRef(null)
  const overlayRef = useRef(null)
  const openerRef = useRef(null)
  const [entered, setEntered] = useState(false)

  // Scroll lock with scrollbar compensation, inert background, focus restore.
  useEffect(() => {
    if (!open) return undefined
    openerRef.current = document.activeElement

    const { body } = document
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    const root = document.getElementById('root')
    const hadInert = root?.hasAttribute('inert') ?? false
    const previousAriaHidden = root?.getAttribute('aria-hidden') ?? null
    if (root) {
      root.setAttribute('inert', '')
      root.setAttribute('aria-hidden', 'true')
    }

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
      if (root) {
        if (!hadInert) root.removeAttribute('inert')
        if (previousAriaHidden === null) root.removeAttribute('aria-hidden')
        else root.setAttribute('aria-hidden', previousAriaHidden)
      }
      const opener = openerRef.current
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [open])

  // Enter animation, skipped entirely under prefers-reduced-motion.
  useEffect(() => {
    if (!open) {
      setEntered(false)
      return undefined
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  // Move focus into the dialog whenever the view changes.
  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => {
      const target =
        dialogRef.current?.querySelector('[data-autofocus]') ||
        dialogRef.current?.querySelector('input')
      target?.focus()
    }, 40)
    return () => clearTimeout(timer)
  }, [open, view])

  // Escape closes, Tab is trapped inside the dialog.
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeAuthModal()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const nodes = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, closeAuthModal])

  if (!open) return null

  const View = VIEWS[view] || LoginForm
  const showTabs = view === 'login' || view === 'signup'
  const wholeModal = authModalBackground.appliesTo === 'whole-modal'

  return createPortal(
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--overlay-scrim)] backdrop-blur-[2px] transition-opacity duration-150 motion-reduce:transition-none',
        entered ? 'opacity-100' : 'opacity-0',
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAuthModal()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-desc"
        style={wholeModal ? backgroundStyle() : undefined}
        className={cn(
          'relative grid max-h-[92dvh] w-[calc(100%-24px)] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[16px] bg-cream-50 shadow-[0_24px_60px_rgba(43,24,16,0.45)] transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none md:max-h-[90dvh] md:min-h-[560px] md:w-full md:max-w-[880px] md:grid-cols-[2fr_3fr] md:grid-rows-[minmax(0,1fr)]',
          entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        <div aria-hidden className="absolute inset-x-0 top-0 z-30 h-1 bg-coral-500" />

        {wholeModal && needsTint() ? (
          <div
            aria-hidden
            className="absolute inset-0 z-0"
            style={{ backgroundColor: authModalBackground.tint }}
          />
        ) : null}

        <AuthBrandPanel view={view} />

        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close"
          className="absolute top-4 right-4 z-30 grid size-10 place-items-center rounded-full text-cream-100 transition-colors hover:bg-brown-700 hover:text-cream-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none md:text-brown-900 md:hover:bg-sand-100 md:hover:text-brown-900"
        >
          <CloseIcon size={20} />
        </button>

        <div className="modal-scroll relative flex min-h-0 flex-col overflow-y-auto bg-cream-50 px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:py-8">
          {showTabs ? (
            <div className="md:pr-12">
              <AuthTabs view={view} onChange={openAuthModal} />
            </div>
          ) : null}

          <div className={showTabs ? 'mt-5' : undefined}>
            <View />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

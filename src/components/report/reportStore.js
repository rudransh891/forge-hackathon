/**
 * Tiny module store shared by the feed and the report page. No libraries:
 * the supported flag is mirrored into localStorage, the counts come back from
 * the API.
 *
 * Support is the one per-citizen action the backend can take without accounts
 * (POST /reports/{id}/confirm), so the network call lives here rather than in a
 * component. The optimistic count is reverted if the call fails.
 */

import { setSupport } from '@/lib/api'

const STORAGE_KEY = 'civic-pulse.support'

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

let state = {
  /** reportId -> boolean */
  supported: readStored(),
  /** reportId -> server count once a toggle has been confirmed */
  counts: {},
  /** last failure, so a page can put it in its live region */
  error: null,
  /** commentId -> boolean (comments have no backend yet) */
  helpful: {},
}

const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function commit(supported, counts, error = null) {
  state = { ...state, supported, counts, error }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(supported))
  } catch {
    /* storage blocked: the session still works, it just will not be remembered */
  }
  emit()
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return state
}

export function isSupported(reportId) {
  return Boolean(state.supported[reportId])
}

/** The count to render: the server value once known, else the payload's value. */
export function supportCount(reportId, baseline = 0) {
  const known = state.counts[reportId]
  return typeof known === 'number' ? known : baseline
}

export function toggleSupport(reportId, baseline = 0) {
  const previousSupported = Boolean(state.supported[reportId])
  const previousCount = supportCount(reportId, baseline)
  const next = !previousSupported

  commit(
    { ...state.supported, [reportId]: next },
    { ...state.counts, [reportId]: Math.max(1, previousCount + (next ? 1 : -1)) },
  )

  setSupport(reportId, next)
    .then((serverCount) => {
      commit(state.supported, { ...state.counts, [reportId]: serverCount })
    })
    .catch(() => {
      commit(
        { ...state.supported, [reportId]: previousSupported },
        { ...state.counts, [reportId]: previousCount },
        'Your support could not be saved.',
      )
    })

  return next
}

/* Comments have no backend yet; the flags stay local so the UI still works. */

export function isHelpful(commentId) {
  return Boolean(state.helpful[commentId])
}

export function toggleHelpful(commentId) {
  const helpful = { ...state.helpful, [commentId]: !state.helpful[commentId] }
  state = { ...state, helpful }
  emit()
  return state.helpful[commentId]
}

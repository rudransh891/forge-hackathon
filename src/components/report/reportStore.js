/**
 * Tiny module store shared by the feed and the report page. No libraries, no
 * storage: everything is in memory for the session.
 *
 * Holds which reports the visitor supports and which comments they marked
 * helpful, plus the supporter/helpful count deltas that follow from those
 * toggles. Components subscribe with useSyncExternalStore so the feed card,
 * the detail support bar and the detail rail never disagree.
 */

let state = {
  supported: {},
  helpful: {},
}

const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
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

export function toggleSupport(reportId) {
  state = {
    ...state,
    supported: { ...state.supported, [reportId]: !state.supported[reportId] },
  }
  emit()
  return state.supported[reportId]
}

export function supporterDelta(reportId) {
  return state.supported[reportId] ? 1 : 0
}

export function isHelpful(commentId) {
  return Boolean(state.helpful[commentId])
}

export function toggleHelpful(commentId) {
  state = {
    ...state,
    helpful: { ...state.helpful, [commentId]: !state.helpful[commentId] },
  }
  emit()
  return state.helpful[commentId]
}

export function helpfulDelta(commentId) {
  return state.helpful[commentId] ? 1 : 0
}

import { useSyncExternalStore } from 'react'

/**
 * The draft, kept in one module store.
 *
 * This is the single deliberate exception to the "no storage" rule: text fields
 * survive a refresh through one localStorage key, always inside try/catch, and
 * the form renders correctly when storage throws (private mode, quota). Photos
 * never persist — they are blobs held in memory and revoked on removal.
 */

const KEY = 'civicpulse.reportDraft.v1'
const EMPTY = { category: null, title: '', description: '', location: null, safetyHazard: false }

// location = { blockLabel, locality, approximate: true } — never coordinates.
let state = { ...EMPTY, photos: [], savedAt: null }
const listeners = new Set()
let timer
const emit = () => listeners.forEach((listener) => listener())

let restored = false
try {
  const raw = localStorage.getItem(KEY)
  if (raw) {
    const parsed = JSON.parse(raw)
    state = { ...state, ...parsed, photos: [] }
    restored = Boolean(parsed && Object.keys(parsed).length)
  }
} catch {
  /* storage unavailable: the form just starts empty */
}

function persist() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      const { photos, savedAt, ...text } = state
      localStorage.setItem(KEY, JSON.stringify(text))
      state = { ...state, savedAt: Date.now() }
      emit()
    } catch {
      /* quota or private mode: nothing to do, the draft stays in memory */
    }
  }, 400)
}

export const draft = {
  subscribe: (listener) => (listeners.add(listener), () => listeners.delete(listener)),
  getSnapshot: () => state,
  wasRestored: () => restored,
  set(patch) {
    state = { ...state, ...patch }
    emit()
    persist()
  },
  addPhotos(items) {
    state = { ...state, photos: [...state.photos, ...items].slice(0, 4) }
    emit()
  },
  removePhoto(id) {
    const photo = state.photos.find((item) => item.id === id)
    if (photo) URL.revokeObjectURL(photo.url)
    state = { ...state, photos: state.photos.filter((item) => item.id !== id) }
    emit()
  },
  isDirty: () =>
    Boolean(
      state.title ||
        state.description ||
        state.category ||
        state.location ||
        state.photos.length ||
        state.safetyHazard,
    ),
  /** Force the debounced write now, for the "Save draft" button. */
  flush() {
    clearTimeout(timer)
    try {
      const { photos, savedAt, ...text } = state
      localStorage.setItem(KEY, JSON.stringify(text))
      state = { ...state, savedAt: Date.now() }
      emit()
    } catch {
      /* ignore */
    }
  },
  clear() {
    state.photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    state = { ...EMPTY, photos: [], savedAt: null }
    restored = false
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    emit()
  },
}

export const useDraft = () => useSyncExternalStore(draft.subscribe, draft.getSnapshot)

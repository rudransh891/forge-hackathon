import {
  fetchFeedPage,
  reverseGeocode,
  searchGeocode,
  submitReport as postReport,
} from '@/lib/api'
import { categories, simulateSuccess } from './formConfig'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Block-level naming for a point, from the backend's Nominatim proxy.
 *
 * The label is always "road, locality" — the exact address never reaches the
 * browser, which is what keeps the form's promise that only the block is shown.
 * A failed lookup still leaves a usable label and the coordinates intact.
 */
export async function reverseToBlock(lat, lng) {
  try {
    const place = await reverseGeocode(lat, lng)
    return {
      blockLabel: place.blockLabel,
      locality: place.locality || 'Prayagraj',
      approximate: true,
      lat: place.lat,
      lng: place.lng,
    }
  } catch {
    return {
      blockLabel: 'Reported location',
      locality: 'Prayagraj',
      approximate: true,
      lat,
      lng,
    }
  }
}

/** Forward geocode for the "type a street" path. Coordinates included. */
export async function searchPlaces(query) {
  const value = String(query || '').trim()
  if (value.length < 3) return []
  try {
    const places = await searchGeocode(value)
    return places.map((place) => ({
      ...place,
      locality: place.locality || 'Prayagraj',
      approximate: true,
    }))
  } catch {
    return []
  }
}

const STOP = new Set(['the', 'and', 'with', 'from', 'near', 'this', 'that'])

function sharedWord(title, candidate) {
  const words = String(title || '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length >= 4 && !STOP.has(word))
  const target = String(candidate || '').toLowerCase()
  return words.some((word) => target.includes(word))
}

/**
 * Similar reports for the "already reported nearby?" panel. Real data: the
 * feed endpoint, filtered by category and a shared word of 4+ letters.
 * It is a hint, never a block on posting.
 *
 * TODO: GET /api/reports/nearby?category=&title=&block= once the API ranks them.
 */
export async function findNearbyReports({ category, title, blockLabel, signal }) {
  if (simulateSuccess) return []
  try {
    const page = await fetchFeedPage({ category, sort: 'newest', pageSize: 20 })
    if (signal?.aborted) return []
    return page.items
      .filter((item) => item.title && sharedWord(title, item.title))
      .slice(0, 2)
  } catch {
    return []
  }
}

/**
 * POST /api/reports — photo, coordinates and description.
 *
 * The API needs coordinates, so posting only works when the location came from
 * the device. A typed block label has no coordinates behind it; rather than
 * inventing them, this returns 'manual_location' and the page says so.
 */
export async function submitReport(payload) {
  if (simulateSuccess) {
    await wait(600)
    return { status: 'ok', id: 'demo' }
  }
  const { photos, coords, title, description, blockLabel, locality, safetyHazard, category, audioText, idToken } =
    payload

  if (!coords) return { status: 'manual_location' }

  const detail = [
    title,
    description,
    safetyHazard ? 'Safety hazard.' : null,
    `Block: ${blockLabel}${locality ? ` (${locality})` : ''}.`,
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const receipt = await postReport({
      photos: photos.map((photo) => photo.blob),
      lat: coords.lat,
      lng: coords.lng,
      description: detail,
      category,
      audioText,
      idToken,
    })
    return { status: 'ok', id: receipt.id }
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Posting failed.' }
  }
}

export { categories }

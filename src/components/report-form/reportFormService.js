import { fetchFeedPage, submitReport as postReport } from '@/lib/api'
import { categories, simulateSuccess } from './formConfig'

const DELAY = 300
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Mock block labels around the pilot area. A real reverse geocoder is not
 * exposed by the API yet; when it is, only this function changes.
 *
 * TODO: GET /api/geocode/reverse?lat=&lng= -> { blockLabel, locality }
 */
const BLOCKS = [
  { blockLabel: 'Jhalwa, near the college gate', locality: 'Jhalwa' },
  { blockLabel: 'Leader Road, between the crossings', locality: 'Chowk' },
  { blockLabel: 'Kydganj, riverside end', locality: 'Kydganj' },
  { blockLabel: 'Civil Lines, by the park', locality: 'Civil Lines' },
  { blockLabel: 'Naini, bridge approach', locality: 'Naini' },
  { blockLabel: 'Tagore Town, block C', locality: 'Tagore Town' },
]

const PLACES = [
  { blockLabel: 'Jhalwa, near the college gate', locality: 'Jhalwa' },
  { blockLabel: 'Leader Road, between the crossings', locality: 'Chowk' },
  { blockLabel: 'Kydganj, riverside end', locality: 'Kydganj' },
  { blockLabel: 'Civil Lines, by the park', locality: 'Civil Lines' },
  { blockLabel: 'Naini, bridge approach', locality: 'Naini' },
  { blockLabel: 'Tagore Town, block C', locality: 'Tagore Town' },
  { blockLabel: 'Allahpur, main road', locality: 'Allahpur' },
  { blockLabel: 'Salori, by the school', locality: 'Salori' },
]

/** Block-level text only. Coordinates are used, then discarded. */
export async function reverseToBlock(lat, lng) {
  await wait(DELAY)
  const index = Math.abs(Math.round(lat * 1000) + Math.round(lng * 1000)) % BLOCKS.length
  return { ...BLOCKS[index], approximate: true }
}

export async function searchPlaces(query) {
  const value = String(query || '').trim().toLowerCase()
  if (value.length < 2) return []
  await wait(DELAY)
  return PLACES.filter((place) => place.blockLabel.toLowerCase().includes(value)).slice(0, 5)
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
  const { photos, coords, title, description, blockLabel, locality, safetyHazard, idToken } =
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
      photo: photos[0].blob,
      lat: coords.lat,
      lng: coords.lng,
      description: detail,
      idToken,
    })
    return { status: 'ok', id: receipt.id }
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Posting failed.' }
  }
}

export { categories }

import { notices, poll, reports } from './feedData'
import { pageSize as defaultPageSize } from './feedConfig'

const DELAY = 400

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function sortReports(items, sort) {
  const copy = [...items]
  if (sort === 'newest') {
    return copy.sort((a, b) => a.ageDays - b.ageDays)
  }
  return copy.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
    return b.supporters - a.supporters
  })
}

/**
 * @param {{ category?: string, sort?: string, cursor?: string|null, pageSize?: number }} query
 * @returns {Promise<{ items: object[], nextCursor: string|null, total: number }>}
 *
 * TODO: replace with GET /api/wards/7/reports?category=&sort=&cursor=&pageSize=
 */
export async function fetchReports({
  category = 'All',
  sort = 'top',
  cursor = null,
  pageSize = defaultPageSize,
} = {}) {
  await wait(DELAY)
  const filtered =
    category === 'All' ? reports : reports.filter((report) => report.category === category)
  const ordered = sortReports(filtered, sort)
  const offset = cursor ? Number(cursor) : 0
  const page = ordered.slice(offset, offset + pageSize)
  const nextOffset = offset + page.length
  const nextCursor = nextOffset < ordered.length ? String(nextOffset) : null
  return { items: page, nextCursor, total: ordered.length }
}

/**
 * @returns {Promise<{ items: { id: string, label: string, href: string }[] }>}
 * TODO: GET /api/wards/7/notices
 */
export async function fetchNotices() {
  await wait(DELAY)
  return { items: notices }
}

/**
 * @returns {Promise<typeof poll>}
 * TODO: GET /api/wards/7/polls/active
 */
export async function fetchPoll() {
  await wait(DELAY)
  return poll
}

/**
 * @param {{ pollId: string, optionId: string }} payload
 * @returns {Promise<{ status: 'recorded', optionId: string }>}
 * TODO: POST /api/polls/:id/votes — for now the vote stays in React state.
 */
export async function votePoll({ pollId, optionId }) {
  await wait(DELAY)
  return { status: 'recorded', pollId, optionId }
}

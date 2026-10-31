import { fetchFeedPage, fetchReportDetail, fetchNearby } from '@/lib/api'
import { pageSize as defaultPageSize } from './feedConfig'
import { notices, poll } from './feedData'

/**
 * The seam between the UI and the API. The exported names and return shapes are
 * the ones the components already expect; the data now comes from FastAPI.
 *
 * Backend coverage as of this merge:
 *   reports, a single report, nearby reports   -> real
 *   notices, poll                              -> still local (no table behind them)
 *   comments, flags, helpful votes             -> no table behind them
 */

/**
 * @param {{ category?: string, sort?: string, cursor?: string|null, pageSize?: number }} query
 * @returns {Promise<{ items: object[], nextCursor: string|null, total: number }>}
 */
export async function fetchReports({
  category = 'All',
  sort = 'top',
  cursor = null,
  pageSize = defaultPageSize,
} = {}) {
  const page = await fetchFeedPage({
    category,
    sort,
    offset: cursor ? Number(cursor) : 0,
    pageSize,
  })
  return {
    items: page.items,
    nextCursor: page.nextOffset === null ? null : String(page.nextOffset),
    total: page.total,
  }
}

/**
 * @returns {Promise<{ items: { id: string, label: string, href: string }[] }>}
 */
export async function fetchNotices() {
  return { items: notices }
}

/**
 * @returns {Promise<typeof poll>}
 */
export async function fetchPoll() {
  return poll
}

/**
 * Polls have no table behind them, so a vote only lives in React state.
 * @returns {Promise<{ status: 'not_configured' }>}
 */
export async function votePoll(payload) {
  void payload
  return { status: 'not_configured' }
}

/**
 * @param {string} id
 * @returns {Promise<object|null>} null when the report does not exist
 */
export async function fetchReport(id) {
  return fetchReportDetail(id)
}

/**
 * @param {{ id: string, locality: string }} query
 * @returns {Promise<object[]>}
 */
export async function fetchNearbyReports({ id, locality }) {
  return fetchNearby({ id, locality })
}

/**
 * Reports have no comments table yet, so this is always empty. The section
 * still renders, with its own empty state.
 * @returns {Promise<{ items: object[], total: number }>}
 */
export async function fetchComments(id, query = {}) {
  void id
  void query
  return { items: [], total: 0 }
}

/** @returns {Promise<{ status: 'not_configured' }>} */
export async function postComment(payload) {
  void payload
  return { status: 'not_configured' }
}

/** @returns {Promise<{ status: 'not_configured' }>} */
export async function flagComment(payload) {
  void payload
  return { status: 'not_configured' }
}

/** @returns {Promise<{ status: 'not_configured' }>} */
export async function voteHelpful(payload) {
  void payload
  return { status: 'not_configured' }
}

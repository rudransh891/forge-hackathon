import { fetchFeedPage, fetchReportDetail, fetchNearby } from '@/lib/api'
import { castVote, fetchActivePoll } from '@/lib/api'
import { fetchCommentsFor, postCommentTo } from '@/lib/api'
import { pageSize as defaultPageSize } from './feedConfig'
import { notices } from './feedData'

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
 * The open poll, in the shape the cards already expect.
 * @returns {Promise<object|null>}
 */
export async function fetchPoll() {
  try {
    const poll = await fetchActivePoll()
    return {
      id: poll.id,
      question: poll.question,
      closes: poll.closes_at
        ? new Date(poll.closes_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })
        : null,
      options: poll.options,
      total: poll.total,
    }
  } catch {
    return null
  }
}

/**
 * @param {{ pollId: string, optionId: string, voter: string }} payload
 * @returns {Promise<{ status: string, poll?: object, message?: string }>}
 */
export async function votePoll({ pollId, optionId, voter }) {
  try {
    const poll = await castVote(pollId, optionId, voter)
    return { status: 'recorded', poll }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'That vote could not be saved.',
    }
  }
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
 * Comments come from the comments table; a signed-in poster is attributed, an
 * anonymous one is labelled "Resident".
 * @returns {Promise<{ items: object[], total: number }>}
 */
export async function fetchComments(id, { sort = 'top', offset = 0, limit = 10 } = {}) {
  const page = await fetchCommentsFor(id, { sort, offset, limit })
  return {
    items: page.items.map((row) => ({
      id: row.id,
      locality: '',
      ageLabel: new Date(row.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      }),
      author: row.author_name,
      text: row.body,
      helpful: 0,
      pinned: false,
      helpfulByMe: false,
    })),
    total: page.total,
  }
}

/** @returns {Promise<{ status: string, message?: string }>} */
export async function postComment({ reportId, text, idToken }) {
  try {
    await postCommentTo(reportId, text, idToken)
    return { status: 'ok' }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'That comment could not be posted.',
    }
  }
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

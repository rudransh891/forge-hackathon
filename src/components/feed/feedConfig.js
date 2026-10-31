/**
 * Feed copy and knobs. Rename or retune the feed here, never in components.
 */

/** The pilot city. Display only: the backend has no ward table (yet). */
export const pilotCity = 'Prayagraj'

/** Kept under its old name because the feed header and h1 already read from it. */
export const ward = pilotCity

/**
 * UI categories. Two of them (Parks, Transit) have no matching backend issue
 * type and therefore show the empty state. See CATEGORY_TYPES in @/lib/api.
 */
export const categories = ['All', 'Roads', 'Parks', 'Transit', 'Safety', 'Water']

export const sortOptions = [
  { id: 'top', label: 'Most severe' },
  { id: 'newest', label: 'Newest' },
]

/**
 * The support action is a single configurable idea: change the label here and
 * the button, the aria-label and the live-region wording all follow.
 */
export const support = {
  label: 'Support',
  supportedLabel: 'Supported',
  addAnnouncement: 'You support this report',
  removeAnnouncement: 'Support removed',
  // Backed by POST /reports/{id}/confirm. There are no accounts yet, so the
  // browser keeps the flag locally and the API keeps the count.
}

export const labels = {
  emptyState: 'No reports in this category yet.',
  endState: `You're all caught up for ${pilotCity}.`,
  errorState: "Couldn't load reports. Retry",
  loadMore: 'Load more reports',
  loading: 'Loading reports',
  photoCredit: 'Photo submitted by a resident.',
  photoUnavailable: 'Photo unavailable',
  verified: 'Verified',
  unverified: 'Unverified',
  reportIssue: 'Report an issue',
  pollCloses: 'Poll closes',
  pollNotConnected: 'Not connected yet',
  backToReports: 'Reports',
  noResponse: 'No department response recorded yet.',
  notVerified: 'Not verified by anyone yet.',
  waitingForCity: 'Waiting for the photo analysis to finish.',
  logInToComment: 'Accounts are not available yet.',
  emptyComments: 'No comments yet.',
  analysisRunning: 'Analysing the photo. This page updates itself.',
  analysisStalled: 'Analysis is taking longer than usual.',
}

/** Reports with no photo and fewer supporters than this collapse to a brief. */
export const briefThreshold = 30

export const pageSize = 8

/* Report detail page */
export const unverifiedNoteAfterDays = 14
export const noResponseNoteAfterDays = 3
export const detailCommentsPageSize = 10

export const trackerSteps = [
  { id: 'reported', label: 'Reported' },
  { id: 'seen', label: 'Routed' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'fixed', label: 'Fixed' },
]

export function categoryLabel(category) {
  return category === 'All' ? 'every category' : category
}

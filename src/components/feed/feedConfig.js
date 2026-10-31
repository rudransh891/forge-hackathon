/**
 * Feed copy and knobs. Rename or retune the feed here, never in components.
 */

export const ward = 'Ward 7'

export const categories = ['All', 'Roads', 'Parks', 'Transit', 'Safety', 'Water']

export const sortOptions = [
  { id: 'top', label: 'Top this week' },
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
  // Support is a local optimistic toggle for now; a real API call would live
  // in feedService.js next to the other endpoints.
}

export const labels = {
  emptyState: 'No reports in this category yet.',
  endState: "You're all caught up for Ward 7.",
  errorState: "Couldn't load reports. Retry",
  loadMore: 'Load more reports',
  loading: 'Loading reports',
  photoCredit: 'Photo submitted by a resident.',
  photoUnavailable: 'Photo unavailable',
  verified: 'Verified by ward office',
  unverified: 'Unverified',
  reportIssue: 'Report an issue',
  pollCloses: 'Poll closes',
  backToReports: 'Reports',
  noResponse: 'No response from the city yet.',
  notVerified: 'Not yet verified by the ward office.',
  waitingForCity: 'Waiting for the city to respond.',
  logInToComment: 'Log in to comment.',
  emptyComments: 'Be the first to comment.',
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
  { id: 'seen', label: 'Seen by city' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'fixed', label: 'Fixed' },
]

export function categoryLabel(category) {
  return category === 'All' ? 'every category' : category
}

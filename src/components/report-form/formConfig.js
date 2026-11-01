/**
 * Every limit, category and sentence on the report form. Copy lives here so
 * wording changes never mean touching a component.
 */

export const maxPhotos = 4
export const maxFileMB = 15
export const titleMin = 8
export const titleMax = 80
export const descMax = 500
export const editWindowMinutes = 10
export const requireAuthToPost = true

/** Flip to true to see the success screen without a backend. */
export const simulateSuccess = false

export const identityNote = 'Your name is never shown.'

export const categories = ['Roads', 'Parks', 'Transit', 'Safety', 'Water', 'Other']

export const copy = {
  cancel: 'Cancel',
  draftSaved: 'Draft saved',
  draftRestored: 'We restored your draft.',
  startOver: 'Start over',
  title: 'Report an issue',
  titleAccent: 'issue',
  subline: 'Takes about a minute. Your name is never shown.',
  photosSection: 'Photo',
  photosNote: 'Up to 4',
  dropTitle: 'Take a photo or choose one',
  dropHint: 'A clear photo helps the city act sooner.',
  coverCaption: 'The first photo is the cover.',
  categorySection: 'What is it',
  titleLabel: 'Short title',
  titlePlaceholder: 'Potholes along Elm Street',
  whereSection: 'Where',
  useLocation: 'Use my location',
  locating: 'Finding you…',
  manualLabel: 'Street or ZIP code',
  manualHint: 'We only show the block, never the exact spot.',
  changeLocation: 'Change location',
  locationHelper: 'Shown to the block only. The exact spot stays private.',
  detailsSection: 'Details',
  detailsLabel: 'Details',
  detailsOptional: 'Optional',
  detailsPlaceholder: 'What should the city know?',
  nearbyTitle: 'Already reported nearby?',
  nearbyNew: 'No, this is a new issue',
  nearbyThanks: 'Thanks, you supported this report.',
  nearbyView: 'View report',
  nearbyStill: 'Still post mine',
  safetyLabel: 'This is a safety hazard',
  safetyHelper:
    'Flags it for faster review. The ward office decides whether it is marked urgent.',
  saveDraft: 'Save draft',
  post: 'Post report',
  posting: 'Posting…',
  postedTitle: 'Your report is posted',
  postedBody:
    'The photo is being analysed now. It appears in the feed as soon as that finishes, and the ward office sees it at the same time.',
  viewReport: 'View your report',
  backToReports: 'Back to reports',
  discardTitle: 'Leave this report?',
  discardBody: 'Your draft is saved, so you can pick it up again from this device.',
  keepEditing: 'Keep editing',
  saveAndLeave: 'Save and leave',
  discardDraft: 'Discard draft',
  previewLabel: 'Preview',
  previewCaption: 'This is how your report will look in the feed.',
}

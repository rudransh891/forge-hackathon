/**
 * Every limit, category and sentence on the report form. Copy lives here so
 * wording changes never mean touching a component.
 */

import { useMergedCopy } from '@/lib/i18n'

export const maxPhotos = 4
export const maxFileMB = 15
export const titleMin = 8
export const titleMax = 80
export const descMax = 500
export const editWindowMinutes = 10
/**
 * Reporting is open to anyone. The backend records an account when a signed-in
 * citizen posts, but never requires one: an account is friction between someone
 * seeing a problem and telling the city about it.
 */
export const requireAuthToPost = false

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
  titleLead: 'Report an',
  titleAccent: 'issue',
  subline: 'Takes about a minute. Your name is never shown.',
  photosSection: 'Photo',
  photosNote: 'Up to 4',
  dropTitle: 'Take a photo or choose one',
  dropHint: 'A clear photo helps the city act sooner.',
  coverCaption: 'The first photo is the cover.',
  categorySection: 'What is it',
  titleLabel: 'Short title',
  titlePlaceholder: 'Potholes along MG Marg',
  whereSection: 'Where',
  useLocation: 'Use my location',
  locating: 'Finding you…',
  manualLabel: 'Street or area',
  manualPlaceholder: 'MG Marg or Civil Lines',
  manualHint: 'We only show the block, never the exact spot.',
  mapHint: 'Tap the map to place or move the pin.',
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
    'Adds a line the severity score reads. The score decides what is treated as urgent, not a person.',
  saveDraft: 'Save draft',
  post: 'Post report',
  posting: 'Posting…',
  postedTitle: 'Your report is posted',
  postedBody:
    'The photo is being analysed now. It appears in the feed as soon as that finishes. Nothing has been sent to a department: complaints go to the project’s own test inbox, and the report page records exactly what happened.',
  viewReport: 'View your report',
  backToReports: 'Back to reports',
  discardTitle: 'Leave this report?',
  discardBody: 'Your draft is saved, so you can pick it up again from this device.',
  keepEditing: 'Keep editing',
  saveAndLeave: 'Save and leave',
  discardDraft: 'Discard draft',
  previewLabel: 'Preview',
  previewCaption: 'This is how your report will look in the feed.',
  voiceStart: 'Speak instead of typing',
  voiceStop: 'Stop listening',
  voiceUnsupported: 'This browser cannot transcribe speech. Type the details instead.',
  voiceListening: 'Listening… speak now.',
  voiceNote: 'Transcribed on this device. The text is added to your description.',
}

/**
 * Hindi overrides for the form. Merged over `copy`, so a key that is missing
 * here falls back to English instead of showing a blank.
 */
export const hindiCopy = {
  cancel: 'रद्द करें',
  title: 'समस्या की रिपोर्ट करें',
  titleLead: 'समस्या की',
  titleAccent: 'रिपोर्ट करें',
  subline: 'लगभग एक मिनट लगेगा। आपका नाम कभी नहीं दिखाया जाता।',
  photosSection: 'फ़ोटो',
  photosNote: 'अधिकतम 4',
  dropTitle: 'फ़ोटो लें या चुनें',
  dropHint: 'साफ़ फ़ोटो से कार्रवाई जल्दी होती है।',
  coverCaption: 'पहली फ़ोटो कवर होगी।',
  categorySection: 'यह क्या है',
  titleLabel: 'छोटा शीर्षक',
  titlePlaceholder: 'MG मार्ग पर गड्ढे',
  whereSection: 'कहाँ',
  useLocation: 'मेरा स्थान उपयोग करें',
  locating: 'स्थान खोजा जा रहा है…',
  manualLabel: 'गली या क्षेत्र',
  manualPlaceholder: 'MG मार्ग या सिविल लाइंस',
  manualHint: 'हम केवल ब्लॉक दिखाते हैं, सटीक जगह नहीं।',
  mapHint: 'निशान लगाने या खिसकाने के लिए नक्शे पर क्लिक करें।',
  changeLocation: 'स्थान बदलें',
  locationHelper: 'केवल ब्लॉक दिखाया जाता है। सटीक जगह निजी रहती है।',
  detailsSection: 'विवरण',
  detailsLabel: 'विवरण',
  detailsOptional: 'वैकल्पिक',
  detailsPlaceholder: 'नगर को क्या जानना चाहिए?',
  nearbyTitle: 'क्या आसपास पहले से रिपोर्ट है?',
  nearbyNew: 'नहीं, यह नई समस्या है',
  nearbyStill: 'फिर भी मेरी पोस्ट करें',
  nearbyView: 'रिपोर्ट देखें',
  nearbyThanks: 'धन्यवाद, आपने इस रिपोर्ट का समर्थन किया।',
  safetyLabel: 'यह सुरक्षा के लिए ख़तरा है',
  safetyHelper:
    'गंभीरता स्कोर इसे पढ़ता है। किसे तत्काल माना जाए, यह स्कोर तय करता है।',
  saveDraft: 'ड्राफ़्ट सहेजें',
  post: 'रिपोर्ट भेजें',
  posting: 'भेजा जा रहा है…',
  postedTitle: 'आपकी रिपोर्ट दर्ज हो गई',
  postedBody:
    'फ़ोटो की जाँच चल रही है। पूरी होते ही यह फ़ीड में दिखेगी। किसी विभाग को कुछ नहीं भेजा गया है: शिकायतें परियोजना के परीक्षण इनबॉक्स पर जाती हैं, और रिपोर्ट पृष्ठ पर सब दर्ज रहता है।',
  viewReport: 'अपनी रिपोर्ट देखें',
  backToReports: 'रिपोर्टों पर लौटें',
  discardTitle: 'यह रिपोर्ट छोड़ें?',
  discardBody: 'आपका ड्राफ़्ट सहेजा गया है, इसे इसी डिवाइस से फिर खोल सकते हैं।',
  keepEditing: 'संपादन जारी रखें',
  saveAndLeave: 'सहेजें और छोड़ें',
  discardDraft: 'ड्राफ़्ट हटाएँ',
  previewLabel: 'पूर्वावलोकन',
  previewCaption: 'फ़ीड में आपकी रिपोर्ट ऐसी दिखेगी।',
  draftSaved: 'ड्राफ़्ट सहेजा गया',
  draftRestored: 'हमने आपका ड्राफ़्ट बहाल किया।',
  startOver: 'फिर से शुरू करें',
  voiceStart: 'टाइप करने के बजाय बोलें',
  voiceStop: 'सुनना बंद करें',
  voiceUnsupported: 'यह ब्राउज़र आवाज़ नहीं समझता। विवरण टाइप करें।',
  voiceListening: 'सुन रहे हैं… अब बोलिए।',
  voiceNote: 'इसी डिवाइस पर लिखा जाता है। पाठ विवरण में जुड़ जाता है।',
}

/** The copy for the current language: Hindi merged over English. */
export function useCopy() {
  return useMergedCopy(copy, hindiCopy)
}

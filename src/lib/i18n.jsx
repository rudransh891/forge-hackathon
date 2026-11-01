import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Bilingual UI: English and Hindi.
 *
 * Every visible string in the citizen-facing app goes through here. A key that
 * is missing from the Hindi table falls back to English rather than showing the
 * key, so a gap degrades quietly instead of breaking the page.
 *
 * Screens that already keep their copy in a config object (formConfig,
 * feedConfig, authModalConfig) translate by merging a Hindi override object
 * over the English one, which keeps the diff to a line per component.
 */

export const LANGUAGES = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'hi', label: 'हिन्दी', short: 'हिं' },
]

const STORAGE_KEY = 'fixitbharat.language'

const STRINGS = {
  en: {
    'nav.howItWorks': 'How it works',
    'nav.issues': 'Issues',
    'nav.report': 'Report',
    'nav.polls': 'Polls',
    'nav.faq': 'FAQ',
    'nav.about': 'About',
    'auth.login': 'Login / Sign up',
    'auth.logout': 'Log out',
    'auth.verify': 'Verify email',
    'lang.switch': 'Change language',

    'hero.badge': 'On the air — Prayagraj',
    'hero.lead': 'take your',
    'hero.lead2': 'city’s',
    'hero.accent': 'pulse',
    'hero.body':
      'See what residents are reporting in Prayagraj, support the ones that matter to you, and follow the proposed response time on every one of them.',
    'hero.label': 'Your locality in Prayagraj',
    'hero.placeholder': 'e.g. Civil Lines or Kydganj',
    'hero.button': 'See reports',
    'hero.hintIdle':
      'The feed covers all of Prayagraj. Reports are matched to a locality from their coordinates.',
    'hero.hintChecked':
      'Opening the Prayagraj feed. Area filtering is not available yet, so every report in the city is listed.',
    'hero.learn': 'Or learn how it works',
    'hero.panel': 'Prayagraj · on the air',

    'pulse.reports': 'reports filed',
    'pulse.open': 'open issues',
    'pulse.resolved': 'resolved',
    'pulse.overdue': 'past deadline',

    'trending.marker': 'Most severe right now',
    'trending.title': 'What needs',
    'trending.titleAccent': 'attention',
    'trending.intro':
      'The highest scored reports in Prayagraj, from a weighted score over the photo, the road, nearby schools and hospitals, and the weather.',
    'trending.view': 'View report',
    'trending.browse': 'Browse all reports',
    'trending.empty': 'No reports have been filed yet. The first one sets the board.',
    'trending.loading': 'Loading the most severe reports…',
    'trending.reported': 'Reported',
    'trending.today': 'today',
    'trending.daysAgo': 'days ago',
    'trending.supporter': 'supporter',
    'trending.supporters': 'supporters',

    'how.marker': 'How it works',
    'how.title': 'Three steps to',
    'how.titleAccent': 'being heard',
    'how.1.title': 'Explore',
    'how.1.body':
      'Open the feed, filter by category, and read every report already on file in the city.',
    'how.2.title': 'Weigh in',
    'how.2.body':
      'Support a report that matters to you, or file your own with a photo and your location.',
    'how.3.title': 'See impact',
    'how.3.body':
      'Follow the status, the score and the proposed response time as each report moves through the pipeline.',

    'poll.marker': 'Poll',
    'poll.chooseOne': 'Choose one option',
    'poll.saving': 'Saving…',
    'poll.oneVote': 'One vote per browser.',
    'poll.thanks': 'Your vote is saved.',
    'poll.title': 'Which fix should the pilot chase',
    'poll.titleAccent': 'first this week',
    'poll.submit': 'Submit my vote',
    'poll.voted': 'Vote counted',
    'poll.thanks': 'Your vote is counted in this browser only.',
    'poll.idle': 'This poll has no backend behind it yet; the vote stays on this page.',
    'poll.results': 'Results',
    'poll.vote': 'vote',
    'poll.votes': 'votes',
    'poll.footnote':
'Percentages are shown next to every bar, so the result never relies on colour alone. One vote per browser, and every count is read from the database.',

    'faq.marker': 'FAQ',
    'faq.title': 'Questions people ask',
    'faq.titleAccent': 'before they post',
    'faq.q1': 'Who can post an issue?',
    'faq.a1':
      'Anyone. Reading is open to everyone, and a report needs only a photo and your location. Accounts are optional.',
    'faq.q2': 'Is FixItBharat run by the city?',
    'faq.a2':
      'No. It is an independent pilot for Prayagraj. Complaints are prepared from the report and emailed to the project’s own test inbox, not to a government department, and the record on each report says so.',
    'faq.q3': 'What happens after I submit a report?',
    'faq.a3':
      'A vision model reads the photo and picks out the issue. The location is enriched with OpenStreetMap and Open-Meteo data, a severity score and a proposed response time are computed from five weighted factors, and nearby reports of the same type are checked for duplicates. The status history on every report records each step.',
    'faq.q4': 'Do you sell my data?',
    'faq.a4':
      'No. There is no account system, so no email or phone number is collected. What is stored is the photo, the coordinates, the optional description, and the public context a report needs.',

    'cta.marker': 'Closing call',
    'cta.title': 'Join Prayagraj’s',
    'cta.titleAccent': 'conversation',
    'cta.body':
      'A non-partisan pilot built on OpenStreetMap, Open-Meteo and an open vision model. Every report shows the evidence behind its score, and nothing claims a department acted when it did not.',
    'cta.signup': 'Create free account',
    'cta.learn': 'Learn more',

    'footer.about': 'About',
    'footer.privacy': 'Privacy',
    'footer.sources': 'Data sources',
    'footer.contact': 'Contact',

    'feed.title': 'Reports in',
    'feed.sort': 'Sort',
    'feed.sort.top': 'Most severe',
    'feed.sort.newest': 'Newest',
    'feed.filters': 'Filter reports by category',
    'feed.empty': 'No reports in this category yet.',
    'feed.end': 'You’re all caught up.',
    'feed.error': 'Couldn’t load reports. Retry',
    'feed.loadMore': 'Load more reports',
    'feed.retry': 'Retry',
    'feed.reportIssue': 'Report an issue',
    'feed.supporters': 'supporters',
    'feed.comments': 'comments',
    'feed.briefs': 'Briefs',
    'feed.mapCaption':
      'Every report loaded here, coloured by severity: green low, amber medium, coral high, dark coral critical. Open a marker to read the report.',
    'feed.departments': 'Routed to',
    'feed.departmentsEmpty':
      'Nothing has been routed yet. Complaints are emailed to the project’s test inbox, and this list fills as reports clear their deadlines.',
    'feed.open': 'open',
    'feed.fixed': 'fixed',

    'status.urgent': 'Urgent',
    'status.resolved': 'Resolved',
    'status.duplicate': 'Duplicate',
    'status.needsPhoto': 'Needs a clear photo',
    'status.underReview': 'Under review',
    'status.verified': 'Verified',
    'status.unverified': 'Unverified',

    'tracker.reported': 'Reported',
    'tracker.routed': 'Routed',
    'tracker.scheduled': 'Scheduled',
    'tracker.fixed': 'Fixed',
    'tracker.progress': 'Report progress',
    'tracker.completed': 'completed',
    'tracker.current': 'current step',
    'tracker.upcoming': 'not started',

    'report.severity': 'Severity',
    'report.evidence': 'What the score looked at',
    'report.sent': 'What was sent',
    'report.history': 'Status history',
    'report.comments': 'Comments',
    'report.nearby': 'Nearby reports',
    'report.fixed': 'Is it fixed?',
    'report.back': 'Reports',
    'report.analyseAgain': 'Analyse again',
    'report.readComplaint': 'Read the complaint',
    'report.support': 'Support',
    'report.supported': 'Supported',
    'report.supporters': 'supporters',
    'report.escalation': 'Escalation',
    'report.loadFailed': 'That report could not be loaded.',
    'report.tryAgain': 'Try again',

    'progress.title': 'Your report is posted',
    'progress.subline': 'This updates itself as the pipeline runs.',
    'progress.received': 'Photo received',
    'progress.analysed': 'Photo analysed',
    'progress.located': 'Location checked',
    'progress.scored': 'Severity scored',
    'progress.routed': 'Complaint prepared',
    'progress.done': 'Done',
    'progress.now': 'In progress',
    'progress.waiting': 'Waiting',
    'progress.view': 'Open the report',
    'auth.tab.login': 'Log in',
    'auth.tab.signup': 'Sign up',
    'auth.tab.forgot': 'Reset',
    'auth.tab.verify': 'Verify',
    'auth.login.lead': 'welcome',
    'auth.login.accent': 'back',
    'auth.login.helper': 'Log in to report an issue, follow it, and see what gets fixed.',
    'auth.login.panelLead': 'the city is',
    'auth.login.panelAccent': 'listening',
    'auth.login.panelBody':
      'One account would cover your reports, your polls and every update the city posts.',
    'auth.signup.lead': 'join your',
    'auth.signup.accent': 'community',
    'auth.signup.helper': 'Create an account so the city knows who to reply to.',
    'auth.signup.panelLead': 'add your',
    'auth.signup.panelAccent': 'signal',
    'auth.signup.panelBody':
      'Neighbors already on the air report the small things before they become the big ones.',
    'auth.forgot.lead': 'reset your',
    'auth.forgot.accent': 'password',
    'auth.forgot.helper': 'We will send a reset link to the email on your account.',
    'auth.forgot.panelLead': 'back on',
    'auth.forgot.panelAccent': 'air',
    'auth.forgot.panelBody':
      'A reset link is all it takes. Your reports and followed issues stay exactly where they were.',
    'auth.verify.lead': 'check your',
    'auth.verify.accent': 'messages',
    'auth.verify.helper': 'Check your email and follow the link to confirm this address.',
    'auth.verify.panelLead': 'almost',
    'auth.verify.panelAccent': 'there',
    'auth.verify.panelBody':
      'One link and your account is on the air. Nothing else is sent until you confirm.',
    'auth.benefit.1': 'See what neighbors are reporting',
    'auth.benefit.2': 'Vote on open polls in your locality',
    'auth.benefit.3': 'Track what actually gets fixed',
    'auth.method.google': 'Continue with Google',
    'auth.field.name': 'Full name',
    'auth.field.email': 'Email',
    'auth.field.password': 'Password',
    'auth.field.confirm': 'Confirm password',
    'auth.field.keep': 'Keep me logged in',
    'auth.field.ward': 'Send me ward updates',
    'auth.termsPrefix': 'I agree to the',
    'auth.terms': 'Terms',
    'auth.privacyPrefix': 'and',
    'auth.privacy': 'Privacy Policy',
    'auth.button.login': 'Log in',
    'auth.button.signup': 'Create account',
    'auth.button.verify': 'I have verified',
    'auth.button.continue': 'Continue',
    'auth.button.reset': 'Send reset link',
    'auth.busy': 'Please wait...',
    'auth.forgotLink': 'Forgot password?',
    'auth.firstTime': 'First time here?',
    'auth.haveAccount': 'Already registered?',
    'auth.noAccount': 'Create an account',
    'auth.orContinue': 'or continue with',
    'auth.comingSoon': 'Coming soon',
    'auth.notConfigured': 'Not configured',
    'auth.backToLogin': 'Back to log in',
    'auth.verifySent': 'We sent a verification link to',
    'auth.verifyNotYet':
      'Not verified yet. Open the link in the email, then press the button again.',
    'auth.verifyRestart': 'Sign in first, then open the link we email you.',
    'auth.checking': 'Checking...',
    'auth.resend': 'Resend link',
    'auth.resendIn': 'Resend link in',
    'auth.useDifferent': 'Use a different email',
    'auth.resetSent': 'If an account exists for that email, a reset link is on its way.',
    'auth.resetPrivacy':
      'For your safety we always show the same message, whether or not an account exists.',
    'auth.termsNote': 'This pilot stores no email or phone number.',
    'auth.err.emailRequired': 'Enter your email address',
    'auth.err.emailInvalid': 'Enter a valid email address',
    'auth.err.name': 'Enter your full name',
    'auth.err.passwordRequired': 'Enter a password',
    'auth.err.passwordShort': 'Use at least 8 characters',
    'auth.err.confirmRequired': 'Confirm your password',
    'auth.err.confirmMismatch': 'Passwords do not match',
    'auth.err.terms': 'Please accept the Terms to continue',
    'auth.strength.weak': 'Weak',
    'auth.strength.fair': 'Fair',
    'auth.strength.good': 'Good',
    'auth.strength.strong': 'Strong',
    'poll.opt.roads': 'Potholes and road damage',
    'poll.opt.garbage': 'Garbage collection',
    'poll.opt.lights': 'Streetlights not working',
    'poll.closes': 'Poll closes',
    'poll.notConnected': 'Not connected yet',
    'report.share': 'Share this report',
    'report.duplicateHeading': 'Is this the same problem?',
    'report.duplicateYes': 'Yes, same problem',
    'report.duplicateNo': 'No, something else',
    'report.fixedBody':
      'Send an after photo taken at the same place. A model compares it with the original and decides whether the problem is gone; the answer is recorded on the timeline.',
    'report.fixedButton': 'Send after photo',
    'report.fixedSending': 'Sending…',
    'report.timelineNote':
      'Recorded automatically from the report own status history. Not a message from a government department.',
    'report.evidenceNote':
      'Read at the time of the report, from OpenStreetMap and Open-Meteo. An empty nearby list means nothing is mapped there, not that nothing exists.',
    'report.missing': 'Not checked',
    'report.filedUnder': 'You filed this under',
    'report.modelSaid': 'the photo was read as',
    'report.routingOutside':
      'Outside the Prayagraj pilot area, so no complaint was sent and the report stays on the board as a record.',
    'report.routingDelivered': 'Complaint emailed to the project test inbox on',
    'report.routingFailed': 'Complaint prepared, but the email could not be sent',
    'report.routingProvisional': 'Not routed: the severity is still provisional because',
    'report.routingWaiting': 'Not routed yet: waiting for your answer to the duplicate question above.',
    'report.routingAnalysing': 'Not routed yet: the analysis is still running.',
    'report.routingNone': 'Nothing has been sent for this report.',
    'report.escalationNote': 'Sent to the project test inbox, never to an officer.',
    'report.commentsSort': 'Sort',
    'report.commentsTop': 'Top',
    'report.commentsNewest': 'Newest',
    'report.commentsEmpty': 'No comments yet.',
    'report.commentsMore': 'Show',
    'report.commentPlaceholder': 'Add a comment',
    'report.commentPost': 'Post',
    'report.notFound': 'We couldn\'t find that report.',
    'report.waiting': 'Waiting for the photo analysis to finish.',
    'report.analysisRunning': 'Analysing the photo. This page updates itself.',
    'report.analysisStalled': 'Analysis is taking longer than usual.',
    'report.notVerified': 'Not verified by anyone yet.',
    'report.noResponse': 'No department response recorded yet.',
    'progress.back': 'Back to reports',
  },

  hi: {
    'nav.howItWorks': 'यह कैसे काम करता है',
    'nav.issues': 'समस्याएँ',
    'nav.report': 'रिपोर्ट करें',
    'nav.polls': 'मतदान',
    'nav.faq': 'सामान्य प्रश्न',
    'nav.about': 'परिचय',
    'auth.login': 'लॉग इन / पंजीकरण',
    'auth.logout': 'लॉग आउट',
    'auth.verify': 'ईमेल सत्यापित करें',
    'lang.switch': 'भाषा बदलें',

    'hero.badge': 'प्रसारण पर — प्रयागराज',
    'hero.lead': 'अपने शहर की',
    'hero.lead2': '',
    'hero.accent': 'धड़कन',
    'hero.body':
      'देखें कि प्रयागराज में लोग क्या रिपोर्ट कर रहे हैं, जो आपके लिए मायने रखता है उसका समर्थन करें, और हर रिपोर्ट की प्रस्तावित समय-सीमा देखें।',
    'hero.label': 'प्रयागराज में आपका क्षेत्र',
    'hero.placeholder': 'जैसे सिविल लाइंस या कैडगंज',
    'hero.button': 'रिपोर्ट देखें',
    'hero.hintIdle':
      'फ़ीड में पूरा प्रयागराज है। रिपोर्टें उनके निर्देशांक से क्षेत्र में जोड़ी जाती हैं।',
    'hero.hintChecked':
      'प्रयागराज की फ़ीड खुल रही है। क्षेत्र से छाँटने की सुविधा अभी नहीं है, इसलिए शहर की सभी रिपोर्टें दिखेंगी।',
    'hero.learn': 'या जानें यह कैसे काम करता है',
    'hero.panel': 'प्रयागराज · प्रसारण पर',

    'pulse.reports': 'दर्ज रिपोर्टें',
    'pulse.open': 'खुली समस्याएँ',
    'pulse.resolved': 'हल हुईं',
    'pulse.overdue': 'समय-सीमा पार',

    'trending.marker': 'अभी सबसे गंभीर',
    'trending.title': 'किस पर चाहिए',
    'trending.titleAccent': 'ध्यान',
    'trending.intro':
      'प्रयागराज की सबसे अधिक अंक पाने वाली रिपोर्टें — फ़ोटो, सड़क, आसपास के स्कूल और अस्पताल, और मौसम से बने भारित स्कोर के आधार पर।',
    'trending.view': 'रिपोर्ट देखें',
    'trending.browse': 'सभी रिपोर्ट देखें',
    'trending.empty': 'अभी कोई रिपोर्ट दर्ज नहीं हुई। पहली रिपोर्ट से शुरुआत होगी।',
    'trending.loading': 'सबसे गंभीर रिपोर्टें लोड हो रही हैं…',
    'trending.reported': 'दर्ज',
    'trending.today': 'आज',
    'trending.daysAgo': 'दिन पहले',
    'trending.supporter': 'समर्थक',
    'trending.supporters': 'समर्थक',

    'how.marker': 'यह कैसे काम करता है',
    'how.title': 'तीन कदम',
    'how.titleAccent': 'सुने जाने तक',
    'how.1.title': 'देखें',
    'how.1.body': 'फ़ीड खोलें, श्रेणी से छाँटें, और शहर में दर्ज हर रिपोर्ट पढ़ें।',
    'how.2.title': 'कहें',
    'how.2.body':
      'जो रिपोर्ट आपके लिए मायने रखती है उसका समर्थन करें, या फ़ोटो और स्थान के साथ अपनी रिपोर्ट भेजें।',
    'how.3.title': 'असर देखें',
    'how.3.body':
      'हर रिपोर्ट की स्थिति, स्कोर और प्रस्तावित समय-सीमा देखते रहें।',

    'poll.marker': 'मतदान',
    'poll.chooseOne': 'एक विकल्प चुनें',
    'poll.saving': 'सहेजा जा रहा है…',
    'poll.oneVote': 'प्रति ब्राउज़र एक मत।',
    'poll.thanks': 'आपका मत सहेजा गया।',
    'poll.title': 'पायलट पहले किस काम को',
    'poll.titleAccent': 'प्राथमिकता दे',
    'poll.submit': 'मेरा मत दर्ज करें',
    'poll.voted': 'मत दर्ज हुआ',
    'poll.thanks': 'आपका मत केवल इसी ब्राउज़र में गिना गया है।',
    'poll.idle': 'इस मतदान के पीछे अभी कोई सर्वर नहीं है; मत इसी पृष्ठ पर रहता है।',
    'poll.results': 'परिणाम',
    'poll.vote': 'मत',
    'poll.votes': 'मत',
    'poll.footnote':
      'हर पट्टी के आगे प्रतिशत लिखा है, इसलिए परिणाम केवल रंग पर निर्भर नहीं। सर्वर पर कुछ संग्रह नहीं होता, और मतदान जुड़ने तक कोई अंतिम तिथि नहीं।',

    'faq.marker': 'सामान्य प्रश्न',
    'faq.title': 'लोग जो पूछते हैं',
    'faq.titleAccent': 'पोस्ट करने से पहले',
    'faq.q1': 'समस्या कौन पोस्ट कर सकता है?',
    'faq.a1':
      'कोई भी। पढ़ना सबके लिए खुला है, और रिपोर्ट के लिए केवल फ़ोटो और स्थान चाहिए। खाता वैकल्पिक है।',
    'faq.q2': 'क्या FixItBharat नगर निगम चलाता है?',
    'faq.a2':
      'नहीं। यह प्रयागराज के लिए एक स्वतंत्र पायलट है। शिकायतें रिपोर्ट से बनाई जाती हैं और परियोजना के अपने परीक्षण इनबॉक्स पर भेजी जाती हैं, किसी सरकारी विभाग को नहीं, और हर रिपोर्ट पर यह दर्ज रहता है।',
    'faq.q3': 'रिपोर्ट भेजने के बाद क्या होता है?',
    'faq.a3':
      'एक विज़न मॉडल फ़ोटो पढ़कर समस्या पहचानता है। स्थान को OpenStreetMap और Open-Meteo के डेटा से समृद्ध किया जाता है, पाँच भारित कारकों से गंभीरता स्कोर और प्रस्तावित समय-सीमा निकाली जाती है, और आसपास की मिलती रिपोर्टें जाँची जाती हैं। हर रिपोर्ट का इतिहास हर कदम दर्ज करता है।',
    'faq.q4': 'क्या आप मेरा डेटा बेचते हैं?',
    'faq.a4':
      'नहीं। कोई खाता प्रणाली नहीं है, इसलिए ईमेल या फ़ोन नंबर नहीं लिया जाता। केवल फ़ोटो, निर्देशांक, वैकल्पिक विवरण और रिपोर्ट के लिए आवश्यक सार्वजनिक संदर्भ संग्रह होते हैं।',

    'cta.marker': 'समापन',
    'cta.title': 'प्रयागराज की',
    'cta.titleAccent': 'बातचीत से जुड़ें',
    'cta.body':
      'OpenStreetMap, Open-Meteo और एक खुले विज़न मॉडल पर बना गैर-राजनीतिक पायलट। हर रिपोर्ट अपने स्कोर के सबूत दिखाती है, और जहाँ किसी विभाग ने कार्रवाई नहीं की, वहाँ ऐसा नहीं कहा जाता।',
    'cta.signup': 'मुफ़्त खाता बनाएँ',
    'cta.learn': 'और जानें',

    'footer.about': 'परिचय',
    'footer.privacy': 'गोपनीयता',
    'footer.sources': 'डेटा स्रोत',
    'footer.contact': 'संपर्क',

    'feed.title': 'रिपोर्टें, क्षेत्र:',
    'feed.sort': 'क्रम',
    'feed.sort.top': 'सबसे गंभीर पहले',
    'feed.sort.newest': 'सबसे नई पहले',
    'feed.filters': 'श्रेणी से रिपोर्ट छाँटें',
    'feed.empty': 'इस श्रेणी में अभी कोई रिपोर्ट नहीं।',
    'feed.end': 'सब देख लिया।',
    'feed.error': 'रिपोर्टें लोड नहीं हुईं। फिर कोशिश करें',
    'feed.loadMore': 'और रिपोर्टें लोड करें',
    'feed.retry': 'फिर कोशिश करें',
    'feed.reportIssue': 'समस्या रिपोर्ट करें',
    'feed.supporters': 'समर्थक',
    'feed.comments': 'टिप्पणियाँ',
    'feed.briefs': 'संक्षेप',
    'feed.mapCaption':
      'यहाँ दिख रही हर रिपोर्ट, गंभीरता के रंग में: हरा कम, पीला मध्यम, नारंगी अधिक, गहरा नारंगी अत्यधिक। विवरण पढ़ने के लिए निशान पर क्लिक करें।',
    'feed.departments': 'किसे भेजा गया',
    'feed.departmentsEmpty':
      'अभी कोई रिपोर्ट नहीं भेजी गई है। शिकायतें परियोजना के परीक्षण इनबॉक्स पर जाती हैं, और समय-सीमा पूरी होने पर यह सूची भरती है।',
    'feed.open': 'खुली',
    'feed.fixed': 'ठीक हुईं',

    'status.urgent': 'अत्यावश्यक',
    'status.resolved': 'हल हुई',
    'status.duplicate': 'दोहराव',
    'status.needsPhoto': 'साफ़ फ़ोटो चाहिए',
    'status.underReview': 'जाँच में',
    'status.verified': 'सत्यापित',
    'status.unverified': 'असत्यापित',

    'tracker.reported': 'दर्ज',
    'tracker.routed': 'भेजा गया',
    'tracker.scheduled': 'निर्धारित',
    'tracker.fixed': 'ठीक हुआ',
    'tracker.progress': 'रिपोर्ट की प्रगति',
    'tracker.completed': 'पूरा',
    'tracker.current': 'वर्तमान चरण',
    'tracker.upcoming': 'शुरू नहीं',

    'report.severity': 'गंभीरता',
    'report.evidence': 'स्कोर ने क्या देखा',
    'report.sent': 'क्या भेजा गया',
    'report.history': 'स्थिति का इतिहास',
    'report.comments': 'टिप्पणियाँ',
    'report.nearby': 'आसपास की रिपोर्टें',
    'report.fixed': 'क्या यह ठीक हो गया?',
    'report.back': 'रिपोर्टें',
    'report.analyseAgain': 'दोबारा जाँचें',
    'report.readComplaint': 'शिकायत पढ़ें',
    'report.support': 'समर्थन',
    'report.supported': 'समर्थित',
    'report.supporters': 'समर्थक',
    'report.escalation': 'उच्चीकरण',
    'report.loadFailed': 'यह रिपोर्ट लोड नहीं हो सकी।',
    'report.tryAgain': 'फिर कोशिश करें',

    'progress.title': 'आपकी रिपोर्ट दर्ज हो गई',
    'progress.subline': 'प्रक्रिया चलते ही यह पृष्ठ स्वयं बदलता रहता है।',
    'progress.received': 'फ़ोटो मिली',
    'progress.analysed': 'फ़ोटो की जाँच हुई',
    'progress.located': 'स्थान जाँचा गया',
    'progress.scored': 'गंभीरता तय हुई',
    'progress.routed': 'शिकायत तैयार हुई',
    'progress.done': 'पूरा',
    'progress.now': 'चल रहा है',
    'progress.waiting': 'प्रतीक्षा',
    'progress.view': 'रिपोर्ट खोलें',
    'auth.tab.login': 'लॉग इन',
    'auth.tab.signup': 'पंजीकरण',
    'auth.tab.forgot': 'रीसेट',
    'auth.tab.verify': 'सत्यापन',
    'auth.login.lead': 'फिर से',
    'auth.login.accent': 'स्वागत',
    'auth.login.helper': 'समस्या रिपोर्ट करने, उसे देखने और सुधार देखने के लिए लॉग इन करें।',
    'auth.login.panelLead': 'शहर',
    'auth.login.panelAccent': 'सुन रहा है',
    'auth.login.panelBody':
      'एक खाते में आपकी रिपोर्टें, आपके मत और शहर की हर सूचना शामिल होगी।',
    'auth.signup.lead': 'अपने',
    'auth.signup.accent': 'समुदाय से जुड़ें',
    'auth.signup.helper': 'खाता बनाएँ ताकि शहर को पता रहे कि किसे उत्तर देना है।',
    'auth.signup.panelLead': 'अपना',
    'auth.signup.panelAccent': 'संकेत जोड़ें',
    'auth.signup.panelBody':
      'पड़ोसी छोटी बातें पहले ही रिपोर्ट कर देते हैं, इससे पहले कि वे बड़ी हो जाएँ।',
    'auth.forgot.lead': 'अपना पासवर्ड',
    'auth.forgot.accent': 'रीसेट करें',
    'auth.forgot.helper': 'हम आपके खाते के ईमेल पर रीसेट लिंक भेजेंगे।',
    'auth.forgot.panelLead': 'फिर',
    'auth.forgot.panelAccent': 'प्रसारण पर',
    'auth.forgot.panelBody':
      'एक रीसेट लिंक काफ़ी है। आपकी रिपोर्टें और देखी जा रही समस्याएँ वहीं रहेंगी।',
    'auth.verify.lead': 'अपना ईमेल',
    'auth.verify.accent': 'देखें',
    'auth.verify.helper': 'ईमेल देखें और इस पते की पुष्टि के लिए लिंक खोलें।',
    'auth.verify.panelLead': 'लगभग',
    'auth.verify.panelAccent': 'पूरा',
    'auth.verify.panelBody':
      'एक लिंक और आपका खाता तैयार। पुष्टि तक कुछ और नहीं भेजा जाता।',
    'auth.benefit.1': 'देखें पड़ोसी क्या रिपोर्ट कर रहे हैं',
    'auth.benefit.2': 'अपने क्षेत्र के खुले मतदान में मत दें',
    'auth.benefit.3': 'देखें कि वास्तव में क्या ठीक होता है',
    'auth.method.google': 'गूगल से जारी रखें',
    'auth.field.name': 'पूरा नाम',
    'auth.field.email': 'ईमेल',
    'auth.field.password': 'पासवर्ड',
    'auth.field.confirm': 'पासवर्ड दोहराएँ',
    'auth.field.keep': 'मुझे लॉग इन रखें',
    'auth.field.ward': 'मुझे क्षेत्र की सूचनाएँ भेजें',
    'auth.termsPrefix': 'मैं सहमत हूँ',
    'auth.terms': 'शर्तें',
    'auth.privacyPrefix': 'और',
    'auth.privacy': 'गोपनीयता नीति',
    'auth.button.login': 'लॉग इन करें',
    'auth.button.signup': 'खाता बनाएँ',
    'auth.button.verify': 'मैंने सत्यापित कर लिया',
    'auth.button.continue': 'आगे बढ़ें',
    'auth.button.reset': 'रीसेट लिंक भेजें',
    'auth.busy': 'कृपया प्रतीक्षा करें...',
    'auth.forgotLink': 'पासवर्ड भूल गए?',
    'auth.firstTime': 'पहली बार यहाँ?',
    'auth.haveAccount': 'पहले से पंजीकृत?',
    'auth.noAccount': 'खाता बनाएँ',
    'auth.orContinue': 'या इससे जारी रखें',
    'auth.comingSoon': 'जल्द आ रहा है',
    'auth.notConfigured': 'कॉन्फ़िगर नहीं',
    'auth.backToLogin': 'लॉग इन पर लौटें',
    'auth.verifySent': 'हमने सत्यापन लिंक भेजा है',
    'auth.verifyNotYet': 'अभी सत्यापित नहीं। ईमेल में लिंक खोलें, फिर बटन दोबारा दबाएँ।',
    'auth.verifyRestart': 'पहले साइन इन करें, फिर हमारे ईमेल का लिंक खोलें।',
    'auth.checking': 'जाँच हो रही है...',
    'auth.resend': 'लिंक फिर भेजें',
    'auth.resendIn': 'लिंक फिर भेजें',
    'auth.useDifferent': 'दूसरा ईमेल उपयोग करें',
    'auth.resetSent': 'यदि उस ईमेल का खाता है, तो रीसेट लिंक भेजा जा रहा है।',
    'auth.resetPrivacy':
      'आपकी सुरक्षा के लिए हम हमेशा एक ही संदेश दिखाते हैं, चाहे खाता हो या न हो।',
    'auth.termsNote': 'यह पायलट कोई ईमेल या फ़ोन नंबर संग्रह नहीं करता।',
    'auth.err.emailRequired': 'अपना ईमेल पता दर्ज करें',
    'auth.err.emailInvalid': 'मान्य ईमेल पता दर्ज करें',
    'auth.err.name': 'अपना पूरा नाम दर्ज करें',
    'auth.err.passwordRequired': 'पासवर्ड दर्ज करें',
    'auth.err.passwordShort': 'कम से कम 8 अक्षर रखें',
    'auth.err.confirmRequired': 'पासवर्ड दोहराएँ',
    'auth.err.confirmMismatch': 'पासवर्ड मेल नहीं खाते',
    'auth.err.terms': 'जारी रखने के लिए शर्तें स्वीकारें',
    'auth.strength.weak': 'कमज़ोर',
    'auth.strength.fair': 'ठीक',
    'auth.strength.good': 'अच्छा',
    'auth.strength.strong': 'मज़बूत',
    'poll.opt.roads': 'गड्ढे और सड़क क्षति',
    'poll.opt.garbage': 'कचरा संग्रह',
    'poll.opt.lights': 'स्ट्रीटलाइट काम नहीं कर रही',
    'poll.closes': 'मतदान समाप्त',
    'poll.notConnected': 'अभी जुड़ा नहीं',
    'report.share': 'यह रिपोर्ट साझा करें',
    'report.duplicateHeading': 'क्या यह वही समस्या है?',
    'report.duplicateYes': 'हाँ, वही समस्या',
    'report.duplicateNo': 'नहीं, कुछ और',
    'report.fixedBody':
      'उसी जगह की बाद की फ़ोटो भेजें। एक मॉडल उसकी तुलना मूल फ़ोटो से करता है और तय करता है कि समस्या गई या नहीं; उत्तर इतिहास में दर्ज होता है।',
    'report.fixedButton': 'बाद की फ़ोटो भेजें',
    'report.fixedSending': 'भेजा जा रहा है…',
    'report.timelineNote':
      'रिपोर्ट के अपने स्थिति-इतिहास से स्वतः दर्ज। यह किसी सरकारी विभाग का संदेश नहीं है।',
    'report.evidenceNote':
      'रिपोर्ट के समय OpenStreetMap और Open-Meteo से पढ़ा गया। आसपास की खाली सूची का अर्थ है कि वहाँ कुछ मैप नहीं है, यह नहीं कि कुछ है ही नहीं।',
    'report.missing': 'जाँचा नहीं गया',
    'report.filedUnder': 'आपने इसे इस श्रेणी में भेजा',
    'report.modelSaid': 'फ़ोटो को पढ़ा गया',
    'report.routingOutside':
      'प्रयागराज पायलट क्षेत्र से बाहर, इसलिए कोई शिकायत नहीं भेजी गई और रिपोर्ट अभिलेख के रूप में बोर्ड पर रहती है।',
    'report.routingDelivered': 'शिकायत परियोजना के परीक्षण इनबॉक्स पर भेजी गई',
    'report.routingFailed': 'शिकायत तैयार हुई, पर ईमेल नहीं भेजा जा सका',
    'report.routingProvisional': 'नहीं भेजा: गंभीरता अभी अनंतिम है क्योंकि',
    'report.routingWaiting': 'अभी नहीं भेजा: ऊपर दिए दोहराव के प्रश्न का उत्तर प्रतीक्षित है।',
    'report.routingAnalysing': 'अभी नहीं भेजा: विश्लेषण चल रहा है।',
    'report.routingNone': 'इस रिपोर्ट के लिए कुछ नहीं भेजा गया।',
    'report.escalationNote': 'परियोजना के परीक्षण इनबॉक्स पर भेजा गया, किसी अधिकारी को नहीं।',
    'report.commentsSort': 'क्रम',
    'report.commentsTop': 'शीर्ष',
    'report.commentsNewest': 'नवीनतम',
    'report.commentsEmpty': 'अभी कोई टिप्पणी नहीं।',
    'report.commentsMore': 'दिखाएँ',
    'report.commentPlaceholder': 'टिप्पणी जोड़ें',
    'report.commentPost': 'भेजें',
    'report.notFound': 'वह रिपोर्ट नहीं मिली।',
    'report.waiting': 'फ़ोटो जाँच पूरी होने की प्रतीक्षा।',
    'report.analysisRunning': 'फ़ोटो की जाँच चल रही है। यह पृष्ठ स्वयं बदलता है।',
    'report.analysisStalled': 'जाँच सामान्य से अधिक समय ले रही है।',
    'report.notVerified': 'अभी किसी ने सत्यापित नहीं किया।',
    'report.noResponse': 'अभी किसी विभाग का उत्तर दर्ज नहीं।',
    'progress.back': 'रिपोर्टों पर लौटें',
  },
}

/** @type {import('react').Context<{lang: string, setLang: (l: string) => void, t: (key: string, fallback?: string) => string}|null>} */
const I18nContext = createContext(null)

function readStored() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'hi' || value === 'en' ? value : 'en'
  } catch {
    return 'en'
  }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readStored)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage blocked: the choice lasts for the session */
    }
  }, [])

  const t = useCallback(
    (key, fallback) => {
      const table = STRINGS[lang] || STRINGS.en
      return table[key] ?? STRINGS.en[key] ?? fallback ?? key
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>')
  return context
}

/** Merge a Hindi override object over an English copy object. */
export function useMergedCopy(english, hindi) {
  const { lang } = useI18n()
  return useMemo(
    () => (lang === 'hi' ? { ...english, ...hindi } : english),
    [lang, english, hindi],
  )
}

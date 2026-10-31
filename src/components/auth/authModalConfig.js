/**
 * Copy and structure for every auth view.
 *
 * Adding a whole new view = add an entry here + one component in ./views and
 * one case in AuthModal's view switch. Adding a sign-in method = one entry in
 * `methods` below, nothing else.
 */

export const TAB_ORDER = ['login', 'signup']

export const views = {
  login: {
    id: 'login',
    tab: 'Log in',
    title: { lead: 'welcome', accent: 'back' },
    helper: 'Log in to report an issue, follow it, and see what gets fixed.',
    panel: {
      title: { lead: 'the ward is', accent: 'listening' },
      body: 'One account covers your reports, your polls and every update the ward office posts.',
    },
  },
  signup: {
    id: 'signup',
    tab: 'Sign up',
    title: { lead: 'join your', accent: 'community' },
    helper: 'Create an account so the ward office knows who to reply to.',
    panel: {
      title: { lead: 'add your', accent: 'signal' },
      body: 'Neighbors already on the air report the small things before they become the big ones.',
    },
  },
  forgot: {
    id: 'forgot',
    tab: 'Reset',
    title: { lead: 'reset your', accent: 'password' },
    helper: 'We will send a reset link to the email or phone on your account.',
    panel: {
      title: { lead: 'back on', accent: 'air' },
      body: 'A reset link is all it takes. Your reports and followed issues stay exactly where they were.',
    },
  },
  verify: {
    id: 'verify',
    tab: 'Verify',
    title: { lead: 'check your', accent: 'messages' },
    helper: 'Enter the six-digit code we sent you.',
    panel: {
      title: { lead: 'almost', accent: 'there' },
      body: 'One code and your account is on the air. Nothing else is sent until you confirm.',
    },
  },
}

export const benefits = [
  'See what neighbors are reporting',
  'Vote on open polls in your ward',
  'Track what actually gets fixed',
]

export const methods = [
  { id: 'google', label: 'Continue with Google', enabled: false },
  { id: 'phone-otp', label: 'Continue with phone code', enabled: false },
]

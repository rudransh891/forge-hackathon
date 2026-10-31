/**
 * The two feed surfaces that have no table behind them yet: the notices strip
 * and the poll. Everything else on the feed comes from the API (see
 * feedService.js).
 *
 * Both are clearly labelled in the UI as not connected, so nothing here claims
 * to be a live municipal record.
 */

export const notices = [
  {
    id: 'n-1',
    label: 'Prayagraj pilot: reports inside the city boundary are the ones routed',
    href: '#faq',
  },
  {
    id: 'n-2',
    label: 'Photo analysis usually takes under a minute',
    href: '#how-it-works',
  },
  {
    id: 'n-3',
    label: 'Nearby reports on the same issue are matched automatically',
    href: '#/issues',
  },
]

export const poll = {
  id: 'p-1',
  question: 'Which fix should the pilot chase first this week?',
  closes: null,
  options: [
    { id: 'roads', label: 'Potholes and road damage', votes: 0 },
    { id: 'garbage', label: 'Garbage collection', votes: 0 },
    { id: 'lights', label: 'Streetlights not working', votes: 0 },
  ],
}

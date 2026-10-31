/**
 * Navigation breadcrumb between the feed and a report page. Plain module
 * state (no storage): `cameFromFeed` tells the back link to use history so the
 * feed can restore its own position, and `restoringFeed` tells the router not
 * to jump to the top when that restore is about to happen.
 */
export const feedNavigation = {
  cameFromFeed: false,
  restoringFeed: false,
  /** Scroll offset captured when a headline was clicked, before the feed unmounts. */
  scrollY: 0,
}

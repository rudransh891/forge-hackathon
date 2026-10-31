/**
 * Feed icons. The shared glyphs come from the auth set so there is one family;
 * the feed-only shapes follow the same 24px grid, currentColor and square ends.
 */
export { AlertIcon, BroadcastIcon, CheckIcon, CloseIcon, InfoIcon } from '../auth/icons'

function Svg({ size = 16, className, children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={className}
    >
      {children}
    </svg>
  )
}

export function CommentIcon({ size = 16, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M3 4h18v12H8l-5 4V4Zm2 2v9.2l2.4-1.2H19V6H5Z" />
    </Svg>
  )
}

export function MapPinIcon({ size = 16, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M11 2h2v2h2v2h2v6h-2v2h-2v2h-2v2h-2v-2H9v-2H7v-2H5V6h2V4h2V2h2Zm0 4H9v2H7v4h2v2h2v2h2v-2h2v-2h2V8h-2V6h-2v2h-4V6Z" />
    </Svg>
  )
}

export function PauseIcon({ size = 16, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" />
    </Svg>
  )
}

export function PlayIcon({ size = 16, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M7 4h4v16H7V4Zm6 4h4v12h-4V8Z" />
    </Svg>
  )
}

export function PhotoIcon({ size = 24, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M3 4h18v16H3V4Zm2 2v9l4-4 3 3 3-3 4 4V6H5Zm3 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </Svg>
  )
}

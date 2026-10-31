/**
 * Every icon in the modal. Inline SVG only, 24px grid, currentColor fills so
 * colour always comes from the parent element.
 *
 * The two eye paths are Material Symbols Outlined shapes supplied by the
 * project owner; their path data and viewBox are untouched (the source files
 * carried a hard-coded #3E2419 fill and 24px size, both removed here).
 */

function Svg({ size = 20, className, children, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  )
}

export function EyeIcon({ size = 20, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M15.19,14.69q1.31-1.31 1.31-3.19T15.19,8.31T12,7T8.81,8.31T7.5,11.5t1.31,3.19T12,16t3.19-1.31Zm-5.1-1.28Q9.3,12.63 9.3,11.5t0.79-1.91T12,8.8t1.91,0.79q0.79,0.79 0.79,1.91t-0.79,1.91T12,14.2t-1.91-0.79ZM5.35,16.96Q2.35,14.93 1,11.5Q2.35,8.07 5.35,6.04T12,4t6.65,2.04T23,11.5q-1.35,3.42-4.35,5.46T12,19T5.35,16.96ZM12,11.5Zm5.19,4.01q2.36-1.49 3.61-4.01q-1.25-2.53-3.61-4.01T12,6Q9.18,6 6.81,7.49T3.2,11.5q1.25,2.52 3.61,4.01T12,17t5.19-1.49Z" />
    </Svg>
  )
}

export function EyeOffIcon({ size = 20, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M16.1,13.3l-1.45-1.45q0.22-1.18-0.67-2.2q-0.9-1.02-2.33-0.8L10.2,7.4q0.42-0.2 0.86-0.3T12,7q1.88,0 3.19,1.31T16.5,11.5q0,0.5-0.1,0.94T16.1,13.3Zm3.2,3.15l-1.45-1.4q0.95-0.72 1.69-1.59T20.8,11.5q-1.25-2.53-3.59-4.01T12,6q-0.72,0-1.42,0.1T9.2,6.4L7.65,4.85q1.03-0.43 2.1-0.64T12,4q3.78,0 6.73,2.09T23,11.5q-0.57,1.47-1.51,2.74T19.3,16.45Zm0.5,6.15l-4.2-4.15q-0.88,0.28-1.76,0.41T12,19q-3.78,0-6.73-2.09T1,11.5q0.53-1.33 1.33-2.46T4.15,7L1.4,4.2L2.8,2.8L21.2,21.2l-1.4,1.4ZM5.55,8.4Q4.83,9.05 4.23,9.82T3.2,11.5q1.25,2.52 3.59,4.01T12,17q0.5,0 0.98-0.06t0.97-0.14l-0.9-0.95q-0.28,0.07-0.53,0.11T12,16q-1.88,0-3.19-1.31T7.5,11.5q0-0.28 0.04-0.53t0.11-0.53L5.55,8.4Zm7.98,2.33ZM9.75,12.6Z" />
    </Svg>
  )
}

export function CloseIcon({ size = 20, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M6.4 4.99 12 10.59 17.6 4.99 19.01 6.4 13.41 12l5.6 5.6-1.41 1.41L12 13.41l-5.6 5.6L4.99 17.6l5.6-5.6-5.6-5.6Z" />
    </Svg>
  )
}

export function AlertIcon({ size = 20, className }) {
  return (
    <Svg size={size} className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.6 23 21.4H1L12 2.6Zm-1 6.2v5.8h2V8.8h-2Zm0 7.4v2h2v-2h-2Z"
      />
    </Svg>
  )
}

export function CheckIcon({ size = 20, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M9.55 17.6 3.8 11.85l1.4-1.4 4.35 4.35 9.25-9.25 1.4 1.4Z" />
    </Svg>
  )
}

export function InfoIcon({ size = 20, className }) {
  return (
    <Svg size={size} className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 4.2h2v2h-2v-2Zm0 3.8h2v8h-2v-8Z"
      />
    </Svg>
  )
}

export function BroadcastIcon({ size = 20, className }) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="2.4" />
      <path d="M8.6 5.3a9.4 9.4 0 0 0 0 13.4l1.42-1.42a7.4 7.4 0 0 1 0-10.56Z" />
      <path d="M15.4 5.3a9.4 9.4 0 0 1 0 13.4l-1.42-1.42a7.4 7.4 0 0 0 0-10.56Z" />
    </Svg>
  )
}

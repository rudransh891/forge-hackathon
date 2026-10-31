import { AlertIcon, CheckIcon } from './icons'
import { labels } from './feedConfig'

/**
 * Status tags. Urgent is the only thing on the page allowed to combine the
 * coral tag, the warning icon and the 4px left edge.
 */
export function StatusTag({ status, urgent, update }) {
  if (urgent) {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 bg-coral-700 px-2 text-[12px] font-semibold text-cream-50">
        <AlertIcon size={14} />
        Urgent
      </span>
    )
  }
  if (status === 'resolved') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 bg-green-100 px-2 text-[12px] font-semibold text-green-700">
        <CheckIcon size={14} />
        Resolved
      </span>
    )
  }
  return null
}

export function UpdateNote({ update }) {
  if (!update) return null
  return (
    <p className="mt-2 border border-sand-300 px-2 py-1.5 text-[12px] leading-5 text-brown-600">
      Update: {update}
    </p>
  )
}

export function VerificationMark({ verification, short = false }) {
  if (verification === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 text-green-700">
        <CheckIcon size={12} />
        {short ? 'Verified' : labels.verified}
      </span>
    )
  }
  return <span>{labels.unverified}</span>
}

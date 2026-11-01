import { AlertIcon, CheckIcon, InfoIcon } from './icons'
import { useI18n } from '@/lib/i18n'

/**
 * Status tags. Urgent is the only thing on the page allowed to combine the
 * coral tag, the warning icon and the 4px left edge.
 *
 * The backend has more states than the design had: a report can fail its
 * photo analysis or be merged into another report. Those show a tag too, so a
 * failed report never looks like a healthy open one.
 */
export function StatusTag({ status, urgent }) {
  const { t } = useI18n()
  if (urgent) {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 bg-coral-700 px-2 text-[12px] font-semibold text-cream-50">
        <AlertIcon size={14} />
        {t('status.urgent')}
      </span>
    )
  }
  if (status === 'resolved') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 bg-green-100 px-2 text-[12px] font-semibold text-green-700">
        <CheckIcon size={14} />
        {t('status.resolved')}
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 bg-teal-400 px-2 text-[12px] font-semibold text-brown-900">
        {t('status.inProgress')}
      </span>
    )
  }
  if (status === 'acknowledged') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 bg-sand-300 px-2 text-[12px] font-semibold text-brown-900">
        {t('status.acknowledged')}
      </span>
    )
  }
  if (status === 'merged') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 bg-sand-100 px-2 text-[12px] font-semibold text-brown-900">
        {t('status.duplicate')}
      </span>
    )
  }
  if (status === 'needs_better_photo') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 bg-coral-100 px-2 text-[12px] font-semibold text-coral-700">
        <InfoIcon size={14} />
        {t('status.needsPhoto')}
      </span>
    )
  }
  if (status === 'needs_review') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 bg-teal-100 px-2 text-[12px] font-semibold text-brown-900">
        <InfoIcon size={14} />
        {t('status.underReview')}
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
  const { t } = useI18n()
  if (verification === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 text-green-700">
        <CheckIcon size={12} />
        {short ? t('status.verified') : t('status.verified')}
      </span>
    )
  }
  return <span>{t('status.unverified')}</span>
}

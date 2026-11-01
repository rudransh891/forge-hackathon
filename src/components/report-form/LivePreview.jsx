import { ReportCard } from '@/components/feed/ReportCard'
import { useCopy } from './formConfig'

/**
 * Desktop rail preview: the real feed card, rendered from the draft.
 * Hidden from assistive tech because it duplicates the form's own content.
 */
export function LivePreview({ draft }) {
  const copy = useCopy()
  const photo = draft.photos[0]?.url ?? null

  const report = {
    id: 'draft',
    title: draft.title || copy.previewTitle,
    category: draft.category || copy.previewCategory,
    locality: draft.location?.locality || copy.previewArea,
    ageDays: 0,
    verification: 'unverified',
    urgent: false,
    status: 'open',
    photo,
    comments: 0,
    supporters: 0,
    description: '',
  }

  return (
    <section aria-label={copy.previewLabel}>
      <p className="text-[12px] text-brown-600">{copy.previewLabel}</p>

      {/* Until a photo exists the card has an empty image well, which reads as a
          broken card. Name the space instead. */}
      {photo ? null : (
        <div
          aria-hidden="true"
          className="mt-2 border border-sand-300 bg-cream-100 px-3 py-6 text-center text-[12px] text-brown-600"
        >
          {copy.previewNoPhoto}
        </div>
      )}

      <div aria-hidden="true" inert className="mt-2 border-t border-sand-300 pt-2">
        <ReportCard report={report} supported={false} onSupport={() => {}} />
      </div>
      <p className="mt-2 text-[12px] text-brown-600">{copy.previewCaption}</p>
    </section>
  )
}

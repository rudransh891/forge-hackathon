import { ReportCard } from '@/components/feed/ReportCard'
import { copy } from './formConfig'

/**
 * Desktop rail preview: the real feed card, rendered from the draft.
 * Hidden from assistive tech because it duplicates the form's own content.
 */
export function LivePreview({ draft }) {
  const report = {
    id: 'draft',
    title: draft.title || 'Your title appears here',
    category: draft.category || 'Category',
    locality: draft.location?.locality || 'Your area',
    ageDays: 0,
    verification: 'unverified',
    urgent: false,
    status: 'open',
    photo: draft.photos[0]?.url ?? null,
    comments: 0,
    supporters: 0,
    description: '',
  }

  return (
    <section aria-label={copy.previewLabel}>
      <p className="text-[12px] text-brown-600">{copy.previewLabel}</p>
      <div aria-hidden="true" inert className="mt-2 border-t border-sand-300 pt-2">
        <ReportCard report={report} supported={false} onSupport={() => {}} />
      </div>
      <p className="mt-2 text-[12px] text-brown-600">{copy.previewCaption}</p>
    </section>
  )
}

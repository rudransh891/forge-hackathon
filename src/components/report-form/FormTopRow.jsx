import { CheckIcon } from '@/components/feed/icons'
import { copy } from './formConfig'

/** Cancel on the left, the draft's state on the right. */
export function FormTopRow({ onCancel, saved }) {
  return (
    <div className="flex h-11 items-center justify-between">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-11 items-center gap-1.5 text-[14px] text-brown-900 hover:text-coral-700 hover:underline hover:decoration-coral-500 hover:decoration-2 hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
      >
        <span aria-hidden className="text-[16px] leading-none">
          ✕
        </span>
        {copy.cancel}
      </button>

      <p aria-live="polite" className="flex items-center gap-1.5 text-[13px] text-brown-600">
        {saved ? (
          <>
            <CheckIcon size={14} className="text-green-700" />
            {copy.draftSaved}
          </>
        ) : null}
      </p>
    </div>
  )
}

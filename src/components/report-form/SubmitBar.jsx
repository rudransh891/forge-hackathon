import { copy } from './formConfig'

/** Submit row: fixed on mobile, inline at the end of the form on desktop. */
export function SubmitBar({ onSaveDraft, onPost, sending, fixed }) {
  return (
    <div
      className={
        fixed
          ? 'fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-sand-300 bg-cream-50 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden'
          : 'mt-8 hidden items-center justify-between gap-4 border-t border-sand-300 pt-4 lg:flex'
      }
    >
      <button
        type="button"
        onClick={onSaveDraft}
        className="h-11 text-[14px] font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
      >
        {copy.saveDraft}
      </button>
      <button
        type="submit"
        onClick={onPost}
        disabled={sending}
        className="h-12 min-w-[160px] bg-green-700 px-5 text-[15px] font-semibold text-cream-50 transition-colors duration-[var(--motion-base)] hover:bg-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:bg-sand-300 disabled:text-brown-600"
      >
        {sending ? copy.posting : copy.post}
      </button>
    </div>
  )
}

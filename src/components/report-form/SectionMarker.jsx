/** "01 | Photo ————————— up to 4" — the numbered marker used on this page. */
export function SectionMarker({ id, index, label, note }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] font-semibold text-coral-700">{index}</span>
      <span aria-hidden className="h-4 w-px bg-sand-300" />
      <h2 id={id} className="text-[14px] font-semibold text-brown-900">{label}</h2>
      <span aria-hidden className="h-px flex-1 bg-sand-300" />
      {note ? <span className="shrink-0 text-[12px] text-brown-600">{note}</span> : null}
    </div>
  )
}

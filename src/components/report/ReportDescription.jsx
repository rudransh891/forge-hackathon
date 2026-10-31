/** Body text. 65ch measure, no drop cap, no pull quote. */
export function ReportDescription({ description }) {
  if (!description) return null
  return (
    <p className="max-w-[65ch] text-[16px] leading-[1.7] text-brown-900">{description}</p>
  )
}

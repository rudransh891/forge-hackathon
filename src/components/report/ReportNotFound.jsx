/** Unknown report id. */
export function ReportNotFound() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-16 lg:px-0">
      <h1 className="font-display text-[28px] leading-tight text-brown-900 lg:text-[36px]">
        We couldn&apos;t find that report.
      </h1>
      <a
        href="#/issues"
        className="mt-4 inline-block text-[15px] font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
      >
        Back to reports
      </a>
    </main>
  )
}

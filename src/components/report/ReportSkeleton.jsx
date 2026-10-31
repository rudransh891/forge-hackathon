/** Loading state: static sand-100 blocks, no shimmer. */
export function ReportSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 pb-24 lg:px-0">
      <div aria-hidden className="pt-4">
        <div className="h-6 w-24 bg-sand-100" />
        <div className="mt-4 h-4 w-52 bg-sand-100" />
        <div className="mt-3 h-9 w-full max-w-[520px] bg-sand-100" />
        <div className="mt-2 h-9 w-2/3 max-w-[360px] bg-sand-100" />
        <div className="mt-4 h-[200px] w-full bg-sand-100 lg:h-[320px]" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full bg-sand-100" />
          <div className="h-4 w-11/12 bg-sand-100" />
          <div className="h-4 w-3/4 bg-sand-100" />
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading report
      </p>
    </main>
  )
}

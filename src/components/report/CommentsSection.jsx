import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchComments, flagComment } from '@/components/feed/feedService'
import { detailCommentsPageSize, labels } from '@/components/feed/feedConfig'
import { CommentComposer } from './CommentComposer'
import { CommentItem } from './CommentItem'

/**
 * Flat comments: three first, ten per "Show more" click, sort resets the list.
 * The top comment tag only exists under the "Top" sort with at least 5 helpful.
 */
export function CommentsSection({ reportId, commentCount, onRequireAuth }) {
  const [sort, setSort] = useState('top')
  const [items, setItems] = useState([])
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(commentCount ?? 0)
  const [loading, setLoading] = useState(true)
  const [announcement, setAnnouncement] = useState('')
  const requestId = useRef(0)

  const load = useCallback(
    async (nextSort, nextOffset, limit) => {
      const id = ++requestId.current
      setLoading(true)
      const page = await fetchComments(reportId, { sort: nextSort, offset: nextOffset, limit })
      if (id !== requestId.current) return
      setItems((current) => (nextOffset === 0 ? page.items : [...current, ...page.items]))
      setOffset(nextOffset + page.items.length)
      setTotal(page.total)
      setLoading(false)
      if (nextOffset > 0) setAnnouncement(`${page.items.length} more comments loaded`)
    },
    [reportId],
  )

  useEffect(() => {
    load('top', 0, 3)
  }, [load])

  useEffect(() => {
    load(sort, 0, 3)
    // re-run only when the sort changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort])

  const remaining = Math.max(0, total - items.length)
  const topId =
    sort === 'top'
      ? [...items].sort((a, b) => b.helpful - a.helpful).find((comment) => comment.helpful >= 5)?.id
      : undefined

  const onFlag = (reason) => {
    flagComment({ commentId: 'local', reason })
    setAnnouncement("Thanks, we'll review this")
  }

  return (
    <section aria-labelledby="comments-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="comments-heading" className="text-[16px] font-semibold text-brown-900">
          Comments · {total}
        </h2>
        <label className="flex items-center gap-2 text-[13px] text-brown-600">
          Sort
          <span className="relative inline-flex">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-11 appearance-none border border-brown-600 bg-cream-50 pr-9 pl-3 text-[13px] text-brown-900 focus:outline-none focus-visible:border-green-700 focus-visible:outline-none"
            >
              <option value="top">Top</option>
              <option value="newest">Newest</option>
            </select>
            <svg
              aria-hidden="true"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-coral-500"
            >
              <path d="M12 16.5 3.5 7.5h17L12 16.5Z" />
            </svg>
          </span>
        </label>
      </div>

      <CommentComposer reportId={reportId} onRequireAuth={onRequireAuth} />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {items.length === 0 && !loading ? (
        <p className="mt-4 text-[14px] text-brown-600">{labels.emptyComments}</p>
      ) : (
        <ul className="mt-2 list-none p-0">
          {items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isTop={comment.id === topId}
              announcement={setAnnouncement}
              onFlag={onFlag}
            />
          ))}
        </ul>
      )}

      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => load(sort, offset, detailCommentsPageSize)}
          className="mt-3 h-11 text-[14px] font-semibold text-brown-900 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          Show {remaining} more comments
        </button>
      ) : null}
    </section>
  )
}

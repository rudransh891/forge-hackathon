import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchReports } from './feedService'
import { categoryLabel, support as supportCopy } from './feedConfig'

/**
 * Feed state: filter, sort, paging, support toggles and live announcements.
 * Everything lives in React state so it survives a lightbox or a report visit.
 */
export function useFeed() {
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('top')
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [status, setStatus] = useState('loading')
  const [hasMore, setHasMore] = useState(true)
  const [announcement, setAnnouncement] = useState('')
  const [supported, setSupported] = useState({})
  const requestId = useRef(0)

  const load = useCallback(
    async ({ nextCategory, nextSort, nextCursor, mode }) => {
      const id = ++requestId.current
      setStatus('loading')
      try {
        const page = await fetchReports({
          category: nextCategory,
          sort: nextSort,
          cursor: nextCursor,
        })
        if (id !== requestId.current) return
        setItems((current) => (nextCursor ? [...current, ...page.items] : page.items))
        setCursor(page.nextCursor)
        setHasMore(Boolean(page.nextCursor))
        setStatus('idle')
        if (mode === 'more') {
          setAnnouncement(`${page.items.length} more reports loaded`)
        } else {
          setAnnouncement(`${page.total} reports in ${categoryLabel(nextCategory)}`)
        }
      } catch {
        if (id !== requestId.current) return
        setStatus('error')
      }
    },
    [],
  )

  useEffect(() => {
    load({ nextCategory: category, nextSort: sort, nextCursor: null, mode: 'reset' })
  }, [category, sort, load])

  const loadMore = useCallback(() => {
    if (status === 'loading' || !hasMore) return
    load({ nextCategory: category, nextSort: sort, nextCursor: cursor, mode: 'more' })
  }, [category, cursor, hasMore, load, sort, status])

  const retry = useCallback(() => {
    load({ nextCategory: category, nextSort: sort, nextCursor: null, mode: 'reset' })
  }, [category, load, sort])

  const changeCategory = useCallback((next) => {
    setCategory(next)
    setAnnouncement('')
  }, [])

  const changeSort = useCallback((next) => {
    setSort(next)
    setAnnouncement('')
  }, [])

  const toggleSupport = useCallback((id) => {
    setSupported((current) => {
      const next = { ...current, [id]: !current[id] }
      setAnnouncement(next[id] ? supportCopy.addAnnouncement : supportCopy.removeAnnouncement)
      return next
    })
  }, [])

  return {
    category,
    sort,
    items,
    status,
    hasMore,
    announcement,
    supported,
    changeCategory,
    changeSort,
    loadMore,
    retry,
    toggleSupport,
  }
}

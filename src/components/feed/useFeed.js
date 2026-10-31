import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { fetchReports } from './feedService'
import { categoryLabel, support as supportCopy } from './feedConfig'
import {
  getSnapshot as getStoreSnapshot,
  subscribe as subscribeStore,
  toggleSupport as toggleSupportInStore,
} from '../report/reportStore'

/**
 * The feed is unmounted while a report is open, so its page state lives in this
 * module between visits (memory only, per session). The report page reads the
 * same reportStore for support, which is what keeps the two in agreement.
 */
let feedSnapshot = null

/**
 * Feed state: filter, sort, paging, support toggles and live announcements.
 */
export function useFeed() {
  const [category, setCategory] = useState(() => feedSnapshot?.category ?? 'All')
  const [sort, setSort] = useState(() => feedSnapshot?.sort ?? 'top')
  const [items, setItems] = useState(() => feedSnapshot?.items ?? [])
  const [cursor, setCursor] = useState(() => feedSnapshot?.cursor ?? null)
  const [status, setStatus] = useState(() =>
    feedSnapshot?.items?.length ? 'idle' : 'loading',
  )
  const [hasMore, setHasMore] = useState(() => feedSnapshot?.hasMore ?? true)
  const [announcement, setAnnouncement] = useState('')
  const skipInitialLoad = useRef(Boolean(feedSnapshot?.items?.length))
  const requestId = useRef(0)

  const store = useSyncExternalStore(subscribeStore, getStoreSnapshot)
  const supported = store.supported

  const load = useCallback(async ({ nextCategory, nextSort, nextCursor, mode }) => {
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
  }, [])

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false
      return
    }
    load({ nextCategory: category, nextSort: sort, nextCursor: null, mode: 'reset' })
  }, [category, sort, load])

  // Keep the snapshot current so returning from a report restores the list.
  useEffect(() => {
    feedSnapshot = {
      category,
      sort,
      items,
      cursor,
      hasMore,
      scrollY: feedSnapshot?.scrollY ?? 0,
    }
  }, [category, sort, items, cursor, hasMore])

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
    const nowSupported = toggleSupportInStore(id)
    setAnnouncement(nowSupported ? supportCopy.addAnnouncement : supportCopy.removeAnnouncement)
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

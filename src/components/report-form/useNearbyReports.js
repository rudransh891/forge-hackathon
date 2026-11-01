import { useEffect, useState } from 'react'
import { findNearbyReports } from './reportFormService'

/**
 * Debounced duplicate check. It runs only once there is a category, a location
 * and eight characters of title, and it never blocks posting.
 */
export function useNearbyReports({ category, title, location }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!category || !location || title.trim().length < 8) {
      setItems([])
      return undefined
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const result = await findNearbyReports({
          category,
          title,
          blockLabel: location.blockLabel,
          signal: controller.signal,
        })
        if (!controller.signal.aborted) setItems(result.slice(0, 2))
      } catch {
        /* an aborted or failed check must never surface as a form error */
      }
    }, 500)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [category, title, location?.blockLabel])

  return items
}

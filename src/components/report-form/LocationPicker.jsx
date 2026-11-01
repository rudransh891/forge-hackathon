import { useEffect, useRef, useState } from 'react'
import { MapPinIcon } from '@/components/feed/icons'
import { LocationPicker as MapPicker } from '@/components/map/CivicMap'
import { copy } from './formConfig'
import { reverseToBlock, searchPlaces } from './reportFormService'

const round = (value) => Math.round(value * 1000) / 1000

/**
 * Location, block level only.
 *
 * Three ways in, all of which end with coordinates: the device fix, a typed
 * street (forward geocode), or tapping the map. The label shown is "road,
 * locality" from the reverse geocoder — the exact address never reaches the
 * browser, and the pin is rounded to three decimals like the fix itself.
 *
 * The map is the honest one: it shows the block the report will carry.
 */
export function LocationPicker({ location, onLocation, onCoords, error, announce }) {
  const [status, setStatus] = useState('idle')
  const [mode, setMode] = useState('device')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [active, setActive] = useState(-1)
  const [coords, setCoords] = useState(null)
  const reverseTimer = useRef(null)

  useEffect(
    () => () => {
      if (reverseTimer.current) clearTimeout(reverseTimer.current)
    },
    [],
  )

  /**
   * A drafted report keeps its block label but not its coordinates (they are
   * held in memory only). Without this, such a draft would look complete and
   * then refuse to post. Look the label back up once and restore the point.
   */
  useEffect(() => {
    if (!location || coords) return undefined
    let alive = true
    searchPlaces(location.blockLabel).then((results) => {
      if (!alive || results.length === 0) return
      const first = results[0]
      const next = { lat: first.lat, lng: first.lng }
      setCoords(next)
      onCoords(next)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.blockLabel])

  const remember = (next) => {
    setCoords(next)
    onCoords(next)
  }

  /** Name the block once the pin stops moving; tapping is not a rate-limit race. */
  const describe = (lat, lng) => {
    if (reverseTimer.current) clearTimeout(reverseTimer.current)
    reverseTimer.current = setTimeout(async () => {
      const block = await reverseToBlock(lat, lng)
      onLocation(block)
      announce(`Location set to ${block.blockLabel}`)
    }, 400)
  }

  const onPoint = (lat, lng) => {
    const next = { lat: round(lat), lng: round(lng) }
    remember(next)
    setMessage('')
    describe(next.lat, next.lng)
  }

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setMode('manual')
      setMessage('This browser cannot find your location. Type a street, or tap the map.')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      ({ coords: fix }) => {
        const next = { lat: round(fix.latitude), lng: round(fix.longitude) }
        remember(next)
        setStatus('idle')
        describe(next.lat, next.lng)
      },
      () => {
        setStatus('idle')
        setMode('manual')
        setMessage(
          "We couldn't get your location. Type a street, or tap the map to place the pin.",
        )
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    )
  }

  const runSearch = async (value) => {
    setQuery(value)
    const results = await searchPlaces(value)
    setSuggestions(results)
    setActive(-1)
  }

  const choose = (place) => {
    remember({ lat: place.lat, lng: place.lng })
    onLocation({ blockLabel: place.blockLabel, locality: place.locality, approximate: true })
    setSuggestions([])
    setMessage('')
    announce(`Location set to ${place.blockLabel}`)
  }

  const reset = () => {
    onLocation(null)
    onCoords(null)
    setCoords(null)
    setMode('device')
    setMessage('')
    setQuery('')
    setSuggestions([])
  }

  if (location) {
    return (
      <div className="flex flex-col gap-3">
        <MapPicker
          lat={coords?.lat ?? null}
          lng={coords?.lng ?? null}
          onChange={onPoint}
          className="h-[180px] w-full"
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-brown-900">{location.blockLabel}</p>
            <p className="mt-1 text-[13px] text-brown-600">{copy.locationHelper}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="h-11 shrink-0 text-[14px] font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {copy.changeLocation}
          </button>
        </div>
        <p className="text-[12px] text-brown-600">{copy.mapHint}</p>
      </div>
    )
  }

  return (
    <div
      id="location-group"
      tabIndex={-1}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? 'location-error' : undefined}
    >
      <MapPicker
        lat={coords?.lat ?? null}
        lng={coords?.lng ?? null}
        onChange={onPoint}
        className="h-[220px] w-full"
      />
      <p className="mt-1.5 text-[12px] text-brown-600">{copy.mapHint}</p>

      {mode === 'device' ? (
        <button
          type="button"
          onClick={useMyLocation}
          disabled={status === 'locating'}
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 border border-green-700 text-[15px] font-semibold text-green-700 transition-colors duration-[var(--motion-base)] hover:bg-green-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none disabled:border-sand-300 disabled:text-brown-600"
        >
          <MapPinIcon size={16} />
          {status === 'locating' ? copy.locating : copy.useLocation}
        </button>
      ) : null}

      {mode === 'device' ? (
        <button
          type="button"
          onClick={() => setMode('manual')}
          className="mt-2 h-11 text-[13px] text-brown-600 underline decoration-sand-300 underline-offset-4 hover:text-coral-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          or type a street
        </button>
      ) : (
        <div className="relative mt-3">
          <label htmlFor="manual-location" className="text-[14px] font-semibold text-brown-900">
            {copy.manualLabel}
          </label>
          <input
            id="manual-location"
            type="text"
            value={query}
            onChange={(event) => runSearch(event.target.value)}
            onKeyDown={(event) => {
              if (!suggestions.length) return
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActive((index) => Math.min(index + 1, suggestions.length - 1))
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActive((index) => Math.max(index - 1, 0))
              }
              if (event.key === 'Enter' && active >= 0) {
                event.preventDefault()
                choose(suggestions[active])
              }
            }}
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls="place-suggestions"
            aria-autocomplete="list"
            placeholder={copy.manualPlaceholder}
            className="mt-1.5 h-12 w-full border border-brown-600 bg-cream-50 px-3 text-[16px] text-brown-900 placeholder:text-brown-600 focus-visible:border-2 focus-visible:border-green-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          />
          <p className="mt-1.5 text-[12px] text-brown-600">{copy.manualHint}</p>
          {suggestions.length ? (
            <ul
              id="place-suggestions"
              role="listbox"
              className="mt-1 list-none border border-sand-300 bg-cream-50 p-0"
            >
              {suggestions.map((place, index) => (
                <li
                  key={`${place.blockLabel}-${place.lat}-${place.lng}`}
                  role="option"
                  aria-selected={index === active}
                >
                  <button
                    type="button"
                    onClick={() => choose(place)}
                    className={`block h-11 w-full px-3 text-left text-[14px] focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${
                      index === active ? 'bg-sand-100 text-brown-900' : 'text-brown-900'
                    }`}
                  >
                    {place.blockLabel}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {message ? <p className="mt-2 text-[13px] text-coral-700">{message}</p> : null}
      {error ? (
        <p id="location-error" className="mt-2 text-[13px] text-coral-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

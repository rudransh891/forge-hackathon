import { useState } from 'react'
import { MapPinIcon } from '@/components/feed/icons'
import { copy } from './formConfig'
import { MapThumb } from './MapThumb'
import { reverseToBlock, searchPlaces } from './reportFormService'

/**
 * Location, block level only.
 *
 * The device fix is rounded to three decimals, used for the block lookup, then
 * handed to the page for the one place the API needs it (the POST). It is never
 * stored in the draft, never shown, never logged.
 */
export function LocationPicker({ location, onLocation, onCoords, error, announce }) {
  const [status, setStatus] = useState('idle')
  const [mode, setMode] = useState('device')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [active, setActive] = useState(-1)

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setMode('manual')
      setMessage('This browser cannot find your location. Enter a street or ZIP code instead.')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = Math.round(coords.latitude * 1000) / 1000
        const lng = Math.round(coords.longitude * 1000) / 1000
        const block = await reverseToBlock(lat, lng)
        onLocation(block)
        onCoords({ lat, lng })
        setStatus('idle')
        announce(`Location set to ${block.blockLabel}`)
      },
      () => {
        setStatus('idle')
        setMode('manual')
        setMessage(
          "We couldn't get your location. Enter a street or ZIP code instead.",
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
    onLocation({ ...place, approximate: true })
    onCoords(null)
    setSuggestions([])
    setMessage('')
    announce(`Location set to ${place.blockLabel}`)
  }

  if (location) {
    return (
      <div className="flex gap-3">
        <MapThumb className="size-[92px] shrink-0" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-brown-900">{location.blockLabel}</p>
          <p className="mt-1 text-[13px] text-brown-600">{copy.locationHelper}</p>
          <button
            type="button"
            onClick={() => {
              onLocation(null)
              onCoords(null)
              setMode('device')
            }}
            className="mt-1 h-11 text-[14px] font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {copy.changeLocation}
          </button>
        </div>
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
      {mode === 'device' ? (
        <button
          type="button"
          onClick={useMyLocation}
          disabled={status === 'locating'}
          className="inline-flex h-12 w-full items-center justify-center gap-2 border border-green-700 text-[15px] font-semibold text-green-700 transition-colors duration-[var(--motion-base)] hover:bg-green-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none disabled:border-sand-300 disabled:text-brown-600"
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
        <div className="relative">
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
            placeholder="Elm Street or 211015"
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
                <li key={place.blockLabel} role="option" aria-selected={index === active}>
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

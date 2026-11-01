import { MapPinIcon } from '@/components/feed/icons'
import { CivicMap } from '@/components/map/CivicMap'

/**
 * Address line + Map link, with the report's real location on a Leaflet map
 * where the caller has coordinates.
 *
 * The link opens OpenStreetMap at the same point in a new tab; the embedded map
 * is a read-only view so it cannot steal scroll from the page.
 */
export function LocationBlock({ addressBlock, withMap = false, mapHref, coords, lat, lng }) {
  const hasPoint = typeof lat === 'number' && typeof lng === 'number'

  return (
    <section aria-label="Location">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[15px] text-brown-900">
          <MapPinIcon size={16} className="shrink-0 text-coral-500" />
          {addressBlock}
        </p>
        <a
          href={mapHref || '#/issues'}
          target={mapHref ? '_blank' : undefined}
          rel={mapHref ? 'noreferrer' : undefined}
          className="text-[14px] font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          {mapHref ? 'Open map' : 'Map'}
        </a>
      </div>

      {coords ? <p className="mt-1 font-mono text-[12px] text-brown-600">{coords}</p> : null}

      {withMap && hasPoint ? (
        <div className="mt-3">
          <CivicMap
            lat={lat}
            lng={lng}
            label={`Map showing the reported location at ${addressBlock}`}
            className="h-[180px] w-full"
          />
        </div>
      ) : null}
    </section>
  )
}

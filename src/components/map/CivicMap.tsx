import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Leaflet maps: one report, the report form's picker, and the public map of all
 * reports.
 *
 * Tiles come from OpenStreetMap, which is free but asks for attribution and
 * modest traffic; the attribution control stays on for that reason. Markers are
 * square divIcons so they match the design's rectangles-only rule instead of
 * Leaflet's rounded pin.
 */

/** Prayagraj city centre, used when nothing better is known. */
const PRAYAGRAJ_CENTRE: [number, number] = [25.4358, 81.8463]

const markerIcon = L.divIcon({
  className: 'civic-map-pin',
  html: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const LEVEL_ICONS: Record<string, L.DivIcon> = {}

/** One square marker per severity level; unknown levels use the default pin. */
function levelIcon(level: string | null): L.DivIcon {
  if (!level) return markerIcon
  if (!LEVEL_ICONS[level]) {
    LEVEL_ICONS[level] = L.divIcon({
      className: `civic-map-pin civic-map-pin--${level}`,
      html: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
  }
  return LEVEL_ICONS[level]
}

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: false })
  }, [lat, lng, map])
  return null
}

/**
 * Leaflet measures its container once. Inside a `hidden lg:block` wrapper that
 * happens at size zero, and again whenever the window is resized.
 */
function SizeKeeper() {
  const map = useMap()
  useEffect(() => {
    const fix = () => map.invalidateSize()
    fix()
    const timer = window.setTimeout(fix, 250)
    window.addEventListener('resize', fix)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', fix)
    }
  }, [map])
  return null
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

type CivicMapProps = {
  lat: number
  lng: number
  zoom?: number
  className?: string
  label?: string
}

/** Read-only map with a single marker. */
export function CivicMap({ lat, lng, zoom = 16, className = '', label }: CivicMapProps) {
  return (
    <div className={`civic-map ${className}`} aria-label={label}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        className="h-full w-full"
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        attributionControl
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={ATTRIBUTION} />
        <Marker position={[lat, lng]} icon={markerIcon} />
        <Recenter lat={lat} lng={lng} />
        <SizeKeeper />
      </MapContainer>
    </div>
  )
}

type LocationPickerProps = {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  className?: string
}

/**
 * Click or drag the pin to set the coordinates the report will be filed with.
 * The number inputs beside it stay the source of truth; this only writes to them.
 */
export function LocationPicker({ lat, lng, onChange, className = '' }: LocationPickerProps) {
  const hasPoint = typeof lat === 'number' && typeof lng === 'number'
  const centre: [number, number] = hasPoint ? [lat, lng] : PRAYAGRAJ_CENTRE

  return (
    <div className={`civic-map ${className}`}>
      <MapContainer
        center={centre}
        zoom={hasPoint ? 16 : 12}
        className="h-full w-full"
        scrollWheelZoom={false}
        zoomControl
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={ATTRIBUTION} />
        {hasPoint ? (
          <Marker
            position={[lat, lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const point = event.target.getLatLng()
                onChange(point.lat, point.lng)
              },
            }}
          />
        ) : null}
        <ClickToPick onPick={onChange} />
        {hasPoint ? <Recenter lat={lat} lng={lng} /> : null}
        <SizeKeeper />
      </MapContainer>
    </div>
  )
}

export type MapPoint = {
  id: string
  lat: number
  lng: number
  label: string
  level: string | null
}

type ReportsMapProps = {
  points: MapPoint[]
  centre: [number, number]
  zoom?: number
  className?: string
}

/** The public map: every visible report as a marker coloured by severity. */
export function ReportsMap({ points, centre, zoom = 12, className = '' }: ReportsMapProps) {
  return (
    <div className={`civic-map ${className}`}>
      <MapContainer center={centre} zoom={zoom} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={ATTRIBUTION} />
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={levelIcon(point.level)}
          >
            <Popup>
              <a href={`#/issues/${point.id}`}>{point.label}</a>
            </Popup>
          </Marker>
        ))}
        <SizeKeeper />
      </MapContainer>
    </div>
  )
}

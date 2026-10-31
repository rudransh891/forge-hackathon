import { useEffect, useRef, useState } from 'react'
import { MAX_UPLOAD_BYTES, submitReport } from '@/lib/api'

/**
 * Report writing, deliberately bare: no design system, plain form controls.
 *
 * The backend only accepts a photo plus coordinates, so that is all this asks
 * for. Analysis runs in the background afterwards, which is why the success
 * state links to the report instead of showing a finished one.
 */
export function ReportSubmitPage() {
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [createdId, setCreatedId] = useState(null)
  const previewUrl = useRef(null)

  // Object URLs hold the blob for the life of the tab, so they are revoked
  // explicitly: on the next pick, and on unmount.
  const clearPhoto = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = null
    setPreview(null)
    setPhoto(null)
  }

  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    },
    [],
  )

  const onFile = (event) => {
    const file = event.target.files?.[0] ?? null
    setMessage('')

    if (file && file.size > MAX_UPLOAD_BYTES) {
      clearPhoto()
      setMessage(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.`)
      return
    }

    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = file ? URL.createObjectURL(file) : null
    setPreview(previewUrl.current)
    setPhoto(file)
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage('This browser cannot share a location. Enter the coordinates by hand.')
      return
    }
    setLocating(true)
    setMessage('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6))
        setLng(position.coords.longitude.toFixed(6))
        setLocating(false)
      },
      (error) => {
        setLocating(false)
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Enter the coordinates by hand.'
            : 'The location could not be read. Enter the coordinates by hand.',
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!photo) {
      setMessage('A photo is required. The analysis reads the photo, not your description.')
      return
    }
    if (!lat.trim() || !lng.trim()) {
      setMessage('Coordinates are required. Use the location button or type them in.')
      return
    }
    const latitude = Number(lat)
    const longitude = Number(lng)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setMessage('Coordinates must be numbers.')
      return
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setMessage('Those coordinates are outside the valid range.')
      return
    }

    setSubmitting(true)
    try {
      const receipt = await submitReport({ photo, lat: latitude, lng: longitude, description })
      setCreatedId(receipt.id)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The report could not be sent.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    clearPhoto()
    setDescription('')
    setLat('')
    setLng('')
    setMessage('')
    setCreatedId(null)
  }

  if (createdId) {
    return (
      <main>
        <h1>Report received</h1>
        <p>Reference {createdId}</p>
        <p>
          The photo is being analysed now. Severity, the suggested response time and the
          nearby-duplicate check appear on the report page as they finish.
        </p>
        <p>
          <a href={`#/issues/${createdId}`}>Open the report</a>
        </p>
        <p>
          <button type="button" onClick={reset}>
            File another report
          </button>
        </p>
      </main>
    )
  }

  return (
    <main>
      <h1>Report an issue</h1>
      <p>
        A photo and the location are required. Everything else is optional. This pilot covers
        Prayagraj; reports outside the city boundary are recorded but not routed.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <p>
          <label htmlFor="report-photo">Photo</label>
          <br />
          <input
            id="report-photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFile}
            required
          />
        </p>

        {preview ? (
          <p>
            <img src={preview} alt="The photo you selected" height="160" />
          </p>
        ) : null}

        <p>
          <label htmlFor="report-lat">Latitude</label>
          <br />
          <input
            id="report-lat"
            type="number"
            step="any"
            min="-90"
            max="90"
            value={lat}
            onChange={(event) => setLat(event.target.value)}
          />
        </p>

        <p>
          <label htmlFor="report-lng">Longitude</label>
          <br />
          <input
            id="report-lng"
            type="number"
            step="any"
            min="-180"
            max="180"
            value={lng}
            onChange={(event) => setLng(event.target.value)}
          />
        </p>

        <p>
          <button type="button" onClick={useMyLocation} disabled={locating}>
            {locating ? 'Reading location…' : 'Use my location'}
          </button>
        </p>

        <p>
          <label htmlFor="report-description">What is wrong here? (optional)</label>
          <br />
          <textarea
            id="report-description"
            rows={4}
            cols={50}
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </p>

        <p>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send report'}
          </button>
        </p>
      </form>

      <p role="alert">{message}</p>

      <p>
        <a href="#/issues">Back to reports</a>
      </p>
    </main>
  )
}

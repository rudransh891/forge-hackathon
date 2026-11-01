import { useEffect, useRef, useState } from 'react'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { getIdToken } from '@/components/auth/authService'
import { AlertIcon, CheckIcon, InfoIcon } from '@/components/feed/icons'
import { CategoryChips } from './CategoryChips'
import { FormTopRow } from './FormTopRow'
import { LeaveDialog } from './LeaveDialog'
import { LivePreview } from './LivePreview'
import { LocationPicker } from './LocationPicker'
import { NearbyCheck } from './NearbyCheck'
import { PhotoPicker } from './PhotoPicker'
import { ReportPosted } from './ReportPosted'
import { SectionMarker } from './SectionMarker'
import { SubmitBar } from './SubmitBar'
import { TextAreaField } from './TextAreaField'
import { descMax, requireAuthToPost, titleMax, useCopy } from './formConfig'
import { draft, useDraft } from './reportDraftStore'
import { submitReport } from './reportFormService'
import { validate } from './reportFormValidation'
import { useIsAuthenticated } from './useIsAuthenticated'
import { useNearbyReports } from './useNearbyReports'
import { useSpeech } from './useSpeech'
import { useI18n } from '@/lib/i18n'

const FIELD_IDS = {
  category: 'category-group',
  title: 'report-title-input',
  location: 'location-group',
  details: 'report-details',
}

export function ReportFormPage() {
  const snapshot = useDraft()
  const { openAuthModal } = useAuthModal()
  const { isAuthenticated } = useIsAuthenticated()
  const [errors, setErrors] = useState({})
  const [photoErrors, setPhotoErrors] = useState([])
  const [banner, setBanner] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const [status, setStatus] = useState('idle')
  const [postedId, setPostedId] = useState(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [restored, setRestored] = useState(() => draft.wasRestored())
  const headingRef = useRef(null)
  const savedAnnounced = useRef(false)
  const coordsRef = useRef(null)

  const copy = useCopy()
  const { lang } = useI18n()

  // Speech appends to whatever is already in the description, so a transcript
  // and a half-typed note can coexist. The hook keeps the latest callback, so
  // closing over the current draft value here is safe.
  const [dictated, setDictated] = useState('')
  const voice = useSpeech(lang, (text) => {
    setDictated((current) => `${current} ${text}`.trim())
    draft.set({
      description: `${snapshot.description} ${text}`.trim().slice(0, descMax),
    })
  })

  const nearby = useNearbyReports({
    category: snapshot.category,
    title: snapshot.title,
    location: snapshot.location,
  })

  const announce = (message) => setAnnouncement(message)
  const dirty = draft.isDirty()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Report an issue · FixItBharat'
    headingRef.current?.focus()
    return () => {
      snapshot.photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Announce the first successful save once, not on every keystroke.
  useEffect(() => {
    if (!snapshot.savedAt || savedAnnounced.current) return
    savedAnnounced.current = true
    setAnnouncement(copy.draftSaved)
  }, [snapshot.savedAt])

  useEffect(() => {
    if (!dirty) return undefined
    const handler = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const goToFeed = () => {
    window.location.hash = '#/issues'
  }

  const onCancel = () => {
    if (dirty) setLeaveOpen(true)
    else goToFeed()
  }

  const focusFirstInvalid = (next) => {
    const key = ['category', 'title', 'location', 'details'].find((field) => next[field])
    const element = document.getElementById(FIELD_IDS[key])
    element?.focus()
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const current = draft.getSnapshot()
    const next = validate(current)
    setErrors(next)
    const count = Object.keys(next).length
    if (count) {
      focusFirstInvalid(next)
      announce(`Please fix ${count} ${count === 1 ? 'field' : 'fields'}`)
      return
    }

    if (requireAuthToPost && !isAuthenticated) {
      draft.flush()
      announce('Log in to post your report. Your draft is saved.')
      openAuthModal('login')
      return
    }

    setStatus('sending')
    const result = await submitReport({
      category: current.category,
      title: current.title.trim(),
      description: current.description.trim(),
      blockLabel: current.location.blockLabel,
      locality: current.location.locality,
      safetyHazard: current.safetyHazard,
      photos: current.photos,
      coords:
        coordsRef.current ??
        (typeof current.location?.lat === 'number' &&
        typeof current.location?.lng === 'number'
          ? { lat: current.location.lat, lng: current.location.lng }
          : null),
      audioText: dictated,
      idToken: await getIdToken(),
    })

    if (result.status === 'ok') {
      draft.clear()
      setPostedId(result.id)
      return
    }
    if (result.status === 'manual_location') {
      setBanner({
        kind: 'info',
        text: 'Tap the map to confirm where this is, then post again.',
      })
      setStatus('idle')
      return
    }
    setBanner({ kind: 'error', text: result.message ?? 'Posting failed.' })
    setStatus('idle')
  }

  if (postedId) {
    return (
      <ReportPosted
        id={postedId}
        onView={() => {
          window.location.hash = `#/issues/${postedId}`
        }}
        onBack={goToFeed}
      />
    )
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[1120px] px-4 pb-28 lg:px-0 lg:pb-16">
        <FormTopRow onCancel={onCancel} saved={Boolean(snapshot.savedAt)} />

        <div className="lg:grid lg:grid-cols-[560px_360px] lg:gap-12">
          <div>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-2 font-display text-[32px] leading-tight text-brown-900 focus-visible:outline-none lg:text-[44px]"
            >
              {copy.titleLead}{' '}
              <span className="text-coral-500">{copy.titleAccent}</span>
            </h1>
            <p className="mt-1 text-[14px] text-brown-600">{copy.subline}</p>

            {restored ? (
              <p className="mt-3 flex flex-wrap items-center gap-2 bg-teal-100 px-3 py-2 text-[14px] text-brown-900">
                <InfoIcon size={16} />
                {copy.draftRestored}
                <button
                  type="button"
                  onClick={() => {
                    draft.clear()
                    setRestored(false)
                  }}
                  className="h-11 font-semibold text-green-700 underline decoration-coral-500 decoration-2 underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
                >
                  {copy.startOver}
                </button>
              </p>
            ) : null}

            <div aria-live="polite" className="sr-only">
              {announcement}
            </div>

            {banner ? (
              <p
                className={`mt-3 flex items-start gap-2 px-3 py-2.5 text-[14px] ${
                  banner.kind === 'error'
                    ? 'bg-coral-100 text-coral-700'
                    : banner.kind === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-teal-100 text-brown-900'
                }`}
              >
                {banner.kind === 'error' ? (
                  <AlertIcon size={16} />
                ) : banner.kind === 'success' ? (
                  <CheckIcon size={16} />
                ) : (
                  <InfoIcon size={16} />
                )}
                {banner.text}
              </p>
            ) : null}

            <form noValidate onSubmit={onSubmit} className="mt-6 flex flex-col gap-6 lg:gap-8">
              <section aria-labelledby="photo-heading" className="flex flex-col gap-3">
                <SectionMarker id="photo-heading" index="01" label={copy.photosSection} note={copy.photosNote} />
                <PhotoPicker
                  photos={snapshot.photos}
                  errors={photoErrors}
                  onAdd={(photos) => {
                    draft.addPhotos(photos)
                    setPhotoErrors([])
                  }}
                  onRemove={(id) => draft.removePhoto(id)}
                  onReject={(failures) => setPhotoErrors(failures)}
                  announce={announce}
                />
              </section>

              <section aria-labelledby="category-heading" className="flex flex-col gap-3">
                <SectionMarker id="category-heading" index="02" label={copy.categorySection} />
                <div id="category-group" tabIndex={-1}>
                  <CategoryChips
                    value={snapshot.category}
                    onChange={(category) => {
                      draft.set({ category })
                      if (errors.category) setErrors({ ...errors, category: null })
                    }}
                    error={errors.category}
                  />
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <label
                      htmlFor="report-title-input"
                      className="text-[14px] font-semibold text-brown-900"
                    >
                      {copy.titleLabel}
                    </label>
                    <span
                      className={`text-[12px] ${
                        snapshot.title.length >= titleMax - 10
                          ? 'font-semibold text-coral-700'
                          : 'text-brown-600'
                      }`}
                    >
                      {snapshot.title.length} / {titleMax}
                    </span>
                  </div>
                  <input
                    id="report-title-input"
                    type="text"
                    value={snapshot.title}
                    maxLength={titleMax}
                    onChange={(event) => {
                      const title = event.target.value
                      draft.set({ title })
                      if (errors.title) setErrors({ ...errors, title: null })
                    }}
                    placeholder={copy.titlePlaceholder}
                    aria-invalid={errors.title ? 'true' : undefined}
                    aria-describedby={errors.title ? 'title-error' : undefined}
                    className={`mt-1.5 h-12 w-full border bg-cream-50 px-3 text-[16px] text-brown-900 placeholder:text-brown-600 focus-visible:border-2 focus-visible:border-green-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${
                      errors.title ? 'border-coral-700' : 'border-brown-600'
                    }`}
                  />
                  {errors.title ? (
                    <p
                      id="title-error"
                      className="mt-1.5 flex items-center gap-1.5 text-[13px] text-coral-700"
                    >
                      <AlertIcon size={14} />
                      {errors.title}
                    </p>
                  ) : null}
                </div>
              </section>

              <section aria-labelledby="where-heading" className="flex flex-col gap-3">
                <SectionMarker id="where-heading" index="03" label={copy.whereSection} />
                <LocationPicker
                  location={snapshot.location}
                  onLocation={(location) => {
                    draft.set({ location })
                    if (errors.location) setErrors({ ...errors, location: null })
                  }}
                  onCoords={(coords) => {
                    coordsRef.current = coords
                  }}
                  error={errors.location}
                  announce={announce}
                />
              </section>

              <section aria-labelledby="details-heading" className="flex flex-col gap-3">
                <SectionMarker id="details-heading" index="04" label={copy.detailsSection} />
                <TextAreaField
                  id="report-details"
                  label={copy.detailsLabel}
                  optionalLabel={copy.detailsOptional}
                  value={snapshot.description}
                  onChange={(description) => draft.set({ description })}
                  error={errors.details}
                  counter={`${snapshot.description.length} / ${descMax}`}
                  nearLimit={snapshot.description.length >= descMax - 10}
                  maxLength={descMax}
                  placeholder={copy.detailsPlaceholder}
                />

                <div>
                  <button
                    type="button"
                    onClick={voice.toggle}
                    disabled={!voice.supported}
                    aria-pressed={voice.listening}
                    className="inline-flex h-11 items-center gap-2 border border-brown-600 px-3 text-[13px] font-semibold text-brown-900 transition-colors hover:bg-sand-100 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none disabled:border-sand-300 disabled:text-brown-600"
                  >
                    <span aria-hidden>{voice.listening ? '■' : '🎙'}</span>
                    {voice.listening ? copy.voiceStop : copy.voiceStart}
                  </button>
                  <p className="mt-1 text-[12px] text-brown-600">
                    {!voice.supported
                      ? copy.voiceUnsupported
                      : voice.listening
                        ? copy.voiceListening
                        : copy.voiceNote}
                  </p>
                  {voice.error ? (
                    <p className="mt-1 text-[12px] text-coral-700">{voice.error}</p>
                  ) : null}
                </div>
              </section>

              <div className="lg:hidden">
                <NearbyCheck
                  reports={nearby}
                  onView={(id) => {
                    window.location.hash = `#/issues/${id}`
                  }}
                  onStillPost={() => {}}
                />
              </div>

              <label className="flex items-start gap-3">
                <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
                  <input
                    type="checkbox"
                    checked={snapshot.safetyHazard}
                    onChange={(event) => draft.set({ safetyHazard: event.target.checked })}
                    className="peer size-5 appearance-none border-2 border-brown-600 checked:border-brown-900 checked:bg-brown-900 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:outline-none"
                  />
                  <CheckIcon
                    size={14}
                    className="pointer-events-none absolute inset-0 m-auto hidden text-cream-50 peer-checked:block"
                  />
                </span>
                <span>
                  <span className="block text-[14px] text-brown-900">{copy.safetyLabel}</span>
                  <span className="mt-0.5 block text-[13px] text-brown-600">
                    {copy.safetyHelper}
                  </span>
                </span>
              </label>

              <p className="text-[13px] text-brown-600">
                Posts show as “Resident, {snapshot.location?.locality ?? 'your area'}”.
              </p>

              <SubmitBar
                fixed={false}
                sending={status === 'sending'}
                onSaveDraft={() => {
                  draft.flush()
                  announce(copy.draftSaved)
                }}
              />
            </form>
          </div>

          <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
            <LivePreview draft={snapshot} />
            <div className="mt-6">
              <NearbyCheck
                reports={nearby}
                onView={(id) => {
                  window.location.hash = `#/issues/${id}`
                }}
                onStillPost={() => {}}
              />
            </div>
          </aside>
        </div>
      </main>

      <SubmitBar
        fixed
        sending={status === 'sending'}
        onSaveDraft={() => {
          draft.flush()
          announce(copy.draftSaved)
        }}
      />

      {leaveOpen ? (
        <LeaveDialog
          onKeepEditing={() => setLeaveOpen(false)}
          onSaveAndLeave={() => {
            draft.flush()
            setLeaveOpen(false)
            goToFeed()
          }}
          onDiscard={() => {
            draft.clear()
            setLeaveOpen(false)
            goToFeed()
          }}
        />
      ) : null}
    </>
  )
}

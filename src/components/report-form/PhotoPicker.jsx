import { useRef, useState } from 'react'
import { copy, maxFileMB, maxPhotos } from './formConfig'
import { processFiles } from './imageUtils'

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden fill="currentColor">
      <path d="M3 6h4l2-2h6l2 2h4v14H3V6Zm2 2v10h14V8h-3.2l-2-2H10.2L8.2 8H5Zm7 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    </svg>
  )
}

/**
 * Photo area: a real button that opens the file picker, drag-and-drop as an
 * enhancement, thumbnails with 44px remove targets.
 */
export function PhotoPicker({ photos, errors, onAdd, onRemove, onReject, announce }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const accept = async (fileList) => {
    if (!fileList || fileList.length === 0) return
    const { accepted, errors: failures } = await processFiles(fileList, {
      maxMB: maxFileMB,
      limit: maxPhotos - photos.length,
    })
    if (accepted.length) {
      onAdd(accepted)
      announce(`${accepted.length} photo${accepted.length === 1 ? '' : 's'} added`)
    }
    if (failures.length) onReject(failures)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          accept(event.target.files)
          event.target.value = ''
        }}
      />

      <button
        type="button"
        disabled={photos.length >= maxPhotos}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          accept(event.dataTransfer.files)
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-6 text-center transition-colors duration-[var(--motion-base)] focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none ${
          dragging ? 'border-teal-400 bg-teal-100' : 'border-brown-600 bg-cream-50'
        } ${photos.length >= maxPhotos ? 'cursor-not-allowed border-sand-300' : ''}`}
      >
        <span className="text-coral-500">
          <CameraIcon />
        </span>
        <span className="text-[15px] font-semibold text-brown-900">{copy.dropTitle}</span>
        <span className="text-[13px] text-brown-600">{copy.dropHint}</span>
      </button>

      {photos.length ? (
        <>
          <ul className="mt-3 flex list-none flex-wrap gap-3 p-0">
            {photos.map((photo, index) => (
              <li key={photo.id} className="relative">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1} of ${photos.length}`}
                  className="size-14 border border-sand-300 object-cover lg:size-[72px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    onRemove(photo.id)
                    announce(`Photo ${index + 1} removed`)
                  }}
                  aria-label={`Remove photo ${index + 1}`}
                  className="absolute -top-2 -right-2 grid size-6 place-items-center bg-brown-900 text-cream-50 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
                >
                  <span aria-hidden className="text-[13px] leading-none">
                    ✕
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] text-brown-600">{copy.coverCaption}</p>
        </>
      ) : null}

      {errors?.length ? (
        <ul className="mt-2 list-none p-0 text-[13px] text-coral-700">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

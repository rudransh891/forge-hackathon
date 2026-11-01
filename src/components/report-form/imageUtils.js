/**
 * Client-side photo processing.
 *
 * Every accepted photo is re-encoded through a canvas. That fixes EXIF rotation,
 * strips EXIF (including GPS) and caps the long edge — the privacy requirement
 * is the strip, the size cap is a side effect worth having.
 */

export const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

export async function processImage(file, maxEdge = 1600) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale)
  const h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85))
  return {
    id: crypto.randomUUID(),
    blob,
    url: URL.createObjectURL(blob),
    width: w,
    height: h,
  }
}

/** Names the reason rather than saying "unsupported file". */
export function rejectionReason(file, maxMB) {
  if (!allowedTypes.includes(file.type)) {
    return `${file.name}: HEIC and other formats aren't supported yet. Choose a JPEG, PNG or WebP.`
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `${file.name} is over ${maxMB} MB.`
  }
  return null
}

/** Processes a batch, returning the successes and the human-readable failures. */
export async function processFiles(files, { maxMB, limit }) {
  const accepted = []
  const errors = []
  const list = Array.from(files)
  if (list.length > limit) {
    errors.push(`You can attach up to ${limit} photos.`)
  }
  const usable = list.slice(0, limit)
  const settled = await Promise.allSettled(
    usable.map((file) => {
      const reason = rejectionReason(file, maxMB)
      return reason ? Promise.reject(new Error(reason)) : processImage(file)
    }),
  )
  settled.forEach((result) => {
    if (result.status === 'fulfilled') accepted.push(result.value)
    else errors.push(result.reason?.message ?? 'That photo could not be read.')
  })
  return { accepted, errors }
}

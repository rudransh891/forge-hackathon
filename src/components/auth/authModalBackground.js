/**
 * THE ONLY FILE THAT CONTROLS THE MODAL BACKGROUND.
 *
 * 1. Solid colour: keep mode 'color' and edit `color`.
 * 2. Photo/scan: set mode 'image' and point `image` at a file in
 *    src/assets/auth/ (or drop a new file there and change the import above).
 * 3. `tint` is the dark layer over the image; keep alpha at 0.75 or higher.
 * 4. `appliesTo` moves the background from the brand panel to the whole modal.
 */
import bgImage from '../../assets/auth/modal-bg.svg'

export const authModalBackground = {
  mode: 'color', // 'color' | 'image'
  color: 'var(--color-brown-900)', // used when mode is 'color', and as image fallback
  image: bgImage, // used when mode is 'image'
  tint: 'rgba(43, 24, 16, 0.78)', // alpha must stay >= 0.75 so text keeps AA on any photo
  position: 'center',
  size: 'cover',
  repeat: 'no-repeat',
  appliesTo: 'brand-panel', // 'brand-panel' | 'whole-modal'
}

/** Style object for the element that carries the background. */
export function backgroundStyle(config = authModalBackground) {
  if (config.mode === 'image') {
    return {
      backgroundColor: config.color,
      backgroundImage: `url("${config.image}")`,
      backgroundPosition: config.position,
      backgroundSize: config.size,
      backgroundRepeat: config.repeat,
    }
  }
  return { backgroundColor: config.color }
}

/** Whether the tint layer should be painted (image mode only). */
export function needsTint(config = authModalBackground) {
  return config.mode === 'image'
}

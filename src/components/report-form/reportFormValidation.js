import { categories, descMax, titleMax, titleMin } from './formConfig'

/** Pure validators: each returns an error string or null. */

export function validateCategory(category) {
  if (!category || !categories.includes(category)) return 'Choose what kind of issue this is.'
  return null
}

export function validateTitle(title) {
  const value = String(title || '').trim()
  if (value.length < titleMin) return `Add a short title (at least ${titleMin} characters).`
  if (value.length > titleMax) return `Keep the title under ${titleMax} characters.`
  return null
}

export function validateLocation(location) {
  return location && location.blockLabel ? null : 'Add where this is.'
}

export function validateDetails(details) {
  const value = String(details || '')
  if (value.length > descMax) return `Keep the details under ${descMax} characters.`
  return null
}

/** The whole draft, as the submit handler wants it. */
export function validate(snapshot) {
  const errors = {}
  const category = validateCategory(snapshot.category)
  const title = validateTitle(snapshot.title)
  const location = validateLocation(snapshot.location)
  const details = validateDetails(snapshot.description)
  if (category) errors.category = category
  if (title) errors.title = title
  if (location) errors.location = location
  if (details) errors.details = details
  return errors
}

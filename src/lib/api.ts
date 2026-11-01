/**
 * The only module that talks to the FastAPI backend.
 *
 * Everything the UI renders is normalised here, in one place, because the API
 * speaks `issue_type` / `status` / `severity_level` and the components speak
 * `category` / `officialStatus` / `urgent`. Keeping the translation here means a
 * backend change is a change to this file.
 *
 * Requests go to `/api`, which vite proxies to http://127.0.0.1:8000 (see
 * vite.config.ts). Uploaded photos are served from `/uploads`, proxied the same way.
 */

export const API_BASE = '/api'

/** Backend issue types, from Backend/ai/schemas.py. */
export type IssueType =
  | 'pothole'
  | 'garbage'
  | 'water_leak'
  | 'drain_overflow'
  | 'streetlight'
  | 'other'
  | 'none'

export type SeverityFactor = {
  state: 'scored' | 'missing' | 'not_applicable'
  points: number
  max: number
  note: string
}

export type Severity = {
  score: number | null
  level: string | null
  reason: string | null
  reason_source: string | null
  coverage: string | null
  missing: string[]
  not_applicable: string[]
  provisional: boolean
  uncapped_level: string | null
  factors: Record<string, SeverityFactor> | null
  deadline_at: string | null
  deadline_note: string | null
}

export type StatusEvent = {
  created_at: string
  status: string
  note: string | null
}

export type DuplicateSuggestion = {
  candidate_id: string
  candidate_summary: string | null
  candidate_photo_url: string | null
  distance_m: number
  score: number
  label: string
  shared_terms: string[]
  response: 'same' | 'different' | null
  suggested_at: string
}

export type FeedItem = {
  id: string
  created_at: string
  lat: number
  lng: number
  address: string | null
  description: string | null
  issue_type: IssueType | null
  severity_score: number | null
  severity_level: string | null
  severity_reason: string | null
  deadline_at: string | null
  confirmations: number
  status: string
  photo_path: string | null
  summary: string | null
}

export type RawReport = FeedItem & {
  duplicate_of: string | null
  ai_result: Record<string, unknown> | null
}

export type ReportDetailPayload = {
  report: RawReport
  severity: Severity | null
  timeline: StatusEvent[]
}

type FeedPage = {
  items: FeedItem[]
  total: number
  next_offset: number | null
}

export type BackendStats = {
  total: number
  open: number
  resolved: number
  routed: number
  in_progress: number
}

export type UiStatus = 'open' | 'resolved' | 'merged' | 'needs_review' | 'needs_better_photo'

export type TrackerStep = 'reported' | 'seen' | 'scheduled' | 'fixed'

export type ReportUpdate = {
  id: string
  author: string
  dateLabel: string
  text: string
  verified: boolean
}

export type Report = {
  id: string
  title: string
  category: string
  locality: string
  ageDays: number
  createdAt: string
  verification: 'verified' | 'unverified'
  urgent: boolean
  status: UiStatus
  rawStatus: string
  photo: string | null
  photoAlt: string
  supporters: number
  comments: number
  commentCount: number
  description: string
  addressBlock: string
  address: string | null
  lat: number
  lng: number
  officialStatus: TrackerStep
  statusDates: Record<string, string>
  updates: ReportUpdate[]
  severity: Severity | null
  timeline: StatusEvent[]
  duplicate: DuplicateSuggestion | null
  mergedInto: string | null
  deadlineAt: string | null
  update: string | null
  photos: { src: string; alt: string }[]
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/* ---------------------------------------------------------------- transport */

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (init.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const merged = { ...headers, ...((init.headers as Record<string, string> | undefined) ?? {}) }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers: merged })
  } catch {
    throw new ApiError(0, 'The server is not reachable.')
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`
    try {
      const body = await response.json()
      if (typeof body?.detail === 'string') message = body.detail
    } catch {
      /* not JSON: keep the status message */
    }
    throw new ApiError(response.status, message)
  }

  return (await response.json()) as T
}

/* ------------------------------------------------------------- translation */

/**
 * UI categories are kept from the original design. Two of them (Parks,
 * Transit) have no backend issue type at all and therefore return no reports;
 * the feed shows its normal empty state rather than inventing content.
 */
const CATEGORY_TYPES: Record<string, IssueType[]> = {
  Roads: ['pothole'],
  Water: ['water_leak', 'drain_overflow'],
  Safety: ['streetlight', 'garbage'],
  Parks: [],
  Transit: [],
}

const TYPE_LABEL: Record<string, string> = {
  pothole: 'Pothole',
  garbage: 'Garbage',
  water_leak: 'Water leak',
  drain_overflow: 'Drain overflow',
  streetlight: 'Streetlight',
  other: 'Civic issue',
  none: 'Photo not a civic issue',
}

/** Localities the pilot city is actually made of, used to read a Nominatim address. */
export const PRAYAGRAJ_LOCALITIES = [
  'Civil Lines',
  'Kydganj',
  'Chowk',
  'Mumfordganj',
  'Alopibagh',
  'Daraganj',
  'Naini',
  'Jhunsi',
  'Katra',
  'Salori',
  'Teliyarganj',
  'Dhoomanganj',
  'Allahpur',
  'George Town',
  'Kareli',
  'Sulem Sarai',
  'Rajapur',
  'Tagore Town',
  'Lukerganj',
  'Colonelganj',
  'Ashok Nagar',
  'Jhalwa',
  'Peepal Gaon',
  'Bai ka Bagh',
  'Kydganj',
]

const ROAD_WORDS = /(road|marg|street|lane|highway|bypass)/i

export function issueTypesForCategory(category: string): IssueType[] | null {
  if (!category || category === 'All') return null
  return CATEGORY_TYPES[category] ?? []
}

export function categoryForIssueType(issueType: string | null): string {
  if (!issueType) return 'Other'
  if (issueType === 'pothole') return 'Roads'
  if (issueType === 'water_leak' || issueType === 'drain_overflow') return 'Water'
  if (issueType === 'streetlight' || issueType === 'garbage') return 'Safety'
  return 'Other'
}

export function trackerStep(status: string): TrackerStep {
  switch (status) {
    case 'resolved':
      return 'fixed'
    case 'acknowledged':
    case 'in_progress':
    case 'escalated':
      return 'scheduled'
    case 'routed':
      return 'seen'
    default:
      return 'reported'
  }
}

function uiStatus(status: string): UiStatus {
  if (status === 'resolved') return 'resolved'
  if (status === 'merged') return 'merged'
  if (status === 'needs_review') return 'needs_review'
  if (status === 'needs_better_photo') return 'needs_better_photo'
  return 'open'
}

export function photoUrl(photoPath: string | null | undefined): string | null {
  if (!photoPath) return null
  const name = photoPath.split(/[\\/]/).pop()
  return name ? `/uploads/${name}` : null
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function dateLabel(iso: string): string {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(parsed)
}

export function dateTimeLabel(iso: string | null): string {
  if (!iso) return ''
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(parsed)
}

function ageDaysFrom(iso: string): number {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return 0
  return Math.max(0, Math.floor((Date.now() - parsed) / 86_400_000))
}

function localityFrom(address: string | null): string {
  const value = (address || '').trim()
  if (!value) return 'Prayagraj'
  const lower = value.toLowerCase()
  const known = PRAYAGRAJ_LOCALITIES.find((name) => lower.includes(name.toLowerCase()))
  if (known) return known

  // Nominatim puts the most specific part first and pads the tail with the city,
  // district and PIN. Take the first part that is neither a house number nor a
  // street, so a road name does not become the locality.
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const candidate = parts.find((part) => !/^\d+$/.test(part) && !ROAD_WORDS.test(part))
  return candidate || parts[0] || 'Prayagraj'
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`
}

function titleFor(item: FeedItem, locality: string): string {
  const description = (item.description || '').trim()
  if (description) return truncate(description, 110)
  const summary = (item.summary || '').trim()
  if (summary) return truncate(summary, 110)
  const label = TYPE_LABEL[item.issue_type ?? 'other'] ?? 'Civic issue'
  return `${label} reported in ${locality}`
}

function updatesFrom(timeline: StatusEvent[]): ReportUpdate[] {
  return [...timeline]
    .reverse()
    .filter((event) => Boolean(event.note))
    .map((event, index) => ({
      id: `${event.created_at}-${index}`,
      author: 'FixIt Bharat',
      dateLabel: dateLabel(event.created_at),
      text: String(event.note),
      verified: false,
    }))
}

function datesFrom(timeline: StatusEvent[]): Record<string, string> {
  const dates: Record<string, string> = {}
  for (const event of timeline) {
    const step = trackerStep(event.status)
    if (step !== 'reported' && !dates[step]) dates[step] = dateLabel(event.created_at)
  }
  return dates
}

function baseReport(item: FeedItem): Report {
  const locality = localityFrom(item.address)
  const status = uiStatus(item.status)
  const photo = photoUrl(item.photo_path)
  const label = TYPE_LABEL[item.issue_type ?? 'other'] ?? 'Civic issue'
  return {
    id: item.id,
    title: titleFor(item, locality),
    category: categoryForIssueType(item.issue_type),
    locality,
    ageDays: ageDaysFrom(item.created_at),
    createdAt: item.created_at,
    verification: 'unverified',
    urgent: item.severity_level === 'critical' && status === 'open',
    status,
    rawStatus: item.status,
    photo,
    photoAlt: photo ? `${label} reported in ${locality}` : '',
    supporters: item.confirmations ?? 1,
    comments: 0,
    commentCount: 0,
    description: (item.description || '').trim(),
    addressBlock: item.address || formatCoords(item.lat, item.lng),
    address: item.address,
    lat: item.lat,
    lng: item.lng,
    officialStatus: trackerStep(item.status),
    statusDates: {},
    updates: [],
    severity: null,
    timeline: [],
    duplicate: null,
    mergedInto: null,
    deadlineAt: item.deadline_at,
    update: null,
    photos: photo ? [{ src: photo, alt: `${label} reported in ${locality}` }] : [],
  }
}

/* --------------------------------------------------------------- endpoints */

export async function fetchFeedPage({
  category = 'All',
  sort = 'top',
  offset = 0,
  pageSize = 8,
}: {
  category?: string
  sort?: string
  offset?: number
  pageSize?: number
} = {}): Promise<{ items: Report[]; total: number; nextOffset: number | null }> {
  const types = issueTypesForCategory(category)
  // A category with no backend issue type is empty, not a request for everything.
  if (types && types.length === 0) {
    return { items: [], total: 0, nextOffset: null }
  }

  const params = new URLSearchParams({
    sort: sort === 'top' ? 'top' : 'newest',
    offset: String(offset),
    limit: String(pageSize),
  })
  if (types) params.set('issue_type', types.join(','))

  const page = await apiFetch<FeedPage>(`/feed?${params.toString()}`)
  return {
    items: page.items.map(baseReport),
    total: page.total,
    nextOffset: page.next_offset,
  }
}

/** Returns null when the report does not exist (400/404), throws otherwise. */
export async function fetchReportDetail(id: string): Promise<Report | null> {
  try {
    const payload = await apiFetch<ReportDetailPayload>(`/reports/${encodeURIComponent(id)}`)
    const report = baseReport({
      ...payload.report,
      summary:
        ((payload.report.ai_result as { vision?: { summary?: string } } | null)?.vision?.summary ??
          null) ||
        null,
    })
    const timeline = payload.timeline ?? []
    const suggestion =
      (payload.report.ai_result as { duplicate_suggestion?: DuplicateSuggestion } | null)
        ?.duplicate_suggestion ?? null

    return {
      ...report,
      description: (payload.report.description || '').trim(),
      severity: payload.severity,
      timeline,
      statusDates: datesFrom(timeline),
      updates: updatesFrom(timeline),
      duplicate: suggestion,
      mergedInto: payload.report.duplicate_of,
      deadlineAt: payload.report.deadline_at,
    }
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null
    throw error
  }
}

export async function fetchNearby({
  id,
  locality,
}: {
  id: string
  locality: string
}): Promise<Report[]> {
  const page = await apiFetch<FeedPage>(`/feed?sort=newest&limit=60`)
  const others = page.items.map(baseReport).filter((report) => report.id !== id)
  const sameArea = others.filter((report) => report.locality === locality)
  return (sameArea.length >= 2 ? sameArea : others).slice(0, 2)
}

export async function fetchStats(): Promise<BackendStats> {
  return apiFetch<BackendStats>('/stats')
}

export async function fetchTopReports(limit = 3): Promise<Report[]> {
  const page = await apiFetch<FeedPage>(`/feed?sort=top&limit=${limit}`)
  return page.items.map(baseReport)
}

/** POST confirmations: support or withdraw support. */
export async function setSupport(id: string, supported: boolean): Promise<number> {
  const result = await apiFetch<{ id: string; confirmations: number }>(
    `/reports/${encodeURIComponent(id)}/confirm`,
    { method: 'POST', body: JSON.stringify({ supported }) },
  )
  return result.confirmations
}

export type DuplicateAnswer = { ok: boolean; merged_into?: string | null; confirmations?: number }

export async function answerDuplicate(
  id: string,
  sameProblem: boolean,
): Promise<DuplicateAnswer> {
  return apiFetch<DuplicateAnswer>(`/reports/${encodeURIComponent(id)}/duplicate-response`, {
    method: 'POST',
    body: JSON.stringify({ same_problem: sameProblem }),
  })
}

export async function reanalyse(id: string): Promise<{ id: string; status: string }> {
  return apiFetch<{ id: string; status: string }>(
    `/reports/${encodeURIComponent(id)}/analyse`,
    { method: 'POST' },
  )
}

export type SubmitReceipt = { id: string; status: string; photo_url: string }

export async function submitReport({
  photo,
  lat,
  lng,
  description,
  idToken,
}: {
  photo: File
  lat: number
  lng: number
  description: string
  idToken?: string | null
}): Promise<SubmitReceipt> {
  const form = new FormData()
  form.append('photo', photo)
  form.append('lat', String(lat))
  form.append('lng', String(lng))
  form.append('description', description)
  return apiFetch<SubmitReceipt>('/reports', {
    method: 'POST',
    body: form,
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
  })
}

/** The maximum the API accepts, mirrored here so the client can fail fast. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

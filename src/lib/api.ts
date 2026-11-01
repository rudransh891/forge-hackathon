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

/**
 * Locally the Vite proxy answers `/api`. A static host has no backend, so a
 * deployment sets `VITE_API_BASE` to the URL of the running API instead.
 */
const configuredBase = import.meta.env.VITE_API_BASE as string | undefined

export const API_BASE = (configuredBase && configuredBase.replace(/\/+$/, '')) || '/api'

/**
 * Uploaded photos are served by the API, not by the static host. In development
 * the Vite proxy handles `/uploads`; a deployment has to send them to the API
 * origin, or every photo 404s on the deployed domain.
 */
const UPLOADS_BASE = configuredBase ? `${API_BASE}/uploads` : '/uploads'

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
  citizen_category?: string | null
  resolved_at?: string | null
  context?: ReportContext | null
}

export type ReportDetailPayload = {
  report: RawReport
  severity: Severity | null
  timeline: StatusEvent[]
  photos?: string[]
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
  overdue: number
  avg_resolution_hours: number | null
  by_type: { issue_type: string; count: number }[]
}

export type ContextPlace = { name: string; type: string; distance_m: number }

export type ReportContext = {
  fetched_at?: string
  missing?: string[]
  geocode?: { ok?: boolean; address?: string; road?: string; locality?: string; city?: string }
  places?: {
    ok?: boolean
    radius_m?: number
    schools?: ContextPlace[]
    hospitals?: ContextPlace[]
    bus_stops?: number
    note?: string
    source?: string
  }
  road?: {
    ok?: boolean
    highway?: string | null
    name?: string | null
    ref?: string | null
    distance_m?: number
    note?: string
    source?: string
  }
  weather?: {
    ok?: boolean
    temperature_c?: number | null
    rain_last_24h_mm?: number | null
    source?: string
  }
  air_quality?: {
    ok?: boolean
    us_aqi?: number | null
    band?: string | null
    pm2_5?: number | null
    source?: string
  }
}

/**
 * Everything the severity score looked at, so the number can be checked.
 * The backend has stored this since the enrichment phase; nothing rendered it.
 */
export type RoutingDelivery = {
  ok?: boolean
  error?: string | null
  target?: string
  channel?: string
  attempted_at?: string
  delivered_at?: string
  photo_attached?: boolean
}

export type RoutingRecord = {
  inside_pilot_area?: boolean
  body?: string
  body_confirmed?: boolean
  complaint_subject?: string | null
  complaint_text?: string | null
  delivery?: RoutingDelivery | null
  citizen_option?: { name?: string; portal?: string; helpline?: string } | null
  note?: string
}

export type EscalationAction = {
  level: number
  name: string
  at: string
  ok: boolean
  error?: string | null
  target?: string
  late_hours?: number
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
  /** What the citizen picked. The model's issue_type is separate. */
  citizenCategory: string | null
  /** What routing actually did, when it ran. */
  routing: RoutingRecord | null
  /** Escalation actions recorded against this report. */
  escalation: EscalationAction[]
  resolvedAt: string | null
  severityLevel: string | null
  /** The evidence the severity score cited: road, places, weather, air. */
  context: ReportContext | null
}

export type DepartmentRow = {
  department: string
  total: number
  resolved: number
  overdue: number
  avg_hours: number | null
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Every read costs a round trip to a database on another continent, so a short
 * client cache keeps page navigation from paying it again. Writes never cache.
 */
const GET_TTL_MS = 30_000
const getCache = new Map<string, { at: number; value: unknown }>()

/* ---------------------------------------------------------------- transport */

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  // Reports change under the reader's feet when a department moves one, so they
  // are never served from the client cache.
  const cacheable =
    method === 'GET' && init.body === undefined && !path.startsWith('/reports/')

  if (cacheable) {
    const hit = getCache.get(path)
    if (hit && Date.now() - hit.at < GET_TTL_MS) return hit.value as T
  }

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

  const data = (await response.json()) as T
  if (cacheable) getCache.set(path, { at: Date.now(), value: data })
  return data
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
  return name ? `${UPLOADS_BASE}/${name}` : null
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
    citizenCategory: null,
    routing: null,
    escalation: [],
    resolvedAt: null,
    severityLevel: item.severity_level,
    context: null,
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

    const ai = (payload.report.ai_result ?? {}) as {
      routing?: RoutingRecord
      escalation?: { actions?: EscalationAction[] }
    }

    const photos = (payload.photos ?? []).map((url, index) => ({
      src: url,
      alt: `${report.category} reported in ${report.locality}, photo ${index + 1}`,
    }))

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
      photos: photos.length ? photos : report.photos,
      citizenCategory: payload.report.citizen_category ?? null,
      routing: ai.routing ?? null,
      escalation: ai.escalation?.actions ?? [],
      resolvedAt: payload.report.resolved_at ?? null,
      context: payload.report.context ?? null,
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

export type SubmitReceipt = {
  id: string
  status: string
  photo_url: string
  photos?: number
}

export async function submitReport({
  photos,
  lat,
  lng,
  description,
  category,
  audioText,
  idToken,
}: {
  photos: File[]
  lat: number
  lng: number
  description: string
  category?: string
  audioText?: string
  idToken?: string | null
}): Promise<SubmitReceipt> {
  const form = new FormData()
  for (const file of photos) form.append('photos', file)
  form.append('lat', String(lat))
  form.append('lng', String(lng))
  form.append('description', description)
  if (category) form.append('category', category)
  if (audioText) form.append('audio_text', audioText)
  return apiFetch<SubmitReceipt>('/reports', {
    method: 'POST',
    body: form,
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
  })
}

/** The citizen says it is fixed: after photo plus where it was taken. */
export async function submitResolution({
  id,
  after,
  lat,
  lng,
}: {
  id: string
  after: File
  lat: number
  lng: number
}): Promise<{ id: string; status: string }> {
  const form = new FormData()
  form.append('after', after)
  form.append('lat', String(lat))
  form.append('lng', String(lng))
  return apiFetch<{ id: string; status: string }>(
    `/reports/${encodeURIComponent(id)}/resolution`,
    { method: 'POST', body: form },
  )
}

/** The maximum the API accepts, mirrored here so the client can fail fast. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/* ------------------------------------------------------------------ geocode */

export type GeocodePlace = {
  blockLabel: string
  locality: string | null
  lat: number
  lng: number
}

/** Block-level name for a point. Never returns the exact address. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodePlace> {
  return apiFetch<GeocodePlace>(`/geocode/reverse?lat=${lat}&lng=${lng}`)
}

/** Forward geocode, biased to the pilot city, with coordinates included. */
export async function searchGeocode(query: string, limit = 6): Promise<GeocodePlace[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  const data = await apiFetch<{ items: GeocodePlace[] }>(`/geocode/search?${params}`)
  return data.items
}

/* -------------------------------------------------------------- deadlines */

/** "Due in 3 days" / "Overdue by 5 hours", for the response-time countdown. */
export function deadlineLabel(iso: string | null): string | null {
  if (!iso) return null
  const target = Date.parse(iso)
  if (Number.isNaN(target)) return null

  const hours = Math.round((target - Date.now()) / 3_600_000)
  if (hours >= 48) return `Due in ${Math.round(hours / 24)} days`
  if (hours > 0) return `Due in ${hours} hours`

  const late = Math.abs(hours)
  if (late >= 48) return `Overdue by ${Math.round(late / 24)} days`
  return `Overdue by ${late} hours`
}

/* ------------------------------------------------------------- departments */

export type DepartmentQueueItem = {
  id: string
  created_at: string
  issue_type: string | null
  severity_level: string | null
  status: string
  deadline_at: string | null
  address: string | null
  department: string | null
}

/** The routed reports waiting on a body, overdue first. Key-gated. */
export async function fetchDepartmentQueue(key: string): Promise<DepartmentQueueItem[]> {
  const data = await apiFetch<{ items: DepartmentQueueItem[] }>('/department/queue', {
    headers: { 'X-Department-Key': key },
  })
  return data.items
}

export type DepartmentStatus = 'acknowledged' | 'in_progress' | 'resolved' | 'reopened'

/** Records a status change with a note on the report's timeline. */
export async function setDepartmentStatus(
  key: string,
  id: string,
  status: DepartmentStatus,
  note: string,
): Promise<{ id: string; status: string }> {
  return apiFetch<{ id: string; status: string }>(`/reports/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'X-Department-Key': key },
    body: JSON.stringify({ status, note }),
  })
}

/** Resolution speed and backlog per responsible body, from real rows only. */
export async function fetchDepartments(): Promise<DepartmentRow[]> {
  const data = await apiFetch<{ items: DepartmentRow[] }>('/departments')
  return data.items
}

export type PollOption = {
  id: string
  label: string
  label_hi?: string | null
  votes: number
}
export type ActivePoll = {
  id: string
  question: string
  question_hi?: string | null
  closes_at: string | null
  options: PollOption[]
  total: number
}

/** The open poll with live tallies. Counts come from real rows. */
export async function fetchActivePoll(): Promise<ActivePoll> {
  return apiFetch<ActivePoll>('/polls/active')
}

/** One vote per browser key; the key is a local id, not an identity. */
export async function castVote(
  pollId: string,
  optionId: string,
  voter: string,
): Promise<ActivePoll> {
  return apiFetch<ActivePoll>(`/polls/${encodeURIComponent(pollId)}/votes`, {
    method: 'POST',
    body: JSON.stringify({ option_id: optionId, voter }),
  })
}

/* ---------------------------------------------------------------- comments */
export type CommentRow = {
  id: string
  created_at: string
  author_name: string
  body: string
}

export async function fetchCommentsFor(
  id: string,
  { sort = 'top', offset = 0, limit = 10 }: { sort?: string; offset?: number; limit?: number } = {},
): Promise<{ items: CommentRow[]; total: number }> {
  const params = new URLSearchParams({
    sort: sort === 'newest' ? 'newest' : 'top',
    offset: String(offset),
    limit: String(limit),
  })
  return apiFetch<{ items: CommentRow[]; total: number }>(
    `/reports/${encodeURIComponent(id)}/comments?${params}`,
  )
}

export async function postCommentTo(  id: string,
  body: string,
  idToken?: string | null,
): Promise<CommentRow> {
  return apiFetch<CommentRow>(`/reports/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
  })
}

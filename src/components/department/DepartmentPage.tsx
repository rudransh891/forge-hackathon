import { useCallback, useEffect, useState } from 'react'
import { fetchDepartmentQueue, setDepartmentStatus } from '@/lib/api'
import type { DepartmentQueueItem, DepartmentStatus } from '@/lib/api'

const STORAGE_KEY = 'fixitbharat.departmentKey'

/** Each action lands on a status; "reopened" returns the report to routed. */
const ACTIONS = [
  { action: 'acknowledged', lands: 'acknowledged', label: 'Acknowledge' },
  { action: 'in_progress', lands: 'in_progress', label: 'Start work' },
  { action: 'resolved', lands: 'resolved', label: 'Mark fixed' },
  { action: 'reopened', lands: 'routed', label: 'Reopen' },
] as const

function dueLabel(deadline: string | null): string {
  if (!deadline) return 'no deadline'
  return `due ${new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

/**
 * The department desk.
 *
 * There is no department account system, so this screen is gated by a shared key
 * from `DEPARTMENT_KEY` in the backend env. It is deliberately plain: every change
 * is written to the report's timeline, which is what the public board reads.
 */
export function DepartmentPage() {
  const [accessKey, setAccessKey] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [items, setItems] = useState<DepartmentQueueItem[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(
    'Enter the access key to load the queue. The pilot default is "demo".',
  )

  const load = useCallback(async (value: string) => {
    if (!value) return
    setBusy(true)
    try {
      const rows = await fetchDepartmentQueue(value)
      setItems(rows)
      setMessage(
        rows.length
          ? `${rows.length} reports in the queue.`
          : 'Nothing is waiting: every routed report is either closed or still inside its deadline.',
      )
    } catch (error) {
      setItems([])
      const text = error instanceof Error ? error.message : 'Could not load the queue.'
      setMessage(
        text.toLowerCase().includes('key')
          ? `That key was refused. ${text}`
          : `Could not load the queue. ${text}`,
      )
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (accessKey) load(accessKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = async (id: string, next: DepartmentStatus) => {
    setBusy(true)
    try {
      await setDepartmentStatus(accessKey, id, next, '')
      await load(accessKey)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That change was refused.')
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[980px] px-4 py-8 lg:px-0">
      <h1 className="font-display text-[28px] leading-tight text-brown-900">Department desk</h1>
      <p className="mt-1 max-w-[70ch] text-[13px] leading-5 text-brown-600">
        Move a complaint forward. Every change is written to the report&apos;s status
        history marked &ldquo;Department&rdquo;, and the public page updates to match.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          aria-label="Access key"
          type="password"
          value={accessKey}
          placeholder="Access key"
          onChange={(event) => setAccessKey(event.target.value)}
          className="h-10 w-[220px] border border-brown-600 bg-cream-50 px-3 text-[13px] text-brown-900"
        />
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.setItem(STORAGE_KEY, accessKey)
            } catch {
              /* storage blocked: the key lasts for this page */
            }
            load(accessKey)
          }}
          disabled={busy || !accessKey}
          className="h-10 border border-green-700 px-3 text-[13px] font-semibold text-green-700 disabled:border-sand-300 disabled:text-brown-600"
        >
          {busy ? 'Loading…' : 'Load queue'}
        </button>
        <span aria-live="polite" className="text-[12px] text-brown-600">
          {message}
        </span>
      </div>

      {items.length > 0 ? (
        <ul className="mt-5 list-none divide-y divide-sand-300 border-t border-sand-300 p-0">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-brown-900">
                  {(item.issue_type ?? 'unclassified').replace(/_/g, ' ')}
                  <span className="ml-2 font-normal text-brown-600">
                    {item.severity_level ?? 'unscored'} · {dueLabel(item.deadline_at)}
                  </span>
                </p>
                <p className="truncate text-[12px] text-brown-600">
                  {item.address || 'no address'} · {item.department || 'not routed'}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-1.5">
                {ACTIONS.map(({ action, lands, label }) => {
                  const selected = item.status === lands
                  return (
                    <button
                      key={action}
                      type="button"
                      aria-pressed={selected}
                      disabled={busy || selected}
                      onClick={() => update(item.id, action)}
                      className={`h-8 px-2.5 text-[12px] font-semibold transition-colors ${
                        selected
                          ? 'border border-brown-900 bg-brown-900 text-cream-50'
                          : 'border border-brown-600 text-brown-900 hover:bg-sand-100'
                      } disabled:opacity-100`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}

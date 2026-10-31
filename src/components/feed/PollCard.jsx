import { useState } from 'react'
import { labels } from './feedConfig'

/**
 * One-tap poll. Voting is local state only; results are text plus bars, so the
 * outcome never depends on colour.
 */
export function PollCard({ poll }) {
  const [voted, setVoted] = useState(null)
  const headingId = `poll-${poll.id}`

  const counts = poll.options.map(
    (option) => option.votes + (voted === option.id ? 1 : 0),
  )
  const total = counts.reduce((sum, count) => sum + count, 0)
  const leader = Math.max(...counts)

  return (
    <section aria-labelledby={headingId} className="bg-brown-900 p-4">
      <p className="text-[12px] text-on-panel-muted">Poll · closes {poll.closes}</p>
      <h2
        id={headingId}
        className="mt-1 font-display text-[20px] leading-tight text-cream-100"
      >
        {poll.question}
      </h2>

      {voted === null ? (
        <div className="mt-3 flex flex-col gap-2">
          {poll.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setVoted(option.id)}
              className="flex h-11 items-center justify-center border border-coral-300 px-3 text-sm text-cream-100 transition-colors duration-[var(--motion-base)] hover:bg-brown-700 focus-visible:ring-[3px] focus-visible:ring-teal-400 focus-visible:outline-none"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <ul className="flex list-none flex-col gap-3 p-0">
            {poll.options.map((option, index) => {
              const percent = Math.round((counts[index] / total) * 100)
              const isLeader = counts[index] === leader
              return (
                <li key={option.id}>
                  <div className="flex items-baseline justify-between gap-3 text-[12px] text-cream-100">
                    <span>
                      {option.label}
                      {voted === option.id ? ' (your vote)' : ''}
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-brown-700">
                    <div
                      className={`h-full ${isLeader ? 'bg-coral-300' : 'bg-cream-100'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-[12px] text-on-panel-muted">
            {labels.pollCloses} {poll.closes}. {total.toLocaleString('en-US')} votes so far.
          </p>
        </div>
      )}
    </section>
  )
}

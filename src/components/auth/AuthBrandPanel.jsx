import { RadioIllustration } from '@/components/site/illustrations'
import { authModalBackground, backgroundStyle, needsTint } from './authModalBackground'
import { benefits, views } from './authModalConfig'
import { BroadcastIcon } from './icons'

/**
 * Desktop: full brown column. Mobile: a ~96px brown band with the title only.
 * Background comes from authModalBackground.js and nowhere else.
 */
export function AuthBrandPanel({ view }) {
  const copy = views[view].panel
  const ownsBackground = authModalBackground.appliesTo === 'brand-panel'

  return (
    <div
      className="relative flex flex-col justify-center overflow-hidden bg-brown-900 px-6 py-5 md:justify-between md:px-8 md:py-10"
      style={ownsBackground ? backgroundStyle() : undefined}
    >
      {ownsBackground && needsTint() ? (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundColor: authModalBackground.tint }}
        />
      ) : null}

      <div className="relative">
        <p className="label-caps hidden items-center gap-2 text-coral-300 md:flex">
          <BroadcastIcon size={16} />
          On the air — Prayagraj
        </p>

        <p className="font-headline text-xl leading-tight font-semibold text-cream-100 md:mt-6 md:text-[28px]">
          {copy.title.lead}{' '}
          <em className="font-display font-normal text-coral-300 italic">{copy.title.accent}</em>
        </p>

        <p className="mt-2 hidden text-sm leading-6 text-on-panel-muted md:block">{copy.body}</p>

        <ul className="mt-6 hidden flex-col gap-3 md:flex">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-sm text-cream-100">
              <span
                aria-hidden
                className="mt-[7px] size-1.5 shrink-0 bg-coral-300"
              />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-8 hidden md:block">
        <div className="w-[180px]">
          <RadioIllustration />
        </div>
        <p className="mt-3 text-xs text-on-panel-muted">We never sell your data.</p>
      </div>
    </div>
  )
}

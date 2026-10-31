import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Container({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1120px] px-5 md:px-16', className)}>
      {children}
    </div>
  )
}

export function SectionMarker({
  index,
  children,
  className,
}: {
  index: string
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn('label-caps flex items-center gap-2 text-ink-muted', className)}>
      <span className="font-mono tracking-normal">{index}</span>
      <span aria-hidden className="h-3 w-px bg-current opacity-50" />
      <span>{children}</span>
    </p>
  )
}

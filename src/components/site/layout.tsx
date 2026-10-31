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
  numberClassName,
  dividerClassName,
}: {
  index: string
  children: ReactNode
  className?: string
  numberClassName?: string
  dividerClassName?: string
}) {
  return (
    <p className={cn('label-caps flex items-center gap-2', className)}>
      <span className={cn('font-mono tracking-normal', numberClassName)}>{index}</span>
      <span aria-hidden className={cn('h-3 w-px', dividerClassName)} />
      <span>{children}</span>
    </p>
  )
}

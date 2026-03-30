'use client'

import { type ReactNode } from 'react'

export function AnimatedSection({
  animKey,
  children,
  className,
}: {
  animKey: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div key={animKey} className="fade-in-up-fast">
        {children}
      </div>
    </div>
  )
}

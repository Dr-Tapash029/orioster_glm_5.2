'use client'

// ═══════════════════════════════════════════════════════════════
// ORIOSTER — Animation helper components
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ── AnimatedCounter ───────────────────────────────────────────
// Counts up from 0 to target value over ~1s with easing
export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  format = (n: number) => Math.round(n).toString(),
}: {
  value: number
  duration?: number
  className?: string
  format?: (n: number) => string
}) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>()
  const startRef = useRef<number>()

  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }
    startRef.current = undefined
    const animate = (ts: number) => {
      if (startRef.current === undefined) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplay(value * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplay(value)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return <span className={cn('count-up tabular-nums', className)}>{format(display)}</span>
}

// ── StaggerList ───────────────────────────────────────────────
// Wraps children with staggered fade-in-up entrance
export function StaggerList({
  children,
  className,
  delay = 0.05,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className="anim-fade-in-up"
              style={{ animationDelay: `${i * delay}s` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  )
}

// ── ShimmerSkeleton ───────────────────────────────────────────
// Loading placeholder with shimmer animation
export function ShimmerSkeleton({
  className,
  lines = 1,
}: {
  className?: string
  lines?: number
}) {
  if (lines === 1) {
    return <div className={cn('shimmer rounded-md', className)} />
  }
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer rounded-md"
          style={{ width: i === lines - 1 ? '60%' : '100%', height: '12px' }}
        />
      ))}
    </div>
  )
}

// ── ShimmerCard ───────────────────────────────────────────────
// Full card skeleton for loading states
export function ShimmerCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass rounded-xl p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="shimmer h-3 w-24 rounded" />
          <div className="shimmer h-7 w-16 rounded" />
          <div className="shimmer h-2 w-20 rounded" />
        </div>
        <div className="shimmer h-11 w-11 rounded-xl" />
      </div>
    </div>
  )
}

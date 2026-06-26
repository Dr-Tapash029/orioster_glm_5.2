'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════
// WordReveal — Staggered word-by-word text reveal (Wope style)
// Splits text into words, each fades in with 0.08s delay
// ═══════════════════════════════════════════════════════════════

export function WordReveal({
  text,
  className,
  delay = 0,
  wordDelay = 0.08,
}: {
  text: string
  className?: string
  delay?: number
  wordDelay?: number
}) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="word-reveal"
          style={{ animationDelay: `${delay + i * wordDelay}s` }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// StaggerCard — Wrapper that applies card-enter + stagger delay
// ═══════════════════════════════════════════════════════════════

export function StaggerCard({
  children,
  index = 0,
  className,
}: {
  children: ReactNode
  index?: number
  className?: string
}) {
  const delay = Math.min(index * 0.08, 0.48)
  return (
    <div
      className={cn('card-enter wope-card-hover', className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

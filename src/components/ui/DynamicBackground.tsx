'use client'

// ═══════════════════════════════════════════════════════════════
// DynamicBackground — Layout-level animated background
// ═══════════════════════════════════════════════════════════════
//
// Hardware-accelerated animated orbs + particle field that sits
// behind the main viewport (fixed inset-0 -z-10). Reads the current
// theme from next-themes and smoothly adjusts color shifting,
// opacity, and particle contrast to remain unobtrusive to clinical
// text and charts.
//
// Performance:
// - Uses transform-only animations (GPU compositor layer)
// - will-change: transform on animated orbs
// - Low particle count (18) with CSS animations
// - Respects prefers-reduced-motion

import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

// Subscribe to prefers-reduced-motion without setState-in-effect
function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}
function getReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
function getReducedMotionServer() {
  return false
}

export function DynamicBackground() {
  const { theme } = useTheme()
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer)

  // theme is undefined during SSR; default to dark until hydrated.
  // next-themes resolves the class on <html> which our inline script sets.
  const isDark = theme !== 'light'

  // ── Orb configurations ──────────────────────────────────────
  // Each orb drifts slowly using transform-only Framer Motion loops.
  // Colors shift between dark (violet/purple) and light (lavender).
  const orbs = isDark
    ? [
        { size: 520, x: '8%', y: '12%', color: 'rgba(113, 61, 255, 0.22)', delay: 0, dur: 28 },
        { size: 460, x: '72%', y: '8%', color: 'rgba(133, 102, 255, 0.18)', delay: 2, dur: 32 },
        { size: 580, x: '40%', y: '68%', color: 'rgba(186, 179, 255, 0.14)', delay: 1, dur: 36 },
        { size: 380, x: '85%', y: '60%', color: 'rgba(113, 61, 255, 0.16)', delay: 3, dur: 30 },
      ]
    : [
        { size: 480, x: '8%', y: '12%', color: 'rgba(113, 61, 255, 0.10)', delay: 0, dur: 28 },
        { size: 420, x: '72%', y: '8%', color: 'rgba(133, 102, 255, 0.08)', delay: 2, dur: 32 },
        { size: 540, x: '40%', y: '68%', color: 'rgba(186, 179, 255, 0.06)', delay: 1, dur: 36 },
        { size: 360, x: '85%', y: '60%', color: 'rgba(113, 61, 255, 0.07)', delay: 3, dur: 30 },
      ]

  // ── Particle field (CSS-animated for perf) ──────────────────
  const particleCount = isDark ? 18 : 12

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at 50% 0%, #140B25 0%, #0a0118 50%, #050010 100%)'
          : 'radial-gradient(ellipse at 50% 0%, #ffffff 0%, #f6f3fc 50%, #f0ebfa 100%)',
      }}
    >
      {/* ── Drifting glow orbs (Framer Motion) ───────────────── */}
      {orbs.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            willChange: 'transform',
          }}
          animate={
            reducedMotion
              ? undefined
              : {
                  x: [0, 30, -20, 0],
                  y: [0, -25, 15, 0],
                  scale: [1, 1.08, 0.96, 1],
                  opacity: [0.7, 1, 0.8, 0.7],
                }
          }
          transition={{
            duration: orb.dur,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── Subtle particle field ────────────────────────────── */}
      {/* Small dots that twinkle — very low opacity, unobtrusive */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const seed = (i * 137.5) % 100
        const left = (seed * 1.1) % 100
        const top = ((seed * 0.7 + i * 13) % 100)
        const size = 1 + (i % 3)
        const delay = (i % 6) * 0.8
        const dur = 3 + (i % 4)
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              background: isDark ? 'rgba(186, 179, 255, 0.4)' : 'rgba(113, 61, 255, 0.25)',
            }}
            animate={
              reducedMotion
                ? undefined
                : { opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }
            }
            transition={{
              duration: dur,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
      })}

      {/* ── Grid texture overlay (very subtle) ───────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(186,179,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(186,179,255,0.02) 1px, transparent 1px)'
            : 'linear-gradient(rgba(113,61,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(113,61,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      {/* ── Vignette (dark mode only, for depth) ─────────────── */}
      {isDark && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5, 0, 16, 0.5) 100%)',
          }}
        />
      )}
    </div>
  )
}

'use client'

// ═══════════════════════════════════════════════════════════════
// ORIOSTER HMS — Shared UI primitives
// Dark navy + cyan glow glassmorphism design system
// ═══════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils'
import {
  Wifi,
  WifiOff,
  CloudUpload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import type { SyncStatus, TriageLevel, RiskLevel } from '@/lib/types'

// ── Glass Panel ───────────────────────────────────────────────
export function GlassPanel({
  children,
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'strong' | 'subtle'
}) {
  const variants = {
    default: 'glass',
    strong: 'glass-strong',
    subtle: 'glass-subtle',
  }
  return (
    <div className={cn(variants[variant], 'rounded-xl', className)} {...props}>
      {children}
    </div>
  )
}

// ── Sync Status Badge ─────────────────────────────────────────
export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const config: Record<SyncStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    DRAFT: {
      label: 'Draft',
      cls: 'bg-white/5 text-slate-400 border-white/10',
      icon: <RefreshCw className="h-3 w-3" />,
    },
    QUEUED: {
      label: 'Queued',
      cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: <CloudUpload className="h-3 w-3" />,
    },
    SYNCED: {
      label: 'Synced',
      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    CONFLICT: {
      label: 'Conflict',
      cls: 'bg-red-500/15 text-red-400 border-red-500/30',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  }
  const c = config[status] ?? config.DRAFT
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        c.cls
      )}
    >
      {c.icon}
      {c.label}
    </span>
  )
}

// ── Triage Badge ──────────────────────────────────────────────
export function TriageBadge({ level }: { level: TriageLevel | null | undefined }) {
  if (!level) return null
  const config: Record<TriageLevel, { label: string; cls: string }> = {
    GREEN: { label: 'Green', cls: 'triage-green' },
    YELLOW: { label: 'Yellow', cls: 'triage-yellow' },
    RED: { label: 'Red', cls: 'triage-red' },
  }
  const c = config[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        c.cls
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {c.label}
    </span>
  )
}

// ── Risk Badge ────────────────────────────────────────────────
export function RiskBadge({ level }: { level: RiskLevel }) {
  const config: Record<RiskLevel, { label: string; cls: string }> = {
    low: { label: 'Low Risk', cls: 'triage-green' },
    moderate: { label: 'Moderate Risk', cls: 'triage-yellow' },
    high: { label: 'High Risk', cls: 'triage-red' },
  }
  const c = config[level] ?? config.moderate
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        c.cls
      )}
    >
      {c.label}
    </span>
  )
}

// ── Role Badge ────────────────────────────────────────────────
export function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    DOCTOR: { label: 'Doctor', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
    NURSE: { label: 'Nurse', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    ADMIN: { label: 'Admin', cls: 'bg-white/10 text-slate-200 border-white/20' },
    LAB_TECH: { label: 'Lab Tech', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  }
  const c = config[role] ?? config.ADMIN
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        c.cls
      )}
    >
      {c.label}
    </span>
  )
}

// ── AI Disclaimer Chip ────────────────────────────────────────
export function DisclaimerChip({ text }: { text?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <span>{text ?? 'This output is not a diagnosis and must be reviewed by a human professional.'}</span>
    </div>
  )
}

// ── Confidence Meter ──────────────────────────────────────────
export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  const color =
    pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-cyan-300">{pct}%</span>
    </div>
  )
}

// ── Offline Banner ────────────────────────────────────────────
export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null
  return (
    <div className="flex items-center gap-2 bg-amber-500/90 px-4 py-1.5 text-xs font-medium text-amber-950">
      <WifiOff className="h-3.5 w-3.5" />
      Offline mode — all clinical workflows remain fully functional. Data will sync when connection returns.
    </div>
  )
}

// ── Online Indicator ──────────────────────────────────────────
export function OnlineIndicator({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        online
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      )}
    >
      {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {online ? 'Online' : 'Offline'}
    </span>
  )
}

// ── KPI Stat Card (with gradient + glow) ──────────────────────
export function StatCard({
  label,
  value,
  icon,
  trend,
  accent = 'cyan',
  className,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  accent?: 'cyan' | 'amber' | 'turquoise' | 'critical'
  className?: string
}) {
  const accents: Record<string, { card: string; iconBg: string; iconColor: string; valueColor: string }> = {
    cyan: {
      card: 'kpi-cyan',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-300',
      valueColor: 'text-cyan-100',
    },
    amber: {
      card: 'kpi-amber',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-300',
      valueColor: 'text-amber-100',
    },
    turquoise: {
      card: 'kpi-turquoise',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-300',
      valueColor: 'text-emerald-100',
    },
    critical: {
      card: 'kpi-critical',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-300',
      valueColor: 'text-red-100',
    },
  }
  const a = accents[accent] ?? accents.cyan
  return (
    <div className={cn('rounded-xl p-4 sm:p-5', a.card, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-400">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl', a.valueColor)}>{value}</p>
          {trend && <p className="mt-0.5 text-[11px] text-slate-500">{trend}</p>}
        </div>
        <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', a.iconBg, a.iconColor)}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

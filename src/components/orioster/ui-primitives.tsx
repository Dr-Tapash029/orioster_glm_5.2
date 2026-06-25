'use client'

// ORIOSTER — Shared UI primitives (glassmorphism design system)

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
    <div className={cn(variants[variant], 'rounded-2xl', className)} {...props}>
      {children}
    </div>
  )
}

// ── Sync Status Badge ─────────────────────────────────────────
export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const config: Record<SyncStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    DRAFT: {
      label: 'Draft',
      cls: 'bg-muted/60 text-muted-foreground border-border',
      icon: <RefreshCw className="h-3 w-3" />,
    },
    QUEUED: {
      label: 'Queued',
      cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      icon: <CloudUpload className="h-3 w-3" />,
    },
    SYNCED: {
      label: 'Synced',
      cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    CONFLICT: {
      label: 'Conflict',
      cls: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
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
    DOCTOR: { label: 'Doctor', cls: 'bg-primary/15 text-primary border-primary/30' },
    NURSE: { label: 'Nurse', cls: 'bg-accent/15 text-accent-foreground border-accent/30' },
    ADMIN: { label: 'Admin', cls: 'bg-foreground/10 text-foreground border-foreground/20' },
    LAB_TECH: { label: 'Lab Tech', cls: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30' },
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
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
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
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums">{pct}%</span>
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
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      )}
    >
      {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {online ? 'Online' : 'Offline'}
    </span>
  )
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  trend,
  accent = 'primary',
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  accent?: 'primary' | 'accent' | 'amber' | 'red'
}) {
  const accents = {
    primary: 'text-primary bg-primary/10',
    accent: 'text-accent-foreground bg-accent/15',
    amber: 'text-amber-600 dark:text-amber-300 bg-amber-500/10',
    red: 'text-red-600 dark:text-red-300 bg-red-500/10',
  }
  return (
    <GlassPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          {trend && <p className="mt-0.5 text-[11px] text-muted-foreground">{trend}</p>}
        </div>
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', accents[accent])}>
          {icon}
        </div>
      </div>
    </GlassPanel>
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
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

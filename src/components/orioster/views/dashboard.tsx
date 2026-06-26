'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { GlassPanel, StatCard, SectionHeader, TriageBadge, SyncStatusBadge } from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserPlus,
  CalendarClock,
  Sparkles,
  HeartPulse,
  AlertTriangle,
  Activity,
  FlaskConical,
  Receipt,
  Stethoscope,
  TrendingUp,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import type { AppRole } from '@/lib/types'

interface DashboardData {
  stats: {
    totalPatients: number
    draftPatients: number
    completedPatients: number
    reviewedPatients: number
    totalAppointments: number
    scheduledAppts: number
    inProgressAppts: number
    totalStaff: number
    doctors: number
    nurses: number
    totalAiResults: number
    totalLabReports: number
    totalInvoices: number
    triage: { red: number; yellow: number; green: number }
    sync: { synced: number; queued: number; draft: number }
  }
  recentPatients: Array<{
    id: string
    fullName: string
    localId: string
    gender: string
    age: number | null
    status: string
    syncStatus: string
    chiefComplaint: string | null
    createdAt: string
    vitals: Array<{ triageLevel: string | null }>
    appointments: Array<{ doctor: { name: string }; scheduledAt: string; status: string }>
  }>
}

export function DashboardView() {
  const { user, setView, setActivePatient } = useAppStore()
  const role = (user?.role ?? 'ADMIN') as AppRole
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    )
  }

  const s = data.stats
  const triageData = [
    { name: 'Green', value: s.triage.green, color: '#22C55E' },
    { name: 'Yellow', value: s.triage.yellow, color: '#F59E0B' },
    { name: 'Red', value: s.triage.red, color: '#EF4444' },
  ]
  const trendData = [
    { day: 'Mon', patients: 12, referrals: 3, medicine: 18 },
    { day: 'Tue', patients: 19, referrals: 5, medicine: 24 },
    { day: 'Wed', patients: 15, referrals: 4, medicine: 20 },
    { day: 'Thu', patients: 22, referrals: 7, medicine: 28 },
    { day: 'Fri', patients: 28, referrals: 9, medicine: 35 },
    { day: 'Sat', patients: 24, referrals: 6, medicine: 30 },
    { day: 'Sun', patients: 16, referrals: 4, medicine: 22 },
  ]

  return (
    <div className="space-y-3 p-3 lg:space-y-5 lg:p-6">
      {/* ═══ Welcome Panel ══════════════════════════════════════ */}
      <GlassPanel variant="strong" className="section-slide-up p-4 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-violet-400 word-reveal lg:text-sm" style={{ animationDelay: '0.1s' }}>{roleGreeting(role)}</p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-100 text-glow-pulse word-reveal lg:text-3xl" style={{ animationDelay: '0.2s' }}>
              {user?.name}
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400 word-reveal lg:text-sm" style={{ animationDelay: '0.35s' }}>
              Here is today&apos;s hospital operations overview.
            </p>
          </div>
          {(role === 'NURSE' || role === 'ADMIN' || role === 'DOCTOR') && (
            <Button
              onClick={() => setView('patient-entry')}
              className="fx-btn-border-trace fx-btn-border-trace-sm btn-press ripple gap-1.5 word-reveal flex-shrink-0 lg:fx-btn-border-trace-lg"
              style={{ animationDelay: '0.5s' }}
            >
              <UserPlus className="h-3.5 w-3.5 lg:h-4.5 lg:w-4.5" />
              <span className="hidden sm:inline">Add Patient</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </GlassPanel>

      {/* ═══ KPI Cards — responsive grid ════════════════════════ */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="card-enter stagger-1">
          <StatCard label="Patients Served" value={s.totalPatients} icon={<HeartPulse className="h-4 w-4 lg:h-5 lg:w-5" />} trend={`${s.draftPatients} in draft`} accent="cyan" />
        </div>
        <div className="card-enter stagger-2">
          <StatCard label="Active Cases" value={s.inProgressAppts + s.scheduledAppts} icon={<Activity className="h-4 w-4 lg:h-5 lg:w-5" />} trend={`${s.scheduledAppts} scheduled`} accent="amber" />
        </div>
        <div className="card-enter stagger-3">
          <StatCard label="Beneficiaries" value={s.completedPatients} icon={<Users className="h-4 w-4 lg:h-5 lg:w-5" />} trend={`${s.reviewedPatients} reviewed`} accent="turquoise" />
        </div>
        <div className="card-enter stagger-4">
          <StatCard label="AI Alerts" value={s.triage.red} icon={<AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5" />} trend="Critical triage" accent="critical" />
        </div>
      </div>

      {/* ═══ Charts — stacked on mobile, side-by-side on desktop ══ */}
      <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-5 lg:gap-4">
        <GlassPanel className="wope-card-hover card-enter stagger-3 p-3.5 lg:col-span-3 lg:p-5">
          <SectionHeader title="Patient Trends" subtitle="Patients · Medicine Distribution" />
          <div className="mt-3 h-44 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#713DFF" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#713DFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gMedicine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9b96b0' }} stroke="rgba(255,255,255,0.06)" />
              <YAxis tick={{ fontSize: 9, fill: '#9b96b0' }} stroke="rgba(255,255,255,0.06)" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#140B25',
                  border: '1px solid rgba(186,179,255,0.15)',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#ffffff',
                }}
              />
              <Area type="monotone" dataKey="patients" stroke="#713DFF" strokeWidth={2} fill="url(#gPatients)" name="Patients" />
              <Area type="monotone" dataKey="medicine" stroke="#22C55E" strokeWidth={2} fill="url(#gMedicine)" name="Medicine" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>

      <GlassPanel className="wope-card-hover card-enter stagger-4 p-3.5 lg:col-span-2 lg:p-5">
        <SectionHeader title="Triage Distribution" subtitle="Local clinical triage" />
        <div className="mt-3 h-40 lg:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={triageData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={60}
                paddingAngle={3}
              >
                {triageData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#140B25',
                  border: '1px solid rgba(186,179,255,0.15)',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#ffffff',
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: '#9b96b0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>
      </div>

      {/* ═══ Recent Activities / Patients ═══════════════════════ */}
      <GlassPanel className="wope-card-hover card-enter stagger-5 p-3.5">
        <SectionHeader
          title="Recent Activities"
          subtitle="Latest patient entries"
          action={
            <Button variant="ghost" size="sm" onClick={() => setView('patients')} className="fx-btn-border-trace fx-btn-border-trace-sm btn-press ripple gap-1 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10">
              <Users className="h-3 w-3" />
              All
            </Button>
          }
        />
        <div className="mt-3 space-y-1.5">
          {data.recentPatients.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePatient(p.id)
                setView('patient-detail')
              }}
              className="row-slide flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-violet-500/8"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[10px] font-semibold text-violet-300">
                {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-100">{p.fullName}</p>
                <p className="truncate text-[10px] text-slate-500">{p.chiefComplaint ?? '—'}</p>
              </div>
              <TriageBadge level={(p.vitals[0]?.triageLevel as 'GREEN' | 'YELLOW' | 'RED') ?? null} />
              <SyncStatusBadge status={p.syncStatus as 'DRAFT' | 'QUEUED' | 'SYNCED' | 'CONFLICT'} />
            </button>
          ))}
        </div>
      </GlassPanel>
    </div>
  )
}

function roleGreeting(role: AppRole): string {
  const hours = new Date().getHours()
  const tod = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening'
  return tod
}

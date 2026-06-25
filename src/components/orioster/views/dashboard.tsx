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
  BarChart,
  Bar,
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
import { formatDistanceToNow } from 'date-fns'

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
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
    <div className="space-y-5">
      {/* ═══ Welcome Panel ══════════════════════════════════════ */}
      <GlassPanel variant="strong" className="overflow-hidden p-5 sm:p-6 mh-stagger-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cyan-400">{roleGreeting(role)}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">{user?.name}</h1>
            <p className="mt-1 text-sm text-slate-400">
              Here is today&apos;s hospital operations overview.
            </p>
          </div>
          {(role === 'NURSE' || role === 'ADMIN' || role === 'DOCTOR') && (
            <Button
              size="lg"
              onClick={() => setView('patient-entry')}
              className="fx-btn-border-trace btn-press ripple gap-2"
            >
              <UserPlus className="h-4.5 w-4.5" />
              Add Patient
            </Button>
          )}
        </div>
      </GlassPanel>

      {/* ═══ KPI Cards (gradient + glow) ════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="mh-stagger-1">
          <StatCard label="Patients Served" value={s.totalPatients} icon={<HeartPulse className="h-5 w-5" />} trend={`${s.draftPatients} in draft`} accent="cyan" />
        </div>
        <div className="mh-stagger-2">
          <StatCard label="Active Cases" value={s.inProgressAppts + s.scheduledAppts} icon={<Activity className="h-5 w-5" />} trend={`${s.scheduledAppts} scheduled`} accent="amber" />
        </div>
        <div className="mh-stagger-3">
          <StatCard label="Beneficiaries" value={s.completedPatients} icon={<Users className="h-5 w-5" />} trend={`${s.reviewedPatients} reviewed`} accent="turquoise" />
        </div>
        <div className="mh-stagger-4">
          <StatCard label="AI Alerts" value={s.triage.red} icon={<AlertTriangle className="h-5 w-5" />} trend="Critical triage" accent="critical" />
        </div>
      </div>

      {/* ═══ Charts row ═════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Humanitarian Trends — area chart */}
        <GlassPanel className="p-4 sm:p-5 mh-stagger-3 lg:col-span-2">
          <SectionHeader title="Humanitarian Trends" subtitle="Patients · Referrals · Medicine Distribution" />
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="gPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#36B8D8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#36B8D8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMedicine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8ba8b8' }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: '#8ba8b8' }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0A1B31',
                    border: '1px solid rgba(115,232,255,0.15)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#e8f4f8',
                  }}
                />
                <Area type="monotone" dataKey="patients" stroke="#36B8D8" strokeWidth={2} fill="url(#gPatients)" name="Patients" />
                <Area type="monotone" dataKey="medicine" stroke="#22C55E" strokeWidth={2} fill="url(#gMedicine)" name="Medicine" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Triage distribution */}
        <GlassPanel className="p-4 sm:p-5 mh-stagger-4">
          <SectionHeader title="Triage Distribution" subtitle="Local clinical triage" />
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={triageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {triageData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0A1B31',
                    border: '1px solid rgba(115,232,255,0.15)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#e8f4f8',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#8ba8b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      {/* ═══ Recent Activities / Patients ═══════════════════════ */}
      <GlassPanel className="p-4 sm:p-5 mh-stagger-5">
        <SectionHeader
          title="Recent Activities"
          subtitle="Latest activities across all roles"
          action={
            <Button variant="ghost" size="sm" onClick={() => setView('patients')} className="gap-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
              <Users className="h-3.5 w-3.5" />
              View all
            </Button>
          }
        />
        <div className="mt-4 overflow-x-auto mh-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-slate-500">
                <th className="pb-2 pr-3 font-medium">Patient</th>
                <th className="pb-2 pr-3 font-medium">Complaint</th>
                <th className="hidden pb-2 pr-3 font-medium sm:table-cell">Triage</th>
                <th className="hidden pb-2 pr-3 font-medium md:table-cell">Doctor</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium">Sync</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.recentPatients.map((p) => (
                <tr
                  key={p.id}
                  className="row-slide cursor-pointer border-b border-white/5"
                  onClick={() => {
                    setActivePatient(p.id)
                    setView('patient-detail')
                  }}
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-300">
                        {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-medium leading-tight text-slate-100">{p.fullName}</p>
                        <p className="text-[11px] text-slate-500">{p.localId} · {p.age ?? '?'}y · {p.gender.toLowerCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[180px] truncate py-2.5 pr-3 text-slate-400">
                    {p.chiefComplaint ?? '—'}
                  </td>
                  <td className="hidden py-2.5 pr-3 sm:table-cell">
                    <TriageBadge level={(p.vitals[0]?.triageLevel as 'GREEN' | 'YELLOW' | 'RED') ?? null} />
                  </td>
                  <td className="hidden py-2.5 pr-3 md:table-cell text-slate-400">
                    {p.appointments[0]?.doctor.name ?? '—'}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="text-xs font-medium text-slate-300">{p.status}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <SyncStatusBadge status={p.syncStatus as 'DRAFT' | 'QUEUED' | 'SYNCED' | 'CONFLICT'} />
                  </td>
                  <td className="py-2.5 text-right text-[11px] text-slate-500">
                    {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

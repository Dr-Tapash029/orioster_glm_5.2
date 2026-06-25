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
  CheckCircle2,
  Clock,
  FlaskConical,
  Receipt,
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

const STATUS_COLORS: Record<string, string> = {
  synced: 'var(--color-chart-2)',
  queued: 'var(--color-chart-3)',
  draft: 'var(--color-chart-4)',
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const s = data.stats
  const triageData = [
    { name: 'Green', value: s.triage.green, color: 'oklch(0.65 0.15 145)' },
    { name: 'Yellow', value: s.triage.yellow, color: 'oklch(0.7 0.18 80)' },
    { name: 'Red', value: s.triage.red, color: 'oklch(0.62 0.2 25)' },
  ]
  const syncData = [
    { name: 'Synced', value: s.sync.synced },
    { name: 'Queued', value: s.sync.queued },
    { name: 'Draft', value: s.sync.draft },
  ]
  const statusData = [
    { name: 'Draft', value: s.draftPatients },
    { name: 'Completed', value: s.completedPatients },
    { name: 'Reviewed', value: s.reviewedPatients },
  ]

  return (
    <div className="space-y-5">
      {/* Role-specific greeting */}
      <GlassPanel variant="strong" className="overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {roleGreeting(role)}
            </p>
            <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">{user?.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {roleDescription(role)}
            </p>
          </div>
          {(role === 'NURSE' || role === 'ADMIN' || role === 'DOCTOR') && (
            <Button
              size="lg"
              onClick={() => setView('patient-entry')}
              className="gap-2 shadow-md shadow-primary/20"
            >
              <UserPlus className="h-4.5 w-4.5" />
              Add Patient
            </Button>
          )}
        </div>
      </GlassPanel>

      {/* Stat cards — role-specific */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Patients" value={s.totalPatients} icon={<Users className="h-5 w-5" />} trend={`${s.draftPatients} in draft`} accent="primary" />
        {role === 'DOCTOR' || role === 'ADMIN' ? (
          <StatCard label="AI Insights" value={s.totalAiResults} icon={<Sparkles className="h-5 w-5" />} trend="Advisory outputs" accent="accent" />
        ) : role === 'LAB_TECH' ? (
          <StatCard label="Lab Reports" value={s.totalLabReports} icon={<FlaskConical className="h-5 w-5" />} trend="Generated" accent="accent" />
        ) : (
          <StatCard label="Appointments" value={s.totalAppointments} icon={<CalendarClock className="h-5 w-5" />} trend={`${s.scheduledAppts} scheduled`} accent="accent" />
        )}
        {role === 'ADMIN' ? (
          <StatCard label="Invoices" value={s.totalInvoices} icon={<Receipt className="h-5 w-5" />} trend="Total issued" accent="amber" />
        ) : (
          <StatCard label="Red Triage" value={s.triage.red} icon={<AlertTriangle className="h-5 w-5" />} trend="Critical patients" accent="red" />
        )}
        <StatCard label="Staff On-duty" value={s.totalStaff} icon={<HeartPulse className="h-5 w-5" />} trend={`${s.doctors} doctors · ${s.nurses} nurses`} accent="primary" />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Triage distribution */}
        <GlassPanel className="p-4 sm:p-5">
          <SectionHeader title="Triage Distribution" subtitle="Local clinical triage — no AI" />
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={triageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {triageData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Sync status */}
        <GlassPanel className="p-4 sm:p-5">
          <SectionHeader title="Sync Status" subtitle="Local SQLite → cloud" />
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={syncData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {syncData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? 'oklch(0.65 0.15 145)' : i === 1 ? 'oklch(0.7 0.18 80)' : 'oklch(0.55 0.04 175)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Patient status */}
        <GlassPanel className="p-4 sm:p-5">
          <SectionHeader title="Patient Status" subtitle="Workflow pipeline" />
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" width={70} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="oklch(0.6 0.13 175)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      {/* Recent patients */}
      <GlassPanel className="p-4 sm:p-5">
        <SectionHeader
          title="Recent Patients"
          subtitle="Latest entries across all roles"
          action={
            <Button variant="outline" size="sm" onClick={() => setView('patients')} className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              View all
            </Button>
          }
        />
        <div className="mt-4 overflow-x-auto orio-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
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
                  className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/40"
                  onClick={() => {
                    setActivePatient(p.id)
                    setView('patient-detail')
                  }}
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-medium leading-tight">{p.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{p.localId} · {p.age ?? '?'}y · {p.gender.toLowerCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[180px] truncate py-2.5 pr-3 text-muted-foreground">
                    {p.chiefComplaint ?? '—'}
                  </td>
                  <td className="hidden py-2.5 pr-3 sm:table-cell">
                    <TriageBadge level={(p.vitals[0]?.triageLevel as 'GREEN' | 'YELLOW' | 'RED') ?? null} />
                  </td>
                  <td className="hidden py-2.5 pr-3 md:table-cell text-muted-foreground">
                    {p.appointments[0]?.doctor.name ?? '—'}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="text-xs font-medium">{p.status}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <SyncStatusBadge status={p.syncStatus as 'DRAFT' | 'QUEUED' | 'SYNCED' | 'CONFLICT'} />
                  </td>
                  <td className="py-2.5 text-right text-[11px] text-muted-foreground">
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
  switch (role) {
    case 'DOCTOR': return `${tod}, Doctor`
    case 'NURSE': return `${tod}, Nurse`
    case 'ADMIN': return `${tod}, Administrator`
    case 'LAB_TECH': return `${tod}, Lab Technician`
    default: return tod
  }
}

function roleDescription(role: AppRole): string {
  switch (role) {
    case 'DOCTOR': return 'Review patients, confirm diagnoses, and use Orio AI for clinical decision support.'
    case 'NURSE': return 'Manage patient intake through the 10-step entry wizard and record vitals.'
    case 'ADMIN': return 'Oversee appointments, invoicing, staff, and the AI Hub for document generation.'
    case 'LAB_TECH': return 'Enter lab parameters and trigger AI analysis for investigation reports.'
    default: return 'Manage hospital operations.'
  }
}

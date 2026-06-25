'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { GlassPanel, SectionHeader, TriageBadge, SyncStatusBadge } from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Search, Users, Sparkles, FlaskConical, Receipt, ArrowRight, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface PatientRow {
  id: string
  localId: string
  fullName: string
  gender: string
  age: number | null
  localIdNumber: string | null
  chiefComplaint: string | null
  status: string
  syncStatus: string
  createdAt: string
  vitals: Array<{ triageLevel: string | null }>
  appointments: Array<{ doctor: { name: string }; status: string }>
  _count: { aiResults: number; labReports: number; invoices: number }
}

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REVIEWED', label: 'Reviewed' },
]

export function PatientsListView() {
  const { setView, setActivePatient, user } = useAppStore()
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')

  const fetchPatients = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'ALL') params.set('status', status)
    fetch(`/api/patients?${params}`)
      .then((r) => r.json())
      .then((d) => setPatients(d.patients ?? []))
      .finally(() => setLoading(false))
  }, [search, status])

  useEffect(() => {
    const t = setTimeout(fetchPatients, 250)
    return () => clearTimeout(t)
  }, [fetchPatients])

  const canAddPatient = user?.role === 'NURSE' || user?.role === 'ADMIN' || user?.role === 'DOCTOR'

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Patients"
        subtitle={`${patients.length} ${patients.length === 1 ? 'record' : 'records'} · Local SQLite is runtime authority`}
        action={
          canAddPatient && (
            <Button onClick={() => setView('patient-entry')} className="btn-cyan gap-2">
              <UserPlus className="h-4 w-4" />
              Add Patient
            </Button>
          )
        }
      />

      {/* Filters */}
      <GlassPanel className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, patient ID, or local ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassPanel>

      {/* Patient list */}
      <GlassPanel className="overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <Users className="h-7 w-7 text-slate-500" />
            </div>
            <div>
              <p className="font-medium text-slate-100">No patients found</p>
              <p className="text-sm text-slate-400">Try adjusting your search or add a new patient.</p>
            </div>
            {canAddPatient && (
              <Button variant="outline" size="sm" onClick={() => setView('patient-entry')} className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Add Patient
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto orio-scroll">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr className="text-left text-xs text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Patient</th>
                  <th className="hidden px-3 py-2.5 font-medium md:table-cell">Chief Complaint</th>
                  <th className="px-3 py-2.5 font-medium">Triage</th>
                  <th className="hidden px-3 py-2.5 font-medium lg:table-cell">Doctor</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Sync</th>
                  <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Reports</th>
                  <th className="px-3 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setActivePatient(p.id)
                      setView('patient-detail')
                    }}
                    className="cursor-pointer border-b border-white/10 transition-colors last:border-0 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-300">
                          {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium leading-tight text-slate-100">{p.fullName}</p>
                          <p className="text-[11px] text-slate-400">
                            {p.localId} · {p.age ?? '?'}y · {p.gender.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden max-w-[200px] truncate px-3 py-3 text-slate-400 md:table-cell">
                      {p.chiefComplaint ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <TriageBadge level={(p.vitals[0]?.triageLevel as 'GREEN' | 'YELLOW' | 'RED') ?? null} />
                    </td>
                    <td className="hidden px-3 py-3 text-slate-400 lg:table-cell">
                      {p.appointments[0]?.doctor.name ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-3 py-3">
                      <SyncStatusBadge status={p.syncStatus as 'DRAFT' | 'QUEUED' | 'SYNCED' | 'CONFLICT'} />
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        {p._count.aiResults > 0 && (
                          <span className="inline-flex items-center gap-0.5" title="AI results">
                            <Sparkles className="h-3 w-3 text-cyan-400" />
                            {p._count.aiResults}
                          </span>
                        )}
                        {p._count.labReports > 0 && (
                          <span className="inline-flex items-center gap-0.5" title="Lab reports">
                            <FlaskConical className="h-3 w-3" />
                            {p._count.labReports}
                          </span>
                        )}
                        {p._count.invoices > 0 && (
                          <span className="inline-flex items-center gap-0.5" title="Invoices">
                            <Receipt className="h-3 w-3" />
                            {p._count.invoices}
                          </span>
                        )}
                        {p._count.aiResults === 0 && p._count.labReports === 0 && p._count.invoices === 0 && (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      <p className="text-center text-[11px] text-slate-500">
        Showing {patients.length} {patients.length === 1 ? 'patient' : 'patients'} ·{' '}
        {formatDistanceToNow(new Date(), { addSuffix: false })} · Click any row to view full record
      </p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, string> = {
    DRAFT: 'bg-white/5 text-slate-400',
    IN_PROGRESS: 'bg-amber-500/15 text-amber-300',
    COMPLETED: 'bg-emerald-500/15 text-emerald-300',
    REVIEWED: 'bg-cyan-500/15 text-cyan-300',
  }
  const label: Record<string, string> = {
    DRAFT: 'Draft',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    REVIEWED: 'Reviewed',
  }
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-medium', config[status] ?? config.DRAFT)}>
      {label[status] ?? status}
    </span>
  )
}

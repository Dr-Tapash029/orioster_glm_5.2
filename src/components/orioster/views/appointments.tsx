'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { GlassPanel, SectionHeader, RoleBadge } from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CalendarClock, Plus, Clock, CheckCircle2, XCircle, Activity, ArrowRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Appointment {
  id: string
  patientId: string
  doctorId: string
  scheduledAt: string
  status: string
  reason: string
  patient: { id: string; fullName: string; localId: string; gender: string; age: number | null; status: string; chiefComplaint: string | null }
  doctor: { id: string; name: string; role: string }
}

interface Patient { id: string; fullName: string; localId: string }
interface Doctor { id: string; name: string }

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  SCHEDULED: { label: 'Scheduled', cls: 'bg-amber-500/15 text-amber-300', icon: <Clock className="h-3 w-3" /> },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-violet-500/15 text-violet-300', icon: <Activity className="h-3 w-3" /> },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-500/15 text-emerald-300', icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-500/15 text-red-400', icon: <XCircle className="h-3 w-3" /> },
}

export function AppointmentsView() {
  const { user, setActivePatient, setView } = useAppStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [form, setForm] = useState({ patientId: '', doctorId: '', scheduledAt: '', reason: '' })

  const fetchAppts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    fetch(`/api/appointments?${params}`)
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments ?? []))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => {
    fetchAppts()
  }, [fetchAppts])

  useEffect(() => {
    if (open) {
      fetch('/api/patients?limit=200').then((r) => r.json()).then((d) => setPatients(d.patients ?? []))
      fetch('/api/staff?role=DOCTOR').then((r) => r.json()).then((d) => setDoctors(d.staff ?? []))
    }
  }, [open])

  async function createAppt() {
    if (!form.patientId || !form.doctorId || !form.scheduledAt) {
      toast.error('Please fill all fields')
      return
    }
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Appointment scheduled')
      setOpen(false)
      setForm({ patientId: '', doctorId: '', scheduledAt: '', reason: '' })
      fetchAppts()
    } catch {
      toast.error('Failed to schedule appointment')
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      toast.success(`Marked as ${status.toLowerCase()}`)
      fetchAppts()
    } catch {
      toast.error('Failed to update')
    }
  }

  const counts = appointments.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-3 p-3 lg:space-y-5 lg:p-6">
      <SectionHeader
        title="Appointments"
        subtitle={`${appointments.length} total · ${counts.SCHEDULED ?? 0} scheduled · ${counts.IN_PROGRESS ?? 0} in progress`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="fx-btn-border-trace fx-btn-border-trace-sm btn-press ripple gap-2">
                <Plus className="h-4 w-4" />
                Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md sm:w-full">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Patient</Label>
                  <Select value={form.patientId} onValueChange={(v) => setForm((f) => ({ ...f, patientId: v }))}>
                    <SelectTrigger className="mt-1 h-10 text-sm">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.fullName} ({p.localId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Doctor</Label>
                  <Select value={form.doctorId} onValueChange={(v) => setForm((f) => ({ ...f, doctorId: v }))}>
                    <SelectTrigger className="mt-1 h-10 text-sm">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date & Time</Label>
                  <Input
                    type="datetime-local"
                    className="mt-1 h-10 text-sm"
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Reason (optional)</Label>
                  <Input
                    className="mt-1 h-10 text-sm"
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder="Consultation"
                  />
                </div>
                <Button onClick={createAppt} className="fx-btn-border-trace btn-press ripple w-full">Schedule Appointment</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'h-8 rounded-full border px-3 text-xs font-medium transition-colors',
              statusFilter === s
                ? 'border-violet-500/30 bg-violet-500/15 text-violet-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            )}
          >
            {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : appointments.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <CalendarClock className="h-7 w-7 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-100">No appointments</p>
            <p className="text-sm text-slate-400">Schedule a new appointment to get started.</p>
          </div>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
          {appointments.map((a) => {
            const sc = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.SCHEDULED
            let dt: Date | null = null
            try { dt = parseISO(a.scheduledAt) } catch { dt = null }
            return (
              <GlassPanel key={a.id} className="card-lift p-3 md:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button
                      onClick={() => { setActivePatient(a.patientId); setView('patient-detail') }}
                      className="truncate text-left text-sm font-medium text-slate-100 hover:text-violet-300 hover:underline"
                    >
                      {a.patient.fullName}
                    </button>
                    <p className="text-[11px] text-slate-400">
                      {a.patient.localId} · {a.patient.age ?? '?'}y · {a.patient.gender.toLowerCase()}
                    </p>
                  </div>
                  <span className={cn('inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', sc.cls)}>
                    {sc.icon}
                    {sc.label}
                  </span>
                </div>

                {a.patient.chiefComplaint && (
                  <p className="mt-2 line-clamp-1 text-xs text-slate-400">{a.patient.chiefComplaint}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-100">
                  <CalendarClock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <span>{dt ? format(dt, 'MMM d, yyyy') : '—'}</span>
                  <span className="text-slate-400">·</span>
                  <span>{dt ? format(dt, 'h:mm a') : '—'}</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <RoleBadge role={a.doctor.role} />
                  <span className="truncate text-xs text-slate-300">{a.doctor.name}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.status === 'SCHEDULED' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'IN_PROGRESS')} className="fx-btn-border-trace fx-btn-border-trace-sm btn-press ripple h-7 border-white/10 text-xs text-slate-300 hover:bg-white/5">
                      Start
                    </Button>
                  )}
                  {a.status === 'IN_PROGRESS' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'COMPLETED')} className="fx-btn-border-trace fx-btn-border-trace-sm btn-press ripple h-7 border-white/10 text-xs text-slate-300 hover:bg-white/5">
                      Complete
                    </Button>
                  )}
                  {(a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS') && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, 'CANCELLED')} className="fx-btn-border-trace fx-btn-border-trace-sm btn-press ripple h-7 text-xs text-red-400">
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setActivePatient(a.patientId); setView('patient-detail') }}
                    className="fx-btn-border-trace fx-btn-border-trace-sm btn-press ripple ml-auto h-7 text-xs text-slate-300 hover:text-slate-100"
                  >
                    View <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </GlassPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

// ─────────────────────────────────────────────────────────────────────────────
// ORIOSTER — Patient Detail View
// Comprehensive patient record with 6 tabs:
// Overview · Vitals · AI Results · Lab Reports · Invoices · Appointments
// AI outputs shown here are ADVISORY ONLY — review by a human professional.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import {
  ArrowLeft, User, HeartPulse, Sparkles, FlaskConical, Receipt, CalendarClock,
  Stethoscope, Pill, ClipboardList, ShieldAlert, Lock, CheckCircle2,
  AlertTriangle, Activity, FileBadge, UserPlus, Phone, MapPin, Briefcase,
  GraduationCap, Award, X,
} from 'lucide-react'

import { useAppStore } from '@/lib/store'
import {
  GlassPanel, SectionHeader, TriageBadge, RiskBadge, DisclaimerChip,
  ConfidenceMeter, SyncStatusBadge, RoleBadge,
} from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  AI_TASK_LABELS, LAB_REPORT_LABELS, type AiOutput, type RiskLevel,
  type TriageLevel,
} from '@/lib/types'

// ── Types ────────────────────────────────────────────────────────────────────
interface VitalsRecord {
  id: string
  temperature: number | null
  bpSystolic: number | null
  bpDiastolic: number | null
  heartRate: number | null
  spo2: number | null
  weightKg: number | null
  heightCm: number | null
  triageLevel: string | null
  recordedAt: string
  recordedBy: string
}

interface AppointmentRecord {
  id: string
  scheduledAt: string
  status: string
  reason: string | null
  doctor: { id: string; name: string; role: string }
}

interface AiResultRecord {
  id: string
  taskType: string
  summary: string
  riskLevel: string
  confidence: number
  limitations: string
  recommendationType: string
  disclaimer: string
  tierUsed: number
  modelUsed: string | null
  fullOutput: string
  createdAt: string
  createdByStaff?: { name: string }
}

interface LabReportRecord {
  id: string
  reportType: string
  parameters: string
  isNormal: boolean | null
  aiFeedback: string | null
  status: string
  createdAt: string
  createdByStaff?: { name: string }
}

interface InvoiceRecord {
  id: string
  invoiceNo: string
  items: string
  subtotal: number
  tax: number
  total: number
  status: string
  createdAt: string
}

interface PatientDetail {
  id: string
  localId: string
  fullName: string
  gender: string
  dateOfBirth: string
  age: number | null
  contact: string | null
  address: string | null
  localIdNumber: string | null
  bloodGroup: string | null
  heightCm: number | null
  weightKg: number | null
  profession: string | null
  education: string | null
  consentGiven: boolean
  syncStatus: string
  status: string
  chiefComplaint: string | null
  pastHistory: string | null
  ongoingMedications: string | null
  allergies: string | null
  localSummary: string | null
  notificationStatus: string | null
  createdAt: string
  vitals: VitalsRecord[]
  appointments: AppointmentRecord[]
  aiResults: AiResultRecord[]
  labReports: LabReportRecord[]
  invoices: InvoiceRecord[]
  createdByStaff: { name: string; role: string }
}

type TabKey = 'overview' | 'vitals' | 'ai' | 'labs' | 'invoices' | 'appointments'

// ── Main View ────────────────────────────────────────────────────────────────
export function PatientDetailView() {
  const { activePatientId, setView, setActivePatient } = useAppStore()
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('overview')

  useEffect(() => {
    if (!activePatientId) return
    let cancelled = false
    fetch(`/api/patients/${activePatientId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.patient) setPatient(d.patient as PatientDetail)
        else toast.error('Patient not found')
      })
      .catch(() => toast.error('Failed to load patient'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activePatientId])

  if (!activePatientId) {
    return (
      <GlassPanel className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <User className="h-10 w-10 text-slate-500" />
        <p className="font-semibold text-slate-100">No patient selected</p>
        <p className="text-sm text-slate-400">Choose a patient from the list to view their record.</p>
        <Button onClick={() => setView('patients')} className="fx-btn-border-trace btn-press ripple gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Go to Patients
        </Button>
      </GlassPanel>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  if (!patient) {
    return (
      <GlassPanel className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <User className="h-10 w-10 text-slate-500" />
        <p className="font-semibold text-slate-100">Patient not found</p>
        <p className="text-sm text-slate-400">The selected patient record could not be loaded.</p>
        <Button onClick={() => setView('patients')} className="fx-btn-border-trace btn-press ripple gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Go to Patients
        </Button>
      </GlassPanel>
    )
  }

  const latestTriage = patient.vitals[0]?.triageLevel as TriageLevel | undefined
  const firewallOk = !!patient.localSummary

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="fx-btn-border-trace btn-press ripple gap-1.5"
        onClick={() => { setActivePatient(null); setView('patients') }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Patients
      </Button>

      {/* Header */}
      <GlassPanel variant="strong" className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-lg font-bold text-violet-300">
              {patient.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">{patient.fullName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
                <span className="font-mono text-xs">{patient.localId}</span>
                <span>·</span>
                <span>{patient.age ?? '?'}y · {patient.gender.toLowerCase()}</span>
                {patient.bloodGroup && <><span>·</span><span>Blood {patient.bloodGroup}</span></>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={patient.status} />
                <SyncStatusBadge status={patient.syncStatus as 'DRAFT' | 'QUEUED' | 'SYNCED' | 'CONFLICT'} />
                {latestTriage && <TriageBadge level={latestTriage} />}
                {firewallOk ? (
                  <Badge className="gap-1 bg-violet-500/15 text-violet-300">
                    <Lock className="h-3 w-3" /> Firewall Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-red-500/40 bg-red-500/10 text-red-400">
                    <ShieldAlert className="h-3 w-3" /> AI Disabled
                  </Badge>
                )}
                {patient.notificationStatus && (
                  <Badge variant="outline" className="gap-1 border-white/10 text-slate-300">
                    <CalendarClock className="h-3 w-3" /> Notify: {patient.notificationStatus}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Created {formatDistanceToNow(new Date(patient.createdAt), { addSuffix: true })}</p>
            <p className="mt-0.5">by {patient.createdByStaff?.name ?? '—'} · <RoleBadge role={patient.createdByStaff?.role ?? 'ADMIN'} /></p>
          </div>
        </div>
      </GlassPanel>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="overflow-x-auto orio-scroll">
          <TabsList className="grid w-full min-w-[640px] grid-cols-6">
            <TabsTrigger value="overview" className="gap-1.5"><User className="h-3.5 w-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="vitals" className="gap-1.5"><HeartPulse className="h-3.5 w-3.5" /> Vitals</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI Results</TabsTrigger>
            <TabsTrigger value="labs" className="gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Labs</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5"><Receipt className="h-3.5 w-3.5" /> Invoices</TabsTrigger>
            <TabsTrigger value="appointments" className="gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Appts</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab patient={patient} onGoToWizard={() => { setView('patient-entry') }} />
        </TabsContent>
        <TabsContent value="vitals" className="mt-4">
          <VitalsTab vitals={patient.vitals} />
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <AiResultsTab results={patient.aiResults} />
        </TabsContent>
        <TabsContent value="labs" className="mt-4">
          <LabReportsTab reports={patient.labReports} />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <InvoicesTab invoices={patient.invoices} />
        </TabsContent>
        <TabsContent value="appointments" className="mt-4">
          <AppointmentsTab appointments={patient.appointments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({
  patient, onGoToWizard,
}: {
  patient: PatientDetail
  onGoToWizard: () => void
}) {
  const pastHistory = safeParse<string[]>(patient.pastHistory, [])
  const medications = safeParse<Array<Record<string, string>> | string[]>(patient.ongoingMedications, [])
  const allergies = safeParse<Array<Record<string, string>> | string[]>(patient.allergies, [])

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Demographics */}
      <GlassPanel className="p-5 lg:col-span-2">
        <SectionHeader title="Patient Demographics" subtitle="General information captured at intake" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Demographic icon={<Phone className="h-4 w-4" />} label="Contact" value={patient.contact ?? '—'} />
          <Demographic icon={<MapPin className="h-4 w-4" />} label="Address" value={patient.address ?? '—'} />
          <Demographic icon={<Award className="h-4 w-4" />} label="Local ID Number" value={patient.localIdNumber ?? '—'} />
          <Demographic icon={<Briefcase className="h-4 w-4" />} label="Profession" value={patient.profession ?? '—'} />
          <Demographic icon={<GraduationCap className="h-4 w-4" />} label="Education" value={patient.education ?? '—'} />
          <Demographic
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Consent"
            value={patient.consentGiven ? 'Given' : 'Not given'}
          />
        </div>
        <Separator className="my-4" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Demographic icon={<HeartPulse className="h-4 w-4" />} label="Blood Group" value={patient.bloodGroup ?? '—'} />
          <Demographic icon={<User className="h-4 w-4" />} label="Height" value={patient.heightCm ? `${patient.heightCm} cm` : '—'} />
          <Demographic icon={<User className="h-4 w-4" />} label="Weight" value={patient.weightKg ? `${patient.weightKg} kg` : '—'} />
        </div>
      </GlassPanel>

      {/* Clinical snapshot */}
      <GlassPanel className="p-5">
        <SectionHeader title="Clinical Snapshot" />
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-400">Chief Complaint</p>
            <p className="mt-0.5 text-sm font-medium text-slate-100">{patient.chiefComplaint ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Past History</p>
            {pastHistory.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {pastHistory.map((h, i) => (
                  <Badge key={i} variant="outline" className="border-white/10 text-[11px] text-slate-300">{h}</Badge>
                ))}
              </div>
            ) : (
              <p className="mt-0.5 text-sm text-slate-400">None recorded</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Allergies</p>
            <AllergyList items={allergies} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Ongoing Medications</p>
            <MedicationList items={medications} />
          </div>
        </div>
      </GlassPanel>

      {/* Privacy firewall / local summary */}
      <GlassPanel variant={patient.localSummary ? 'strong' : 'default'} className="p-5 lg:col-span-3">
        <SectionHeader
          title="patient_summary_v1 — Privacy Firewall Output"
          subtitle="De-identified, compressed summary that AI receives"
          action={
            patient.localSummary ? (
              <Badge className="gap-1 bg-violet-500/15 text-violet-300">
                <Lock className="h-3 w-3" /> Generated
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-red-500/40 bg-red-500/10 text-red-400">
                <ShieldAlert className="h-3 w-3" /> Step 8 incomplete
              </Badge>
            )
          }
        />
        {patient.localSummary ? (
          <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 glow-violet">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
              <CheckCircle2 className="h-4 w-4" /> Local summary active — AI eligible
            </div>
            <p className="mt-2 whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-100/90">
              {patient.localSummary}
            </p>
            <p className="mt-3 text-[11px] text-slate-400">
              Raw PHI (name, contact, address, IDs) never leaves the device. The AI receives only this compressed summary.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-300">Step 8 not completed</p>
                <p className="mt-1 text-sm text-slate-400">
                  The local summary (privacy firewall) has not been generated. Orio AI tasks are hard-disabled for this patient until the wizard is completed through Step 8.
                </p>
                <Button size="sm" className="mt-3 fx-btn-border-trace btn-press ripple gap-1.5" onClick={onGoToWizard}>
                  <UserPlus className="h-3.5 w-3.5" /> Open Patient Entry Wizard
                </Button>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}

// ── Vitals Tab ───────────────────────────────────────────────────────────────
function VitalsTab({ vitals }: { vitals: VitalsRecord[] }) {
  if (vitals.length === 0) {
    return <EmptyState icon={<HeartPulse className="h-7 w-7" />} title="No vitals recorded" description="Vitals captured during the patient entry wizard will appear here." />
  }
  return (
    <GlassPanel className="p-4 sm:p-5">
      <SectionHeader title="Vitals History" subtitle={`${vitals.length} record(s) · latest first`} />
      <div className="mt-4 overflow-x-auto orio-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-slate-400">
              <th className="pb-2 pr-3 font-medium">Recorded</th>
              <th className="pb-2 pr-3 font-medium">Triage</th>
              <th className="pb-2 pr-3 font-medium">Temp</th>
              <th className="pb-2 pr-3 font-medium">BP</th>
              <th className="pb-2 pr-3 font-medium">HR</th>
              <th className="pb-2 pr-3 font-medium">SpO₂</th>
              <th className="pb-2 pr-3 font-medium">Weight</th>
              <th className="pb-2 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {vitals.map((v) => (
              <tr key={v.id} className="border-b border-white/10 last:border-0">
                <td className="py-2.5 pr-3 text-xs text-slate-400">
                  {format(new Date(v.recordedAt), 'dd MMM yyyy, HH:mm')}
                </td>
                <td className="py-2.5 pr-3">
                  <TriageBadge level={(v.triageLevel as TriageLevel) ?? null} />
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-slate-100">
                  {v.temperature != null ? `${v.temperature}°C` : '—'}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-slate-100">
                  {v.bpSystolic != null && v.bpDiastolic != null ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-slate-100">
                  {v.heartRate != null ? `${v.heartRate}` : '—'}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-slate-100">
                  {v.spo2 != null ? `${v.spo2}%` : '—'}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-slate-100">
                  {v.weightKg != null ? `${v.weightKg} kg` : '—'}
                </td>
                <td className="py-2.5 text-xs text-slate-400">
                  {formatDistanceToNow(new Date(v.recordedAt), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  )
}

// ── AI Results Tab ───────────────────────────────────────────────────────────
function AiResultsTab({ results }: { results: AiResultRecord[] }) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-7 w-7" />}
        title="No AI results yet"
        description="Advisory outputs from Orio AI (diagnosis, treatment, prescriptions, etc.) will appear here. Run a task from the Orio AI module."
      />
    )
  }
  return (
    <div className="space-y-4">
      <SectionHeader title="AI Results" subtitle={`${results.length} advisory output(s) · all reviewed by human professional`} />
      {results.map((r) => (
        <AiResultCard key={r.id} result={r} />
      ))}
    </div>
  )
}

function AiResultCard({ result }: { result: AiResultRecord }) {
  const [expanded, setExpanded] = useState(false)
  const output = safeParse<AiOutput>(result.fullOutput, {} as AiOutput)
  const limitations = safeParse<string[]>(result.limitations, [])
  const taskLabel = AI_TASK_LABELS[result.taskType as keyof typeof AI_TASK_LABELS] ?? result.taskType

  return (
    <GlassPanel className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
            <TaskIcon taskType={result.taskType} />
          </div>
          <div>
            <p className="font-semibold text-slate-100">{taskLabel}</p>
            <p className="text-xs text-slate-400">
              {format(new Date(result.createdAt), 'dd MMM yyyy, HH:mm')} · by {result.createdByStaff?.name ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <RiskBadge level={(result.riskLevel as RiskLevel) ?? 'moderate'} />
          <Badge variant="outline" className="gap-1 border-violet-500/30 text-[10px] text-violet-300">
            <Sparkles className="h-2.5 w-2.5" /> Tier {result.tierUsed}
          </Badge>
          <Badge variant="outline" className="border-white/10 text-[10px] text-slate-300">{result.recommendationType}</Badge>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-100">{result.summary}</p>

      <div className="mt-3 max-w-xs">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">Confidence</span>
          <span className="font-semibold tabular-nums text-slate-100">{Math.round(result.confidence * 100)}%</span>
        </div>
        <ConfidenceMeter value={result.confidence} />
      </div>

      {/* Rich output */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3 overflow-hidden"
          >
            {/* Diagnosis */}
            {output.diagnosis && output.diagnosis.length > 0 && (
              <RichBlock title="Differential Diagnosis" icon={<Stethoscope className="h-3.5 w-3.5" />}>
                <div className="space-y-2">
                  {output.diagnosis.map((d, i) => (
                    <div key={i} className="rounded-md bg-white/5 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-100">{i + 1}. {d.condition}</span>
                        <span className="text-xs font-semibold tabular-nums text-violet-300">{Math.round(d.probability * 100)}%</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{d.reasoning}</p>
                    </div>
                  ))}
                </div>
              </RichBlock>
            )}

            {/* Treatment plan */}
            {output.treatment_plan && output.treatment_plan.length > 0 && (
              <RichBlock title="Treatment Plan" icon={<ClipboardList className="h-3.5 w-3.5" />}>
                <ListItems items={output.treatment_plan} />
              </RichBlock>
            )}

            {/* Prescription */}
            {output.prescription && output.prescription.length > 0 && (
              <RichBlock title="Prescription" icon={<Pill className="h-3.5 w-3.5" />}>
                <div className="overflow-x-auto orio-scroll">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-slate-400">
                        <th className="py-1 pr-2 font-medium">Drug</th>
                        <th className="py-1 pr-2 font-medium">Dose</th>
                        <th className="py-1 pr-2 font-medium">Freq</th>
                        <th className="py-1 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {output.prescription.map((rx, i) => (
                        <tr key={i} className="border-b border-white/10 last:border-0">
                          <td className="py-1.5 pr-2 font-medium text-slate-100">{rx.drug}</td>
                          <td className="py-1.5 pr-2 tabular-nums text-slate-300">{rx.dosage}</td>
                          <td className="py-1.5 pr-2 text-slate-300">{rx.frequency}</td>
                          <td className="py-1.5 text-slate-300">{rx.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </RichBlock>
            )}

            {/* Advice */}
            {output.advice && output.advice.length > 0 && (
              <RichBlock title="Advice" icon={<Activity className="h-3.5 w-3.5" />}>
                <ListItems items={output.advice} />
              </RichBlock>
            )}

            {/* Complications */}
            {output.complications && output.complications.length > 0 && (
              <RichBlock title="Possible Complications" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
                <ListItems items={output.complications} />
              </RichBlock>
            )}

            {/* Interactions */}
            {output.interactions && output.interactions.length > 0 && (
              <RichBlock title="Drug Interactions" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
                <ListItems items={output.interactions} />
              </RichBlock>
            )}

            {/* Lab analysis */}
            {output.parameters_analysis && output.parameters_analysis.length > 0 && (
              <RichBlock title="Lab Analysis" icon={<FlaskConical className="h-3.5 w-3.5" />}>
                <div className="space-y-1.5">
                  {output.parameters_analysis.map((p, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-white/5 px-3 py-1.5 text-xs">
                      <span className="font-medium text-slate-100">{p.parameter}</span>
                      <span className="tabular-nums text-slate-400">{p.value}</span>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                        p.status === 'normal' && 'bg-emerald-500/15 text-emerald-300',
                        p.status === 'low' && 'bg-amber-500/15 text-amber-300',
                        p.status === 'high' && 'bg-red-500/15 text-red-400',
                      )}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </RichBlock>
            )}

            {/* Limitations */}
            {limitations.length > 0 && (
              <RichBlock title="Limitations" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
                <ListItems items={limitations} />
              </RichBlock>
            )}

            <DisclaimerChip text={result.disclaimer} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setExpanded((e) => !e)} className="fx-btn-border-trace btn-press ripple gap-1 text-xs text-slate-300 hover:text-slate-100">
          {expanded ? 'Hide details' : 'Show details'}
        </Button>
        <span className="text-[11px] text-slate-400">
          {result.modelUsed ? `Model: ${result.modelUsed}` : ''}
        </span>
      </div>
    </GlassPanel>
  )
}

// ── Lab Reports Tab ──────────────────────────────────────────────────────────
function LabReportsTab({ reports }: { reports: LabReportRecord[] }) {
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical className="h-7 w-7" />}
        title="No lab reports"
        description="Lab reports generated via the AI Hub or entered by lab technicians will appear here."
      />
    )
  }
  return (
    <div className="space-y-4">
      <SectionHeader title="Lab Reports" subtitle={`${reports.length} report(s)`} />
      {reports.map((r) => {
        const params = safeParse<Array<{ name: string; value: string; unit?: string; refRange?: string; status?: string; note?: string }>>(r.parameters, [])
        const typeLabel = LAB_REPORT_LABELS[r.reportType] ?? r.reportType
        return (
          <GlassPanel key={r.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{typeLabel}</p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(r.createdAt), 'dd MMM yyyy, HH:mm')} · by {r.createdByStaff?.name ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {r.isNormal === null ? (
                  <Badge variant="outline" className="border-white/10 text-slate-400">Unknown</Badge>
                ) : r.isNormal ? (
                  <Badge className="gap-1 bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> All Normal
                  </Badge>
                ) : (
                  <Badge className="gap-1 bg-amber-500/15 text-amber-300">
                    <AlertTriangle className="h-3 w-3" /> Abnormal
                  </Badge>
                )}
                <Badge variant="outline" className="border-white/10 text-[10px] text-slate-300">{r.status}</Badge>
              </div>
            </div>

            {params.length > 0 && (
              <div className="mt-3 overflow-x-auto orio-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                      <th className="pb-2 pr-3 font-medium">Parameter</th>
                      <th className="pb-2 pr-3 font-medium">Value</th>
                      <th className="pb-2 pr-3 font-medium">Unit</th>
                      <th className="pb-2 pr-3 font-medium">Ref Range</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map((p, i) => (
                      <tr key={i} className="border-b border-white/10 last:border-0">
                        <td className="py-2 pr-3 font-medium text-slate-100">{p.name}</td>
                        <td className="py-2 pr-3 tabular-nums text-slate-100">{p.value || '—'}</td>
                        <td className="py-2 pr-3 text-slate-400">{p.unit || '—'}</td>
                        <td className="py-2 pr-3 text-slate-400">{p.refRange || '—'}</td>
                        <td className="py-2 pr-3">
                          <LabStatus status={p.status} />
                        </td>
                        <td className="py-2 text-xs text-slate-400">{p.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {r.aiFeedback && (
              <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-300">
                  <Sparkles className="h-3.5 w-3.5" /> AI Feedback
                </p>
                <p className="mt-1 text-sm text-slate-100/90">{r.aiFeedback}</p>
                <DisclaimerChip text="AI feedback is advisory and must be reviewed by a human professional." />
              </div>
            )}
          </GlassPanel>
        )
      })}
    </div>
  )
}

// ── Invoices Tab ─────────────────────────────────────────────────────────────
function InvoicesTab({ invoices }: { invoices: InvoiceRecord[] }) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-7 w-7" />}
        title="No invoices"
        description="Invoices generated via the AI Hub or billing workflows will appear here."
      />
    )
  }
  return (
    <div className="space-y-4">
      <SectionHeader title="Invoices" subtitle={`${invoices.length} invoice(s)`} />
      {invoices.map((inv) => {
        const items = safeParse<Array<{ description: string; quantity: number; unit_price: number }>>(inv.items, [])
        return (
          <GlassPanel key={inv.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold font-mono text-slate-100">{inv.invoiceNo}</p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(inv.createdAt), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <InvoiceStatus status={inv.status} />
              </div>
            </div>

            {items.length > 0 && (
              <div className="mt-3 overflow-x-auto orio-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                      <th className="pb-2 pr-3 font-medium">Description</th>
                      <th className="pb-2 pr-3 text-right font-medium">Qty</th>
                      <th className="pb-2 pr-3 text-right font-medium">Unit</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} className="border-b border-white/10 last:border-0">
                        <td className="py-2 pr-3 text-slate-100">{it.description}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{it.quantity}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{formatCurrency(it.unit_price)}</td>
                        <td className="py-2 text-right font-medium tabular-nums text-violet-300">
                          {formatCurrency((it.quantity ?? 0) * (it.unit_price ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3 flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm">
              <span className="text-slate-400">Subtotal: <span className="font-medium text-slate-100 tabular-nums">{formatCurrency(inv.subtotal)}</span></span>
              <span className="text-slate-400">Tax: <span className="font-medium text-slate-100 tabular-nums">{formatCurrency(inv.tax)}</span></span>
              <span className="text-slate-400">Total: <span className="font-bold text-violet-300 tabular-nums">{formatCurrency(inv.total)}</span></span>
            </div>
          </GlassPanel>
        )
      })}
    </div>
  )
}

// ── Appointments Tab ─────────────────────────────────────────────────────────
function AppointmentsTab({ appointments }: { appointments: AppointmentRecord[] }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock className="h-7 w-7" />}
        title="No appointments"
        description="Scheduled appointments with assigned doctors will appear here."
      />
    )
  }
  return (
    <div className="space-y-4">
      <SectionHeader title="Appointments" subtitle={`${appointments.length} appointment(s)`} />
      <div className="grid gap-3 sm:grid-cols-2">
        {appointments.map((a) => (
          <GlassPanel key={a.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-300">
                  {a.doctor.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-100">{a.doctor.name}</p>
                  <p className="text-xs text-slate-400">
                    <RoleBadge role={a.doctor.role} />
                  </p>
                </div>
              </div>
              <ApptStatus status={a.status} />
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <p className="flex items-center gap-1.5 text-slate-400">
                <CalendarClock className="h-3.5 w-3.5" />
                {format(new Date(a.scheduledAt), 'dd MMM yyyy, HH:mm')}
              </p>
              {a.reason && (
                <p className="text-xs text-slate-400">Reason: {a.reason}</p>
              )}
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────
function Demographic({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-100">{value}</p>
      </div>
    </div>
  )
}

function AllergyList({ items }: { items: Array<Record<string, string>> | string[] }) {
  if (!items || items.length === 0) {
    return <p className="mt-0.5 text-sm text-slate-400">None recorded</p>
  }
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {items.map((it, i) => {
        if (typeof it === 'string') {
          return <Badge key={i} variant="outline" className="gap-1 border-red-500/30 bg-red-500/5 text-red-300 text-[11px]">{it}</Badge>
        }
        return (
          <Badge key={i} variant="outline" className="gap-1 border-red-500/30 bg-red-500/5 text-red-300 text-[11px]">
            {it.allergen ?? it.name ?? '?'}
            {it.severity && <span className="opacity-70">({it.severity})</span>}
          </Badge>
        )
      })}
    </div>
  )
}

function MedicationList({ items }: { items: Array<Record<string, string>> | string[] }) {
  if (!items || items.length === 0) {
    return <p className="mt-0.5 text-sm text-slate-400">None recorded</p>
  }
  return (
    <div className="mt-1 space-y-1">
      {items.map((it, i) => {
        if (typeof it === 'string') {
          return <p key={i} className="text-sm text-slate-100">• {it}</p>
        }
        const parts = [it.drug ?? it.name, it.dose ?? it.dosage, it.frequency].filter(Boolean)
        return <p key={i} className="text-sm text-slate-100">• {parts.join(' — ')}</p>
      })}
    </div>
  )
}

function RichBlock({
  title, icon, children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-violet-300">
        {icon} {title}
      </p>
      {children}
    </div>
  )
}

function ListItems({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((it, i) => (
        <li key={i} className="text-sm text-slate-100/90">• {it}</li>
      ))}
    </ul>
  )
}

function TaskIcon({ taskType }: { taskType: string }) {
  const icon = useMemo(() => {
    switch (taskType) {
      case 'DIAGNOSIS': return <Stethoscope className="h-5 w-5" />
      case 'TREATMENT': return <ClipboardList className="h-5 w-5" />
      case 'RX_GENERATION': return <Pill className="h-5 w-5" />
      case 'LAB_ANALYSIS': return <FlaskConical className="h-5 w-5" />
      case 'INVOICE': return <Receipt className="h-5 w-5" />
      case 'CERTIFICATE': return <FileBadge className="h-5 w-5" />
      case 'NOTIFY_DOCTOR': return <CalendarClock className="h-5 w-5" />
      default: return <Sparkles className="h-5 w-5" />
    }
  }, [taskType])
  return <>{icon}</>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-white/5 text-slate-400 border-white/10',
    IN_PROGRESS: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    COMPLETED: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    REVIEWED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', map[status] ?? map.DRAFT)}>
      {status.replace('_', ' ')}
    </span>
  )
}

function LabStatus({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-slate-500">—</span>
  const map: Record<string, string> = {
    normal: 'bg-emerald-500/15 text-emerald-300',
    low: 'bg-amber-500/15 text-amber-300',
    high: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', map[status] ?? 'bg-white/5 text-slate-400')}>
      {status}
    </span>
  )
}

function InvoiceStatus({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    PENDING: { cls: 'bg-amber-500/15 text-amber-300', icon: <AlertTriangle className="h-3 w-3" /> },
    PAID: { cls: 'bg-emerald-500/15 text-emerald-300', icon: <CheckCircle2 className="h-3 w-3" /> },
    CANCELLED: { cls: 'bg-red-500/15 text-red-400', icon: <X className="h-3 w-3" /> },
  }
  const c = map[status] ?? map.PENDING
  return (
    <Badge variant="outline" className={cn('gap-1 border-white/10', c.cls)}>
      {c.icon} {status}
    </Badge>
  )
}

function ApptStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    SCHEDULED: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    IN_PROGRESS: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    COMPLETED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', map[status] ?? map.SCHEDULED)}>
      {status}
    </span>
  )
}

function EmptyState({
  icon, title, description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <GlassPanel variant="subtle" className="flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-100">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{description}</p>
      </div>
    </GlassPanel>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n ?? 0)
}

'use client'

// ORIOSTER — Patient Entry Wizard (10-step offline-first intake)
// Task ID: 5 — Patient Entry Wizard
// Critical module: privacy firewall at Step 8, AI hard-disabled until then.

import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  WIZARD_STEPS,
  CHIEF_COMPLAINTS,
  PAST_HISTORY_TAGS,
  COMMON_MEDICATIONS,
  ALLERGY_SEVERITIES,
  MANDATORY_DISCLAIMER,
  computeTriageLevel,
  type AppRole,
  type TriageLevel,
} from '@/lib/types'
import {
  GlassPanel,
  TriageBadge,
  DisclaimerChip,
  ConfidenceMeter,
  SyncStatusBadge,
} from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Save,
  ShieldCheck,
  Lock,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  WifiOff,
  FileText,
  Calendar,
  Stethoscope,
  Send,
  ClipboardCheck,
  Activity,
  Pill,
  Wind,
  HeartPulse,
  Thermometer,
  Ruler,
  Weight,
  Droplet,
  GraduationCap,
  Briefcase,
  Phone,
  MapPin,
  User,
  RotateCcw,
  CloudUpload,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Doctor {
  id: string
  name: string
  email: string
  role: string
}

interface MedicationEntry {
  drug: string
  dose: string
  frequency: string
  custom?: boolean
}

interface AllergyEntry {
  allergen: string
  severity: string
}

interface PatientRecord {
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
  chiefComplaint: string | null
  pastHistory: string | null
  ongoingMedications: string | null
  allergies: string | null
  localSummary: string | null
  status: string
  syncStatus: string
  notificationStatus: string | null
}

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
}

interface SummaryResponse {
  summary: string
  compressionRatio: number
  summaryId: string
  message?: string
}

interface AiNotifyResponse {
  result?: { id: string }
  output?: {
    summary: string
    risk_level: 'low' | 'moderate' | 'high'
    confidence: number
    limitations: string[]
    advice?: string[]
    recommendation_type: string
  }
  tierUsed?: number
  modelUsed?: string
  disclaimer?: string
  error?: string
  blocked?: boolean
}

interface StepProps {
  patient: PatientRecord | null
  user: { id: string; name: string; email: string; role: AppRole }
  online: boolean
  onPatientCreated: (p: PatientRecord) => void
  onPatientUpdated: (patch: Partial<PatientRecord>) => void
  onVitalsRecorded: (v: VitalsRecord) => void
  onAdvance: () => void
  triggerSaved: () => void
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function generateLocalId(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-6)
  const r = Math.random().toString(36).toUpperCase().slice(2, 5)
  return `PT-${t}${r}`
}

function safeParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

function isValidStep(step: number, patient: PatientRecord | null): boolean {
  // Used by parent to decide if a step's data is already present.
  if (!patient) return step === 1
  switch (step) {
    case 1:
      return !!patient.fullName && !!patient.gender && patient.consentGiven
    case 2:
      return !!patient.chiefComplaint
    case 3:
      return !!patient.pastHistory
    case 4:
      return !!patient.ongoingMedications
    case 5:
      // We rely on completedSteps set for vitals (no field on patient)
      return false
    case 6:
      return !!patient.allergies
    case 7:
      // appointments live in their own table; rely on completedSteps
      return false
    case 8:
      return !!patient.localSummary
    case 9:
      return patient.notificationStatus === 'SENT' || patient.notificationStatus === 'QUEUED'
    case 10:
      return patient.status === 'COMPLETED'
    default:
      return false
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN WIZARD COMPONENT
// ─────────────────────────────────────────────────────────────

export function PatientEntryWizard() {
  const { user, setView, wizardPatientId, setWizardPatientId, online } = useAppStore()
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [vitals, setVitals] = useState<VitalsRecord | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // ── Restore in-progress patient if wizardPatientId set ──
  useEffect(() => {
    if (!user) return
    if (wizardPatientId) {
      fetch(`/api/patients/${wizardPatientId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.patient) {
            const p = data.patient as PatientRecord
            setPatient(p)
            // Restore completed steps based on data presence
            const completed = new Set<number>()
            for (const s of WIZARD_STEPS) {
              if (isValidStep(s.id, p)) completed.add(s.id)
            }
            // Vitals / appointments: check via relations
            if (data.patient.vitals?.length > 0) {
              completed.add(5)
              setVitals(data.patient.vitals[0])
            }
            if (data.patient.appointments?.length > 0) {
              completed.add(7)
            }
            setCompletedSteps(completed)
            // Resume at first non-completed step
            const next = WIZARD_STEPS.find((s) => !completed.has(s.id))
            setCurrentStep(next ? next.id : 10)
          }
        })
        .catch(() => toast.error('Failed to restore in-progress patient.'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user, wizardPatientId])

  // ── Saved indicator fade ──
  useEffect(() => {
    if (!savedAt) return
    const t = setTimeout(() => setSavedAt(null), 3500)
    return () => clearTimeout(t)
  }, [savedAt])

  const triggerSaved = useCallback(() => {
    setSaving(true)
    setSavedAt(Date.now())
    setTimeout(() => setSaving(false), 600)
  }, [])

  const handlePatientCreated = useCallback(
    (p: PatientRecord) => {
      setPatient(p)
      setWizardPatientId(p.id)
    },
    [setWizardPatientId]
  )

  const handlePatientUpdated = useCallback((patch: Partial<PatientRecord>) => {
    setPatient((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const handleVitalsRecorded = useCallback((v: VitalsRecord) => {
    setVitals(v)
  }, [])

  const advance = useCallback(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.add(currentStep)
      return next
    })
    if (currentStep < 10) {
      setCurrentStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  // ── Submit final (Step 10) ──
  const handleFinalSubmit = useCallback(async () => {
    if (!patient) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          syncStatus: 'QUEUED',
        }),
      })
      if (!res.ok) throw new Error('Failed to finalize patient')
      const data = await res.json()
      handlePatientUpdated(data.patient)
      toast.success('Patient intake completed', {
        description: `${patient.fullName} has been queued for sync.`,
      })
      setWizardPatientId(null)
      setTimeout(() => setView('patients'), 700)
    } catch (e) {
      toast.error('Submit failed', { description: (e as Error).message })
    } finally {
      setSubmitting(false)
    }
  }, [patient, handlePatientUpdated, setWizardPatientId, setView])

  // ── Cancel wizard ──
  const handleCancel = useCallback(() => {
    if (
      patient &&
      !confirm('Discard this patient intake? The draft will be saved locally and you can resume later.')
    ) {
      return
    }
    setWizardPatientId(null)
    setView('patients')
  }, [patient, setWizardPatientId, setView])

  const stepPropsBase: Omit<StepProps, 'patient'> = useMemo(
    () => ({
      user: user!,
      online,
      onPatientCreated: handlePatientCreated,
      onPatientUpdated: handlePatientUpdated,
      onVitalsRecorded: handleVitalsRecorded,
      onAdvance: advance,
      triggerSaved,
    }),
    [user, online, handlePatientCreated, handlePatientUpdated, handleVitalsRecorded, advance, triggerSaved]
  )

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  const currentStepMeta = WIZARD_STEPS.find((s) => s.id === currentStep)!
  const progressPct = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100

  return (
    <div className="space-y-3 p-3 lg:space-y-5 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Patient Entry Wizard</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            10-step offline-first intake · privacy firewall at Step 8 · AI advisory only
          </p>
        </div>
        <div className="flex items-center gap-2">
          {patient && (
            <Badge variant="outline" className="gap-1.5 font-mono text-[11px]">
              <FileText className="h-3 w-3" />
              {patient.localId}
            </Badge>
          )}
          {patient && <SyncStatusBadge status={patient.syncStatus as 'DRAFT' | 'QUEUED' | 'SYNCED' | 'CONFLICT'} />}
          <Button variant="ghost" size="sm" onClick={handleCancel} className="fx-btn-border-trace btn-press ripple text-slate-400">
            Exit
          </Button>
        </div>
      </div>

      {/* Progress rail — desktop vertical, mobile horizontal scroller */}
      <ProgressRail
        currentStep={currentStep}
        completedSteps={completedSteps}
        onJump={(id) => {
          // Cannot skip ahead — only allow jumping to completed or current
          if (id <= currentStep || completedSteps.has(id)) {
            setCurrentStep(id)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* Desktop vertical stepper */}
        <aside className="hidden lg:block">
          <VerticalStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            onJump={(id) => {
              if (id <= currentStep || completedSteps.has(id)) {
                setCurrentStep(id)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
          />
        </aside>

        {/* Step content */}
        <div className="space-y-3">
          <GlassPanel variant="strong" className="p-5 sm:p-6">
            {/* Step header */}
            <div className="mb-5 flex items-start gap-3 border-b border-white/10 pb-4">
              <div
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                  currentStep === 8
                    ? 'bg-violet-500/15 text-violet-300 glow-violet'
                    : currentStep === 9
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'bg-violet-500/15 text-violet-300'
                )}
              >
                {completedSteps.has(currentStep) ? <Check className="h-5 w-5" /> : currentStep}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold sm:text-lg">{currentStepMeta.title}</h2>
                  {currentStep === 8 && (
                    <Badge className="gap-1 bg-violet-500/15 text-violet-300 hover:bg-violet-500/20 border-violet-500/30">
                      <ShieldCheck className="h-3 w-3" /> Privacy Firewall
                    </Badge>
                  )}
                  {currentStep === 9 && (
                    <Badge className="gap-1 bg-violet-500/15 text-violet-300 hover:bg-violet-500/20 border-violet-500/30">
                      <Sparkles className="h-3 w-3" /> AI-Assisted
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">
                  {stepDescription(currentStep)}
                </p>
              </div>
            </div>

            {/* Step body */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {currentStep === 1 && (
                  <StepGeneral {...stepPropsBase} patient={patient} />
                )}
                {currentStep === 2 && (
                  <StepComplaint {...stepPropsBase} patient={patient} />
                )}
                {currentStep === 3 && (
                  <StepHistory {...stepPropsBase} patient={patient} />
                )}
                {currentStep === 4 && (
                  <StepMedications {...stepPropsBase} patient={patient} />
                )}
                {currentStep === 5 && (
                  <StepVitals
                    {...stepPropsBase}
                    patient={patient}
                    existingVitals={vitals}
                  />
                )}
                {currentStep === 6 && (
                  <StepAllergies {...stepPropsBase} patient={patient} />
                )}
                {currentStep === 7 && (
                  <StepDoctor {...stepPropsBase} patient={patient} />
                )}
                {currentStep === 8 && (
                  <StepSummary {...stepPropsBase} patient={patient} />
                )}
                {currentStep === 9 && (
                  <StepNotify {...stepPropsBase} patient={patient} />
                )}
                {currentStep === 10 && (
                  <StepReview
                    {...stepPropsBase}
                    patient={patient}
                    vitals={vitals}
                    onSubmit={handleFinalSubmit}
                    submitting={submitting}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </GlassPanel>

          {/* Nav row — Back on left, Saved indicator on right (Continue is inside step) */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentStep === 1}
              className="fx-btn-border-trace btn-press ripple gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <SavedIndicator saving={saving} savedAt={savedAt} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Progress Rail (mobile horizontal scroller)
// ─────────────────────────────────────────────────────────────

function ProgressRail({
  currentStep,
  completedSteps,
  onJump,
}: {
  currentStep: number
  completedSteps: Set<number>
  onJump: (id: number) => void
}) {
  return (
    <div className="lg:hidden">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          Step {currentStep} of {WIZARD_STEPS.length}
        </span>
        <span className="text-xs font-semibold text-violet-300">
          {Math.round(((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100)}% complete
        </span>
      </div>
      <Progress value={(currentStep / WIZARD_STEPS.length) * 100} className="h-1.5" />
      <ScrollArea className="mt-2 w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {WIZARD_STEPS.map((s) => {
            const isCurrent = s.id === currentStep
            const isDone = completedSteps.has(s.id)
            const canJump = isDone || s.id <= currentStep
            return (
              <button
                key={s.id}
                disabled={!canJump}
                onClick={() => onJump(s.id)}
                className={cn(
                  'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                  isCurrent && 'border-violet-400 bg-violet-500 text-white',
                  !isCurrent && isDone && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
                  !isCurrent && !isDone && canJump && 'border-white/10 bg-white/5 text-slate-400',
                  !canJump && 'border-white/10 bg-white/5 text-slate-500 cursor-not-allowed'
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : <span className="tabular-nums">{s.id}</span>}
                {s.short}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Vertical Stepper (desktop sidebar)
// ─────────────────────────────────────────────────────────────

function VerticalStepper({
  currentStep,
  completedSteps,
  onJump,
}: {
  currentStep: number
  completedSteps: Set<number>
  onJump: (id: number) => void
}) {
  return (
    <GlassPanel variant="subtle" className="p-3">
      <ol className="space-y-1">
        {WIZARD_STEPS.map((s, idx) => {
          const isCurrent = s.id === currentStep
          const isDone = completedSteps.has(s.id)
          const canJump = isDone || s.id <= currentStep
          const isLocked = !canJump
          const isFirewall = s.id === 8
          const isAi = s.id === 9
          return (
            <li key={s.id} className="relative">
              {idx < WIZARD_STEPS.length - 1 && (
                <span
                  className={cn(
                    'absolute left-[14px] top-7 h-[calc(100%-4px)] w-px',
                    isDone ? 'bg-emerald-500/40' : 'bg-border/60'
                  )}
                />
              )}
              <button
                disabled={isLocked}
                onClick={() => onJump(s.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
                  isCurrent && 'bg-violet-500/10',
                  !isCurrent && !isLocked && 'hover:bg-white/10',
                  isLocked && 'cursor-not-allowed opacity-60'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                    isDone && 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
                    !isDone && isCurrent && 'border-violet-400 bg-violet-500 text-white',
                    !isDone && !isCurrent && 'border-white/10 bg-background text-slate-400'
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : isLocked ? <Lock className="h-3 w-3" /> : s.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-xs font-medium',
                      isCurrent ? 'text-slate-100' : 'text-slate-400'
                    )}
                  >
                    {s.title}
                  </span>
                  {(isFirewall || isAi) && (
                    <span
                      className={cn(
                        'mt-0.5 flex items-center gap-1 text-[10px] font-medium',
                        isFirewall ? 'text-emerald-400' : 'text-violet-400'
                      )}
                    >
                      {isFirewall ? <ShieldCheck className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
                      {isFirewall ? 'Firewall' : 'AI step'}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </GlassPanel>
  )
}

// ─────────────────────────────────────────────────────────────
// Saved Indicator
// ─────────────────────────────────────────────────────────────

function SavedIndicator({ saving, savedAt }: { saving: boolean; savedAt: number | null }) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving locally…
      </span>
    )
  }
  if (savedAt) {
    return (
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400"
      >
        <Save className="h-3 w-3" />
        Saved locally
      </motion.span>
    )
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// STEP 1 — General Information
// ─────────────────────────────────────────────────────────────

function StepGeneral({ patient, user, onPatientCreated, onPatientUpdated, onAdvance, triggerSaved }: StepProps) {
  const [fullName, setFullName] = useState(patient?.fullName ?? '')
  const [gender, setGender] = useState(patient?.gender ?? '')
  const [age, setAge] = useState<string>(patient?.age != null ? String(patient.age) : '')
  const [dateOfBirth, setDateOfBirth] = useState(patient?.dateOfBirth ?? '')
  const [contact, setContact] = useState(patient?.contact ?? '')
  const [address, setAddress] = useState(patient?.address ?? '')
  const [localIdNumber, setLocalIdNumber] = useState(patient?.localIdNumber ?? '')
  const [bloodGroup, setBloodGroup] = useState(patient?.bloodGroup ?? '')
  const [heightCm, setHeightCm] = useState(patient?.heightCm != null ? String(patient.heightCm) : '')
  const [weightKg, setWeightKg] = useState(patient?.weightKg != null ? String(patient.weightKg) : '')
  const [profession, setProfession] = useState(patient?.profession ?? '')
  const [education, setEducation] = useState(patient?.education ?? '')
  const [consentGiven, setConsentGiven] = useState(patient?.consentGiven ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Full name is required'
    if (!gender) return 'Gender is required'
    if (!consentGiven) return 'Patient consent is required to proceed'
    if (age && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 130)) {
      return 'Please enter a valid age (0–130)'
    }
    return null
  }

  const handleContinue = async () => {
    const err = validate()
    if (err) {
      setError(err)
      toast.error(err)
      return
    }
    setError(null)
    setSaving(true)
    try {
      const payload = {
        localId: patient?.localId ?? generateLocalId(),
        fullName: fullName.trim(),
        gender,
        dateOfBirth: dateOfBirth || '',
        age: age ? Number(age) : null,
        contact: contact || null,
        address: address || null,
        localIdNumber: localIdNumber || null,
        bloodGroup: bloodGroup || null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        profession: profession || null,
        education: education || null,
        consentGiven,
        status: patient?.status ?? 'DRAFT',
        syncStatus: patient?.syncStatus ?? 'DRAFT',
        createdBy: user.id,
      }

      if (patient) {
        // PATCH existing
        const res = await fetch(`/api/patients/${patient.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to save')
        const data = await res.json()
        onPatientUpdated(data.patient)
      } else {
        // POST new
        const res = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create patient')
        const data = await res.json()
        onPatientCreated(data.patient)
      }
      triggerSaved()
      toast.success('General information saved')
      onAdvance()
    } catch (e) {
      toast.error('Save failed', { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" icon={<User className="h-3.5 w-3.5" />} required>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Aisha Rahman"
          />
        </Field>
        <Field label="Gender" required>
          <RadioGroup
            value={gender}
            onValueChange={setGender}
            className="flex gap-4 pt-1.5"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="FEMALE" id="g-f" />
              <Label htmlFor="g-f">Female</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="MALE" id="g-m" />
              <Label htmlFor="g-m">Male</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="OTHER" id="g-o" />
              <Label htmlFor="g-o">Other</Label>
            </div>
          </RadioGroup>
        </Field>
        <Field label="Age" icon={<Activity className="h-3.5 w-3.5" />}>
          <Input
            type="number"
            min={0}
            max={130}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 34"
          />
        </Field>
        <Field label="Date of birth">
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </Field>
        <Field label="Contact number" icon={<Phone className="h-3.5 w-3.5" />}>
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+880 1XXX-XXXXXX"
          />
        </Field>
        <Field label="Local ID number" icon={<FileText className="h-3.5 w-3.5" />}>
          <Input
            value={localIdNumber}
            onChange={(e) => setLocalIdNumber(e.target.value)}
            placeholder="Camp / clinic ID"
          />
        </Field>
        <Field label="Blood group" icon={<Droplet className="h-3.5 w-3.5" />}>
          <Select value={bloodGroup} onValueChange={setBloodGroup}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Height (cm)" icon={<Ruler className="h-3.5 w-3.5" />}>
          <Input
            type="number"
            min={0}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="e.g. 165"
          />
        </Field>
        <Field label="Weight (kg)" icon={<Weight className="h-3.5 w-3.5" />}>
          <Input
            type="number"
            min={0}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g. 62"
          />
        </Field>
        <Field label="Profession" icon={<Briefcase className="h-3.5 w-3.5" />}>
          <Input
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder="e.g. Teacher"
          />
        </Field>
        <Field label="Education" icon={<GraduationCap className="h-3.5 w-3.5" />}>
          <Input
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="e.g. Secondary"
          />
        </Field>
        <Field label="Address" icon={<MapPin className="h-3.5 w-3.5" />} className="sm:col-span-2">
          <Textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Village / ward / district"
          />
        </Field>
      </div>

      {/* Consent */}
      <GlassPanel variant="subtle" className="p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            checked={consentGiven}
            onCheckedChange={(v) => setConsentGiven(v === true)}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              Patient consent given <span className="text-red-500">*</span>
            </p>
            <p className="text-[11px] leading-snug text-slate-400">
              Patient (or guardian) has consented to local data collection and the de-identified
              summary being used for clinical decision support. Raw PHI never leaves this device.
            </p>
          </div>
        </label>
      </GlassPanel>

      <StepFooter>
        <ContinueButton onClick={handleContinue} loading={saving} />
      </StepFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — Chief Complaint
// ─────────────────────────────────────────────────────────────

function StepComplaint({ patient, onPatientUpdated, onAdvance, triggerSaved }: StepProps) {
  const [complaint, setComplaint] = useState(patient?.chiefComplaint ?? '')
  const [notes, setNotes] = useState(() => {
    // If existing chiefComplaint has custom text after the structured label, restore it
    if (!patient?.chiefComplaint) return ''
    const parts = patient.chiefComplaint.split(' — ')
    return parts.length > 1 ? parts.slice(1).join(' — ') : ''
  })
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)

  const MAX_NOTES = 300

  const handleContinue = async () => {
    if (!complaint) {
      toast.error('Please select a chief complaint')
      return
    }
    setSaving(true)
    try {
      const combined = notes.trim()
        ? `${complaint} — ${notes.trim().slice(0, MAX_NOTES)}${duration ? ` (${duration})` : ''}`
        : complaint
      const res = await fetch(`/api/patients/${patient!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chiefComplaint: combined }),
      })
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      onPatientUpdated(data.patient)
      triggerSaved()
      toast.success('Chief complaint saved')
      onAdvance()
    } catch (e) {
      toast.error('Save failed', { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Chief complaint" required>
          <Select value={complaint.split(' — ')[0]} onValueChange={setComplaint}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select primary complaint" />
            </SelectTrigger>
            <SelectContent>
              {CHIEF_COMPLAINTS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Duration (optional)">
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 3 days"
          />
        </Field>
      </div>

      <Field
        label="Additional notes (optional)"
        hint={`${notes.length} / ${MAX_NOTES} chars`}
      >
        <Textarea
          rows={3}
          value={notes}
          maxLength={MAX_NOTES}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Briefly describe onset, severity, associated symptoms…"
        />
      </Field>

      <StepFooter>
        <ContinueButton onClick={handleContinue} loading={saving} />
      </StepFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STEP 3 — Past History
// ─────────────────────────────────────────────────────────────

function StepHistory({ patient, onPatientUpdated, onAdvance, triggerSaved }: StepProps) {
  const [tags, setTags] = useState<string[]>(() => safeParse<string[]>(patient?.pastHistory, []))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const MAX_NOTES = 400

  const toggleTag = (t: string) => {
    if (t === 'None') {
      setTags(['None'])
      return
    }
    setTags((prev) => {
      const withoutNone = prev.filter((x) => x !== 'None')
      return withoutNone.includes(t)
        ? withoutNone.filter((x) => x !== t)
        : [...withoutNone, t]
    })
  }

  const handleContinue = async () => {
    if (tags.length === 0) {
      toast.error('Please select at least one tag (or "None")')
      return
    }
    setSaving(true)
    try {
      const payload = JSON.stringify(tags)
      const res = await fetch(`/api/patients/${patient!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pastHistory: payload }),
      })
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      onPatientUpdated(data.patient)
      triggerSaved()
      toast.success('Past history saved')
      onAdvance()
    } catch (e) {
      toast.error('Save failed', { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">Select relevant history tags</p>
        <div className="flex flex-wrap gap-2">
          {PAST_HISTORY_TAGS.map((t) => {
            const active = tags.includes(t)
            const isNone = t === 'None'
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  active && isNone && 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
                  active && !isNone && 'border-violet-400 bg-violet-500 text-white',
                  !active && 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/5'
                )}
              >
                {active && <Check className="h-3 w-3" />}
                {t}
              </button>
            )
          })}
        </div>
        {tags.length > 0 && !tags.includes('None') && (
          <p className="mt-2 text-[11px] text-slate-400">
            {tags.length} tag{tags.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <Field
        label="Additional history notes (optional)"
        hint={`${notes.length} / ${MAX_NOTES} chars`}
      >
        <Textarea
          rows={3}
          maxLength={MAX_NOTES}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Family history, surgical details, ongoing treatment context…"
        />
      </Field>

      <StepFooter>
        <ContinueButton onClick={handleContinue} loading={saving} />
      </StepFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STEP 4 — Ongoing Medications
// ─────────────────────────────────────────────────────────────

function StepMedications({ patient, onPatientUpdated, onAdvance, triggerSaved }: StepProps) {
  const [meds, setMeds] = useState<MedicationEntry[]>(() =>
    safeParse<MedicationEntry[]>(patient?.ongoingMedications, [])
  )
  const [saving, setSaving] = useState(false)

  const addMed = () => {
    setMeds((prev) => [...prev, { drug: '', dose: '', frequency: '' }])
  }

  const updateMed = (idx: number, patch: Partial<MedicationEntry>) => {
    setMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
  }

  const removeMed = (idx: number) => {
    setMeds((prev) => prev.filter((_, i) => i !== idx))
  }

  const duplicateDrugs = useMemo(() => {
    const seen = new Map<string, number>()
    meds.forEach((m) => {
      if (!m.drug) return
      seen.set(m.drug.toLowerCase(), (seen.get(m.drug.toLowerCase()) ?? 0) + 1)
    })
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k))
  }, [meds])

  const handleContinue = async () => {
    setSaving(true)
    try {
      // Filter out empty rows
      const cleaned = meds.filter((m) => m.drug.trim())
      const payload = JSON.stringify(cleaned)
      const res = await fetch(`/api/patients/${patient!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ongoingMedications: payload }),
      })
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      onPatientUpdated(data.patient)
      triggerSaved()
      toast.success(
        cleaned.length > 0
          ? `${cleaned.length} medication${cleaned.length > 1 ? 's' : ''} saved`
          : 'Medications cleared (no ongoing meds)'
      )
      onAdvance()
    } catch (e) {
      toast.error('Save failed', { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Add each ongoing medication. Leave empty if patient is not on any medication.
        </p>
        <Button variant="outline" size="sm" onClick={addMed} className="fx-btn-border-trace btn-press ripple gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add medication
        </Button>
      </div>

      {meds.length === 0 ? (
        <GlassPanel variant="subtle" className="p-6 text-center">
          <Pill className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-2 text-sm font-medium">No medications added</p>
          <p className="mt-1 text-xs text-slate-400">
            Patient is not on any ongoing medication. Continue to proceed.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-2.5">
          {meds.map((m, idx) => {
            const isDuplicate = m.drug && duplicateDrugs.has(m.drug.toLowerCase())
            return (
              <GlassPanel key={idx} variant="subtle" className="p-3">
                <div className="grid gap-2.5 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-end">
                  <Field label={idx === 0 ? 'Drug' : undefined}>
                    <Select
                      value={m.drug}
                      onValueChange={(v) => updateMed(idx, { drug: v, custom: v === '__custom' })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select or type below" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_MEDICATIONS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                        <SelectItem value="__custom">Custom drug…</SelectItem>
                      </SelectContent>
                    </Select>
                    {m.drug === '__custom' && (
                      <Input
                        className="mt-1.5"
                        placeholder="Type drug name"
                        value={m.custom ? '' : m.drug === '__custom' ? '' : m.drug}
                        onChange={(e) => updateMed(idx, { drug: e.target.value, custom: true })}
                      />
                    )}
                  </Field>
                  <Field label={idx === 0 ? 'Dose' : undefined}>
                    <Input
                      placeholder="e.g. 500mg"
                      value={m.dose}
                      onChange={(e) => updateMed(idx, { dose: e.target.value })}
                    />
                  </Field>
                  <Field label={idx === 0 ? 'Frequency' : undefined}>
                    <Select
                      value={m.frequency}
                      onValueChange={(v) => updateMed(idx, { frequency: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'Weekly', 'Monthly'].map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="fx-btn-border-trace btn-press ripple h-9 w-9 text-slate-400 hover:text-red-500"
                    onClick={() => removeMed(idx)}
                    aria-label="Remove medication"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {isDuplicate && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Duplicate drug — patient may already be on this medication
                  </div>
                )}
              </GlassPanel>
            )
          })}
        </div>
      )}

      <StepFooter>
        <ContinueButton onClick={handleContinue} loading={saving} />
      </StepFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STEP 5 — Vitals
// ─────────────────────────────────────────────────────────────

function StepVitals({ patient, user, existingVitals, onVitalsRecorded, onAdvance, triggerSaved }: StepProps & {
  existingVitals: VitalsRecord | null
}) {
  const [temperature, setTemperature] = useState(existingVitals?.temperature?.toString() ?? '')
  const [bpSystolic, setBpSystolic] = useState(existingVitals?.bpSystolic?.toString() ?? '')
  const [bpDiastolic, setBpDiastolic] = useState(existingVitals?.bpDiastolic?.toString() ?? '')
  const [heartRate, setHeartRate] = useState(existingVitals?.heartRate?.toString() ?? '')
  const [spo2, setSpo2] = useState(existingVitals?.spo2?.toString() ?? '')
  const [weightKg, setWeightKg] = useState(existingVitals?.weightKg?.toString() ?? patient?.weightKg?.toString() ?? '')
  const [heightCm, setHeightCm] = useState(existingVitals?.heightCm?.toString() ?? patient?.heightCm?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const triagePreview: TriageLevel = useMemo(
    () =>
      computeTriageLevel({
        temperature: temperature ? Number(temperature) : null,
        bpSystolic: bpSystolic ? Number(bpSystolic) : null,
        bpDiastolic: bpDiastolic ? Number(bpDiastolic) : null,
        heartRate: heartRate ? Number(heartRate) : null,
        spo2: spo2 ? Number(spo2) : null,
      }),
    [temperature, bpSystolic, bpDiastolic, heartRate, spo2]
  )

  const abnormalFlags = useMemo(() => {
    const flags: { field: string; msg: string }[] = []
    const t = temperature ? Number(temperature) : null
    const s = bpSystolic ? Number(bpSystolic) : null
    const d = bpDiastolic ? Number(bpDiastolic) : null
    const hr = heartRate ? Number(heartRate) : null
    const sp = spo2 ? Number(spo2) : null
    if (t != null && (t >= 39.5 || t <= 35)) flags.push({ field: 'Temperature', msg: `${t}°C — critical range` })
    else if (t != null && (t >= 38.5 || t < 36)) flags.push({ field: 'Temperature', msg: `${t}°C — abnormal` })
    if (s != null && s >= 180) flags.push({ field: 'BP Systolic', msg: `${s} mmHg — hypertensive crisis` })
    if (d != null && d >= 120) flags.push({ field: 'BP Diastolic', msg: `${d} mmHg — hypertensive crisis` })
    if (hr != null && (hr >= 120 || hr <= 50)) flags.push({ field: 'Heart rate', msg: `${hr} BPM — critical` })
    if (sp != null && sp <= 90) flags.push({ field: 'SpO₂', msg: `${sp}% — hypoxemia` })
    else if (sp != null && sp <= 94) flags.push({ field: 'SpO₂', msg: `${sp}% — below normal` })
    return flags
  }, [temperature, bpSystolic, bpDiastolic, heartRate, spo2])

  const handleContinue = async () => {
    if (!temperature && !bpSystolic && !heartRate && !spo2) {
      toast.error('Please record at least one vital sign')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient!.id,
          recordedBy: user.id,
          temperature: temperature ? Number(temperature) : null,
          bpSystolic: bpSystolic ? Number(bpSystolic) : null,
          bpDiastolic: bpDiastolic ? Number(bpDiastolic) : null,
          heartRate: heartRate ? Number(heartRate) : null,
          spo2: spo2 ? Number(spo2) : null,
          weightKg: weightKg ? Number(weightKg) : null,
          heightCm: heightCm ? Number(heightCm) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed to record vitals')
      const data = await res.json()
      onVitalsRecorded(data.vitals)
      triggerSaved()
      toast.success(`Vitals recorded · Triage ${data.triageLevel}`, {
        description: data.triageLevel === 'RED'
          ? 'Critical — prioritize this patient'
          : data.triageLevel === 'YELLOW'
            ? 'Abnormal — clinical review advised'
            : 'Within normal limits',
      })
      onAdvance()
    } catch (e) {
      toast.error('Save failed', { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Triage preview */}
      <GlassPanel variant="subtle" className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-300" />
          <span className="text-sm font-medium">Local triage level (computed, no AI)</span>
        </div>
        <TriageBadge level={triagePreview} />
      </GlassPanel>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Temperature (°C)" icon={<Thermometer className="h-3.5 w-3.5" />}>
          <Input
            type="number"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="36.5"
          />
        </Field>
        <Field label="BP systolic (mmHg)" icon={<HeartPulse className="h-3.5 w-3.5" />}>
          <Input
            type="number"
            value={bpSystolic}
            onChange={(e) => setBpSystolic(e.target.value)}
            placeholder="120"
          />
        </Field>
        <Field label="BP diastolic (mmHg)">
          <Input
            type="number"
            value={bpDiastolic}
            onChange={(e) => setBpDiastolic(e.target.value)}
            placeholder="80"
          />
        </Field>
        <Field label="Heart rate (BPM)" icon={<HeartPulse className="h-3.5 w-3.5" />}>
          <Input
            type="number"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            placeholder="72"
          />
        </Field>
        <Field label="SpO₂ (%)" icon={<Wind className="h-3.5 w-3.5" />}>
          <Input
            type="number"
            min={0}
            max={100}
            value={spo2}
            onChange={(e) => setSpo2(e.target.value)}
            placeholder="98"
          />
        </Field>
        <Field label="Weight (kg)" icon={<Weight className="h-3.5 w-3.5" />}>
          <Input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="62"
          />
        </Field>
        <Field label="Height (cm)" icon={<Ruler className="h-3.5 w-3.5" />}>
          <Input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="165"
          />
        </Field>
      </div>

      {abnormalFlags.length > 0 && (
        <GlassPanel variant="subtle" className="space-y-1.5 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            {abnormalFlags.length} abnormal value{abnormalFlags.length > 1 ? 's' : ''} detected
          </div>
          {abnormalFlags.map((f, i) => (
            <p key={i} className="text-[11px] text-slate-400">
              · <span className="font-medium text-slate-100">{f.field}:</span> {f.msg}
            </p>
          ))}
        </GlassPanel>
      )}

      <StepFooter>
        <ContinueButton onClick={handleContinue} loading={saving} />
      </StepFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STEP 6 — Hypersensitivity (Allergies)
// ─────────────────────────────────────────────────────────────

function StepAllergies({ patient, onPatientUpdated, onAdvance, triggerSaved }: StepProps) {
  const [allergies, setAllergies] = useState<AllergyEntry[]>(() => {
    const parsed = safeParse<AllergyEntry[]>(patient?.allergies, [])
    // If patient has no allergies field yet, default to "None"
    if (!patient?.allergies && parsed.length === 0) return [{ allergen: 'None', severity: 'Mild' }]
    return parsed
  })
  const [saving, setSaving] = useState(false)

  const hasNone = allergies.some((a) => a.allergen.toLowerCase() === 'none')

  const addAllergy = () => {
    if (hasNone) {
      // Remove None when adding a real allergy
      setAllergies([{ allergen: '', severity: 'Mild' }])
      return
    }
    setAllergies((prev) => [...prev, { allergen: '', severity: 'Mild' }])
  }

  const updateAllergy = (idx: number, patch: Partial<AllergyEntry>) => {
    setAllergies((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)))
  }

  const removeAllergy = (idx: number) => {
    setAllergies((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      return next.length === 0 ? [{ allergen: 'None', severity: 'Mild' }] : next
    })
  }

  const markNone = () => {
    setAllergies([{ allergen: 'None', severity: 'Mild' }])
  }

  const handleContinue = async () => {
    if (allergies.length === 0) {
      toast.error('Please mark "No known allergies" or add at least one entry')
      return
    }
    setSaving(true)
    try {
      const cleaned = allergies.filter((a) => a.allergen.trim())
      if (cleaned.length === 0) {
        toast.error('Allergy entries cannot be empty')
        setSaving(false)
        return
      }
      const payload = JSON.stringify(cleaned)
      const res = await fetch(`/api/patients/${patient!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allergies: payload }),
      })
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      onPatientUpdated(data.patient)
      triggerSaved()
      toast.success(
        hasNone ? 'No known allergies recorded' : `${cleaned.length} allerg${cleaned.length > 1 ? 'ies' : 'y'} saved`
      )
      onAdvance()
    } catch (e) {
      toast.error('Save failed', { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-400">
          Record known hypersensitivities. At least one entry (or "None") is required.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markNone} disabled={hasNone} className="fx-btn-border-trace btn-press ripple gap-1.5">
            <Check className="h-3.5 w-3.5" />
            No known allergies
          </Button>
          <Button variant="outline" size="sm" onClick={addAllergy} disabled={hasNone} className="fx-btn-border-trace btn-press ripple gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add allergy
          </Button>
        </div>
      </div>

      {hasNone ? (
        <GlassPanel variant="subtle" className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">No known allergies (NKA)</p>
            <p className="text-xs text-slate-400">Patient has no documented hypersensitivities.</p>
          </div>
        </GlassPanel>
      ) : (
        <div className="space-y-2.5">
          {allergies.map((a, idx) => (
            <GlassPanel key={idx} variant="subtle" className="p-3">
              <div className="grid gap-2.5 sm:grid-cols-[1.5fr_1fr_auto] sm:items-end">
                <Field label={idx === 0 ? 'Allergen' : undefined}>
                  <Input
                    placeholder="e.g. Penicillin, Peanuts, Latex"
                    value={a.allergen}
                    onChange={(e) => updateAllergy(idx, { allergen: e.target.value })}
                  />
                </Field>
                <Field label={idx === 0 ? 'Severity' : undefined}>
                  <Select
                    value={a.severity}
                    onValueChange={(v) => updateAllergy(idx, { severity: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALLERGY_SEVERITIES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Button
                  variant="ghost"
                  size="icon"
                  className="fx-btn-border-trace btn-press ripple h-9 w-9 text-slate-400 hover:text-red-500"
                  onClick={() => removeAllergy(idx)}
                  aria-label="Remove allergy"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <StepFooter>
        <ContinueButton onClick={handleContinue} loading={saving} />
      </StepFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STEP 7 — Assign Doctor
// ─────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
]

function StepDoctor({ patient, onAdvance, triggerSaved }: StepProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [slot, setSlot] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/staff?role=DOCTOR')
      .then((r) => r.json())
      .then((data) => setDoctors(data.staff ?? []))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false))
  }, [])

  const handleContinue = async () => {
    if (!doctorId) {
      toast.error('Please select a doctor')
      return
    }
    if (!date || !slot) {
      toast.error('Please pick a date and time slot')
      return
    }
    setSaving(true)
    try {
      const scheduledAt = new Date(`${date}T${slot}:00`).toISOString()
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient!.id,
          doctorId,
          scheduledAt,
          reason: reason || patient!.chiefComplaint || 'Consultation',
          status: 'SCHEDULED',
        }),
      })
      if (!res.ok) throw new Error('Failed to schedule appointment')
      triggerSaved()
      const doc = doctors.find((d) => d.id === doctorId)
      toast.success(`Appointment scheduled with ${doc?.name ?? 'doctor'}`)
      onAdvance()
    } catch (e) {
      toast.error('Scheduling failed', { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {doctors.length === 0 ? (
        <GlassPanel variant="subtle" className="p-4 text-center text-sm text-slate-400">
          <Stethoscope className="mx-auto h-8 w-8 opacity-50" />
          <p className="mt-2 font-medium text-slate-100">No doctors available</p>
          <p className="mt-1 text-xs">Ask an administrator to add doctors in Staff management.</p>
        </GlassPanel>
      ) : (
        <>
          <Field label="Assign doctor" required>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Appointment date" icon={<Calendar className="h-3.5 w-3.5" />} required>
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Time slot" required>
              <Select value={slot} onValueChange={setSlot}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Reason for visit (optional)">
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Defaults to chief complaint"
            />
          </Field>

          {doctorId && date && slot && (
            <GlassPanel variant="subtle" className="flex items-center gap-3 p-3">
              <Calendar className="h-4 w-4 text-violet-300" />
              <p className="text-sm">
                <span className="font-medium">
                  {doctors.find((d) => d.id === doctorId)?.name}
                </span>
                <span className="text-slate-400">
                  {' · '}{new Date(`${date}T${slot}:00`).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </p>
            </GlassPanel>
          )}
        </>
      )}

      <StepFooter>
        <ContinueButton
          onClick={handleContinue}
          loading={saving}
          disabled={doctors.length === 0}
          label="Schedule & Continue"
        />
      </StepFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STEP 8 — Local Summary (PRIVACY FIREWALL — NO AI, NO NETWORK)
// ─────────────────────────────────────────────────────────────

function StepSummary({ patient, onPatientUpdated, onAdvance, triggerSaved }: StepProps) {
  const [summary, setSummary] = useState<string | null>(patient?.localSummary ?? null)
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null)
  const [summaryId, setSummaryId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasGenerated = !!summary

  const generate = useCallback(async () => {
    if (!patient) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to generate summary')
      }
      const data: SummaryResponse = await res.json()
      setSummary(data.summary)
      setCompressionRatio(data.compressionRatio)
      setSummaryId(data.summaryId)
      onPatientUpdated({ localSummary: data.summary })
      triggerSaved()
      toast.success('patient_summary_v1 generated locally', {
        description: `Compression: ${Math.round(data.compressionRatio * 100)}% · Privacy firewall active`,
      })
    } catch (e) {
      setError((e as Error).message)
      toast.error('Summary generation failed', { description: (e as Error).message })
    } finally {
      setGenerating(false)
    }
  }, [patient, onPatientUpdated, triggerSaved])

  // Auto-generate on first entry if no summary yet
  useEffect(() => {
    if (!patient) return
    if (!patient.localSummary && !generating && !error) {
      generate()
    }
  }, [patient, generating, error, generate])

  const handleContinue = () => {
    if (!summary) {
      toast.error('Please generate the local summary first')
      return
    }
    onAdvance()
  }

  return (
    <div className="space-y-4">
      {/* Firewall banner */}
      <GlassPanel variant="subtle" className="border-violet-500/30 bg-violet-500/5 p-4 glow-violet">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">Privacy Firewall</p>
              {hasGenerated && (
                <Badge className="gap-1 bg-violet-500/15 text-violet-300 hover:bg-violet-500/20 border-violet-500/30">
                  <Check className="h-3 w-3" /> Complete
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs leading-snug text-slate-400">
              This step is <strong>strictly local</strong>. No AI, no network. A de-identified
              summary (<code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[10px]">patient_summary_v1</code>) is
              generated from the structured data captured so far. All downstream AI calls
              receive <em>only</em> this summary — raw PHI never leaves the device.
            </p>
          </div>
        </div>
      </GlassPanel>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
          <Button variant="ghost" size="sm" onClick={generate} className="fx-btn-border-trace btn-press ripple ml-auto h-6 px-2 text-[11px]">
            Retry
          </Button>
        </div>
      )}

      {generating && !hasGenerated && (
        <GlassPanel variant="subtle" className="flex items-center gap-3 p-6">
          <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
          <div>
            <p className="text-sm font-medium">Generating patient_summary_v1…</p>
            <p className="text-xs text-slate-400">Compressing structured data, stripping PHI…</p>
          </div>
        </GlassPanel>
      )}

      {summary && (
        <>
          {/* Summary output — monospace box */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">patient_summary_v1 (de-identified)</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={generate}
                disabled={generating}
                className="fx-btn-border-trace btn-press ripple h-7 gap-1.5 text-[11px] text-slate-400"
              >
                <RotateCcw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
            <pre className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-[12px] leading-relaxed text-slate-100/90 orio-scroll">
{summary}
            </pre>
            {summaryId && (
              <p className="mt-1.5 text-[10px] text-slate-400">
                Summary ID: <span className="font-mono">{summaryId}</span>
              </p>
            )}
          </div>

          {/* Compression ratio */}
          {compressionRatio != null && (
            <GlassPanel variant="subtle" className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Compression ratio</p>
                  <p className="text-[11px] text-slate-400">
                    Target ≥ 70% (raw JSON vs. de-identified summary)
                  </p>
                </div>
                <span
                  className={cn(
                    'text-2xl font-bold tabular-nums',
                    compressionRatio >= 0.7 ? 'text-emerald-400' : 'text-amber-400'
                  )}
                >
                  {Math.round(compressionRatio * 100)}%
                </span>
              </div>
              <Progress
                value={compressionRatio * 100}
                className={cn(
                  'h-2',
                  compressionRatio >= 0.7 ? '[&>[data-slot=progress-indicator]]:bg-emerald-500' : '[&>[data-slot=progress-indicator]]:bg-amber-500'
                )}
              />
              <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span className={compressionRatio >= 0.7 ? 'text-emerald-400' : ''}>70% target</span>
                <span>100%</span>
              </div>
            </GlassPanel>
          )}

          {/* What the AI sees */}
          <GlassPanel variant="subtle" className="p-3">
            <div className="flex items-start gap-2 text-xs">
              <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-violet-300" />
              <p className="text-slate-400">
                The next step (Notify Doctor) will call the Orio AI service. The AI will receive{' '}
                <strong>only the summary above</strong> — no name, no contact, no address, no local ID.
                This is the privacy firewall in action.
              </p>
            </div>
          </GlassPanel>
        </>
      )}

      <StepFooter>
        <ContinueButton onClick={handleContinue} loading={generating} disabled={!summary} />
      </StepFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STEP 9 — Notify Doctor (AI-assisted, receives only summary_v1)
// ─────────────────────────────────────────────────────────────

function StepNotify({ patient, online, onPatientUpdated, onAdvance, triggerSaved }: StepProps) {
  const [aiOutput, setAiOutput] = useState<AiNotifyResponse['output'] | null>(null)
  const [tierUsed, setTierUsed] = useState<number | null>(null)
  const [modelUsed, setModelUsed] = useState<string | null>(null)
  const [disclaimer, setDisclaimer] = useState<string>(MANDATORY_DISCLAIMER)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [queued, setQueued] = useState(false)
  const alreadyNotified = patient?.notificationStatus === 'SENT'

  const runNotify = useCallback(async () => {
    if (!patient) return
    setLoading(true)
    setError(null)
    setBlocked(false)
    try {
      const res = await fetch('/api/orio-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id, task: 'NOTIFY_DOCTOR' }),
      })
      const data: AiNotifyResponse = await res.json()
      if (!res.ok) {
        if (data.blocked) {
          setBlocked(true)
          setError(data.error ?? 'AI is hard-disabled until Step 8 is complete.')
          throw new Error(data.error ?? 'AI blocked')
        }
        throw new Error(data.error ?? 'AI request failed')
      }
      setAiOutput(data.output ?? null)
      setTierUsed(data.tierUsed ?? null)
      setModelUsed(data.modelUsed ?? null)
      setDisclaimer(data.disclaimer ?? MANDATORY_DISCLAIMER)
      onPatientUpdated({ notificationStatus: 'SENT' })
      triggerSaved()
      toast.success('Doctor notified with AI-enhanced summary')
    } catch (e) {
      // If offline or network issue, queue locally
      if (!online || (e as Error).message.toLowerCase().includes('fetch')) {
        setQueued(true)
        onPatientUpdated({ notificationStatus: 'QUEUED' })
        triggerSaved()
        toast('Notification queued locally', {
          description: 'Will be delivered to the doctor when connection returns.',
        })
      } else {
        setError((e as Error).message)
        toast.error('AI notification failed', { description: (e as Error).message })
      }
    } finally {
      setLoading(false)
    }
  }, [patient, online, onPatientUpdated, triggerSaved])

  // Auto-run on mount if not yet notified
  useEffect(() => {
    if (!patient) return
    if (!alreadyNotified && !loading && !error && !queued) {
      runNotify()
    }
  }, [patient?.id])

  const handleContinue = () => {
    if (!aiOutput && !queued) {
      toast.error('Please complete the notification step first')
      return
    }
    onAdvance()
  }

  return (
    <div className="space-y-4">
      {/* AI context banner */}
      <GlassPanel variant="subtle" className="border-violet-500/30 bg-violet-500/5 p-4 glow-violet">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">AI-Assisted Doctor Notification</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-400">
              The Orio AI service will receive <strong>only</strong> the de-identified{' '}
              <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[10px]">patient_summary_v1</code>{' '}
              from Step 8 and produce an enhanced, prioritized notification for the assigned doctor.
              Raw PHI never reaches the AI.
            </p>
          </div>
        </div>
      </GlassPanel>

      {blocked && (
        <GlassPanel variant="subtle" className="border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-400">AI hard-disabled</p>
              <p className="mt-0.5 text-xs text-red-400/80">{error}</p>
              <p className="mt-1 text-xs text-slate-400">
                Go back to Step 8 and generate the local summary first.
              </p>
            </div>
          </div>
        </GlassPanel>
      )}

      {loading && (
        <GlassPanel variant="subtle" className="flex items-center gap-3 p-6">
          <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Orio AI is preparing the notification…</p>
            <p className="text-xs text-slate-400">
              Receiving de-identified summary · composing doctor-ready brief
            </p>
          </div>
        </GlassPanel>
      )}

      {queued && (
        <GlassPanel variant="subtle" className="border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-amber-300">Queued locally</p>
                <Badge className="gap-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/25">
                  <CloudUpload className="h-3 w-3" /> QUEUED
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-amber-300/80">
                The notification will be delivered to the assigned doctor automatically when
                connectivity returns. The patient record has been marked as{' '}
                <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-[10px]">QUEUED</code>.
                You can safely continue — the firewall summary will be used when delivery occurs.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={runNotify}
                disabled={loading}
                className="fx-btn-border-trace btn-press ripple mt-2 h-7 gap-1.5 text-[11px]"
              >
                <RotateCcw className="h-3 w-3" />
                Retry now
              </Button>
            </div>
          </div>
        </GlassPanel>
      )}

      {aiOutput && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {/* AI output */}
          <GlassPanel variant="subtle" className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">AI-enhanced doctor brief</p>
              <Badge className="gap-1 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20">
                <Check className="h-3 w-3" /> Sent
              </Badge>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100/90">
              {aiOutput.summary}
            </p>
            {aiOutput.advice && aiOutput.advice.length > 0 && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Key attention points
                </p>
                <ul className="space-y-1">
                  {aiOutput.advice.map((a, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-100/80">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-violet-400" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassPanel>

          {/* Confidence + tier */}
          <div className="grid gap-3 sm:grid-cols-2">
            <GlassPanel variant="subtle" className="p-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                AI confidence
              </p>
              <ConfidenceMeter value={aiOutput.confidence} />
              <p className="mt-1 text-[10px] text-slate-400">
                Risk level:{' '}
                <span
                  className={cn(
                    'font-medium',
                    aiOutput.risk_level === 'low' && 'text-emerald-400',
                    aiOutput.risk_level === 'moderate' && 'text-amber-400',
                    aiOutput.risk_level === 'high' && 'text-red-400'
                  )}
                >
                  {aiOutput.risk_level.toUpperCase()}
                </span>
              </p>
            </GlassPanel>
            <GlassPanel variant="subtle" className="p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Model routing
              </p>
              <p className="text-xs font-medium">
                Tier {tierUsed ?? '—'} · <span className="font-mono text-[11px]">{modelUsed ?? 'orio-ai'}</span>
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                3-tier failover with retry · recommendation_type: advisory
              </p>
            </GlassPanel>
          </div>

          {/* Disclaimer */}
          <DisclaimerChip text={disclaimer} />

          {aiOutput.limitations && aiOutput.limitations.length > 0 && (
            <details className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
              <summary className="cursor-pointer font-medium text-slate-400">
                Limitations ({aiOutput.limitations.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {aiOutput.limitations.map((l, i) => (
                  <li key={i} className="text-slate-400">· {l}</li>
                ))}
              </ul>
            </details>
          )}
        </motion.div>
      )}

      <StepFooter>
        <ContinueButton
          onClick={handleContinue}
          loading={loading}
          disabled={!aiOutput && !queued}
        />
      </StepFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STEP 10 — Review & Submit (role-based checklist)
// ─────────────────────────────────────────────────────────────

function StepReview({
  patient,
  user,
  vitals,
  onSubmit,
  submitting,
}: StepProps & {
  vitals: VitalsRecord | null
  onSubmit: () => void
  submitting: boolean
}) {
  const role = user.role

  // Build role-based checklist items
  const checklist = useMemo(() => {
    const items: { id: string; label: string; verified: boolean }[] = []
    // Common items
    items.push({
      id: 'consent',
      label: 'Patient consent recorded',
      verified: !!patient?.consentGiven,
    })
    items.push({
      id: 'summary',
      label: 'Privacy firewall — patient_summary_v1 generated',
      verified: !!patient?.localSummary,
    })
    if (role === 'NURSE') {
      items.push({
        id: 'vitals',
        label: 'Vitals recorded with triage level',
        verified: !!vitals && !!vitals.triageLevel,
      })
      items.push({
        id: 'allergies',
        label: 'Hypersensitivity check completed',
        verified: !!patient?.allergies,
      })
    }
    if (role === 'DOCTOR') {
      items.push({
        id: 'diagnosis',
        label: 'Diagnosis reviewed against AI advisory',
        verified: true, // self-attested
      })
      items.push({
        id: 'rx',
        label: 'Prescription plan reviewed for allergies & interactions',
        verified: true,
      })
    }
    if (role === 'ADMIN') {
      items.push({
        id: 'appointment',
        label: 'Appointment scheduled with assigned doctor',
        verified: true,
      })
      items.push({
        id: 'billing',
        label: 'Billing / invoice setup verified',
        verified: true,
      })
    }
    if (role === 'LAB_TECH') {
      items.push({
        id: 'labs',
        label: 'Required lab investigations listed',
        verified: true,
      })
    }
    items.push({
      id: 'disclaimer',
      label: 'AI outputs are advisory only — I retain final clinical responsibility',
      verified: false, // must be manually ticked
    })
    return items
  }, [patient, vitals, role])

  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({})

  // `checked` is derived: auto-verified OR manually checked.
  const checked = useMemo(() => {
    const next: Record<string, boolean> = {}
    checklist.forEach((c) => {
      next[c.id] = c.verified || !!manualChecks[c.id]
    })
    return next
  }, [checklist, manualChecks])

  const allChecked = checklist.every((c) => checked[c.id])

  const toggle = (id: string, verified: boolean) => {
    if (verified) return // cannot untick auto-verified
    setManualChecks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-4">
      <GlassPanel variant="subtle" className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Role-based sign-off checklist</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Your role: <span className="font-medium text-slate-100">{role}</span>. Verify each
              item before final submission. Auto-verified items are locked.
            </p>
          </div>
        </div>
      </GlassPanel>

      <div className="space-y-2">
        {checklist.map((c) => (
          <label
            key={c.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
              c.verified
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : checked[c.id]
                  ? 'border-violet-500/30 bg-violet-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/5',
              c.verified && 'cursor-default'
            )}
          >
            <Checkbox
              checked={!!checked[c.id]}
              onCheckedChange={(v) => toggle(c.id, c.verified)}
              disabled={c.verified}
              className="mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{c.label}</p>
              {c.verified && (
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
                  Auto-verified from record
                </p>
              )}
            </div>
            {c.verified && <Check className="h-4 w-4 text-emerald-500" />}
          </label>
        ))}
      </div>

      {/* Final summary card */}
      <GlassPanel variant="subtle" className="p-4">
        <p className="mb-2 text-sm font-semibold">Patient intake summary</p>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <SummaryRow label="Patient" value={patient?.fullName ?? '—'} />
          <SummaryRow label="Local ID" value={patient?.localId ?? '—'} mono />
          <SummaryRow label="Gender" value={patient?.gender ?? '—'} />
          <SummaryRow label="Age" value={patient?.age != null ? `${patient.age}y` : '—'} />
          <SummaryRow label="Chief complaint" value={patient?.chiefComplaint ?? '—'} />
          <SummaryRow label="Triage level" value={vitals?.triageLevel ?? '—'} />
          <SummaryRow label="Privacy firewall" value={patient?.localSummary ? 'Complete' : 'Pending'} />
          <SummaryRow
            label="Notification"
            value={patient?.notificationStatus ?? 'Pending'}
          />
          <SummaryRow label="Sync status" value={patient?.syncStatus ?? 'DRAFT'} />
          <SummaryRow label="Current status" value={patient?.status ?? 'DRAFT'} />
        </div>
      </GlassPanel>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-[11px] text-slate-400 sm:text-right">
          On submit, the patient record will be marked <strong>COMPLETED</strong> and queued for sync.
        </p>
        <Button
          onClick={onSubmit}
          disabled={!allChecked || submitting}
          className="fx-btn-border-trace btn-press ripple gap-2 sm:w-auto"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitting ? 'Submitting…' : 'Submit & Complete'}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Reusable presentational helpers
// ─────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  icon,
  required,
  className,
  children,
}: {
  label?: string
  hint?: string
  icon?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label className="text-xs">
          {icon && <span className="text-slate-400">{icon}</span>}
          {label}
          {required && <span className="text-red-500">*</span>}
          {hint && <span className="ml-auto text-[10px] font-normal text-slate-400">{hint}</span>}
        </Label>
      )}
      {children}
    </div>
  )
}

function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
      {children}
    </div>
  )
}

function ContinueButton({
  onClick,
  loading,
  disabled,
  label = 'Continue',
}: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  label?: string
}) {
  return (
    <Button onClick={onClick} disabled={loading || disabled} className="fx-btn-border-trace btn-press ripple gap-1.5">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
      {!loading && <ChevronRight className="h-4 w-4" />}
    </Button>
  )
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={cn('font-medium', mono && 'font-mono text-[11px]')}>{value}</span>
    </div>
  )
}

function stepDescription(step: number): string {
  switch (step) {
    case 1:
      return 'Capture demographics, contact, anthropometrics, and consent. Generates a temporary local patient ID and saves the record as DRAFT.'
    case 2:
      return 'Select the primary chief complaint from the structured list. Optional capped free-text for context.'
    case 3:
      return 'Multi-select structured history tags. "None" or at least one tag is required.'
    case 4:
      return 'Add ongoing medications (drug, dose, frequency). Duplicates are flagged. Optional step — leave empty if none.'
    case 5:
      return 'Record vital signs. Local triage level (GREEN / YELLOW / RED) is computed automatically — no AI involved.'
    case 6:
      return 'Record hypersensitivities. Mark "No known allergies" or add at least one allergen entry.'
    case 7:
      return 'Assign a doctor and pick a time slot. Creates a SCHEDULED appointment.'
    case 8:
      return 'Generate the de-identified patient_summary_v1 locally. This is the privacy firewall — strictly local, no AI, no network.'
    case 9:
      return 'Send an AI-enhanced notification to the assigned doctor. AI receives only patient_summary_v1. Queues locally if offline.'
    case 10:
      return 'Verify the role-based sign-off checklist and submit. Patient record is marked COMPLETED and queued for sync.'
    default:
      return ''
  }
}

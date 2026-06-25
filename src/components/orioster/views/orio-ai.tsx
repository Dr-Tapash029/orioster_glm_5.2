'use client'

// ─────────────────────────────────────────────────────────────────────────────
// ORIOSTER — Orio AI Module (Clinical Decision Support)
// AI is ADVISORY ONLY. The doctor always has the final say.
// AI receives ONLY de-identified patient_summary_v1 (privacy firewall).
// AI is HARD-DISABLED until Step 8 (Local Summary) is complete.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Sparkles, ShieldAlert, Stethoscope, Pill, ClipboardList, RefreshCw,
  CheckCircle2, Loader2, ChevronRight, Lock, Printer,
  AlertTriangle, Brain, Activity, UserPlus, Wand2,
} from 'lucide-react'

import { useAppStore } from '@/lib/store'
import {
  GlassPanel, SectionHeader, TriageBadge, RiskBadge, DisclaimerChip,
  ConfidenceMeter, SyncStatusBadge,
} from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover'
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  MANDATORY_DISCLAIMER, type AiTaskType, type AiOutput, type RiskLevel,
  type TriageLevel, AI_TASK_LABELS,
} from '@/lib/types'

// ── Types ────────────────────────────────────────────────────────────────────
interface PickerPatient {
  id: string
  localId: string
  fullName: string
  gender: string
  age: number | null
  chiefComplaint: string | null
  localSummary: string | null
  status: string
  syncStatus: string
  vitals: Array<{ triageLevel: string | null }>
}

interface AiCallResult {
  output: AiOutput
  tierUsed: number
  modelUsed: string
  disclaimer: string
  createdAt?: string
}

type Cache = Partial<Record<AiTaskType, AiCallResult>>

// ── Main View ────────────────────────────────────────────────────────────────
export function OrioAiView() {
  const { user, setView, setActivePatient, activePatientId } = useAppStore()
  const [patients, setPatients] = useState<PickerPatient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(activePatientId)
  const [cache, setCache] = useState<Cache>({})
  const [loadingTask, setLoadingTask] = useState<AiTaskType | null>(null)
  const [confirmedDx, setConfirmedDx] = useState<string | null>(null)
  const [tab, setTab] = useState<'DIAGNOSIS' | 'TREATMENT' | 'RX_GENERATION'>('DIAGNOSIS')

  // Fetch patient list once
  useEffect(() => {
    let cancelled = false
    fetch('/api/patients?limit=200')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        const list: PickerPatient[] = (d.patients ?? []).map((p: PickerPatient) => ({
          id: p.id, localId: p.localId, fullName: p.fullName, gender: p.gender,
          age: p.age, chiefComplaint: p.chiefComplaint, localSummary: p.localSummary,
          status: p.status, syncStatus: p.syncStatus, vitals: p.vitals ?? [],
        }))
        setPatients(list)
        // If store has an active patient that exists in the list, keep it
        if (activePatientId && list.some((p) => p.id === activePatientId)) {
          setSelectedId(activePatientId)
        } else if (list.length > 0) {
          setSelectedId(list[0].id)
        }
      })
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => { if (!cancelled) setLoadingPatients(false) })
    return () => { cancelled = true }
  }, [activePatientId])

  const selected = useMemo(
    () => patients.find((p) => p.id === selectedId) ?? null,
    [patients, selectedId]
  )

  // Reset cache + confirmed diagnosis when patient changes
  const onSelectPatient = useCallback((id: string) => {
    setSelectedId(id)
    setActivePatient(id)
    setCache({})
    setConfirmedDx(null)
    setTab('DIAGNOSIS')
  }, [setActivePatient])

  const firewallOk = !!selected?.localSummary

  // ── AI call helper ──
  const runTask = useCallback(
    async (task: AiTaskType, customSummary?: string) => {
      if (!selectedId) {
        toast.error('Select a patient first')
        return
      }
      // Optimistic: set loading marker
      setLoadingTask(task)
      try {
        const res = await fetch('/api/orio-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: selectedId, task, customSummary }),
        })
        const data = await res.json()
        if (data.blocked) {
          toast.error('AI is disabled — patient_summary_v1 not generated.')
          setCache((c) => ({ ...c, [task]: undefined }))
          return
        }
        if (!res.ok) {
          throw new Error(data.error ?? 'AI request failed')
        }
        const result: AiCallResult = {
          output: data.output,
          tierUsed: data.tierUsed,
          modelUsed: data.modelUsed,
          disclaimer: data.disclaimer ?? MANDATORY_DISCLAIMER,
          createdAt: new Date().toISOString(),
        }
        setCache((c) => ({ ...c, [task]: result }))
        toast.success(`${AI_TASK_LABELS[task]} generated — Tier ${result.tierUsed}`)
      } catch (e) {
        setCache((c) => ({ ...c, [task]: undefined }))
        toast.error((e as Error).message)
      } finally {
        setLoadingTask(null)
      }
    },
    [selectedId]
  )

  if (loadingPatients) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <GlassPanel variant="strong" className="overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Orio AI — Clinical Decision Support</h1>
              <p className="mt-0.5 max-w-2xl text-sm text-slate-400">
                Advisory-only clinical intelligence. AI receives only de-identified{' '}
                <code className="rounded bg-white/5 px-1 py-0.5 text-[11px]">patient_summary_v1</code>. The doctor always has the final say.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-300">
            <ShieldAlert className="h-3 w-3" /> Advisory Mode
          </Badge>
        </div>
      </GlassPanel>

      {/* Patient selector + firewall status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel className="p-4 sm:p-5 lg:col-span-1">
          <SectionHeader title="Select Patient" subtitle="Choose a patient for AI assistance" />
          <div className="mt-3">
            <PatientPicker
              patients={patients}
              value={selectedId}
              onChange={onSelectPatient}
            />
          </div>
          {selected && (
            <div className="mt-4 space-y-2.5 border-t border-white/10 pt-3">
              <Row label="Local ID" value={selected.localId} />
              <Row label="Age / Sex" value={`${selected.age ?? '?'}y · ${selected.gender.toLowerCase()}`} />
              <Row label="Status" value={selected.status} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Triage</span>
                <TriageBadge level={(selected.vitals[0]?.triageLevel as TriageLevel) ?? null} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Sync</span>
                <SyncStatusBadge status={selected.syncStatus as 'DRAFT' | 'QUEUED' | 'SYNCED' | 'CONFLICT'} />
              </div>
              <div>
                <span className="text-xs text-slate-400">Chief Complaint</span>
                <p className="mt-0.5 text-sm font-medium">{selected.chiefComplaint ?? '—'}</p>
              </div>
            </div>
          )}
        </GlassPanel>

        {/* Firewall status panel */}
        <GlassPanel className="p-4 sm:p-5 lg:col-span-2">
          <SectionHeader
            title="Privacy Firewall"
            subtitle="AI is hard-disabled until patient_summary_v1 exists"
            action={
              firewallOk ? (
                <Badge className="gap-1.5 bg-cyan-500/15 text-cyan-300 border-cyan-500/30 glow-cyan">
                  <Lock className="h-3 w-3" /> Firewall Active
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5 border-red-500/40 bg-red-500/10 text-red-400">
                  <ShieldAlert className="h-3 w-3" /> AI Disabled
                </Badge>
              )
            }
          />
          {!selected ? (
            <p className="mt-4 text-sm text-slate-400">Select a patient to view firewall status.</p>
          ) : !firewallOk ? (
            <FirewallWarning onGoToWizard={() => {
              setActivePatient(selected.id)
              setView('patient-entry')
            }} />
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3 glow-cyan">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                  <CheckCircle2 className="h-4 w-4" />
                  patient_summary_v1 generated
                </div>
                <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-slate-400">
                  {selected.localSummary}
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                Raw PHI never leaves the device. The AI receives only the compressed, de-identified summary above. Outputs are advisory and must be reviewed by a human professional.
              </p>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* AI task panel — only when firewall active */}
      {selected && firewallOk && (
        <GlassPanel className="p-4 sm:p-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <div className="overflow-x-auto orio-scroll">
              <TabsList className="grid w-full min-w-[560px] grid-cols-3">
                <TabsTrigger value="DIAGNOSIS" className="gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5" /> Differential Diagnosis
                </TabsTrigger>
                <TabsTrigger value="TREATMENT" className="gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Treatment Plan
                </TabsTrigger>
                <TabsTrigger value="RX_GENERATION" className="gap-1.5">
                  <Pill className="h-3.5 w-3.5" /> Prescription
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="DIAGNOSIS" className="mt-4">
              <DiagnosisPanel
                loading={loadingTask === 'DIAGNOSIS'}
                result={cache.DIAGNOSIS}
                confirmedDx={confirmedDx}
                onRun={() => runTask('DIAGNOSIS')}
                onConfirm={setConfirmedDx}
                onReset={() => { setCache((c) => ({ ...c, DIAGNOSIS: undefined })); setConfirmedDx(null) }}
              />
            </TabsContent>

            <TabsContent value="TREATMENT" className="mt-4">
              <TreatmentPanel
                loading={loadingTask === 'TREATMENT'}
                result={cache.TREATMENT}
                confirmedDx={confirmedDx}
                onRun={() => runTask('TREATMENT', confirmedDx ? `Confirmed diagnosis (doctor-selected): ${confirmedDx}` : undefined)}
                onReset={() => setCache((c) => ({ ...c, TREATMENT: undefined }))}
                onGoToDiagnosis={() => setTab('DIAGNOSIS')}
              />
            </TabsContent>

            <TabsContent value="RX_GENERATION" className="mt-4">
              <PrescriptionPanel
                loading={loadingTask === 'RX_GENERATION'}
                result={cache.RX_GENERATION}
                onRun={() => runTask('RX_GENERATION', confirmedDx ? `Confirmed diagnosis: ${confirmedDx}` : undefined)}
                onReset={() => setCache((c) => ({ ...c, RX_GENERATION: undefined }))}
              />
            </TabsContent>
          </Tabs>
        </GlassPanel>
      )}

      {/* Footer note */}
      <p className="px-1 text-center text-[11px] text-slate-400">
        ORIO AI · 4-tier failover · Privacy firewall enforced server-side · {user?.name ?? 'Doctor'}
      </p>
    </div>
  )
}

// ── Firewall warning ─────────────────────────────────────────────────────────
function FirewallWarning({ onGoToWizard }: { onGoToWizard: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-400">AI is disabled — patient_summary_v1 not generated</p>
          <p className="mt-1 text-sm text-slate-400">
            Complete the Patient Entry Wizard through <span className="font-medium">Step 8 (Local Summary)</span> first.
            The privacy firewall requires a de-identified summary before any AI task can run.
          </p>
          <Button size="sm" className="btn-cyan mt-3 gap-1.5" onClick={onGoToWizard}>
            <UserPlus className="h-3.5 w-3.5" /> Open Patient Entry Wizard
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Patient Picker (combobox) ────────────────────────────────────────────────
function PatientPicker({
  patients, value, onChange,
}: {
  patients: PickerPatient[]
  value: string | null
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = patients.find((p) => p.id === value) ?? null
  const filtered = patients.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.localId.toLowerCase().includes(q) ||
      (p.chiefComplaint ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{selected.fullName}</span>
              <span className="text-[11px] text-slate-400">· {selected.localId}</span>
            </span>
          ) : (
            <span className="text-slate-400">Search patient…</span>
          )}
          <ChevronRight className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-90')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, ID, or complaint…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-72">
            <CommandEmpty>No patient found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((p) => {
                const hasSummary = !!p.localSummary
                return (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => { onChange(p.id); setOpen(false); setSearch('') }}
                    className="gap-2"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-[11px] font-semibold text-cyan-300">
                      {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.fullName}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {p.localId} · {p.age ?? '?'}y · {p.chiefComplaint ?? 'No complaint'}
                      </p>
                    </div>
                    {hasSummary ? (
                      <Lock className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ── Diagnosis Panel ──────────────────────────────────────────────────────────
function DiagnosisPanel({
  loading, result, confirmedDx, onRun, onConfirm, onReset,
}: {
  loading: boolean
  result: AiCallResult | undefined
  confirmedDx: string | null
  onRun: () => void
  onConfirm: (dx: string) => void
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Differential Diagnosis</h3>
          <p className="text-sm text-slate-400">
            AI suggests the 3 most probable diagnoses from the de-identified summary.
          </p>
        </div>
        <div className="flex gap-2">
          {result && (
            <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
          <Button size="sm" onClick={onRun} disabled={loading} className="btn-cyan gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {result ? 'Regenerate' : 'Run AI'}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && !result ? (
          <InlineLoader label="Running differential diagnosis through the privacy firewall…" key="loader" />
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Summary header */}
            <GlassPanel variant="subtle" className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-400">AI Summary</p>
                  <p className="mt-1 text-sm">{result.output.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <RiskBadge level={(result.output.risk_level as RiskLevel) ?? 'moderate'} />
                  <TierBadge tier={result.tierUsed} model={result.modelUsed} />
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Overall confidence</span>
                  <span className="font-semibold tabular-nums">{Math.round(result.output.confidence * 100)}%</span>
                </div>
                <ConfidenceMeter value={result.output.confidence} />
              </div>
            </GlassPanel>

            {/* Diagnosis list */}
            <div className="space-y-3">
              {result.output.diagnosis?.slice(0, 3).map((d, i) => {
                const isConfirmed = confirmedDx === d.condition
                return (
                  <GlassPanel
                    key={i}
                    variant={isConfirmed ? 'strong' : 'default'}
                    className={cn('p-4 transition-all', isConfirmed && 'ring-2 ring-primary/50')}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isConfirmed ? 'bg-cyan-500 text-cyan-950' : 'bg-cyan-500/15 text-cyan-300'
                        )}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">{d.condition}</p>
                          <p className="mt-1 text-sm text-slate-400">{d.reasoning}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm font-bold tabular-nums">{Math.round(d.probability * 100)}%</span>
                        <Button
                          size="sm"
                          variant={isConfirmed ? 'default' : 'outline'}
                          className={cn('gap-1.5', isConfirmed && 'btn-cyan')}
                          onClick={() => onConfirm(d.condition)}
                        >
                          {isConfirmed ? (
                            <><CheckCircle2 className="h-3.5 w-3.5" /> Confirmed</>
                          ) : (
                            <><Stethoscope className="h-3.5 w-3.5" /> Select as confirmed</>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProbabilityBar value={d.probability} rank={i} />
                    </div>
                  </GlassPanel>
                )
              })}
            </div>

            {/* Limitations */}
            {result.output.limitations?.length > 0 && (
              <LimitationsList items={result.output.limitations} />
            )}

            <DisclaimerChip text={result.disclaimer} />

            {confirmedDx && (
              <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                <span>
                  <span className="font-semibold">{confirmedDx}</span> marked as confirmed diagnosis.
                  Proceed to <span className="font-medium">Treatment Plan</span> to generate a plan based on this selection.
                </span>
              </div>
            )}
          </motion.div>
        ) : (
          <EmptyTask
            icon={<Brain className="h-7 w-7" />}
            title="No diagnosis generated yet"
            description="Click Run AI to generate a differential diagnosis. The output is advisory and must be reviewed by a human professional."
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Treatment Panel ──────────────────────────────────────────────────────────
function TreatmentPanel({
  loading, result, confirmedDx, onRun, onReset, onGoToDiagnosis,
}: {
  loading: boolean
  result: AiCallResult | undefined
  confirmedDx: string | null
  onRun: () => void
  onReset: () => void
  onGoToDiagnosis: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Treatment Plan</h3>
          <p className="text-sm text-slate-400">
            Requires a confirmed diagnosis selected from the differential step.
          </p>
        </div>
        <div className="flex gap-2">
          {result && (
            <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
          <Button size="sm" onClick={onRun} disabled={loading || !confirmedDx} className="btn-cyan gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5" />}
            {result ? 'Regenerate' : 'Generate Plan'}
          </Button>
        </div>
      </div>

      {/* Confirmed diagnosis chip */}
      {confirmedDx ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
          <span className="text-slate-400">Confirmed diagnosis:</span>
          <span className="font-semibold">{confirmedDx}</span>
        </div>
      ) : (
        <GlassPanel variant="subtle" className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium">No confirmed diagnosis selected</p>
              <p className="text-xs text-slate-400">
                Run Differential Diagnosis and select a condition first. The treatment plan is contextual to the doctor-confirmed diagnosis.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onGoToDiagnosis} className="gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" /> Go to Diagnosis
          </Button>
        </GlassPanel>
      )}

      <AnimatePresence mode="wait">
        {loading && !result ? (
          <InlineLoader label="Generating treatment plan with complications & interactions…" key="loader" />
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            <GlassPanel variant="subtle" className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-400">AI Summary</p>
                  <p className="mt-1 text-sm">{result.output.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <RiskBadge level={(result.output.risk_level as RiskLevel) ?? 'moderate'} />
                  <TierBadge tier={result.tierUsed} model={result.modelUsed} />
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Overall confidence</span>
                  <span className="font-semibold tabular-nums">{Math.round(result.output.confidence * 100)}%</span>
                </div>
                <ConfidenceMeter value={result.output.confidence} />
              </div>
            </GlassPanel>

            <div className="grid gap-4 md:grid-cols-2">
              <TreatmentCard
                icon={<ClipboardList className="h-4 w-4" />}
                title="Treatment Steps"
                items={result.output.treatment_plan}
                accent="primary"
              />
              <TreatmentCard
                icon={<Activity className="h-4 w-4" />}
                title="Patient Advice"
                items={result.output.advice}
                accent="accent"
              />
              <TreatmentCard
                icon={<AlertTriangle className="h-4 w-4" />}
                title="Possible Complications"
                items={result.output.complications}
                accent="amber"
              />
              <TreatmentCard
                icon={<ShieldAlert className="h-4 w-4" />}
                title="Drug Interactions"
                items={result.output.interactions}
                accent="red"
              />
            </div>

            {result.output.limitations?.length > 0 && (
              <LimitationsList items={result.output.limitations} />
            )}

            <DisclaimerChip text={result.disclaimer} />
          </motion.div>
        ) : (
          <EmptyTask
            icon={<ClipboardList className="h-7 w-7" />}
            title="No treatment plan yet"
            description={confirmedDx
              ? 'Click Generate Plan to produce an advisory treatment plan, complications, and drug interactions for the confirmed diagnosis.'
              : 'Select a confirmed diagnosis first to enable treatment plan generation.'
            }
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Prescription Panel ───────────────────────────────────────────────────────
function PrescriptionPanel({
  loading, result, onRun, onReset,
}: {
  loading: boolean
  result: AiCallResult | undefined
  onRun: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Prescription Generation</h3>
          <p className="text-sm text-slate-400">
            AI generates an advisory prescription reviewed against allergies and current medications.
          </p>
        </div>
        <div className="flex gap-2">
          {result && (
            <>
              <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { toast.success('Prescription sent to print queue'); window.print() }}
                className="gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </>
          )}
          <Button size="sm" onClick={onRun} disabled={loading} className="btn-cyan gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pill className="h-3.5 w-3.5" />}
            {result ? 'Regenerate' : 'Generate Rx'}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && !result ? (
          <InlineLoader label="Generating prescription with allergy & interaction checks…" key="loader" />
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            <GlassPanel variant="subtle" className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-400">AI Summary</p>
                  <p className="mt-1 text-sm">{result.output.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <RiskBadge level={(result.output.risk_level as RiskLevel) ?? 'moderate'} />
                  <TierBadge tier={result.tierUsed} model={result.modelUsed} />
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Overall confidence</span>
                  <span className="font-semibold tabular-nums">{Math.round(result.output.confidence * 100)}%</span>
                </div>
                <ConfidenceMeter value={result.output.confidence} />
              </div>
            </GlassPanel>

            {/* Prescription table */}
            <GlassPanel className="overflow-hidden p-0">
              <div className="border-b border-white/10 bg-white/5 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rx · {result.output.prescription?.length ?? 0} item(s)
                </p>
              </div>
              <div className="overflow-x-auto orio-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-400">
                      <th className="px-4 py-2 font-medium">Drug</th>
                      <th className="px-4 py-2 font-medium">Dosage</th>
                      <th className="px-4 py-2 font-medium">Frequency</th>
                      <th className="px-4 py-2 font-medium">Duration</th>
                      <th className="px-4 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.output.prescription?.map((rx, i) => (
                      <tr key={i} className="border-b border-white/10 last:border-0">
                        <td className="px-4 py-2.5 font-medium">{rx.drug}</td>
                        <td className="px-4 py-2.5 tabular-nums">{rx.dosage}</td>
                        <td className="px-4 py-2.5">{rx.frequency}</td>
                        <td className="px-4 py-2.5">{rx.duration}</td>
                        <td className="px-4 py-2.5 text-slate-400">{rx.notes ?? '—'}</td>
                      </tr>
                    ))}
                    {(!result.output.prescription || result.output.prescription.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                          No prescription items returned.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassPanel>

            {/* Advice */}
            {result.output.advice && result.output.advice.length > 0 && (
              <TreatmentCard
                icon={<Activity className="h-4 w-4" />}
                title="Patient Advice"
                items={result.output.advice}
                accent="accent"
              />
            )}

            {result.output.limitations?.length > 0 && (
              <LimitationsList items={result.output.limitations} />
            )}

            <DisclaimerChip text={result.disclaimer} />
          </motion.div>
        ) : (
          <EmptyTask
            icon={<Pill className="h-7 w-7" />}
            title="No prescription generated yet"
            description="Click Generate Rx to produce an advisory prescription. Verify dosages against patient allergies and current medications before dispensing."
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────
function TierBadge({ tier, model }: { tier: number; model?: string }) {
  const cls = tier === 1
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : tier === 2
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : 'bg-red-500/15 text-red-400 border-red-500/30'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', cls)}>
      <Sparkles className="h-2.5 w-2.5" />
      Tier {tier} {tier === 1 ? '— Success' : `— Failover ${tier}`}
    </span>
  )
}

function ProbabilityBar({ value, rank }: { value: number; rank: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  const colors = ['bg-cyan-500', 'bg-cyan-500/70', 'bg-cyan-500/45']
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[rank] ?? colors[2])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-[11px] font-semibold tabular-nums">{pct}%</span>
    </div>
  )
}

function TreatmentCard({
  icon, title, items, accent,
}: {
  icon: React.ReactNode
  title: string
  items?: string[]
  accent: 'primary' | 'accent' | 'amber' | 'red'
}) {
  const accents = {
    primary: 'bg-cyan-500/15 text-cyan-300',
    accent: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-300',
    red: 'bg-red-500/10 text-red-400',
  }
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center gap-2">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', accents[accent])}>
          {icon}
        </div>
        <p className="text-sm font-semibold">{title}</p>
        <span className="ml-auto text-[11px] text-slate-400">{items?.length ?? 0}</span>
      </div>
      <Separator className="my-3" />
      {items && items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={cn('mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full', accents[accent].split(' ')[0])} />
              <span className="text-slate-100/90">{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">No items.</p>
      )}
    </GlassPanel>
  )
}

function LimitationsList({ items }: { items: string[] }) {
  return (
    <GlassPanel variant="subtle" className="p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <AlertTriangle className="h-3.5 w-3.5" /> AI Limitations
      </p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-slate-400">• {it}</li>
        ))}
      </ul>
    </GlassPanel>
  )
}

function InlineLoader({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-10"
    >
      <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-slate-400">4-tier failover active · non-blocking</p>
      </div>
    </motion.div>
  )
}

function EmptyTask({
  icon, title, description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <GlassPanel variant="subtle" className="flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{description}</p>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Wand2 className="h-3 w-3" /> Outputs are advisory — review before action
      </div>
    </GlassPanel>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

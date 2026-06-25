'use client'

// ─────────────────────────────────────────────────────────────────────────────
// ORIOSTER — AI Hub (Document Generation Center)
// Central command module for generating documents through fixed templates.
// All AI outputs are ADVISORY ONLY — doctor/admin must review before action.
// Privacy firewall enforced: patient must have patient_summary_v1.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  LayoutGrid, Receipt, FlaskConical, Pill, FileBadge, Sparkles, Loader2,
  ChevronRight, Lock, ShieldAlert, CheckCircle2, RefreshCw, Save,
  AlertTriangle, Activity, FileText,
} from 'lucide-react'

import { useAppStore } from '@/lib/store'
import {
  GlassPanel, RiskBadge, DisclaimerChip, ConfidenceMeter,
  TriageBadge, SyncStatusBadge,
} from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  MANDATORY_DISCLAIMER, type AiOutput, type RiskLevel, type TriageLevel,
  LAB_REPORT_TYPES, LAB_REPORT_LABELS, type AiTaskType, AI_TASK_LABELS,
} from '@/lib/types'

// ── Patient type (minimal) ───────────────────────────────────────────────────
interface HubPatient {
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
}

type DocType = 'INVOICE' | 'LAB_REPORT' | 'PRESCRIPTION' | 'CERTIFICATE'

// ── Lab parameter templates ──────────────────────────────────────────────────
interface ParamTemplate { name: string; unit: string; refRange: string }
const LAB_PARAMETER_TEMPLATES: Record<string, ParamTemplate[]> = {
  CBC: [
    { name: 'Hemoglobin', unit: 'g/dL', refRange: '13.0-17.0' },
    { name: 'WBC Count', unit: '10³/µL', refRange: '4.0-11.0' },
    { name: 'Platelet Count', unit: '10³/µL', refRange: '150-450' },
    { name: 'RBC Count', unit: '10⁶/µL', refRange: '4.5-5.5' },
    { name: 'Hematocrit', unit: '%', refRange: '40-50' },
  ],
  LIPID_PANEL: [
    { name: 'Total Cholesterol', unit: 'mg/dL', refRange: '<200' },
    { name: 'LDL', unit: 'mg/dL', refRange: '<100' },
    { name: 'HDL', unit: 'mg/dL', refRange: '>40' },
    { name: 'Triglycerides', unit: 'mg/dL', refRange: '<150' },
  ],
  LFT: [
    { name: 'ALT', unit: 'U/L', refRange: '7-56' },
    { name: 'AST', unit: 'U/L', refRange: '10-40' },
    { name: 'Bilirubin Total', unit: 'mg/dL', refRange: '0.1-1.2' },
    { name: 'Albumin', unit: 'g/dL', refRange: '3.5-5.0' },
  ],
  RFT: [
    { name: 'Urea', unit: 'mg/dL', refRange: '7-20' },
    { name: 'Creatinine', unit: 'mg/dL', refRange: '0.6-1.2' },
    { name: 'Sodium', unit: 'mmol/L', refRange: '135-145' },
    { name: 'Potassium', unit: 'mmol/L', refRange: '3.5-5.0' },
  ],
  BLOOD_GLUCOSE: [
    { name: 'Fasting Glucose', unit: 'mg/dL', refRange: '70-100' },
    { name: 'Postprandial Glucose', unit: 'mg/dL', refRange: '<140' },
    { name: 'HbA1c', unit: '%', refRange: '<5.7' },
  ],
  URINALYSIS: [
    { name: 'pH', unit: '', refRange: '5-8' },
    { name: 'Specific Gravity', unit: '', refRange: '1.005-1.030' },
    { name: 'Protein', unit: '', refRange: 'Negative' },
    { name: 'Glucose', unit: '', refRange: 'Negative' },
  ],
  THYROID: [
    { name: 'TSH', unit: 'mIU/L', refRange: '0.4-4.0' },
    { name: 'Free T3', unit: 'pg/mL', refRange: '2.3-4.2' },
    { name: 'Free T4', unit: 'ng/dL', refRange: '0.8-1.8' },
  ],
}

// ── Document type cards config ───────────────────────────────────────────────
const DOC_CARDS: Array<{
  type: DocType
  title: string
  description: string
  icon: React.ReactNode
  accent: string
  task: AiTaskType
}> = [
  {
    type: 'INVOICE',
    title: 'Invoice',
    description: 'AI-generated itemized billing from service summary. Save to patient record.',
    icon: <Receipt className="h-5 w-5" />,
    accent: 'bg-amber-500/15 text-amber-300',
    task: 'INVOICE',
  },
  {
    type: 'LAB_REPORT',
    title: 'Lab Report',
    description: 'Enter parameters, AI analyzes normal/abnormal values, save report to patient.',
    icon: <FlaskConical className="h-5 w-5" />,
    accent: 'bg-violet-500/15 text-violet-300',
    task: 'LAB_ANALYSIS',
  },
  {
    type: 'PRESCRIPTION',
    title: 'Prescription',
    description: 'AI generates an advisory prescription with dosage, frequency, and notes.',
    icon: <Pill className="h-5 w-5" />,
    accent: 'bg-violet-500/15 text-violet-300',
    task: 'RX_GENERATION',
  },
  {
    type: 'CERTIFICATE',
    title: 'Medical Certificate',
    description: 'AI drafts certificate content — doctor reviews and finalizes before signing.',
    icon: <FileBadge className="h-5 w-5" />,
    accent: 'bg-emerald-500/15 text-emerald-300',
    task: 'CERTIFICATE',
  },
]

// ── Main View ────────────────────────────────────────────────────────────────
export function AiHubView() {
  const { user } = useAppStore()
  const [patients, setPatients] = useState<HubPatient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/patients?limit=200')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setPatients((d.patients ?? []).map((p: HubPatient) => ({
          id: p.id, localId: p.localId, fullName: p.fullName, gender: p.gender,
          age: p.age, chiefComplaint: p.chiefComplaint, localSummary: p.localSummary,
          status: p.status, syncStatus: p.syncStatus, vitals: p.vitals ?? [],
        })))
      })
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => { if (!cancelled) setLoadingPatients(false) })
    return () => { cancelled = true }
  }, [])

  const aiDisabledCount = useMemo(
    () => patients.filter((p) => !p.localSummary).length,
    [patients]
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <GlassPanel variant="strong" className="overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">AI Hub — Document Generation Center</h1>
              <p className="mt-0.5 max-w-2xl text-sm text-slate-400">
                Generate documents through fixed AI templates. Every output is advisory — review before saving or dispensing.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-300">
            <ShieldAlert className="h-3 w-3" /> Advisory Templates
          </Badge>
        </div>
        {/* Status row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Patients" value={patients.length} icon={<FileText className="h-3.5 w-3.5" />} />
          <MiniStat label="Firewall Active" value={patients.length - aiDisabledCount} icon={<Lock className="h-3.5 w-3.5" />} accent="emerald" />
          <MiniStat label="AI Disabled" value={aiDisabledCount} icon={<ShieldAlert className="h-3.5 w-3.5" />} accent="red" />
          <MiniStat label="Templates" value={DOC_CARDS.length} icon={<LayoutGrid className="h-3.5 w-3.5" />} />
        </div>
      </GlassPanel>

      {/* Document cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DOC_CARDS.map((card) => (
          <motion.div
            key={card.type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GlassPanel className="group flex h-full flex-col p-5 transition-all hover:shadow-lg">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', card.accent)}>
                {card.icon}
              </div>
              <h3 className="mt-3 text-base font-semibold">{card.title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-400">{card.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Task: <code className="rounded bg-white/5 px-1 py-0.5">{card.task}</code>
                </span>
              </div>
              <Button
                className="fx-btn-border-trace btn-press ripple mt-4 w-full gap-1.5"
                onClick={() => setActiveDoc(card.type)}
                disabled={loadingPatients}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <p className="px-1 text-center text-[11px] text-slate-400">
        AI Hub · {user?.name ?? 'User'} · All outputs include the mandatory disclaimer · Privacy firewall enforced server-side
      </p>

      {/* Workflow dialog */}
      <Dialog open={!!activeDoc} onOpenChange={(o) => !o && setActiveDoc(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-hidden p-0">
          {activeDoc && (
            <DocWorkflow
              docType={activeDoc}
              patients={patients}
              onClose={() => setActiveDoc(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Document workflow (dialog body) ──────────────────────────────────────────
function DocWorkflow({
  docType, patients, onClose,
}: {
  docType: DocType
  patients: HubPatient[]
  onClose: () => void
}) {
  const { user } = useAppStore()
  const [patientId, setPatientId] = useState<string | null>(null)
  const [labReportType, setLabReportType] = useState<string>(LAB_REPORT_TYPES[0])
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiCallResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const patient = useMemo(
    () => patients.find((p) => p.id === patientId) ?? null,
    [patients, patientId]
  )
  const firewallOk = !!patient?.localSummary

  const card = DOC_CARDS.find((c) => c.type === docType)!

  // Reset state when docType changes
  useEffect(() => {
    setPatientId(null)
    setResult(null)
    setSaved(false)
    setParamValues({})
    setLabReportType(LAB_REPORT_TYPES[0])
  }, [docType])

  // ── Run AI ──
  const runAi = useCallback(async () => {
    if (!patientId) { toast.error('Select a patient first'); return }
    setLoading(true)
    setResult(null)
    try {
      let customSummary: string | undefined
      if (docType === 'LAB_REPORT') {
        const template = LAB_PARAMETER_TEMPLATES[labReportType] ?? []
        const lines = template.map((t) => {
          const v = paramValues[t.name] ?? ''
          return `${t.name}: ${v} ${t.unit} (ref ${t.refRange})`
        })
        customSummary = `Lab report type: ${LAB_REPORT_LABELS[labReportType]}. Parameters: ${lines.join('; ')}.`
      }
      const res = await fetch('/api/orio-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, task: card.task, customSummary }),
      })
      const data = await res.json()
      if (data.blocked) {
        toast.error('AI disabled — patient_summary_v1 not generated.')
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'AI request failed')
      setResult({
        output: data.output,
        tierUsed: data.tierUsed,
        modelUsed: data.modelUsed,
        disclaimer: data.disclaimer ?? MANDATORY_DISCLAIMER,
      })
      toast.success(`${card.title} generated — Tier ${data.tierUsed}`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [patientId, docType, labReportType, paramValues, card])

  // ── Save invoice ──
  const saveInvoice = async () => {
    if (!patientId || !user) return
    const items = result?.output.line_items ?? []
    if (items.length === 0) { toast.error('No line items to save'); return }
    const subtotal = items.reduce((s, it) => s + (it.quantity ?? 0) * (it.unit_price ?? 0), 0)
    const tax = Math.round(subtotal * 0.05 * 100) / 100
    const total = subtotal + tax
    setSaving(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, items, subtotal, tax, total, createdBy: user.id }),
      })
      if (!res.ok) throw new Error('Failed to save invoice')
      const d = await res.json()
      toast.success(`Invoice ${d.invoice?.invoiceNo ?? ''} saved`)
      setSaved(true)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ── Save lab report ──
  const saveLabReport = async () => {
    if (!patientId || !user) return
    const template = LAB_PARAMETER_TEMPLATES[labReportType] ?? []
    const analysisMap = new Map(
      (result?.output.parameters_analysis ?? []).map((a) => [a.parameter.toLowerCase(), a])
    )
    const parameters = template.map((t) => {
      const val = paramValues[t.name] ?? ''
      const ai = analysisMap.get(t.name.toLowerCase())
      return {
        name: t.name,
        value: val,
        unit: t.unit,
        refRange: t.refRange,
        status: ai?.status ?? 'normal',
        note: ai?.note ?? '',
      }
    })
    setSaving(true)
    try {
      const res = await fetch('/api/lab-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          reportType: labReportType,
          parameters,
          createdBy: user.id,
        }),
      })
      if (!res.ok) throw new Error('Failed to save lab report')
      toast.success('Lab report saved')
      setSaved(true)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', card.accent)}>
            {card.icon}
          </div>
          <div>
            <DialogTitle className="text-base">{card.title} Generation</DialogTitle>
            <DialogDescription className="text-xs">
              AI task: {AI_TASK_LABELS[card.task]} · Advisory output
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(90vh-72px)]">
        <div className="space-y-4 px-5 py-4">
          {/* Patient selection */}
          <div>
            <Label className="text-xs font-medium text-slate-400">Patient</Label>
            <div className="mt-1.5">
              <PatientPickerInline
                patients={patients}
                value={patientId}
                onChange={(id) => { setPatientId(id); setResult(null); setSaved(false) }}
              />
            </div>
            {patient && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <TriageBadge level={(patient.vitals[0]?.triageLevel as TriageLevel) ?? null} />
                <SyncStatusBadge status={patient.syncStatus as 'DRAFT' | 'QUEUED' | 'SYNCED' | 'CONFLICT'} />
                <span className="text-slate-400">· {patient.age ?? '?'}y {patient.gender.toLowerCase()}</span>
                <span className="text-slate-400">· {patient.chiefComplaint ?? 'No complaint'}</span>
              </div>
            )}
          </div>

          {/* Firewall check */}
          {patient && !firewallOk && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-red-400">
                <ShieldAlert className="h-3.5 w-3.5" /> AI disabled for this patient
              </p>
              <p className="mt-1 text-slate-400">
                patient_summary_v1 not generated. Complete Step 8 of the Patient Entry Wizard first.
              </p>
            </div>
          )}

          {/* Lab report config */}
          {docType === 'LAB_REPORT' && firewallOk && (
            <LabReportConfig
              reportType={labReportType}
              onReportTypeChange={(t) => { setLabReportType(t); setParamValues({}); setResult(null) }}
              paramValues={paramValues}
              onParamChange={(name, v) => setParamValues((s) => ({ ...s, [name]: v }))}
            />
          )}

          {/* Generate button */}
          {firewallOk && (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={runAi} disabled={loading} className="fx-btn-border-trace btn-press ripple gap-1.5">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {result ? 'Regenerate' : 'Generate with AI'}
              </Button>
              {result && (
                <Button variant="outline" size="sm" onClick={() => setResult(null)} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
              <span className="ml-auto text-[11px] text-slate-400">
                {loading ? '4-tier failover active…' : 'Non-blocking'}
              </span>
            </div>
          )}

          {/* Loading inline */}
          {loading && !result && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
              <div>
                <p className="text-sm font-medium">Generating {card.title.toLowerCase()}…</p>
                <p className="text-[11px] text-slate-400">AI is processing the de-identified summary</p>
              </div>
            </div>
          )}

          {/* Result display */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <ResultDisplay docType={docType} result={result} labReportType={labReportType} />

                {/* Save actions */}
                {(docType === 'INVOICE' || docType === 'LAB_REPORT') && (
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                    <div className="text-xs">
                      <p className="font-medium">
                        {saved
                          ? (docType === 'INVOICE' ? 'Invoice saved to patient record' : 'Lab report saved to patient record')
                          : (docType === 'INVOICE' ? 'Save this invoice to the patient record?' : 'Save this lab report?')}
                      </p>
                      <p className="text-slate-400">
                        {saved ? 'You can view it under Patient Detail → Invoices / Lab Reports.' : 'Records the generated document with the AI advisory attached.'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={docType === 'INVOICE' ? saveInvoice : saveLabReport}
                      disabled={saving || saved}
                      className="fx-btn-border-trace btn-press ripple gap-1.5"
                    >
                      {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                )}

                <DisclaimerChip text={result.disclaimer} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </>
  )
}

// ── Lab report config ────────────────────────────────────────────────────────
function LabReportConfig({
  reportType, onReportTypeChange, paramValues, onParamChange,
}: {
  reportType: string
  onReportTypeChange: (t: string) => void
  paramValues: Record<string, string>
  onParamChange: (name: string, value: string) => void
}) {
  const template = LAB_PARAMETER_TEMPLATES[reportType] ?? []
  return (
    <GlassPanel variant="subtle" className="p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[200px] flex-1">
          <Label className="text-xs font-medium text-slate-400">Report Type</Label>
          <Select value={reportType} onValueChange={onReportTypeChange}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LAB_REPORT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{LAB_REPORT_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline" className="gap-1">
          <FlaskConical className="h-3 w-3" /> {template.length} parameters
        </Badge>
      </div>
      <Separator className="my-3" />
      <div className="grid gap-3 sm:grid-cols-2">
        {template.map((t) => (
          <div key={t.name} className="space-y-1">
            <Label className="text-xs">
              {t.name}
              <span className="ml-1 text-[10px] text-slate-400">
                {t.unit && `(${t.unit})`} · ref {t.refRange}
              </span>
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder={`e.g. ${t.refRange}`}
              value={paramValues[t.name] ?? ''}
              onChange={(e) => onParamChange(t.name, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Leave blank if not measured. AI will analyze entered values against reference ranges.
      </p>
    </GlassPanel>
  )
}

// ── Result display (per doc type) ────────────────────────────────────────────
function ResultDisplay({
  docType, result, labReportType,
}: {
  docType: DocType
  result: AiCallResult
  labReportType: string
}) {
  const o = result.output
  return (
    <div className="space-y-3">
      {/* Common header */}
      <GlassPanel variant="subtle" className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-400">AI Summary</p>
            <p className="mt-1 text-sm">{o.summary}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <RiskBadge level={(o.risk_level as RiskLevel) ?? 'low'} />
            <TierBadge tier={result.tierUsed} />
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">Confidence</span>
            <span className="font-semibold tabular-nums">{Math.round(o.confidence * 100)}%</span>
          </div>
          <ConfidenceMeter value={o.confidence} />
        </div>
      </GlassPanel>

      {/* Invoice */}
      {docType === 'INVOICE' && (
        <GlassPanel className="overflow-hidden p-0">
          <div className="border-b border-white/10 bg-white/5 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Line Items · {o.line_items?.length ?? 0}
            </p>
          </div>
          <div className="overflow-x-auto orio-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-400">
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 text-right font-medium">Qty</th>
                  <th className="px-4 py-2 text-right font-medium">Unit Price</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {o.line_items?.map((it, i) => (
                  <tr key={i} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-2.5">{it.description}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{it.quantity}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(it.unit_price)}</td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      {formatCurrency((it.quantity ?? 0) * (it.unit_price ?? 0))}
                    </td>
                  </tr>
                ))}
                {(!o.line_items || o.line_items.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">No items.</td></tr>
                )}
              </tbody>
              {o.line_items && o.line_items.length > 0 && (
                <tfoot>
                  <tr className="border-t bg-white/5">
                    <td colSpan={3} className="px-4 py-2.5 text-right text-xs text-slate-400">
                      Subtotal · Tax (5%) · Total
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-bold tabular-nums">
                      {formatCurrency(
                        o.line_items.reduce((s, it) => s + (it.quantity ?? 0) * (it.unit_price ?? 0), 0)
                      )}
                      <span className="block text-[11px] font-normal text-slate-400">
                        +5% tax on save
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </GlassPanel>
      )}

      {/* Lab report */}
      {docType === 'LAB_REPORT' && (
        <GlassPanel className="overflow-hidden p-0">
          <div className="border-b border-white/10 bg-white/5 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {LAB_REPORT_LABELS[labReportType]} · AI Parameter Analysis
            </p>
          </div>
          <div className="overflow-x-auto orio-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-400">
                  <th className="px-4 py-2 font-medium">Parameter</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">AI Note</th>
                </tr>
              </thead>
              <tbody>
                {o.parameters_analysis?.map((p, i) => (
                  <tr key={i} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{p.parameter}</td>
                    <td className="px-4 py-2.5 tabular-nums">{p.value}</td>
                    <td className="px-4 py-2.5"><ParamStatus status={p.status} /></td>
                    <td className="px-4 py-2.5 text-slate-400">{p.note}</td>
                  </tr>
                ))}
                {(!o.parameters_analysis || o.parameters_analysis.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">No analysis.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {o.advice && o.advice.length > 0 && (
            <div className="border-t border-white/10 px-4 py-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <Activity className="h-3.5 w-3.5" /> Advisory
              </p>
              <ul className="space-y-1">
                {o.advice.map((a, i) => (
                  <li key={i} className="text-xs text-slate-100/90">• {a}</li>
                ))}
              </ul>
            </div>
          )}
        </GlassPanel>
      )}

      {/* Prescription */}
      {docType === 'PRESCRIPTION' && (
        <GlassPanel className="overflow-hidden p-0">
          <div className="border-b border-white/10 bg-white/5 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Rx · {o.prescription?.length ?? 0} item(s)
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
                {o.prescription?.map((rx, i) => (
                  <tr key={i} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{rx.drug}</td>
                    <td className="px-4 py-2.5 tabular-nums">{rx.dosage}</td>
                    <td className="px-4 py-2.5">{rx.frequency}</td>
                    <td className="px-4 py-2.5">{rx.duration}</td>
                    <td className="px-4 py-2.5 text-slate-400">{rx.notes ?? '—'}</td>
                  </tr>
                ))}
                {(!o.prescription || o.prescription.length === 0) && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">No prescription items.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {o.advice && o.advice.length > 0 && (
            <div className="border-t border-white/10 px-4 py-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <Activity className="h-3.5 w-3.5" /> Patient Advice
              </p>
              <ul className="space-y-1">
                {o.advice.map((a, i) => (
                  <li key={i} className="text-xs text-slate-100/90">• {a}</li>
                ))}
              </ul>
            </div>
          )}
        </GlassPanel>
      )}

      {/* Certificate */}
      {docType === 'CERTIFICATE' && (
        <GlassPanel className="p-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <FileBadge className="h-5 w-5 text-violet-300" />
            <p className="text-sm font-semibold">Medical Certificate — Draft</p>
            <Badge variant="outline" className="ml-auto gap-1 text-[10px]">
              <AlertTriangle className="h-2.5 w-2.5" /> Requires doctor signature
            </Badge>
          </div>
          <div className="mt-3 space-y-3 text-sm">
            <p className="text-slate-100/90">{o.summary}</p>
            {o.treatment_plan && o.treatment_plan.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommended Rest / Recovery</p>
                <ul className="mt-1 space-y-1">
                  {o.treatment_plan.map((p, i) => (
                    <li key={i} className="text-sm">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {o.advice && o.advice.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Certificate Recommendation</p>
                <ul className="mt-1 space-y-1">
                  {o.advice.map((a, i) => (
                    <li key={i} className="text-sm">• {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Limitations */}
      {o.limitations && o.limitations.length > 0 && (
        <GlassPanel variant="subtle" className="p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <AlertTriangle className="h-3.5 w-3.5" /> AI Limitations
          </p>
          <ul className="space-y-1">
            {o.limitations.map((it, i) => (
              <li key={i} className="text-xs text-slate-400">• {it}</li>
            ))}
          </ul>
        </GlassPanel>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────
function PatientPickerInline({
  patients, value, onChange,
}: {
  patients: HubPatient[]
  value: string | null
  onChange: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const selected = patients.find((p) => p.id === value) ?? null
  const [open, setOpen] = useState(false)
  const filtered = patients.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.localId.toLowerCase().includes(q) ||
      (p.chiefComplaint ?? '').toLowerCase().includes(q)
    )
  })
  return (
    <div className="relative">
      <Button
        variant="outline"
        role="combobox"
        className="w-full justify-between font-normal"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <span className="truncate">{selected.fullName}</span>
            <span className="text-[11px] text-slate-400">· {selected.localId}</span>
          </span>
        ) : (
          <span className="text-slate-400">Select patient…</span>
        )}
        <ChevronRight className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-90')} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-popover p-2 shadow-lg">
            <Input
              autoFocus
              placeholder="Search patient…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="mt-2 max-h-60 overflow-y-auto orio-scroll">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">No patient found.</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { onChange(p.id); setOpen(false); setSearch('') }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/5"
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-semibold text-violet-300">
                      {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.fullName}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {p.localId} · {p.age ?? '?'}y · {p.chiefComplaint ?? 'No complaint'}
                      </p>
                    </div>
                    {p.localSummary ? (
                      <Lock className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ShieldAlert className="h-3 w-3 text-red-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TierBadge({ tier }: { tier: number }) {
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

function ParamStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    normal: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    low: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    high: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase', map[status] ?? map.normal)}>
      {status}
    </span>
  )
}

function MiniStat({
  label, value, icon, accent = 'default',
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent?: 'default' | 'emerald' | 'red'
}) {
  const cls = accent === 'emerald'
    ? 'text-emerald-400'
    : accent === 'red'
      ? 'text-red-400'
      : 'text-slate-400'
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <p className={cn('flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide', cls)}>
        {icon} {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  )
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n ?? 0)
}

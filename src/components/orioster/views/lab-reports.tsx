'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { GlassPanel, SectionHeader, DisclaimerChip } from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FlaskConical, Plus, Sparkles, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { LAB_REPORT_TYPES, LAB_REPORT_LABELS } from '@/lib/types'
import { toast } from 'sonner'

interface LabReport {
  id: string
  reportType: string
  parameters: string
  isNormal: boolean | null
  aiFeedback: string | null
  status: string
  createdAt: string
  patient: { id: string; fullName: string; localId: string; age: number | null; gender: string }
  createdByStaff: { id: string; name: string }
}

interface Patient { id: string; fullName: string; localId: string }

// Parameter templates per report type
const PARAM_TEMPLATES: Record<string, Array<{ name: string; unit: string; refLow: number; refHigh: number }>> = {
  CBC: [
    { name: 'Hemoglobin', unit: 'g/dL', refLow: 12, refHigh: 17 },
    { name: 'WBC Count', unit: '10^3/μL', refLow: 4, refHigh: 11 },
    { name: 'Platelet Count', unit: '10^3/μL', refLow: 150, refHigh: 450 },
    { name: 'RBC Count', unit: '10^6/μL', refLow: 4.2, refHigh: 5.9 },
    { name: 'Hematocrit', unit: '%', refLow: 36, refHigh: 50 },
  ],
  LIPID_PANEL: [
    { name: 'Total Cholesterol', unit: 'mg/dL', refLow: 0, refHigh: 200 },
    { name: 'LDL', unit: 'mg/dL', refLow: 0, refHigh: 100 },
    { name: 'HDL', unit: 'mg/dL', refLow: 40, refHigh: 100 },
    { name: 'Triglycerides', unit: 'mg/dL', refLow: 0, refHigh: 150 },
  ],
  LFT: [
    { name: 'ALT', unit: 'U/L', refLow: 7, refHigh: 56 },
    { name: 'AST', unit: 'U/L', refLow: 10, refHigh: 40 },
    { name: 'Bilirubin Total', unit: 'mg/dL', refLow: 0.1, refHigh: 1.2 },
    { name: 'Alk Phosphatase', unit: 'U/L', refLow: 44, refHigh: 147 },
  ],
  RFT: [
    { name: 'Urea', unit: 'mg/dL', refLow: 7, refHigh: 20 },
    { name: 'Creatinine', unit: 'mg/dL', refLow: 0.6, refHigh: 1.2 },
    { name: 'Uric Acid', unit: 'mg/dL', refLow: 3.4, refHigh: 7.0 },
  ],
  BLOOD_GLUCOSE: [
    { name: 'Fasting Glucose', unit: 'mg/dL', refLow: 70, refHigh: 100 },
    { name: 'Postprandial Glucose', unit: 'mg/dL', refLow: 0, refHigh: 140 },
    { name: 'HbA1c', unit: '%', refLow: 4, refHigh: 5.7 },
  ],
  URINALYSIS: [
    { name: 'pH', unit: '', refLow: 4.5, refHigh: 8 },
    { name: 'Specific Gravity', unit: '', refLow: 1.005, refHigh: 1.03 },
    { name: 'Protein', unit: 'mg/dL', refLow: 0, refHigh: 0 },
    { name: 'Glucose', unit: 'mg/dL', refLow: 0, refHigh: 0 },
  ],
  THYROID: [
    { name: 'TSH', unit: 'mIU/L', refLow: 0.4, refHigh: 4.0 },
    { name: 'T3', unit: 'ng/dL', refLow: 80, refHigh: 200 },
    { name: 'T4', unit: 'μg/dL', refLow: 5.1, refHigh: 11.9 },
  ],
}

export function LabReportsView() {
  const { user, setActivePatient, setView } = useAppStore()
  const [reports, setReports] = useState<LabReport[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [reportType, setReportType] = useState<string>('CBC')
  const [selectedPatient, setSelectedPatient] = useState('')
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [analyzing, setAnalyzing] = useState(false)

  const fetchReports = () => {
    setLoading(true)
    fetch('/api/lab-reports')
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    if (open) {
      fetch('/api/patients?limit=200').then((r) => r.json()).then((d) => setPatients(d.patients ?? []))
    }
  }, [open])

  async function createAndAnalyze() {
    if (!selectedPatient) {
      toast.error('Select a patient')
      return
    }
    const template = PARAM_TEMPLATES[reportType] ?? []
    const params = template.map((t) => {
      const val = parseFloat(paramValues[t.name] ?? '0')
      let status: 'normal' | 'low' | 'high' = 'normal'
      if (val < t.refLow) status = 'low'
      else if (val > t.refHigh) status = 'high'
      return { name: t.name, value: paramValues[t.name] ?? '0', unit: t.unit, refRange: `${t.refLow}-${t.refHigh}`, status }
    })

    setAnalyzing(true)
    try {
      // 1. Save the lab report
      const res = await fetch('/api/lab-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          reportType,
          parameters: params,
          createdBy: user?.id,
        }),
      })
      if (!res.ok) throw new Error('Failed to save report')
      const { report } = await res.json()

      // 2. Run AI analysis (advisory)
      const summaryText = `Lab Report: ${LAB_REPORT_LABELS[reportType]}. Parameters: ${params.map((p) => `${p.name}=${p.value}${p.unit} (ref ${p.refRange}, ${p.status})`).join('; ')}. Patient: ${report.patient.fullName}, ${report.patient.age}y ${report.patient.gender}.`

      try {
        const aiRes = await fetch('/api/orio-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: selectedPatient, task: 'LAB_ANALYSIS', customSummary: summaryText }),
        })
        const aiData = await aiRes.json()
        if (aiRes.ok && aiData.output) {
          await fetch('/api/lab-reports', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: report.id, aiFeedback: JSON.stringify(aiData.output) }),
          })
          toast.success('Lab report generated & AI analysis complete')
        } else {
          toast.success('Lab report generated (AI analysis requires Step 8 summary)')
        }
      } catch {
        toast.success('Lab report generated (AI analysis unavailable)')
      }

      setOpen(false)
      setParamValues({})
      setSelectedPatient('')
      fetchReports()
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setAnalyzing(false)
    }
  }

  const template = PARAM_TEMPLATES[reportType] ?? []

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Lab Reports"
        subtitle={`${reports.length} reports · AI analysis is advisory only`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Lab Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Patient</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger className="mt-1">
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
                    <Label className="text-xs">Report Type</Label>
                    <Select value={reportType} onValueChange={(v) => { setReportType(v); setParamValues({}) }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LAB_REPORT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {LAB_REPORT_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Enter parameter values (ref range shown):</p>
                  <div className="space-y-2">
                    {template.map((t) => (
                      <div key={t.name} className="grid grid-cols-[1fr_120px_100px] items-center gap-2">
                        <div>
                          <span className="text-sm font-medium">{t.name}</span>
                          <span className="ml-1 text-[11px] text-muted-foreground">ref {t.refLow}-{t.refHigh} {t.unit}</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Value"
                          value={paramValues[t.name] ?? ''}
                          onChange={(e) => setParamValues((v) => ({ ...v, [t.name]: e.target.value }))}
                          className="h-8 text-sm"
                        />
                        <span className="text-[11px] text-muted-foreground">{t.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  AI will analyze the parameters and provide advisory feedback after saving.
                </div>

                <Button onClick={createAndAnalyze} disabled={analyzing} className="w-full gap-2">
                  {analyzing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating & Analyzing...</>
                  ) : (
                    <><FlaskConical className="h-4 w-4" /> Generate Report & Analyze</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <FlaskConical className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No lab reports</p>
            <p className="text-sm text-muted-foreground">Generate a new report to get started.</p>
          </div>
        </GlassPanel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map((r) => {
            let params: Array<{ name: string; value: string; unit: string; refRange: string; status: string }> = []
            try { params = JSON.parse(r.parameters) } catch { /* */ }
            let aiFeedback: { summary?: string; parameters_analysis?: Array<{ parameter: string; value: string; status: string; note: string }>; advice?: string[] } | null = null
            if (r.aiFeedback) {
              try { aiFeedback = JSON.parse(r.aiFeedback) } catch { /* */ }
            }
            return (
              <GlassPanel key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{LAB_REPORT_LABELS[r.reportType] ?? r.reportType}</span>
                    </div>
                    <button
                      onClick={() => { setActivePatient(r.patient.id); setView('patient-detail') }}
                      className="mt-0.5 text-left text-sm hover:underline"
                    >
                      {r.patient.fullName} · {r.patient.age ?? '?'}y {r.patient.gender.toLowerCase()}
                    </button>
                  </div>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    r.isNormal ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  )}>
                    {r.isNormal ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {r.isNormal ? 'Normal' : 'Abnormal'}
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto orio-scroll">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-1 font-medium">Parameter</th>
                        <th className="pb-1 font-medium">Value</th>
                        <th className="pb-1 font-medium">Ref</th>
                        <th className="pb-1 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {params.map((p, i) => (
                        <tr key={i} className="border-b border-border/30 last:border-0">
                          <td className="py-1.5 font-medium">{p.name}</td>
                          <td className="py-1.5">{p.value} {p.unit}</td>
                          <td className="py-1.5 text-muted-foreground">{p.refRange}</td>
                          <td className="py-1.5">
                            {p.status === 'normal' && <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 text-[10px]">N</Badge>}
                            {p.status === 'low' && <Badge variant="outline" className="border-amber-500/30 text-amber-600 text-[10px]">L</Badge>}
                            {p.status === 'high' && <Badge variant="outline" className="border-red-500/30 text-red-600 text-[10px]">H</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {aiFeedback && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Advisory Analysis
                    </div>
                    {aiFeedback.summary && <p className="mt-1 text-xs">{aiFeedback.summary}</p>}
                    {aiFeedback.advice && aiFeedback.advice.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
                        {aiFeedback.advice.slice(0, 3).map((a, i) => (
                          <li key={i}>• {a}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2">
                      <DisclaimerChip />
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>By {r.createdByStaff.name}</span>
                  <span>{format(new Date(r.createdAt), 'MMM d, h:mm a')}</span>
                </div>
              </GlassPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}

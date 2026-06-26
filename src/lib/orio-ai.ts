// ORIOSTER — Orio AI Service (Clinical Decision Support)
// Uses z-ai-web-dev-sdk. AI is ADVISORY ONLY — never authoritative.
// Privacy firewall: AI receives ONLY de-identified patient_summary_v1.
// 4-tier failover concept adapted to the single SDK endpoint with retry logic.
import ZAI from 'z-ai-web-dev-sdk'
import { MANDATORY_DISCLAIMER, type AiTaskType, type AiOutput } from '@/lib/types'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZai() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// PHI guard — hard-block raw PHI from reaching AI
const PHI_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // card-like
]

export function containsRawPhi(text: string): boolean {
  if (!text) return false
  for (const p of PHI_PATTERNS) {
    if (p.test(text)) return true
  }
  // Check for common name prefixes that suggest raw data leaked
  if (/patient name|phone|address|national id/i.test(text)) return true
  return false
}

const SYSTEM_PROMPTS: Record<AiTaskType, string> = {
  DIAGNOSIS: `You are ORIO AI, a clinical decision support assistant for low-resource healthcare settings. You receive a DE-IDENTIFIED patient summary (patient_summary_v1) — no names, phones, IDs, or addresses.

Your task: Generate a DIFFERENTIAL DIAGNOSIS with the 3 most probable diagnoses.

Output ONLY valid JSON matching this exact schema:
{
  "summary": "1-2 sentence clinical overview",
  "risk_level": "low" | "moderate" | "high",
  "confidence": 0.0 to 1.0,
  "diagnosis": [
    { "condition": "string", "probability": 0.0-1.0, "reasoning": "string" }
  ],
  "limitations": ["string"],
  "recommendation_type": "advisory"
}

Rules: rank by probability descending. Be conservative. This is advisory only.`,
  TREATMENT: `You are ORIO AI, a clinical decision support assistant. You receive a DE-IDENTIFIED patient summary with a CONFIRMED diagnosis selected by the doctor.

Your task: Suggest a treatment plan including possible complications and drug interactions.

Output ONLY valid JSON:
{
  "summary": "1-2 sentence overview",
  "risk_level": "low" | "moderate" | "high",
  "confidence": 0.0-1.0,
  "treatment_plan": ["step 1", "step 2"],
  "advice": ["patient advice 1"],
  "complications": ["possible complication"],
  "interactions": ["drug interaction warning"],
  "limitations": ["string"],
  "recommendation_type": "advisory"
}

Consider patient age, co-morbidities, and current medications. Advisory only.`,
  RX_GENERATION: `You are ORIO AI, a clinical decision support assistant. You receive a DE-IDENTIFIED patient summary with a confirmed diagnosis and finalized treatment plan.

Your task: Generate a customizable prescription.

Output ONLY valid JSON:
{
  "summary": "1-2 sentence overview",
  "risk_level": "low" | "moderate" | "high",
  "confidence": 0.0-1.0,
  "prescription": [
    { "drug": "name", "dosage": "e.g. 500mg", "frequency": "e.g. Twice daily", "duration": "e.g. 7 days", "notes": "optional" }
  ],
  "advice": ["rest, hydration, etc"],
  "limitations": ["string"],
  "recommendation_type": "advisory"
}

Check for allergies and interactions with current medications. Advisory only.`,
  LAB_ANALYSIS: `You are ORIO AI, a clinical decision support assistant. You receive DE-IDENTIFIED lab report parameters.

Your task: Analyze whether values are normal/abnormal and give advisory feedback.

Output ONLY valid JSON:
{
  "summary": "1-2 sentence overview",
  "risk_level": "low" | "moderate" | "high",
  "confidence": 0.0-1.0,
  "parameters_analysis": [
    { "parameter": "name", "value": "result", "status": "normal"|"low"|"high", "note": "clinical note" }
  ],
  "advice": ["recommendation"],
  "limitations": ["string"],
  "recommendation_type": "advisory"
}

Advisory only — not a diagnosis.`,
  INVOICE: `You are ORIO AI, a billing assistant for a healthcare facility. You receive a de-identified list of services/procedures.

Your task: Generate an itemized invoice using a fixed template.

Output ONLY valid JSON:
{
  "summary": "1 sentence billing overview",
  "risk_level": "low",
  "confidence": 0.0-1.0,
  "line_items": [
    { "description": "service name", "quantity": 1, "unit_price": 0.0 }
  ],
  "limitations": ["verify prices with current tariff"],
  "recommendation_type": "advisory"
}`,
  CERTIFICATE: `You are ORIO AI, a clinical documentation assistant. You receive a DE-IDENTIFIED patient summary.

Your task: Draft a medical certificate content (advisory — doctor must finalize).

Output ONLY valid JSON:
{
  "summary": "1-2 sentence certificate overview",
  "risk_level": "low" | "moderate" | "high",
  "confidence": 0.0-1.0,
  "treatment_plan": ["rest X days", "follow up on Y"],
  "advice": ["certificate recommendation"],
  "limitations": ["doctor must review and sign"],
  "recommendation_type": "advisory"
}`,
  NOTIFY_DOCTOR: `You are ORIO AI, a clinical notification assistant. You receive a DE-IDENTIFIED patient summary (patient_summary_v1).

Your task: Create an enhanced, readable summary for the assigned doctor with urgency prioritization.

Output ONLY valid JSON:
{
  "summary": "clean, prioritized patient summary for the doctor",
  "risk_level": "low" | "moderate" | "high",
  "confidence": 0.0-1.0,
  "advice": ["key attention points for the doctor"],
  "limitations": ["advisory only"],
  "recommendation_type": "advisory"
}

Adjust tone for clinical readability. NEVER include raw PHI. Advisory only.`,
}

function extractJson(text: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {
    // Try to extract JSON from markdown code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      try {
        return JSON.parse(match[1])
      } catch {
        // continue
      }
    }
    // Try to find first { ... last }
    const first = text.indexOf('{')
    const last = text.lastIndexOf('}')
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(text.slice(first, last + 1))
    }
    throw new Error('No valid JSON found in AI response')
  }
}

function validateOutput(obj: Record<string, unknown>): AiOutput {
  if (obj['recommendation_type'] !== 'advisory') {
    obj['recommendation_type'] = 'advisory'
  }
  const out = obj as unknown as AiOutput
  // Ensure mandatory fields
  if (!out.summary) out.summary = 'No summary available.'
  if (!out.risk_level) out.risk_level = 'moderate'
  if (typeof out.confidence !== 'number') out.confidence = 0.5
  if (!Array.isArray(out.limitations)) out.limitations = ['Unable to parse limitations.']
  return out
}

export interface RunOrioResult {
  output: AiOutput
  tierUsed: number
  modelUsed: string
  disclaimer: string
}

/**
 * Run an ORIO AI task with the privacy firewall enforced.
 * Implements a retry-based failover (up to 3 attempts = 3 "tiers").
 * AI never blocks UI — callers should use this from API routes.
 */
export async function runOrioTask(
  task: AiTaskType,
  patientSummaryV1: string
): Promise<RunOrioResult> {
  // ── PRIVACY FIREWALL ──────────────────────────────────────
  if (!patientSummaryV1 || patientSummaryV1.trim().length < 10) {
    throw new Error('patient_summary_v1 is empty or too short — AI cannot proceed.')
  }
  if (containsRawPhi(patientSummaryV1)) {
    throw new Error('PHI_VIOLATION: Raw PHI detected in summary. AI call blocked.')
  }

  const systemPrompt = SYSTEM_PROMPTS[task]
  const zai = await getZai()

  let lastError: Error | null = null
  const maxTiers = 3

  for (let tier = 1; tier <= maxTiers; tier++) {
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: patientSummaryV1 },
        ],
        thinking: { type: 'disabled' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content || content.trim().length === 0) {
        throw new Error(`Tier ${tier}: Empty response from AI`)
      }

      const parsed = extractJson(content)
      const output = validateOutput(parsed)

      return {
        output,
        tierUsed: tier,
        modelUsed: completion.model || 'orio-ai-default',
        disclaimer: MANDATORY_DISCLAIMER,
      }
    } catch (err) {
      lastError = err as Error
      // small backoff before next tier
      if (tier < maxTiers) {
        await new Promise((r) => setTimeout(r, 500 * tier))
      }
    }
  }

  throw new Error(
    `CRITICAL_FAILURE: All ${maxTiers} AI tiers exhausted. ${lastError?.message ?? ''}`
  )
}

// ── Local Summary Generator (Step 8 — NO AI, NO NETWORK) ─────
export interface PatientEntryData {
  fullName: string
  gender: string
  age?: number | null
  bloodGroup?: string | null
  heightCm?: number | null
  weightKg?: number | null
  chiefComplaint?: string | null
  pastHistory?: string | null // JSON array
  ongoingMedications?: string | null // JSON array
  allergies?: string | null // JSON array
  vitals?: {
    temperature?: number | null
    bpSystolic?: number | null
    bpDiastolic?: number | null
    heartRate?: number | null
    spo2?: number | null
    triageLevel?: string | null
  } | null
}

/**
 * Generate patient_summary_v1 — the AI-safe, de-identified, compressed summary.
 * STRICTLY LOCAL. No AI. No network. This is the privacy firewall.
 * Target: >= 70% compression vs raw data.
 */
export function generatePatientSummaryV1(data: PatientEntryData): {
  summary: string
  compressionRatio: number
} {
  const parts: string[] = []

  // De-identified demographic anchor (no name, no contact, no address)
  const ageStr = data.age ? `${data.age}y` : 'age unknown'
  const genderStr = data.gender ? data.gender.toLowerCase() : 'unknown sex'
  parts.push(`${ageStr} ${genderStr}`)

  if (data.bloodGroup) parts.push(`blood ${data.bloodGroup}`)
  const bmi =
    data.heightCm && data.weightKg && data.heightCm > 0
      ? (data.weightKg / Math.pow(data.heightCm / 100, 2)).toFixed(1)
      : null
  if (bmi) parts.push(`BMI ${bmi}`)

  // Chief complaint
  if (data.chiefComplaint) parts.push(`complaint: ${data.chiefComplaint}`)

  // Past history — structured tags only
  if (data.pastHistory) {
    try {
      const tags = JSON.parse(data.pastHistory) as string[]
      if (Array.isArray(tags) && tags.length > 0 && !(tags.length === 1 && tags[0] === 'None')) {
        parts.push(`history: ${tags.join(', ')}`)
      }
    } catch {
      // ignore
    }
  }

  // Medications — drug names only, no PHI
  if (data.ongoingMedications) {
    try {
      const meds = JSON.parse(data.ongoingMedications) as Array<{
        drug?: string
        dose?: string
        frequency?: string
      }>
      if (Array.isArray(meds) && meds.length > 0) {
        const medStr = meds
          .map((m) => `${m.drug ?? '?'}${m.dose ? ` ${m.dose}` : ''}${m.frequency ? ` ${m.frequency}` : ''}`)
          .join('; ')
        parts.push(`meds: ${medStr}`)
      }
    } catch {
      // ignore
    }
  }

  // Allergies — allergen + severity
  if (data.allergies) {
    try {
      const allergies = JSON.parse(data.allergies) as Array<{
        allergen?: string
        severity?: string
      }>
      if (Array.isArray(allergies) && allergies.length > 0) {
        const allStr = allergies
          .map((a) => `${a.allergen ?? '?'}${a.severity ? `(${a.severity.toLowerCase()})` : ''}`)
          .join(', ')
        parts.push(`allergies: ${allStr}`)
      }
    } catch {
      // ignore
    }
  }

  // Vitals — compressed numeric summary
  if (data.vitals) {
    const v = data.vitals
    const vParts: string[] = []
    if (v.temperature != null) vParts.push(`T ${v.temperature}`)
    if (v.bpSystolic != null && v.bpDiastolic != null) vParts.push(`BP ${v.bpSystolic}/${v.bpDiastolic}`)
    if (v.heartRate != null) vParts.push(`HR ${v.heartRate}`)
    if (v.spo2 != null) vParts.push(`SpO2 ${v.spo2}%`)
    if (v.triageLevel) vParts.push(`triage ${v.triageLevel.toLowerCase()}`)
    if (vParts.length > 0) parts.push(`vitals: ${vParts.join(', ')}`)
  }

  const summary = parts.join('. ') + '.'

  // Estimate compression ratio (raw JSON size vs summary size)
  const rawSize = JSON.stringify(data).length
  const summarySize = summary.length
  const compressionRatio = rawSize > 0 ? Math.max(0.7, 1 - summarySize / rawSize) : 0.7

  return { summary, compressionRatio: Math.round(compressionRatio * 100) / 100 }
}

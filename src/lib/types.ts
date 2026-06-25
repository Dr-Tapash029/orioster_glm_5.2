// ORIOSTER — Core domain types & constants

export type AppRole = 'DOCTOR' | 'NURSE' | 'ADMIN' | 'LAB_TECH'

export const ROLE_LABELS: Record<AppRole, string> = {
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  ADMIN: 'Administrator',
  LAB_TECH: 'Lab Technician',
}

export const ROLE_CODES: Record<AppRole, string> = {
  DOCTOR: 'DOC',
  NURSE: 'NUR',
  ADMIN: 'ADM',
  LAB_TECH: 'LAB',
}

export type SyncStatus = 'DRAFT' | 'QUEUED' | 'SYNCED' | 'CONFLICT'

export type TriageLevel = 'GREEN' | 'YELLOW' | 'RED'

export type RiskLevel = 'low' | 'moderate' | 'high'

export type AiTaskType =
  | 'DIAGNOSIS'
  | 'TREATMENT'
  | 'RX_GENERATION'
  | 'LAB_ANALYSIS'
  | 'INVOICE'
  | 'CERTIFICATE'
  | 'NOTIFY_DOCTOR'

export const AI_TASK_LABELS: Record<AiTaskType, string> = {
  DIAGNOSIS: 'Differential Diagnosis',
  TREATMENT: 'Treatment Plan',
  RX_GENERATION: 'Prescription Generation',
  LAB_ANALYSIS: 'Lab Report Analysis',
  INVOICE: 'Invoice Generation',
  CERTIFICATE: 'Medical Certificate',
  NOTIFY_DOCTOR: 'Doctor Notification',
}

// 10-step patient entry wizard
export const WIZARD_STEPS = [
  { id: 1, key: 'general', title: 'General Information', short: 'General' },
  { id: 2, key: 'complaint', title: 'Chief Complaint', short: 'Complaint' },
  { id: 3, key: 'history', title: 'Past History', short: 'History' },
  { id: 4, key: 'medications', title: 'Ongoing Medications', short: 'Meds' },
  { id: 5, key: 'vitals', title: 'Vitals', short: 'Vitals' },
  { id: 6, key: 'allergies', title: 'Hypersensitivity', short: 'Allergies' },
  { id: 7, key: 'doctor', title: 'Assign Doctor', short: 'Doctor' },
  { id: 8, key: 'summary', title: 'Local Summary', short: 'Summary' },
  { id: 9, key: 'notify', title: 'Notify Doctor', short: 'Notify' },
  { id: 10, key: 'review', title: 'Review & Submit', short: 'Submit' },
] as const

export const MANDATORY_DISCLAIMER =
  'This output is not a diagnosis and must be reviewed by a human professional.'

export const CHIEF_COMPLAINTS = [
  'Fever',
  'Cough',
  'Headache',
  'Abdominal pain',
  'Chest pain',
  'Shortness of breath',
  'Diarrhea',
  'Vomiting',
  'Body ache',
  'Joint pain',
  'Skin rash',
  'Wound / injury',
  'Weakness / fatigue',
  'Dizziness',
  'Pregnancy check-up',
  'Hypertension follow-up',
  'Diabetes follow-up',
  'Eye problem',
  'Dental problem',
  'Other',
]

export const PAST_HISTORY_TAGS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart disease',
  'Kidney disease',
  'Liver disease',
  'Tuberculosis',
  'Thyroid disorder',
  'Previous surgery',
  'Smoker',
  'Alcohol use',
  'None',
]

export const COMMON_MEDICATIONS = [
  'Metformin',
  'Amlodipine',
  'Atorvastatin',
  'Aspirin',
  'Paracetamol',
  'Omeprazole',
  'Salbutamol',
  'Insulin',
  'Losartan',
  'Amoxicillin',
  'Ibuprofen',
  'Cetirizine',
]

export const ALLERGY_SEVERITIES = ['Mild', 'Moderate', 'Severe'] as const

export const LAB_REPORT_TYPES = [
  'CBC',
  'LIPID_PANEL',
  'LFT',
  'RFT',
  'BLOOD_GLUCOSE',
  'URINALYSIS',
  'THYROID',
] as const

export const LAB_REPORT_LABELS: Record<string, string> = {
  CBC: 'Complete Blood Count (CBC)',
  LIPID_PANEL: 'Lipid Panel',
  LFT: 'Liver Function Test',
  RFT: 'Renal Function Test',
  BLOOD_GLUCOSE: 'Blood Glucose',
  URINALYSIS: 'Urinalysis',
  THYROID: 'Thyroid Profile',
}

export interface AiOutput {
  summary: string
  risk_level: RiskLevel
  confidence: number
  limitations: string[]
  recommendation_type: 'advisory'
  diagnosis?: Array<{
    condition: string
    probability: number
    reasoning: string
  }>
  treatment_plan?: string[]
  prescription?: Array<{
    drug: string
    dosage: string
    frequency: string
    duration: string
    notes?: string
  }>
  advice?: string[]
  complications?: string[]
  interactions?: string[]
  parameters_analysis?: Array<{
    parameter: string
    value: string
    status: 'normal' | 'low' | 'high'
    note: string
  }>
  line_items?: Array<{ description: string; quantity: number; unit_price: number }>,
}

// Local triage logic — no AI, pure clinical rules
export function computeTriageLevel(v: {
  bpSystolic?: number | null
  bpDiastolic?: number | null
  heartRate?: number | null
  temperature?: number | null
  spo2?: number | null
}): TriageLevel {
  let score = 0
  if (v.bpSystolic != null && (v.bpSystolic >= 180 || v.bpSystolic <= 90)) score += 2
  else if (v.bpSystolic != null && (v.bpSystolic >= 140 || v.bpSystolic <= 100)) score += 1
  if (v.bpDiastolic != null && (v.bpDiastolic >= 120 || v.bpDiastolic <= 60)) score += 2
  else if (v.bpDiastolic != null && (v.bpDiastolic >= 90 || v.bpDiastolic <= 70)) score += 1
  if (v.heartRate != null && (v.heartRate >= 120 || v.heartRate <= 50)) score += 2
  else if (v.heartRate != null && (v.heartRate >= 100 || v.heartRate <= 55)) score += 1
  if (v.temperature != null && (v.temperature >= 39.5 || v.temperature <= 35)) score += 2
  else if (v.temperature != null && (v.temperature >= 38.5 || v.temperature <= 36)) score += 1
  if (v.spo2 != null && v.spo2 <= 90) score += 2
  else if (v.spo2 != null && v.spo2 <= 94) score += 1

  if (score >= 4) return 'RED'
  if (score >= 2) return 'YELLOW'
  return 'GREEN'
}

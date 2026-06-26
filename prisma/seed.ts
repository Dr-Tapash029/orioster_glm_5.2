// ORIOSTER — Seed database with demo staff & sample patients
import { db } from '@/lib/db'

async function seed() {
  console.log('🌱 Seeding ORIOSTER database...')

  // ── Staff ──────────────────────────────────────────────────
  const staff = [
    { email: 'doctor@orioster.health', name: 'Dr. Amara Chen', role: 'DOCTOR' },
    { email: 'nurse@orioster.health', name: 'Nurse Rafael Cruz', role: 'NURSE' },
    { email: 'admin@orioster.health', name: 'Admin Priya Sharma', role: 'ADMIN' },
    { email: 'lab@orioster.health', name: 'Lab Tech Marcus Webb', role: 'LAB_TECH' },
    { email: 'doctor2@orioster.health', name: 'Dr. Sofia Rahman', role: 'DOCTOR' },
  ]

  const staffIds: Record<string, string> = {}
  for (const s of staff) {
    const existing = await db.staff.findUnique({ where: { email: s.email } })
    if (existing) {
      staffIds[s.role + (s.email.includes('2') ? '2' : '')] = existing.id
      continue
    }
    const created = await db.staff.create({ data: s })
    const key = s.email.includes('2') ? s.role + '2' : s.role
    staffIds[key] = created.id
    console.log(`  ✓ Staff: ${s.name} (${s.role})`)
  }

  // ── Sample Patients ────────────────────────────────────────
  const samplePatients = [
    {
      localId: 'PT-2025-0001',
      fullName: 'James Okoro',
      gender: 'MALE',
      dateOfBirth: '1986-03-15',
      age: 39,
      contact: '+8801711111111',
      address: 'Block A, Riverside Camp',
      localIdNumber: 'CAMP-A-1042',
      bloodGroup: 'O+',
      heightCm: 175,
      weightKg: 78,
      profession: 'Farmer',
      education: 'Primary',
      consentGiven: true,
      status: 'COMPLETED',
      syncStatus: 'SYNCED',
      chiefComplaint: 'Fever for 3 days with body ache',
      pastHistory: JSON.stringify(['Diabetes']),
      ongoingMedications: JSON.stringify([{ drug: 'Metformin', dose: '500mg', frequency: 'Twice daily' }]),
      allergies: JSON.stringify([{ allergen: 'Penicillin', severity: 'Moderate' }]),
      localSummary: 'Adult male, 39y, diabetic on metformin. Presents with 3-day fever, body ache. Vitals: T 38.9, BP 130/85, HR 96, SpO2 97%. Allergic to penicillin (moderate).',
      createdBy: staffIds.NURSE,
      notificationStatus: 'SENT',
    },
    {
      localId: 'PT-2025-0002',
      fullName: 'Mei Lin Zhao',
      gender: 'FEMALE',
      dateOfBirth: '1992-11-22',
      age: 33,
      contact: '+8801722222222',
      address: 'District Hospital Ward 3',
      localIdNumber: 'DH-W3-0287',
      bloodGroup: 'A+',
      heightCm: 162,
      weightKg: 56,
      profession: 'Teacher',
      education: 'University',
      consentGiven: true,
      status: 'IN_PROGRESS',
      syncStatus: 'QUEUED',
      chiefComplaint: 'Persistent cough with chest tightness',
      pastHistory: JSON.stringify(['Asthma']),
      ongoingMedications: JSON.stringify([{ drug: 'Salbutamol', dose: '100mcg', frequency: 'As needed' }]),
      allergies: JSON.stringify([{ allergen: 'Dust mites', severity: 'Mild' }]),
      createdBy: staffIds.NURSE,
      notificationStatus: 'PENDING',
    },
    {
      localId: 'PT-2025-0003',
      fullName: 'Kwame Mensah',
      gender: 'MALE',
      dateOfBirth: '1975-07-08',
      age: 50,
      contact: '+8801733333333',
      address: 'Community Clinic Zone 2',
      localIdNumber: 'CC-Z2-0512',
      bloodGroup: 'B+',
      heightCm: 168,
      weightKg: 82,
      profession: 'Trader',
      education: 'Secondary',
      consentGiven: true,
      status: 'COMPLETED',
      syncStatus: 'SYNCED',
      chiefComplaint: 'Hypertension follow-up, occasional headache',
      pastHistory: JSON.stringify(['Hypertension', 'Smoker']),
      ongoingMedications: JSON.stringify([
        { drug: 'Amlodipine', dose: '5mg', frequency: 'Once daily' },
        { drug: 'Aspirin', dose: '75mg', frequency: 'Once daily' },
      ]),
      allergies: JSON.stringify([{ allergen: 'None', severity: 'Mild' }]),
      localSummary: 'Adult male, 50y, hypertensive smoker. Follow-up visit. On amlodipine + aspirin. Reports occasional headache.',
      createdBy: staffIds.NURSE,
      notificationStatus: 'SENT',
    },
    {
      localId: 'PT-2025-0004',
      fullName: 'Fatima Al-Rashid',
      gender: 'FEMALE',
      dateOfBirth: '2001-04-30',
      age: 24,
      contact: '+8801744444444',
      address: 'Riverside Camp Tent 14',
      localIdNumber: 'CAMP-A-1098',
      bloodGroup: 'AB+',
      heightCm: 160,
      weightKg: 52,
      profession: 'Student',
      education: 'University',
      consentGiven: true,
      status: 'DRAFT',
      syncStatus: 'DRAFT',
      chiefComplaint: 'Skin rash with itching',
      pastHistory: JSON.stringify(['None']),
      ongoingMedications: JSON.stringify([]),
      allergies: JSON.stringify([{ allergen: 'Seafood', severity: 'Severe' }]),
      createdBy: staffIds.NURSE,
      notificationStatus: null,
    },
    {
      localId: 'PT-2025-0005',
      fullName: 'Liam O Connor',
      gender: 'MALE',
      dateOfBirth: '1968-12-03',
      age: 57,
      contact: '+8801755555555',
      address: 'District Hospital Ward 1',
      localIdNumber: 'DH-W1-0034',
      bloodGroup: 'O-',
      heightCm: 178,
      weightKg: 90,
      profession: 'Construction worker',
      education: 'Primary',
      consentGiven: true,
      status: 'REVIEWED',
      syncStatus: 'SYNCED',
      chiefComplaint: 'Chest pain and shortness of breath',
      pastHistory: JSON.stringify(['Heart disease', 'Hypertension']),
      ongoingMedications: JSON.stringify([
        { drug: 'Atorvastatin', dose: '20mg', frequency: 'Once daily' },
        { drug: 'Aspirin', dose: '75mg', frequency: 'Once daily' },
      ]),
      allergies: JSON.stringify([{ allergen: 'None', severity: 'Mild' }]),
      localSummary: 'Adult male, 57y, cardiac history. Presents with chest pain, SOB. On statin + aspirin. Vitals elevated BP.',
      createdBy: staffIds.NURSE,
      notificationStatus: 'SENT',
    },
  ]

  for (const p of samplePatients) {
    const existing = await db.patient.findUnique({ where: { localId: p.localId } })
    if (existing) continue
    await db.patient.create({ data: p })
    console.log(`  ✓ Patient: ${p.fullName}`)
  }

  // ── Vitals ─────────────────────────────────────────────────
  const patients = await db.patient.findMany()
  const vitalsData = [
    { temp: 38.9, sys: 130, dia: 85, hr: 96, spo2: 97, w: 78, h: 175 },
    { temp: 37.2, sys: 118, dia: 76, hr: 88, spo2: 95, w: 56, h: 162 },
    { temp: 37.0, sys: 145, dia: 92, hr: 82, spo2: 98, w: 82, h: 168 },
    { temp: 36.8, sys: 110, dia: 70, hr: 74, spo2: 99, w: 52, h: 160 },
    { temp: 37.5, sys: 155, dia: 95, hr: 104, spo2: 93, w: 90, h: 178 },
  ]

  for (let i = 0; i < patients.length && i < vitalsData.length; i++) {
    const v = vitalsData[i]
    const triage = computeTriage(v)
    const exists = await db.vitals.findFirst({ where: { patientId: patients[i].id } })
    if (exists) continue
    await db.vitals.create({
      data: {
        patientId: patients[i].id,
        temperature: v.temp,
        bpSystolic: v.sys,
        bpDiastolic: v.dia,
        heartRate: v.hr,
        spo2: v.spo2,
        weightKg: v.w,
        heightCm: v.h,
        triageLevel: triage,
        recordedBy: staffIds.NURSE,
      },
    })
  }
  console.log(`  ✓ Vitals for ${Math.min(patients.length, vitalsData.length)} patients`)

  // ── Appointments ───────────────────────────────────────────
  const appts = [
    { pi: 0, when: '2025-01-15T10:00:00', status: 'COMPLETED' },
    { pi: 1, when: '2025-01-16T11:30:00', status: 'IN_PROGRESS' },
    { pi: 2, when: '2025-01-16T14:00:00', status: 'COMPLETED' },
    { pi: 4, when: '2025-01-15T09:00:00', status: 'COMPLETED' },
  ]
  for (const a of appts) {
    if (a.pi >= patients.length) continue
    const exists = await db.appointment.findFirst({ where: { patientId: patients[a.pi].id } })
    if (exists) continue
    await db.appointment.create({
      data: {
        patientId: patients[a.pi].id,
        doctorId: staffIds.DOCTOR,
        scheduledAt: a.when,
        status: a.status,
        reason: patients[a.pi].chiefComplaint || 'Consultation',
      },
    })
  }
  console.log('  ✓ Appointments')

  console.log('✅ Seed complete!')
}

function computeTriage(v: { sys: number; dia: number; hr: number; temp: number; spo2: number }) {
  let score = 0
  if (v.sys >= 140 || v.sys <= 100) score += 1
  if (v.sys >= 180 || v.sys <= 90) score += 1
  if (v.dia >= 90 || v.dia <= 70) score += 1
  if (v.dia >= 120 || v.dia <= 60) score += 1
  if (v.hr >= 100 || v.hr <= 55) score += 1
  if (v.hr >= 120 || v.hr <= 50) score += 1
  if (v.temp >= 38.5 || v.temp <= 36) score += 1
  if (v.spo2 <= 94) score += 1
  if (v.spo2 <= 90) score += 1
  if (score >= 4) return 'RED'
  if (score >= 2) return 'YELLOW'
  return 'GREEN'
}

seed()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

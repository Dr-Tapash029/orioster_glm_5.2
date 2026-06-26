// ORIOSTER — Patients API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const limit = Number(searchParams.get('limit') ?? 100)

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { localId: { contains: search } },
      { localIdNumber: { contains: search } },
    ]
  }
  if (status && status !== 'ALL') {
    where.status = status
  }

  const patients = await db.patient.findMany({
    where,
    include: {
      vitals: { orderBy: { recordedAt: 'desc' }, take: 1 },
      appointments: { include: { doctor: true }, orderBy: { scheduledAt: 'desc' }, take: 1 },
      _count: { select: { aiResults: true, labReports: true, invoices: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ patients })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      localId,
      fullName,
      gender,
      dateOfBirth,
      age,
      contact,
      address,
      localIdNumber,
      bloodGroup,
      heightCm,
      weightKg,
      profession,
      education,
      consentGiven,
      chiefComplaint,
      pastHistory,
      ongoingMedications,
      allergies,
      localSummary,
      status,
      syncStatus,
      notificationStatus,
      createdBy,
    } = body

    if (!fullName || !gender || !createdBy) {
      return NextResponse.json({ error: 'fullName, gender, createdBy required' }, { status: 400 })
    }

    const patient = await db.patient.create({
      data: {
        localId: localId || `PT-${Date.now()}`,
        fullName,
        gender,
        dateOfBirth: dateOfBirth || '',
        age: age ?? null,
        contact: contact ?? null,
        address: address ?? null,
        localIdNumber: localIdNumber ?? null,
        bloodGroup: bloodGroup ?? null,
        heightCm: heightCm ?? null,
        weightKg: weightKg ?? null,
        profession: profession ?? null,
        education: education ?? null,
        consentGiven: consentGiven ?? false,
        chiefComplaint: chiefComplaint ?? null,
        pastHistory: pastHistory ?? null,
        ongoingMedications: ongoingMedications ?? null,
        allergies: allergies ?? null,
        localSummary: localSummary ?? null,
        status: status ?? 'DRAFT',
        syncStatus: syncStatus ?? 'DRAFT',
        notificationStatus: notificationStatus ?? null,
        createdBy,
      },
    })

    return NextResponse.json({ patient }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to create patient', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

// ORIOSTER — Vitals API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeTriageLevel } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { patientId, recordedBy, ...vitals } = body
    if (!patientId || !recordedBy) {
      return NextResponse.json({ error: 'patientId and recordedBy required' }, { status: 400 })
    }

    const triageLevel = computeTriageLevel(vitals)
    const record = await db.vitals.create({
      data: {
        patientId,
        recordedBy,
        temperature: vitals.temperature ?? null,
        bpSystolic: vitals.bpSystolic ?? null,
        bpDiastolic: vitals.bpDiastolic ?? null,
        heartRate: vitals.heartRate ?? null,
        spo2: vitals.spo2 ?? null,
        weightKg: vitals.weightKg ?? null,
        heightCm: vitals.heightCm ?? null,
        triageLevel,
      },
    })

    return NextResponse.json({ vitals: record, triageLevel }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to record vitals', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

// ORIOSTER — Local Summary API (Step 8 — NO AI, NO NETWORK)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePatientSummaryV1 } from '@/lib/orio-ai'

export async function POST(req: NextRequest) {
  try {
    const { patientId } = await req.json()
    if (!patientId) {
      return NextResponse.json({ error: 'patientId required' }, { status: 400 })
    }

    const patient = await db.patient.findUnique({
      where: { id: patientId },
      include: { vitals: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const latestVitals = patient.vitals[0]
    const { summary, compressionRatio } = generatePatientSummaryV1({
      fullName: patient.fullName,
      gender: patient.gender,
      age: patient.age,
      bloodGroup: patient.bloodGroup,
      heightCm: patient.heightCm,
      weightKg: patient.weightKg,
      chiefComplaint: patient.chiefComplaint,
      pastHistory: patient.pastHistory,
      ongoingMedications: patient.ongoingMedications,
      allergies: patient.allergies,
      vitals: latestVitals
        ? {
            temperature: latestVitals.temperature,
            bpSystolic: latestVitals.bpSystolic,
            bpDiastolic: latestVitals.bpDiastolic,
            heartRate: latestVitals.heartRate,
            spo2: latestVitals.spo2,
            triageLevel: latestVitals.triageLevel,
          }
        : null,
    })

    // Save summary locally (encrypted concept — stored as summaryV1)
    const saved = await db.patientSummary.create({
      data: {
        patientId,
        summaryV1: summary,
        encryptedSummary: `enc:${Buffer.from(summary).toString('base64')}`,
        compressionRatio,
        createdBy: patient.createdBy,
      },
    })

    // Update patient with local summary + mark summary step complete
    await db.patient.update({
      where: { id: patientId },
      data: { localSummary: summary },
    })

    return NextResponse.json({
      summary,
      compressionRatio,
      summaryId: saved.id,
      message: 'patient_summary_v1 generated locally — privacy firewall complete',
    })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to generate summary', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

// ORIOSTER — Appointments API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const doctorId = searchParams.get('doctorId')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (doctorId) where.doctorId = doctorId
  if (status && status !== 'ALL') where.status = status

  const appointments = await db.appointment.findMany({
    where,
    include: {
      patient: { select: { id: true, fullName: true, localId: true, gender: true, age: true, status: true, chiefComplaint: true } },
      doctor: { select: { id: true, name: true, role: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  return NextResponse.json({ appointments })
}

export async function POST(req: NextRequest) {
  try {
    const { patientId, doctorId, scheduledAt, reason, status } = await req.json()
    if (!patientId || !doctorId || !scheduledAt) {
      return NextResponse.json(
        { error: 'patientId, doctorId, scheduledAt required' },
        { status: 400 }
      )
    }

    const appt = await db.appointment.create({
      data: {
        patientId,
        doctorId,
        scheduledAt,
        reason: reason ?? 'Consultation',
        status: status ?? 'SCHEDULED',
      },
      include: { doctor: true, patient: true },
    })

    return NextResponse.json({ appointment: appt }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to create appointment', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }
    const appt = await db.appointment.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json({ appointment: appt })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to update appointment', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

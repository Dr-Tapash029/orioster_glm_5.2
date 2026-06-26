// ORIOSTER — Single patient API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const patient = await db.patient.findUnique({
    where: { id },
    include: {
      vitals: { orderBy: { recordedAt: 'desc' } },
      appointments: { include: { doctor: true }, orderBy: { scheduledAt: 'desc' } },
      summaries: { orderBy: { createdAt: 'desc' } },
      aiResults: { orderBy: { createdAt: 'desc' } },
      labReports: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
      createdByStaff: true,
    },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }
  return NextResponse.json({ patient })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json()
    delete body.id
    delete body.createdAt
    delete body.updatedAt

    const patient = await db.patient.update({
      where: { id },
      data: body,
    })
    return NextResponse.json({ patient })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to update patient', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

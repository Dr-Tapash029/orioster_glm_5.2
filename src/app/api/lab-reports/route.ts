// ORIOSTER — Lab Reports API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  const where: Record<string, unknown> = {}
  if (patientId) where.patientId = patientId

  const reports = await db.labReport.findMany({
    where,
    include: {
      patient: { select: { id: true, fullName: true, localId: true, age: true, gender: true } },
      createdByStaff: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ reports })
}

export async function POST(req: NextRequest) {
  try {
    const { patientId, reportType, parameters, createdBy } = await req.json()
    if (!patientId || !reportType || !parameters || !createdBy) {
      return NextResponse.json(
        { error: 'patientId, reportType, parameters, createdBy required' },
        { status: 400 }
      )
    }

    // Determine if all parameters are normal
    const params = typeof parameters === 'string' ? JSON.parse(parameters) : parameters
    const allNormal = Array.isArray(params) && params.every((p: { status?: string }) => p.status === 'normal')

    const report = await db.labReport.create({
      data: {
        patientId,
        reportType,
        parameters: typeof parameters === 'string' ? parameters : JSON.stringify(parameters),
        isNormal: allNormal,
        status: 'COMPLETED',
        createdBy,
      },
      include: { patient: true },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to create lab report', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, aiFeedback, isNormal, status } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    const data: Record<string, unknown> = {}
    if (aiFeedback !== undefined) data.aiFeedback = aiFeedback
    if (isNormal !== undefined) data.isNormal = isNormal
    if (status !== undefined) data.status = status

    const report = await db.labReport.update({ where: { id }, data })
    return NextResponse.json({ report })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to update lab report', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

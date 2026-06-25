// ORIOSTER — AI Results API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  const where: Record<string, unknown> = {}
  if (patientId) where.patientId = patientId

  const results = await db.aiResult.findMany({
    where,
    include: {
      patient: { select: { id: true, fullName: true, localId: true } },
      createdByStaff: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ results })
}

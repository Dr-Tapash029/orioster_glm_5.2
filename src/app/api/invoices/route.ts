// ORIOSTER — Invoices API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  const where: Record<string, unknown> = {}
  if (patientId) where.patientId = patientId

  const invoices = await db.invoice.findMany({
    where,
    include: {
      patient: { select: { id: true, fullName: true, localId: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ invoices })
}

export async function POST(req: NextRequest) {
  try {
    const { patientId, items, subtotal, tax, total, createdBy } = await req.json()
    if (!patientId || !createdBy) {
      return NextResponse.json(
        { error: 'patientId and createdBy required' },
        { status: 400 }
      )
    }

    const invoiceNo = `INV-${Date.now()}`
    const invoice = await db.invoice.create({
      data: {
        patientId,
        invoiceNo,
        items: typeof items === 'string' ? items : JSON.stringify(items ?? []),
        subtotal: subtotal ?? 0,
        tax: tax ?? 0,
        total: total ?? 0,
        status: 'PENDING',
        createdBy,
      },
      include: { patient: true },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to create invoice', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

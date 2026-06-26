// ORIOSTER — Staff API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const where: Record<string, unknown> = { isActive: true }
  if (role) where.role = role

  const staff = await db.staff.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ staff })
}

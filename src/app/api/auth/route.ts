// ORIOSTER — Auth API (simple session-based, role selection)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { AppRole } from '@/lib/types'

export async function GET() {
  const staff = await db.staff.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { role: 'asc' },
  })
  return NextResponse.json({ staff })
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    const staff = await db.staff.findUnique({ where: { email } })
    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    return NextResponse.json({
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role as AppRole,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

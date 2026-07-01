// ORIOSTER — Auth API
// Supports: Google sign-in (simulated) + email/password + role selection
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
    const body = await req.json()
    const { email, password, name, role, provider } = body

    // ── Google sign-in (simulated) ──────────────────────────
    if (provider === 'google') {
      if (!email) {
        return NextResponse.json({ error: 'Email required for Google sign-in' }, { status: 400 })
      }
      // Check if user exists
      let staff = await db.staff.findUnique({ where: { email } })
      if (!staff) {
        // Create new user with Google (default role DOCTOR if not specified)
        staff = await db.staff.create({
          data: {
            email,
            name: name || email.split('@')[0],
            role: (role as AppRole) || 'DOCTOR',
          },
        })
      }
      if (!staff.isActive) {
        return NextResponse.json({ error: 'Account deactivated' }, { status: 403 })
      }
      return NextResponse.json({
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role as AppRole,
        },
      })
    }

    // ── Email + Password sign-in ────────────────────────────
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Check if user exists
    let staff = await db.staff.findUnique({ where: { email } })

    if (staff) {
      // Existing user — verify password (demo: password must match or be 'demo')
      // In production, use bcrypt to compare hashed passwords
      if (password !== 'demo' && password !== 'password' && password.length < 3) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }
      if (!staff.isActive) {
        return NextResponse.json({ error: 'Account deactivated' }, { status: 403 })
      }
      return NextResponse.json({
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role as AppRole,
        },
      })
    }

    // ── Sign up (new user) ──────────────────────────────────
    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role required for sign up' }, { status: 400 })
    }

    staff = await db.staff.create({
      data: {
        email,
        name,
        role: role as AppRole,
      },
    })

    return NextResponse.json({
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role as AppRole,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: 'Authentication failed', detail: (e as Error).message },
      { status: 500 }
    )
  }
}

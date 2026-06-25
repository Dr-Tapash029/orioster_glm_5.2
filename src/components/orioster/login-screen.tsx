'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { RoleBadge } from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import {
  HeartPulse,
  ShieldCheck,
  WifiOff,
  Loader2,
  Stethoscope,
  Users,
  FlaskConical,
  FileText,
  Sparkles,
} from 'lucide-react'
import type { AppRole } from '@/lib/types'
import { toast } from 'sonner'

interface StaffMember {
  id: string
  name: string
  email: string
  role: AppRole
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  DOCTOR: <Stethoscope className="h-5 w-5" />,
  NURSE: <Users className="h-5 w-5" />,
  ADMIN: <FileText className="h-5 w-5" />,
  LAB_TECH: <FlaskConical className="h-5 w-5" />,
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  DOCTOR: 'Clinical decisions, diagnosis confirmation, AI review & prescriptions',
  NURSE: 'Patient intake, vitals recording, entry wizard execution',
  ADMIN: 'Scheduling, invoicing, staff management, AI Hub access',
  LAB_TECH: 'Lab report parameter entry, AI analysis trigger',
}

export function LoginScreen() {
  const setUser = useAppStore((s) => s.setUser)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setStaff(d.staff ?? []))
      .catch(() => toast.error('Failed to load staff accounts'))
      .finally(() => setLoading(false))
  }, [])

  async function handleLogin(s: StaffMember) {
    setSigningIn(s.id)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: s.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Login failed')
      toast.success(`Welcome, ${data.user.name}`)
      setUser(data.user)
    } catch (e) {
      toast.error((e as Error).message)
      setSigningIn(null)
    }
  }

  return (
    <div className="mh-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Moving cyan light rays (decorative) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="mh-light-ray absolute -left-1/4 top-0 h-[200%] w-32 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent" style={{ animationDelay: '0s' }} />
        <div className="mh-light-ray absolute -left-1/4 top-0 h-[200%] w-24 bg-gradient-to-b from-transparent via-cyan-300/8 to-transparent" style={{ animationDelay: '3s' }} />
        <div className="mh-light-ray absolute -left-1/4 top-0 h-[200%] w-40 bg-gradient-to-b from-transparent via-cyan-500/6 to-transparent" style={{ animationDelay: '5s' }} />
      </div>

      {/* Top brand */}
      <div className="relative mb-8 flex flex-col items-center gap-3 text-center">
        <div className="mh-logo-glow flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-[#061425] shadow-2xl">
          <HeartPulse className="h-10 w-10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100">ORIOSTER</h1>
          <p className="text-sm font-medium tracking-wider text-cyan-400">AI-POWERED HOSPITAL MANAGEMENT SYSTEM</p>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Offline-first · Humanitarian Operations · AI is advisory only
        </div>
      </div>

      {/* Glass login card */}
      <div className="glass-strong relative w-full max-w-2xl rounded-2xl p-5 sm:p-7">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-100">Select your role to sign in</h2>
          <p className="text-sm text-slate-400">
            Demo environment — click any staff card to enter. No password required.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {staff.map((s) => (
              <button
                key={s.id}
                onClick={() => handleLogin(s)}
                disabled={signingIn !== null}
                className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:shadow-[0_0_30px_rgba(54,184,216,0.12)] disabled:opacity-50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                  {ROLE_ICONS[s.role] ?? <Users className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-100">{s.name}</p>
                    <RoleBadge role={s.role} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{s.email}</p>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
                    {ROLE_DESCRIPTIONS[s.role]}
                  </p>
                </div>
                {signingIn === s.id && (
                  <Loader2 className="mt-1 h-4 w-4 flex-shrink-0 animate-spin text-cyan-400" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-[11px] text-slate-400">
          <WifiOff className="h-3.5 w-3.5 text-cyan-400" />
          The app works fully offline. Local SQLite is the primary runtime authority — cloud sync is eventual and invisible.
        </div>
      </div>

      {/* AI orb decoration (bottom center) */}
      <div className="pointer-events-none mt-8 flex flex-col items-center gap-2">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="mh-orb-ring absolute inset-0 rounded-full bg-cyan-400/20" />
          <div className="mh-orb-ring absolute inset-1 rounded-full bg-cyan-400/30" style={{ animationDelay: '0.5s' }} />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-cyan-600 shadow-[0_0_25px_rgba(54,184,216,0.4)]">
            <Sparkles className="h-4 w-4 text-[#061425]" />
          </div>
        </div>
        <p className="text-[10px] font-medium tracking-wider text-cyan-400/60">ORIO AI</p>
      </div>

      <footer className="mt-auto pt-8 text-center text-[11px] text-slate-600">
        Orioster · AI-Powered HMS v1.0 · &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { GlassPanel, RoleBadge } from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { HeartPulse, ShieldCheck, WifiOff, Loader2, Stethoscope, Users, FlaskConical, FileText } from 'lucide-react'
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
    <div className="orio-bg relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      {/* Top brand */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <HeartPulse className="h-9 w-9" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ORIOSTER</h1>
          <p className="text-sm text-muted-foreground">AI-Powered Hospital Management System</p>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Offline-first · Human-controlled · AI is advisory only
        </div>
      </div>

      <GlassPanel variant="strong" className="w-full max-w-2xl p-5 sm:p-7">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Select your role to sign in</h2>
          <p className="text-sm text-muted-foreground">
            Demo environment — click any staff card to enter. No password required.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {staff.map((s) => (
              <button
                key={s.id}
                onClick={() => handleLogin(s)}
                disabled={signingIn !== null}
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md disabled:opacity-50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {ROLE_ICONS[s.role] ?? <Users className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <RoleBadge role={s.role} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.email}</p>
                  <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/80">
                    {ROLE_DESCRIPTIONS[s.role]}
                  </p>
                </div>
                {signingIn === s.id && (
                  <Loader2 className="mt-1 h-4 w-4 flex-shrink-0 animate-spin text-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          <WifiOff className="h-3.5 w-3.5" />
          The app works fully offline. Local SQLite is the primary runtime authority — cloud sync is eventual and invisible.
        </div>
      </GlassPanel>

      <footer className="mt-auto pt-8 text-center text-[11px] text-muted-foreground/70">
        ORIOSTER v3.0 · Offline-first clinical operating system · &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}

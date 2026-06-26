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
  Mail,
  Lock,
  User,
  Building2,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { AppRole } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { WordReveal } from '@/components/orioster/word-reveal'

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
  DOCTOR: 'Clinical decisions, diagnosis confirmation, AI review',
  NURSE: 'Patient intake, vitals recording, entry wizard',
  ADMIN: 'Scheduling, invoicing, staff management, AI Hub',
  LAB_TECH: 'Lab report parameter entry, AI analysis',
}

export function LoginScreen() {
  const setUser = useAppStore((s) => s.setUser)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState<string | null>(null)

  // Sign up form state
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpRole, setSignUpRole] = useState<AppRole>('DOCTOR')
  const [signUpCompany, setSignUpCompany] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!signUpName || !signUpEmail || !signUpPassword) {
      toast.error('Please fill all required fields')
      return
    }
    // Simulate signup — create user session
    toast.success('Account created! Welcome to Orioster.')
    setUser({
      id: `new-${Date.now()}`,
      name: signUpName,
      email: signUpEmail,
      role: signUpRole,
    })
  }

  return (
    <div className="wope-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Moving violet light rays */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="wope-light-ray absolute -left-1/4 top-0 h-[200%] w-32 bg-gradient-to-b from-transparent via-violet-400/10 to-transparent" style={{ animationDelay: '0s' }} />
        <div className="wope-light-ray absolute -left-1/4 top-0 h-[200%] w-24 bg-gradient-to-b from-transparent via-violet-300/8 to-transparent" style={{ animationDelay: '3s' }} />
        <div className="wope-light-ray absolute -left-1/4 top-0 h-[200%] w-40 bg-gradient-to-b from-transparent via-violet-500/6 to-transparent" style={{ animationDelay: '5s' }} />
      </div>

      {/* Top brand */}
      <div className="relative mb-6 flex flex-col items-center gap-3 text-center">
        <div className="wope-logo-glow bg-glow-in flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-2xl">
          <HeartPulse className="h-9 w-9" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl text-glow-pulse" style={{ fontFamily: 'var(--font-heading)' }}>
            <WordReveal text="ORIOSTER" delay={0.2} wordDelay={0.12} />
          </h1>
          <p className="mt-1 text-xs font-medium tracking-wider text-violet-400 word-reveal" style={{ animationDelay: '0.6s' }}>
            AI-POWERED HOSPITAL MANAGEMENT SYSTEM
          </p>
        </div>
      </div>

      {/* Auth card with Sign In / Sign Up tabs */}
      <div className="glass-strong section-slide-up relative w-full max-w-md rounded-2xl p-5 sm:p-6" style={{ animationDelay: '0.4s' }}>
        {/* Tab switcher */}
        <div className="mb-5 flex gap-1 rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setMode('signin')}
            className={cn(
              'btn-press flex-1 rounded-lg py-2 text-sm font-medium transition-all',
              mode === 'signin' ? 'bg-violet-500/20 text-white shadow-[0_0_15px_rgba(113,61,255,0.2)]' : 'text-slate-400 hover:text-white'
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={cn(
              'btn-press flex-1 rounded-lg py-2 text-sm font-medium transition-all',
              mode === 'signup' ? 'bg-violet-500/20 text-white shadow-[0_0_15px_rgba(113,61,255,0.2)]' : 'text-slate-400 hover:text-white'
            )}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signin' ? (
          <SignInPanel
            staff={staff}
            loading={loading}
            signingIn={signingIn}
            onLogin={handleLogin}
          />
        ) : (
          <SignUpPanel
            name={signUpName}
            email={signUpEmail}
            password={signUpPassword}
            role={signUpRole}
            company={signUpCompany}
            showPassword={showPassword}
            onNameChange={setSignUpName}
            onEmailChange={setSignUpEmail}
            onPasswordChange={setSignUpPassword}
            onRoleChange={setSignUpRole}
            onCompanyChange={setSignUpCompany}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onSubmit={handleSignUp}
          />
        )}

        <div className="mt-5 flex items-center gap-2 rounded-lg border border-violet-500/10 bg-violet-500/5 px-3 py-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Offline-first · Local SQLite is runtime authority · AI is advisory only
        </div>
      </div>

      {/* AI orb decoration */}
      <div className="pointer-events-none mt-6 flex flex-col items-center gap-2">
        <div className="relative flex h-10 w-10 items-center justify-center">
          <div className="wope-orb-ring absolute inset-0 rounded-full bg-violet-400/20" />
          <div className="wope-orb-ring absolute inset-1 rounded-full bg-violet-400/30" style={{ animationDelay: '0.5s' }} />
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 shadow-[0_0_25px_rgba(113,61,255,0.4)]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <p className="text-[10px] font-medium tracking-wider text-violet-400/60">ORIO AI</p>
      </div>

      <footer className="mt-auto pt-6 text-center text-[11px] text-slate-600">
        Orioster · AI-Powered HMS · &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SIGN IN PANEL — Quick role selection
// ═══════════════════════════════════════════════════════════════

function SignInPanel({
  staff,
  loading,
  signingIn,
  onLogin,
}: {
  staff: StaffMember[]
  loading: boolean
  signingIn: string | null
  onLogin: (s: StaffMember) => void
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">Select your role</h2>
        <p className="text-xs text-slate-400">Quick sign in — no password required</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onLogin(s)}
              disabled={signingIn !== null}
              className={cn(
                'anim-fade-in-up card-lift btn-press group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-violet-500/30 hover:bg-violet-500/5 disabled:opacity-50'
              )}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                {ROLE_ICONS[s.role] ?? <Users className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                  <RoleBadge role={s.role} />
                </div>
                <p className="truncate text-[11px] text-slate-500">{s.email}</p>
              </div>
              {signingIn === s.id && (
                <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-violet-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SIGN UP PANEL — Registration form
// ═══════════════════════════════════════════════════════════════

function SignUpPanel({
  name,
  email,
  password,
  role,
  company,
  showPassword,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onRoleChange,
  onCompanyChange,
  onTogglePassword,
  onSubmit,
}: {
  name: string
  email: string
  password: string
  role: AppRole
  company: string
  showPassword: boolean
  onNameChange: (v: string) => void
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onRoleChange: (v: AppRole) => void
  onCompanyChange: (v: string) => void
  onTogglePassword: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  const roles: AppRole[] = ['DOCTOR', 'NURSE', 'ADMIN', 'LAB_TECH']

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">Create your account</h2>
        <p className="text-xs text-slate-400">Join Orioster to get started</p>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Full Name *</label>
        <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
          <User className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Dr. Tapash Roy"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Email *</label>
        <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
          <Mail className="h-4 w-4 text-slate-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@hospital.health"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Password *</label>
        <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
          <Lock className="h-4 w-4 text-slate-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="text-slate-500 hover:text-violet-300"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Role */}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Role *</label>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRoleChange(r)}
              className={cn(
                'btn-press flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all',
                role === r
                  ? 'border-violet-500/40 bg-violet-500/15 text-white'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-violet-500/20'
              )}
            >
              <span className="text-violet-400">{ROLE_ICONS[r]}</span>
              <span className="text-xs font-medium">{r === 'LAB_TECH' ? 'Lab Tech' : r.charAt(0) + r.slice(1).toLowerCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Company */}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Company / Hospital</label>
        <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
          <Building2 className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            placeholder="e.g. Riverside Medical Center"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="fx-btn-border-trace btn-press ripple w-full gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Create Account
      </Button>
    </form>
  )
}

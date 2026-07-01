'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  HeartPulse,
  ShieldCheck,
  Loader2,
  Stethoscope,
  Users,
  FlaskConical,
  FileText,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import type { AppRole } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS: { value: AppRole; label: string; icon: LucideIcon; desc: string }[] = [
  { value: 'DOCTOR', label: 'Doctor', icon: Stethoscope, desc: 'Clinical decisions & AI review' },
  { value: 'NURSE', label: 'Nurse', icon: Users, desc: 'Patient intake & vitals' },
  { value: 'ADMIN', label: 'Admin', icon: FileText, desc: 'Scheduling & invoicing' },
  { value: 'LAB_TECH', label: 'Lab Tech', icon: FlaskConical, desc: 'Lab reports & analysis' },
]

export function LoginScreen() {
  const setUser = useAppStore((s) => s.setUser)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<AppRole>('DOCTOR')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    if (mode === 'signup' && !name) {
      toast.error('Please enter your name')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: mode === 'signup' ? name : undefined,
          role: mode === 'signup' ? role : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Authentication failed')
      toast.success(`Welcome, ${data.user.name}`)
      setUser(data.user)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      // Simulate Google OAuth — in production, use NextAuth.js or @react-oauth/google
      // For now, use a demo Google account
      const googleEmail = 'doctor@orioster.health'
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail, provider: 'google' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Google sign-in failed')
      toast.success(`Welcome, ${data.user.name}`)
      setUser(data.user)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="wope-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Moving violet light rays */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="wope-light-ray absolute -left-1/4 top-0 h-[200%] w-32 bg-gradient-to-b from-transparent via-violet-400/10 to-transparent" style={{ animationDelay: '0s' }} />
        <div className="wope-light-ray absolute -left-1/4 top-0 h-[200%] w-24 bg-gradient-to-b from-transparent via-violet-300/8 to-transparent" style={{ animationDelay: '3s' }} />
        <div className="wope-light-ray absolute -left-1/4 top-0 h-[200%] w-40 bg-gradient-to-b from-transparent via-violet-500/6 to-transparent" style={{ animationDelay: '5s' }} />
      </div>

      {/* Official Logo */}
      <div className="relative mb-5 flex flex-col items-center gap-1">
        <img
          src="/orioster-logo.png"
          alt="Orioster Logo"
          className="anim-scale-in h-28 w-28 rounded-2xl object-contain shadow-2xl sm:h-32 sm:w-32"
          style={{ filter: 'drop-shadow(0 0 20px rgba(113,61,255,0.3))' }}
        />
      </div>

      {/* Auth Card */}
      <div className="glass-strong anim-fade-in-up relative w-full max-w-md rounded-2xl p-5 sm:p-6">
        {/* Tab switcher */}
        <div className="mb-5 flex gap-1 rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setMode('signin')}
            className={cn(
              'btn-press flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all',
              mode === 'signin'
                ? 'bg-violet-500/20 text-white shadow-[0_0_15px_rgba(113,61,255,0.2)]'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={cn(
              'btn-press flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all',
              mode === 'signup'
                ? 'bg-violet-500/20 text-white shadow-[0_0_15px_rgba(113,61,255,0.2)]'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Sign Up
          </button>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="btn-press mb-4 flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] text-slate-500">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Full Name</label>
              <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
                <User className="h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Tapash Roy"
                  className="h-10 w-full bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
            <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.health"
                className="h-10 w-full bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
            <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
              <Lock className="h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 w-full bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 hover:text-violet-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role Selection (sign up only) */}
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={cn(
                        'btn-press flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all',
                        role === opt.value
                          ? 'border-violet-500/40 bg-violet-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-violet-500/20'
                      )}
                    >
                      <Icon className="h-4 w-4 text-violet-400" />
                      <div>
                        <p className="text-xs font-semibold">{opt.label}</p>
                        <p className="text-[9px] text-slate-500">{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="fx-btn-border-trace btn-press ripple w-full gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Demo accounts hint */}
        {mode === 'signin' && (
          <div className="mt-4 rounded-lg border border-violet-500/10 bg-violet-500/5 px-3 py-2 text-[11px] text-slate-400">
            <p className="font-medium text-violet-300">Demo accounts:</p>
            <p className="mt-0.5">doctor@orioster.health · nurse@orioster.health</p>
            <p>admin@orioster.health · lab@orioster.health</p>
            <p className="mt-0.5 text-slate-500">Any password works for demo accounts.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Offline-first · Local SQLite · AI is advisory only
        </div>
        <p className="text-[10px] text-slate-600">
          Orioster · AI-Powered HMS · © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, type ReactNode } from 'react'
import { useAppStore, type ViewKey } from '@/lib/store'
import {
  OnlineIndicator,
  OfflineBanner,
  RoleBadge,
} from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  HeartPulse,
  LayoutDashboard,
  Users,
  UserPlus,
  Sparkles,
  LayoutGrid,
  CalendarClock,
  FlaskConical,
  Receipt,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  ShieldCheck,
  Command,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppRole } from '@/lib/types'

interface NavItem {
  key: ViewKey
  label: string
  icon: ReactNode
  roles?: AppRole[]
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'patients', label: 'Patients', icon: <Users className="h-4 w-4" /> },
  { key: 'patient-entry', label: 'New Patient', icon: <UserPlus className="h-4 w-4" />, roles: ['NURSE', 'ADMIN', 'DOCTOR'] },
  { key: 'orio-ai', label: 'Orio AI', icon: <Sparkles className="h-4 w-4" />, roles: ['DOCTOR', 'ADMIN'] },
  { key: 'ai-hub', label: 'AI Hub', icon: <LayoutGrid className="h-4 w-4" />, roles: ['ADMIN', 'DOCTOR'] },
  { key: 'appointments', label: 'Appointments', icon: <CalendarClock className="h-4 w-4" /> },
  { key: 'lab-reports', label: 'Lab Reports', icon: <FlaskConical className="h-4 w-4" />, roles: ['LAB_TECH', 'DOCTOR', 'ADMIN'] },
  { key: 'invoices', label: 'Invoices', icon: <Receipt className="h-4 w-4" />, roles: ['ADMIN'] },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, view, setView, online, setOnline } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const role = user.role as AppRole
  const visibleNav = NAV_ITEMS.filter((n) => !n.roles || n.roles.includes(role))

  function navigate(v: ViewKey) {
    setView(v)
    setMobileOpen(false)
  }

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="mh-bg flex min-h-screen flex-col">
      <OfflineBanner online={online} />

      {/* ═══ Top Navigation Bar ════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-cyan-500/10 bg-[#061425]/80 backdrop-blur-2xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {/* Left: Logo with breathing glow */}
          <button
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-2.5"
          >
            <div className="mh-logo-glow flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-[#061425]">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-none tracking-wide text-slate-100">ORIOSTER</p>
              <p className="text-[10px] font-medium tracking-wider text-cyan-400">AI-POWERED HMS</p>
            </div>
          </button>

          {/* Center: Global Search (desktop) */}
          <div className="mx-auto hidden max-w-md flex-1 md:block">
            <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, beneficiaries, programs, cases, reports..."
                className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
              />
              <kbd className="hidden items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 lg:flex">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>
          </div>

          {/* Right: Icons */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Online toggle */}
            <button
              onClick={() => setOnline(!online)}
              className="hidden sm:block"
              title="Toggle connectivity"
            >
              <OnlineIndicator online={online} />
            </button>

            {/* Notifications */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-cyan-300">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-400 mh-pulse" />
            </button>

            {/* AI Assistant quick access */}
            {(role === 'DOCTOR' || role === 'ADMIN') && (
              <button
                onClick={() => navigate('orio-ai')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300"
                title="Orio AI Assistant"
              >
                <Sparkles className="h-4.5 w-4.5" />
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Profile */}
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 py-1 pl-1 pr-3 sm:flex">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-cyan-500/20 text-[11px] font-semibold text-cyan-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-xs font-medium leading-none text-slate-200">{user.name}</p>
                <div className="mt-0.5">
                  <RoleBadge role={role} />
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Horizontal nav row (desktop) */}
        <nav className="hidden items-center gap-0.5 border-t border-cyan-500/5 px-4 md:flex sm:px-6">
          {visibleNav.map((item) => (
            <NavTab
              key={item.key}
              item={item}
              active={view === item.key}
              onClick={() => navigate(item.key)}
            />
          ))}
        </nav>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-cyan-500/15 bg-[#061425] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="mh-logo-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-[#061425]">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">ORIOSTER</p>
                  <p className="text-[10px] text-cyan-400">AI-POWERED HMS</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile search */}
            <div className="glass-input mb-3 flex items-center gap-2 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <nav className="flex flex-col gap-1">
              {visibleNav.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  active={view === item.key}
                  onClick={() => navigate(item.key)}
                />
              ))}
            </nav>

            <button
              onClick={() => setOnline(!online)}
              className="mt-4 flex w-full items-center justify-center"
            >
              <OnlineIndicator online={online} />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">{children}</main>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-cyan-500/10 bg-[#061425]/60 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-cyan-400">ORIOSTER</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Hospital Operations</span>
            <span>·</span>
            <span>Local SQLite is runtime authority</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">AI is advisory only — The doctor always has the final say</span>
            <span>·</span>
            <span>v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Horizontal nav tab (desktop) ──────────────────────────────
function NavTab({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'nav-tab-indicator btn-press ripple flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-all',
        active
          ? 'active border-cyan-400 text-cyan-300'
          : 'border-transparent text-slate-400 hover:text-slate-200'
      )}
    >
      <span className="transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
      {item.label}
    </button>
  )
}

// ── Vertical nav button (mobile drawer) ───────────────────────
function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
        active
          ? 'bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(54,184,216,0.15)]'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      )}
    >
      {item.icon}
      {item.label}
    </button>
  )
}

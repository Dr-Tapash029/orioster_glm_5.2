'use client'

import { useState, type ReactNode } from 'react'
import { useAppStore, type ViewKey } from '@/lib/store'
import {
  GlassPanel,
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
  Moon,
  Sun,
  Wifi,
  WifiOff,
  ShieldCheck,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import type { AppRole } from '@/lib/types'

interface NavItem {
  key: ViewKey
  label: string
  icon: ReactNode
  roles?: AppRole[] // if set, only show for these roles
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
  { key: 'patients', label: 'Patients', icon: <Users className="h-4.5 w-4.5" /> },
  { key: 'patient-entry', label: 'New Patient', icon: <UserPlus className="h-4.5 w-4.5" />, roles: ['NURSE', 'ADMIN', 'DOCTOR'] },
  { key: 'orio-ai', label: 'Orio AI', icon: <Sparkles className="h-4.5 w-4.5" />, roles: ['DOCTOR', 'ADMIN'] },
  { key: 'ai-hub', label: 'AI Hub', icon: <LayoutGrid className="h-4.5 w-4.5" />, roles: ['ADMIN', 'DOCTOR'] },
  { key: 'appointments', label: 'Appointments', icon: <CalendarClock className="h-4.5 w-4.5" /> },
  { key: 'lab-reports', label: 'Lab Reports', icon: <FlaskConical className="h-4.5 w-4.5" />, roles: ['LAB_TECH', 'DOCTOR', 'ADMIN'] },
  { key: 'invoices', label: 'Invoices', icon: <Receipt className="h-4.5 w-4.5" />, roles: ['ADMIN'] },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, view, setView, online, setOnline } = useAppStore()
  const { theme, setTheme } = useTheme()
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
    <div className="orio-bg flex min-h-screen flex-col">
      <OfflineBanner online={online} />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-none">ORIOSTER</p>
              <p className="text-[10px] text-muted-foreground">AI-Powered HMS</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Online toggle (simulated connectivity) */}
            <button
              onClick={() => setOnline(!online)}
              className="hidden sm:flex"
              title="Toggle connectivity (simulated)"
            >
              <OnlineIndicator online={online} />
            </button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User */}
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 py-1 pl-1 pr-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-xs font-medium leading-none">{user.name}</p>
                <div className="mt-0.5">
                  <RoleBadge role={role} />
                </div>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={logout} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — desktop */}
        <aside className="hidden w-60 flex-shrink-0 border-r border-border/40 bg-sidebar/40 p-3 lg:block">
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

          <GlassPanel variant="subtle" className="mt-6 p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Privacy Firewall
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              AI receives only de-identified patient_summary_v1. Raw PHI never leaves the device.
            </p>
          </GlassPanel>

          <div className="mt-4 flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
            {online ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5 text-amber-500" />}
            {online ? 'Sync active' : 'Offline — sync queued'}
          </div>
        </aside>

        {/* Sidebar — mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-sidebar p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold">ORIOSTER</p>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
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
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">{children}</main>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-border/40 bg-background/60 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground/80">ORIOSTER</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Offline-first clinical OS</span>
            <span>·</span>
            <span>Local SQLite is runtime authority</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">AI is advisory only — The doctor always has the final say</span>
            <span>·</span>
            <span>v3.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

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
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      {item.icon}
      {item.label}
    </button>
  )
}

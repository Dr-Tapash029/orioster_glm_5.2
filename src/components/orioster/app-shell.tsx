'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useAppStore, type ViewKey } from '@/lib/store'
import { useTheme } from 'next-themes'
import { OnlineIndicator, OfflineBanner, RoleBadge } from '@/components/orioster/ui-primitives'
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
  Home,
  Calendar,
  User,
  Building2,
  CheckSquare,
  FileText,
  ChevronRight,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppRole } from '@/lib/types'

// ── Navigation items ──────────────────────────────────────────
interface NavItem {
  key: ViewKey
  label: string
  icon: ReactNode
  roles?: AppRole[]
}

const ALL_NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { key: 'patients', label: 'Patients', icon: <Users className="h-5 w-5" /> },
  { key: 'patient-entry', label: 'New Patient', icon: <UserPlus className="h-5 w-5" />, roles: ['NURSE', 'ADMIN', 'DOCTOR'] },
  { key: 'orio-ai', label: 'Orio AI', icon: <Sparkles className="h-5 w-5" />, roles: ['DOCTOR', 'ADMIN'] },
  { key: 'ai-hub', label: 'AI Hub', icon: <LayoutGrid className="h-5 w-5" />, roles: ['ADMIN', 'DOCTOR'] },
  { key: 'appointments', label: 'Appointments', icon: <CalendarClock className="h-5 w-5" /> },
  { key: 'lab-reports', label: 'Lab Reports', icon: <FlaskConical className="h-5 w-5" />, roles: ['LAB_TECH', 'DOCTOR', 'ADMIN'] },
  { key: 'invoices', label: 'Invoices', icon: <Receipt className="h-5 w-5" />, roles: ['ADMIN'] },
]

// Bottom nav items (5 slots, middle is menu)
const BOTTOM_NAV: Array<{ key: ViewKey; label: string; icon: ReactNode; roles?: AppRole[] }> = [
  { key: 'dashboard', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { key: 'patients', label: 'Patients', icon: <Users className="h-5 w-5" /> },
  { key: 'menu' as ViewKey, label: 'Menu', icon: <Menu className="h-6 w-6" /> },
  { key: 'appointments', label: 'Schedule', icon: <Calendar className="h-5 w-5" /> },
  { key: 'orio-ai', label: 'AI', icon: <Sparkles className="h-5 w-5" />, roles: ['DOCTOR', 'ADMIN'] },
]

// Profile dropdown items
const PROFILE_MENU: Array<{ key: ViewKey; label: string; icon: ReactNode }> = [
  { key: 'my-profile', label: 'My Profile', icon: <User className="h-4 w-4" /> },
  { key: 'my-company', label: 'My Company', icon: <Building2 className="h-4 w-4" /> },
  { key: 'my-tasks', label: 'My Tasks', icon: <CheckSquare className="h-4 w-4" /> },
  { key: 'my-documents', label: 'My Documents', icon: <FileText className="h-4 w-4" /> },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, view, setView, online, setOnline, profileImage, drawerOpen, setDrawerOpen } = useAppStore()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (!user) return null

  const role = user.role as AppRole
  const visibleNav = ALL_NAV.filter((n) => !n.roles || n.roles.includes(role))
  const visibleBottom = BOTTOM_NAV.filter((n) => !n.roles || n.roles.includes(role))

  // If bottom nav has only 4 items (AI filtered out), add invoices or labs as 5th
  const bottomNav = visibleBottom.length >= 5 ? visibleBottom : [
    ...visibleBottom.slice(0, 2),
    { key: 'menu' as ViewKey, label: 'Menu', icon: <Menu className="h-6 w-6" /> },
    ...visibleBottom.slice(2),
    { key: 'lab-reports' as ViewKey, label: 'Labs', icon: <FlaskConical className="h-5 w-5" /> },
  ].slice(0, 5)

  function navigate(v: ViewKey) {
    if (v === 'menu' as ViewKey) {
      setDrawerOpen(!drawerOpen)
    } else {
      setView(v)
    }
  }

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="wope-bg flex min-h-screen flex-col">
      <OfflineBanner online={online} />

      {/* ═══ Responsive Container ════════════════════════════ */}
      {/* Mobile: max-w-md centered phone layout                         */}
      {/* Desktop (lg+): full-width with persistent sidebar + wide content */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col shadow-2xl lg:max-w-7xl lg:flex-row lg:shadow-none">
        {/* ── Desktop Sidebar (lg+ only) ─────────────────────── */}
        <DesktopSidebar
          navItems={visibleNav}
          activeView={view}
          onNavigate={navigate}
          user={user}
          profileImage={profileImage}
          initials={initials}
          role={role}
          onLogout={logout}
        />

        {/* ── Main Column ────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* ── Header ─────────────────────────────────────────── */}
          <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0118]/90 backdrop-blur-2xl">
            <div className="flex h-14 items-center gap-2 px-3 lg:px-6">
              {/* Logo — hidden on desktop (shown in sidebar) */}
              <button
                onClick={() => navigate('dashboard')}
                className="flex items-center gap-2 lg:hidden"
              >
                <div className="wope-logo-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold tracking-tight text-white-gradient" style={{ fontFamily: 'var(--font-heading)' }}>
                  Orioster
                </span>
              </button>

              {/* Search button — expands on desktop */}
              <SearchButton />

              <div className="ml-auto flex items-center gap-1">
                {/* Online indicator */}
                <button
                  onClick={() => setOnline(!online)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5"
                  title="Toggle connectivity"
                >
                  {online ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-amber-400" />}
                </button>

                {/* Notifications */}
                <NotificationButton />

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-violet-300"
                  title="Toggle theme"
                >
                  {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Profile */}
                <ProfileButton
                  user={user}
                  profileImage={profileImage}
                  initials={initials}
                  role={role}
                  onNavigate={setView}
                  onLogout={logout}
                />
              </div>
            </div>
          </header>

          {/* ── Main Content ───────────────────────────────────── */}
          <main className="min-w-0 flex-1 overflow-y-auto wope-scroll pb-20 lg:pb-6" style={{ paddingBottom: '80px' }}>
            <div className="mx-auto max-w-md lg:max-w-none">{children}</div>
          </main>

          {/* ── Bottom Navigation Bar (mobile only) ───────────── */}
          <BottomNav
            items={bottomNav}
            activeView={view}
            drawerOpen={drawerOpen}
            onNavigate={navigate}
          />
        </div>
      </div>

      {/* ── Side Drawer (mobile only, glassmorphism) ──────────── */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={visibleNav}
        activeView={view}
        onNavigate={navigate}
        user={user}
        profileImage={profileImage}
        initials={initials}
        role={role}
        onLogout={logout}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SEARCH BUTTON — Opens search overlay
// ═══════════════════════════════════════════════════════════════

function SearchButton() {
  const { searchOpen, setSearchOpen } = useAppStore()
  return (
    <button
      onClick={() => setSearchOpen(!searchOpen)}
      className="glass-input ml-1 flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg px-3 text-xs text-slate-400 lg:h-10 lg:text-sm"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="ml-auto hidden rounded border border-white/10 bg-white/5 px-1 text-[9px] sm:inline">
        ⌘K
      </kbd>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION BUTTON — Opens notification panel
// ═══════════════════════════════════════════════════════════════

function NotificationButton() {
  const { notifications, markAllNotificationsRead, markNotificationRead } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-violet-300"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-violet-500 px-1 text-[8px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-fade-in-up absolute right-0 top-10 z-50 w-80 max-w-[calc(100vw-1.5rem)] glass-panel-solid rounded-xl p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] text-violet-400 hover:text-violet-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 space-y-1.5 overflow-y-auto wope-scroll">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={cn(
                    'flex w-full gap-2.5 rounded-lg p-2.5 text-left transition-colors',
                    n.read ? 'bg-transparent' : 'bg-violet-500/8'
                  )}
                >
                  <div className={cn(
                    'mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                    n.type === 'critical' ? 'bg-red-500/15 text-red-400' :
                    n.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                    n.type === 'warning' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-violet-500/15 text-violet-400'
                  )}>
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-medium text-white">{n.title}</p>
                      {!n.read && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">{n.time}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROFILE BUTTON — Dropdown with My Profile, Company, Tasks, Documents
// ═══════════════════════════════════════════════════════════════

function ProfileButton({
  user,
  profileImage,
  initials,
  role,
  onNavigate,
  onLogout,
}: {
  user: { name: string; email: string }
  profileImage: string | null
  initials: string
  role: AppRole
  onNavigate: (v: ViewKey) => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full p-0.5 transition-transform active:scale-95"
      >
        <Avatar className="h-8 w-8 border border-violet-500/30">
          {profileImage ? (
            <img src={profileImage} alt={user.name} className="h-full w-full rounded-full object-cover" />
          ) : null}
          <AvatarFallback className="bg-violet-500/20 text-[11px] font-semibold text-violet-300">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div className="anim-fade-in-up absolute right-0 top-11 z-50 w-64 glass-panel-solid rounded-xl p-2 shadow-2xl">
          {/* User info header */}
          <div className="flex items-center gap-2.5 rounded-lg p-2">
            <Avatar className="h-10 w-10 border border-violet-500/30">
              {profileImage ? (
                <img src={profileImage} alt={user.name} className="h-full w-full rounded-full object-cover" />
              ) : null}
              <AvatarFallback className="bg-violet-500/20 text-xs font-semibold text-violet-300">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">{user.email}</p>
              <div className="mt-0.5">
                <RoleBadge role={role} />
              </div>
            </div>
          </div>

          <div className="my-1.5 h-px bg-white/5" />

          {/* Menu items */}
          <div className="space-y-0.5">
            {PROFILE_MENU.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key)
                  setOpen(false)
                }}
                className="btn-press flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-violet-500/10 hover:text-white"
              >
                <span className="text-violet-400">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              </button>
            ))}
          </div>

          <div className="my-1.5 h-px bg-white/5" />

          {/* Logout */}
          <button
            onClick={onLogout}
            className="btn-press flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP SIDEBAR — Persistent left nav (lg+ only)
// ═══════════════════════════════════════════════════════════════

function DesktopSidebar({
  navItems,
  activeView,
  onNavigate,
  user,
  profileImage,
  initials,
  role,
  onLogout,
}: {
  navItems: NavItem[]
  activeView: ViewKey
  onNavigate: (v: ViewKey) => void
  user: { name: string; email: string }
  profileImage: string | null
  initials: string
  role: AppRole
  onLogout: () => void
}) {
  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-white/5 bg-[#0a0118]/60 backdrop-blur-xl lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/5 px-5">
        <div className="wope-logo-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white-gradient" style={{ fontFamily: 'var(--font-heading)' }}>Orioster</p>
          <p className="text-[10px] text-violet-400">AI-Powered HMS</p>
        </div>
      </div>

      {/* User card */}
      <div className="border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-violet-500/30">
            {profileImage ? (
              <img src={profileImage} alt={user.name} className="h-full w-full rounded-full object-cover" />
            ) : null}
            <AvatarFallback className="bg-violet-500/20 text-xs font-semibold text-violet-300">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <div className="mt-0.5">
              <RoleBadge role={role} />
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 wope-scroll">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'btn-press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
              activeView === item.key
                ? 'bg-violet-500/15 text-white shadow-[0_0_20px_rgba(113,61,255,0.15)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <span className={activeView === item.key ? 'text-violet-300' : ''}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        {/* Profile menu items */}
        <div className="my-2 h-px bg-white/5" />
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Account</p>
        {PROFILE_MENU.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'btn-press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
              activeView === item.key
                ? 'bg-violet-500/15 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <span className="text-violet-400">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-violet-500/5 px-3 py-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Privacy Firewall Active
        </div>
        <button
          onClick={onLogout}
          className="btn-press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════════
// BOTTOM NAVIGATION — 5 items, middle is the Menu button (mobile only)
// ═══════════════════════════════════════════════════════════════

function BottomNav({
  items,
  activeView,
  drawerOpen,
  onNavigate,
}: {
  items: Array<{ key: ViewKey; label: string; icon: ReactNode }>
  activeView: ViewKey
  drawerOpen: boolean
  onNavigate: (v: ViewKey) => void
}) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 lg:hidden">
      <div className="glass-strong mx-2 mb-2 flex items-center justify-around rounded-2xl px-2 py-2 shadow-2xl">
        {items.map((item, idx) => {
          const isMenu = item.label === 'Menu'
          const isActive = isMenu ? drawerOpen : activeView === item.key
          return (
            <button
              key={idx}
              onClick={() => onNavigate(item.key)}
              className={cn(
                'btn-press ripple flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all',
                isMenu
                  ? 'relative -mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_0_20px_rgba(113,61,255,0.4)]'
                  : isActive
                    ? 'text-violet-300'
                    : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {isMenu ? (
                <span className={cn('transition-transform', drawerOpen && 'rotate-90')}>
                  {item.icon}
                </span>
              ) : (
                item.icon
              )}
              <span className={cn('text-[9px] font-medium', isMenu && 'sr-only')}>{item.label}</span>
              {isActive && !isMenu && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-violet-400" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ═══════════════════════════════════════════════════════════════
// SIDE DRAWER — Premium glassmorphism, slides from left
// ═══════════════════════════════════════════════════════════════

function SideDrawer({
  open,
  onClose,
  navItems,
  activeView,
  onNavigate,
  user,
  profileImage,
  initials,
  role,
  onLogout,
}: {
  open: boolean
  onClose: () => void
  navItems: NavItem[]
  activeView: ViewKey
  onNavigate: (v: ViewKey) => void
  user: { name: string; email: string }
  profileImage: string | null
  initials: string
  role: AppRole
  onLogout: () => void
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm anim-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="glass-strong flex h-full flex-col rounded-r-2xl border-r border-violet-500/15 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 p-4">
            <div className="flex items-center gap-2.5">
              <div className="wope-logo-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Orioster</p>
                <p className="text-[10px] text-violet-400">AI-Powered HMS</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User card */}
          <div className="border-b border-white/5 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-violet-500/30">
                {profileImage ? (
                  <img src={profileImage} alt={user.name} className="h-full w-full rounded-full object-cover" />
                ) : null}
                <AvatarFallback className="bg-violet-500/20 text-sm font-semibold text-violet-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-[11px] text-slate-400">{user.email}</p>
                <div className="mt-1">
                  <RoleBadge role={role} />
                </div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-3 wope-scroll">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  'btn-press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
                  activeView === item.key
                    ? 'bg-violet-500/15 text-white shadow-[0_0_20px_rgba(113,61,255,0.15)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <span className={activeView === item.key ? 'text-violet-300' : ''}>{item.icon}</span>
                {item.label}
              </button>
            ))}

            {/* Profile menu items */}
            <div className="my-2 h-px bg-white/5" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Account</p>
            {PROFILE_MENU.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  'btn-press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
                  activeView === item.key
                    ? 'bg-violet-500/15 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <span className="text-violet-400">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-violet-500/5 px-3 py-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Privacy Firewall Active
            </div>
            <button
              onClick={onLogout}
              className="btn-press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

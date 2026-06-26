// ORIOSTER — Client state store (Zustand)
// Handles auth session, SPA navigation, profile, notifications, search
// Theme is now managed by next-themes (not Zustand) for proper SSR hydration.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppRole } from '@/lib/types'

// ── View Keys ─────────────────────────────────────────────────
// Admin-only views are isolated from general user views.
// The view switcher in page.tsx uses canAccessView() to enforce this.
export type ViewKey =
  // Shared views (all roles)
  | 'dashboard'
  | 'patients'
  | 'patient-detail'
  | 'patient-entry'
  | 'appointments'
  | 'lab-reports'
  // Admin-only views
  | 'ai-hub'
  | 'invoices'
  // Doctor/Admin views
  | 'orio-ai'
  // Account views (all roles)
  | 'my-profile'
  | 'my-company'
  | 'my-tasks'
  | 'my-documents'

// ── Role-Based View Access Control ────────────────────────────
// Defines which views each role can access. The view switcher
// filters rendered views based on the current user's role.
const ADMIN_ONLY_VIEWS: ViewKey[] = ['ai-hub', 'invoices']
const DOCTOR_ADMIN_VIEWS: ViewKey[] = ['orio-ai']
const LAB_TECH_VIEWS: ViewKey[] = ['lab-reports']

export function canAccessView(view: ViewKey, role: AppRole): boolean {
  if (ADMIN_ONLY_VIEWS.includes(view)) return role === 'ADMIN'
  if (DOCTOR_ADMIN_VIEWS.includes(view)) return role === 'DOCTOR' || role === 'ADMIN'
  if (LAB_TECH_VIEWS.includes(view)) return role === 'LAB_TECH' || role === 'DOCTOR' || role === 'ADMIN'
  return true
}

// Convenience sets for nav rendering
export const ADMIN_VIEWS = new Set<ViewKey>(ADMIN_ONLY_VIEWS)
export const USER_VIEWS = new Set<ViewKey>([
  'dashboard', 'patients', 'patient-detail', 'patient-entry', 'appointments', 'lab-reports',
])

interface SessionUser {
  id: string
  name: string
  email: string
  role: AppRole
}

export interface AppNotification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'critical'
}

interface AppState {
  // Auth
  user: SessionUser | null
  setUser: (u: SessionUser | null) => void
  logout: () => void

  // Navigation (SPA — single route, role-filtered)
  view: ViewKey
  setView: (v: ViewKey) => void

  // Active patient (for detail view / AI)
  activePatientId: string | null
  setActivePatient: (id: string | null) => void

  // Patient entry wizard draft (persists across navigation)
  wizardPatientId: string | null
  setWizardPatientId: (id: string | null) => void

  // Online/offline indicator (simulated sync status)
  online: boolean
  setOnline: (v: boolean) => void

  // Profile image (base64 data URL — uploaded by user)
  profileImage: string | null
  setProfileImage: (img: string | null) => void

  // Side drawer open state
  drawerOpen: boolean
  setDrawerOpen: (v: boolean) => void

  // Notifications
  notifications: AppNotification[]
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addNotification: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
}

const defaultNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'New patient registered',
    message: 'James Okoro has been admitted with fever and body ache.',
    time: '5m ago',
    read: false,
    type: 'info',
  },
  {
    id: 'n2',
    title: 'Critical triage alert',
    message: 'Liam O Connor requires immediate attention — RED triage.',
    time: '12m ago',
    read: false,
    type: 'critical',
  },
  {
    id: 'n3',
    title: 'AI diagnosis ready',
    message: 'Orio AI completed differential diagnosis for James Okoro.',
    time: '1h ago',
    read: false,
    type: 'success',
  },
  {
    id: 'n4',
    title: 'Lab report completed',
    message: 'CBC report for Mei Lin Zhao is ready for review.',
    time: '2h ago',
    read: true,
    type: 'info',
  },
]

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      logout: () => set({ user: null, view: 'dashboard', activePatientId: null, wizardPatientId: null }),

      view: 'dashboard',
      setView: (v) => {
        // Enforce role-based view access at the store level
        const role = get().user?.role
        if (role && !canAccessView(v, role)) return // silently block
        set({ view: v, drawerOpen: false })
      },

      activePatientId: null,
      setActivePatient: (id) => set({ activePatientId: id }),

      wizardPatientId: null,
      setWizardPatientId: (id) => set({ wizardPatientId: id }),

      online: true,
      setOnline: (v) => set({ online: v }),

      profileImage: null,
      setProfileImage: (img) => set({ profileImage: img }),

      drawerOpen: false,
      setDrawerOpen: (v) => set({ drawerOpen: v }),

      notifications: defaultNotifications,
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: `n${Date.now()}`, time: 'just now', read: false },
            ...s.notifications,
          ],
        })),

      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      searchOpen: false,
      setSearchOpen: (v) => set({ searchOpen: v }),
    }),
    {
      name: 'orioster-session',
      partialize: (s) => ({ user: s.user, view: s.view, profileImage: s.profileImage }),
    }
  )
)

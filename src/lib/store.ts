// ORIOSTER — Client state store (Zustand)
// Handles auth session, SPA navigation, profile, theme, notifications, search
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppRole } from '@/lib/types'

export type ViewKey =
  | 'dashboard'
  | 'patients'
  | 'patient-detail'
  | 'patient-entry'
  | 'orio-ai'
  | 'ai-hub'
  | 'appointments'
  | 'lab-reports'
  | 'invoices'
  | 'my-profile'
  | 'my-company'
  | 'my-tasks'
  | 'my-documents'

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

  // Navigation (SPA — single route)
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

  // Theme: 'dark' | 'light'
  theme: 'dark' | 'light'
  toggleTheme: () => void
  setTheme: (t: 'dark' | 'light') => void

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
      setView: (v) => set({ view: v, drawerOpen: false }),

      activePatientId: null,
      setActivePatient: (id) => set({ activePatientId: id }),

      wizardPatientId: null,
      setWizardPatientId: (id) => set({ wizardPatientId: id }),

      online: true,
      setOnline: (v) => set({ online: v }),

      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('light', next === 'light')
          document.documentElement.classList.toggle('dark', next === 'dark')
        }
      },
      setTheme: (t) => {
        set({ theme: t })
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('light', t === 'light')
          document.documentElement.classList.toggle('dark', t === 'dark')
        }
      },

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
      partialize: (s) => ({ user: s.user, view: s.view, theme: s.theme, profileImage: s.profileImage }),
    }
  )
)

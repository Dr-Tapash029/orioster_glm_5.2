// ORIOSTER — Client state store (Zustand)
// Handles auth session + SPA navigation (single-route app)
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
  | 'staff'
  | 'settings'

interface SessionUser {
  id: string
  name: string
  email: string
  role: AppRole
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      logout: () => set({ user: null, view: 'dashboard', activePatientId: null, wizardPatientId: null }),

      view: 'dashboard',
      setView: (v) => set({ view: v }),

      activePatientId: null,
      setActivePatient: (id) => set({ activePatientId: id }),

      wizardPatientId: null,
      setWizardPatientId: (id) => set({ wizardPatientId: id }),

      online: true,
      setOnline: (v) => set({ online: v }),
    }),
    {
      name: 'orioster-session',
      partialize: (s) => ({ user: s.user, view: s.view }),
    }
  )
)

'use client'

import { useAppStore, canAccessView } from '@/lib/store'
import { LoginScreen } from '@/components/orioster/login-screen'
import { AppShell } from '@/components/orioster/app-shell'
import { SearchOverlay } from '@/components/orioster/search-overlay'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import type { ViewKey } from '@/lib/store'

// ── View imports organized by role access ─────────────────────
import { DashboardView, PatientsListView, PatientDetailView, PatientEntryWizard, OrioAiView, AppointmentsView, LabReportsView } from '@/components/dashboard/user'
import { AiHubView, InvoicesView } from '@/components/dashboard/admin'
import { MyProfileView, MyCompanyView, MyTasksView, MyDocumentsView } from '@/components/dashboard/shared'

// ── Page transition variants ──────────────────────────────────
const viewVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
}
const viewTransition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }

// ── View → Component registry ─────────────────────────────────
// Separated into Admin / User / Shared buckets for clarity.
// The view switcher below filters by role before rendering.
const VIEW_REGISTRY: Record<ViewKey, () => React.ReactElement> = {
  // User views
  dashboard: DashboardView,
  patients: PatientsListView,
  'patient-detail': PatientDetailView,
  'patient-entry': PatientEntryWizard,
  'orio-ai': OrioAiView,
  appointments: AppointmentsView,
  'lab-reports': LabReportsView,
  // Admin views
  'ai-hub': AiHubView,
  invoices: InvoicesView,
  // Shared account views
  'my-profile': MyProfileView,
  'my-company': MyCompanyView,
  'my-tasks': MyTasksView,
  'my-documents': MyDocumentsView,
}

export default function Home() {
  const { user, view } = useAppStore()

  // ── Role-based view filtering ───────────────────────────────
  // If the current user's role cannot access the requested view,
  // fall back to the dashboard. This is the primary layout
  // conditional shell that isolates Admin views from User views.
  const effectiveView = useMemo<ViewKey>(() => {
    if (!user) return 'dashboard'
    if (canAccessView(view, user.role)) return view
    return 'dashboard' // fallback for unauthorized access attempts
  }, [view, user])

  // ── Unauthenticated → Login ─────────────────────────────────
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <LoginScreen />
      </motion.div>
    )
  }

  // ── Authenticated → Role-filtered view switcher ─────────────
  const ViewComponent = VIEW_REGISTRY[effectiveView] ?? DashboardView

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveView}
          variants={viewVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={viewTransition}
          className="min-h-0"
        >
          <ViewComponent />
        </motion.div>
      </AnimatePresence>
      <SearchOverlay />
    </AppShell>
  )
}

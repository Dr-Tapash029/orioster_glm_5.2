'use client'

import { useAppStore } from '@/lib/store'
import { LoginScreen } from '@/components/orioster/login-screen'
import { AppShell } from '@/components/orioster/app-shell'
import { SearchOverlay } from '@/components/orioster/search-overlay'
import { DashboardView } from '@/components/orioster/views/dashboard'
import { PatientsListView } from '@/components/orioster/views/patients-list'
import { PatientDetailView } from '@/components/orioster/views/patient-detail'
import { PatientEntryWizard } from '@/components/orioster/views/patient-entry-wizard'
import { OrioAiView } from '@/components/orioster/views/orio-ai'
import { AiHubView } from '@/components/orioster/views/ai-hub'
import { AppointmentsView } from '@/components/orioster/views/appointments'
import { LabReportsView } from '@/components/orioster/views/lab-reports'
import { InvoicesView } from '@/components/orioster/views/invoices'
import { MyProfileView, MyCompanyView, MyTasksView, MyDocumentsView } from '@/components/orioster/views/profile-views'
import { motion, AnimatePresence } from 'framer-motion'

const viewVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
}

const viewTransition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }

export default function Home() {
  const { user, view } = useAppStore()

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

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          variants={viewVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={viewTransition}
        >
          {view === 'dashboard' && <DashboardView />}
          {view === 'patients' && <PatientsListView />}
          {view === 'patient-detail' && <PatientDetailView />}
          {view === 'patient-entry' && <PatientEntryWizard />}
          {view === 'orio-ai' && <OrioAiView />}
          {view === 'ai-hub' && <AiHubView />}
          {view === 'appointments' && <AppointmentsView />}
          {view === 'lab-reports' && <LabReportsView />}
          {view === 'invoices' && <InvoicesView />}
          {view === 'my-profile' && <MyProfileView />}
          {view === 'my-company' && <MyCompanyView />}
          {view === 'my-tasks' && <MyTasksView />}
          {view === 'my-documents' && <MyDocumentsView />}
        </motion.div>
      </AnimatePresence>
      <SearchOverlay />
    </AppShell>
  )
}

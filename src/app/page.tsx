'use client'

import { useAppStore } from '@/lib/store'
import { LoginScreen } from '@/components/orioster/login-screen'
import { AppShell } from '@/components/orioster/app-shell'
import { DashboardView } from '@/components/orioster/views/dashboard'
import { PatientsListView } from '@/components/orioster/views/patients-list'
import { PatientDetailView } from '@/components/orioster/views/patient-detail'
import { PatientEntryWizard } from '@/components/orioster/views/patient-entry-wizard'
import { OrioAiView } from '@/components/orioster/views/orio-ai'
import { AiHubView } from '@/components/orioster/views/ai-hub'
import { AppointmentsView } from '@/components/orioster/views/appointments'
import { LabReportsView } from '@/components/orioster/views/lab-reports'
import { InvoicesView } from '@/components/orioster/views/invoices'

export default function Home() {
  const { user, view } = useAppStore()

  if (!user) {
    return <LoginScreen />
  }

  return (
    <AppShell>
      {view === 'dashboard' && <DashboardView />}
      {view === 'patients' && <PatientsListView />}
      {view === 'patient-detail' && <PatientDetailView />}
      {view === 'patient-entry' && <PatientEntryWizard />}
      {view === 'orio-ai' && <OrioAiView />}
      {view === 'ai-hub' && <AiHubView />}
      {view === 'appointments' && <AppointmentsView />}
      {view === 'lab-reports' && <LabReportsView />}
      {view === 'invoices' && <InvoicesView />}
    </AppShell>
  )
}

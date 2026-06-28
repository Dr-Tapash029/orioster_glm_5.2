// ═══════════════════════════════════════════════════════════════
// USER VIEWS — General user views (all clinical roles)
// Access is further filtered by role (e.g. Orio AI = Doctor/Admin only)
// via the canAccessView() guard in the Zustand store.
// ═══════════════════════════════════════════════════════════════

export { DashboardView } from '@/components/orioster/views/dashboard'
export { PatientsListView } from '@/components/orioster/views/patients-list'
export { PatientDetailView } from '@/components/orioster/views/patient-detail'
export { PatientEntryWizard } from '@/components/orioster/views/patient-entry-wizard'
export { OrioAiView } from '@/components/orioster/views/orio-ai'
export { AppointmentsView } from '@/components/orioster/views/appointments'
export { LabReportsView } from '@/components/orioster/views/lab-reports'

// ORIOSTER — Dashboard stats API
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [
    totalPatients,
    draftPatients,
    completedPatients,
    reviewedPatients,
    totalAppointments,
    scheduledAppts,
    inProgressAppts,
    totalStaff,
    doctors,
    nurses,
    totalAiResults,
    totalLabReports,
    totalInvoices,
    redTriage,
    yellowTriage,
    greenTriage,
    recentPatients,
  ] = await Promise.all([
    db.patient.count(),
    db.patient.count({ where: { status: 'DRAFT' } }),
    db.patient.count({ where: { status: 'COMPLETED' } }),
    db.patient.count({ where: { status: 'REVIEWED' } }),
    db.appointment.count(),
    db.appointment.count({ where: { status: 'SCHEDULED' } }),
    db.appointment.count({ where: { status: 'IN_PROGRESS' } }),
    db.staff.count({ where: { isActive: true } }),
    db.staff.count({ where: { role: 'DOCTOR', isActive: true } }),
    db.staff.count({ where: { role: 'NURSE', isActive: true } }),
    db.aiResult.count(),
    db.labReport.count(),
    db.invoice.count(),
    db.vitals.count({ where: { triageLevel: 'RED' } }),
    db.vitals.count({ where: { triageLevel: 'YELLOW' } }),
    db.vitals.count({ where: { triageLevel: 'GREEN' } }),
    db.patient.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        vitals: { orderBy: { recordedAt: 'desc' }, take: 1 },
        appointments: { include: { doctor: true }, take: 1 },
      },
    }),
  ])

  const syncStats = {
    synced: await db.patient.count({ where: { syncStatus: 'SYNCED' } }),
    queued: await db.patient.count({ where: { syncStatus: 'QUEUED' } }),
    draft: await db.patient.count({ where: { syncStatus: 'DRAFT' } }),
  }

  return NextResponse.json({
    stats: {
      totalPatients,
      draftPatients,
      completedPatients,
      reviewedPatients,
      totalAppointments,
      scheduledAppts,
      inProgressAppts,
      totalStaff,
      doctors,
      nurses,
      totalAiResults,
      totalLabReports,
      totalInvoices,
      triage: { red: redTriage, yellow: yellowTriage, green: greenTriage },
      sync: syncStats,
    },
    recentPatients,
  })
}

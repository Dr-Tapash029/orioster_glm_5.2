// ORIOSTER — Orio AI API (Clinical Decision Support — advisory only)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { runOrioTask } from '@/lib/orio-ai'
import type { AiTaskType } from '@/lib/types'
import { MANDATORY_DISCLAIMER } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { patientId, task, customSummary } = await req.json()
    if (!patientId || !task) {
      return NextResponse.json({ error: 'patientId and task required' }, { status: 400 })
    }

    const patient = await db.patient.findUnique({
      where: { id: patientId },
      include: { vitals: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // ── PRIVACY FIREWALL: AI requires patient_summary_v1 (Step 8 complete) ──
    const summary = customSummary || patient.localSummary
    if (!summary) {
      return NextResponse.json(
        {
          error:
            'AI_DISABLED: patient_summary_v1 not generated yet. Complete Step 8 (Local Summary) first. AI is hard-disabled until the privacy firewall is in place.',
          blocked: true,
        },
        { status: 403 }
      )
    }

    const taskType = task as AiTaskType
    const result = await runOrioTask(taskType, summary)

    // Save AI result (advisory)
    const aiResult = await db.aiResult.create({
      data: {
        patientId,
        taskType,
        summary: result.output.summary,
        riskLevel: result.output.risk_level,
        confidence: result.output.confidence,
        limitations: JSON.stringify(result.output.limitations),
        recommendationType: 'advisory',
        disclaimer: MANDATORY_DISCLAIMER,
        tierUsed: result.tierUsed,
        modelUsed: result.modelUsed,
        fullOutput: JSON.stringify(result.output),
        createdBy: patient.createdBy,
      },
    })

    // If this is the notify-doctor task, update notification status
    if (taskType === 'NOTIFY_DOCTOR') {
      await db.patient.update({
        where: { id: patientId },
        data: { notificationStatus: 'SENT' },
      })
    }

    return NextResponse.json({
      result: aiResult,
      output: result.output,
      tierUsed: result.tierUsed,
      modelUsed: result.modelUsed,
      disclaimer: result.disclaimer,
    })
  } catch (e) {
    const msg = (e as Error).message
    const status = msg.includes('PHI_VIOLATION') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

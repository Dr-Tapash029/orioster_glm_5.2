# Task ID: 5 — Patient Entry Wizard
**Agent:** patient-entry-wizard-agent (Z.ai Code subagent)
**File:** `src/components/orioster/views/patient-entry-wizard.tsx`

## Task
Build the ORIOSTER Patient Entry Wizard — a 10-step offline-first patient intake flow with:
- Hard rule: steps cannot be skipped; complete step N before N+1
- Per-step autosave (PATCH the patient after each step)
- Step 8 (Local Summary) is STRICTLY LOCAL — generates `patient_summary_v1` privacy firewall; NO AI, NO NETWORK
- AI hard-disabled until Step 8 complete
- Step 9 (Notify Doctor) MAY use AI but only with `patient_summary_v1` as input
- Step 10 requires role checklist validation before final submit
- FAB / "Add Patient" entry must be one tap

## Work Log
1. Read `/home/z/my-project/worklog.md` — prior agent (Task 1) had set up the foundation (Prisma schema, glass theme, app shell).
2. Reviewed the available context:
   - `src/lib/types.ts` — got `WIZARD_STEPS`, `CHIEF_COMPLAINTS`, `PAST_HISTORY_TAGS`, `COMMON_MEDICATIONS`, `ALLERGY_SEVERITIES`, `MANDATORY_DISCLAIMER`, `computeTriageLevel`, `AppRole`, `TriageLevel`.
   - `src/lib/store.ts` — Zustand store with `user`, `setView`, `wizardPatientId`, `setWizardPatientId`, `online`.
   - `src/components/orioster/ui-primitives.tsx` — `GlassPanel` (variants default/strong/subtle), `TriageBadge`, `DisclaimerChip`, `ConfidenceMeter`, `SectionHeader`, `SyncStatusBadge`.
   - API endpoints: `/api/patients` (POST), `/api/patients/[id]` (GET/PATCH), `/api/vitals` (POST), `/api/appointments` (POST), `/api/summary` (POST — local), `/api/orio-ai` (POST — handles `blocked: true`), `/api/staff?role=DOCTOR` (GET).
3. Replaced the stub at `src/components/orioster/views/patient-entry-wizard.tsx` with a complete ~2500-line single-file implementation.
4. Implemented all 10 step components:
   - **Step 1 (General Information)**: full demographics form (name, gender, age, DOB, contact, address, local ID, blood group, height, weight, profession, education) + consent checkbox. POST creates patient on first save; PATCH on subsequent saves. Generates temporary local ID `PT-XXXXXXXX`.
   - **Step 2 (Chief Complaint)**: structured dropdown of `CHIEF_COMPLAINTS` + capped free-text notes (300 chars) + duration.
   - **Step 3 (Past History)**: multi-select chips from `PAST_HISTORY_TAGS` with "None" exclusion logic + capped notes (400 chars).
   - **Step 4 (Ongoing Medications)**: add/remove drug entries from `COMMON_MEDICATIONS` dropdown or custom, dose, frequency. Duplicate-drug detection (case-insensitive) shows inline warning.
   - **Step 5 (Vitals)**: temperature, BP systolic/diastolic, heart rate, SpO₂, weight, height. Real-time triage preview using `computeTriageLevel()` (no AI). Abnormal-value flag list. POSTs to `/api/vitals` which returns the saved triage level.
   - **Step 6 (Hypersensitivity)**: add allergen + severity (from `ALLERGY_SEVERITIES`). "No known allergies" button clears entries and marks `None`. Defaults to "None" if no allergies field yet.
   - **Step 7 (Assign Doctor)**: fetches doctors from `/api/staff?role=DOCTOR`, date picker + 13 time-slot dropdown. POSTs to `/api/appointments` with `status: 'SCHEDULED'`.
   - **Step 8 (Local Summary)**: CRITICAL privacy firewall step. Auto-calls `POST /api/summary` on mount if not yet generated. Shows the de-identified `patient_summary_v1` in a monospace styled box, compression ratio with progress bar (target ≥70%), and a prominent "Privacy Firewall" banner. Regenerate button. NO AI, NO NETWORK beyond local DB call.
   - **Step 9 (Notify Doctor)**: auto-calls `POST /api/orio-ai` with `{patientId, task: 'NOTIFY_DOCTOR'}` on mount. Inline non-blocking spinner (not full-screen). Renders AI-enhanced summary + key attention points + ConfidenceMeter + tier/model routing info + DisclaimerChip + collapsible limitations. Handles `blocked: true` (shouldn't happen post-Step-8, but handled gracefully with explanatory error). Falls back to "Queued locally" state on network failure or offline mode (sets `notificationStatus: 'QUEUED'`).
   - **Step 10 (Review & Submit)**: role-based checklist (NURSE: vitals+triage recorded, allergies check; DOCTOR: diagnosis reviewed, RX reviewed; ADMIN: appointment scheduled, billing verified; LAB_TECH: required labs listed) + auto-verified items (consent, summary firewall) locked. Mandatory manual tick on "AI outputs are advisory only — I retain final clinical responsibility". Submit disabled until all checks pass. On submit, PATCHes patient to `status: 'COMPLETED'`, `syncStatus: 'QUEUED'`, shows success toast, clears `wizardPatientId`, navigates to `patients` view.
5. Built shared helpers and primitives inside the same file:
   - `ProgressRail` — mobile horizontal scroller with progress bar
   - `VerticalStepper` — desktop left-rail stepper with locked-future-step indicator, firewall/AI badges
   - `SavedIndicator` — "Saving locally…" / "Saved locally" toast-style inline indicator
   - `Field`, `StepFooter`, `ContinueButton`, `SummaryRow` — layout primitives
6. Implemented resume-from-draft logic: if `wizardPatientId` is set on mount, fetches `/api/patients/{id}` and restores completed steps by inspecting field presence (fullName+consent → step 1, chiefComplaint → step 2, etc.) plus the patient's relations (vitals → step 5, appointments → step 7). Resumes at first non-completed step.
7. Enforced "no skipping ahead" rule: the vertical stepper and progress rail buttons only allow jumping to completed or already-reached steps. Future steps are visually locked (Lock icon, dimmed).
8. Used framer-motion `AnimatePresence` with subtle 220ms slide+fade step transitions (kept 60fps-friendly).
9. Wired up Sonner `toast` for feedback on every save/error.
10. Ran `bun run lint` — fixed two issues in my file:
    - Removed an unused `eslint-disable` comment (auto-resolved by React 19 hooks rule).
    - Refactored the Step 10 checklist state to use `useMemo`-derived `checked` (auto-verified OR manually-checked) instead of `setState`-inside-`useEffect`, satisfying `react-hooks/set-state-in-effect`.
11. Verified dev server: HTTP 200 on root load, no compile errors in `dev.log` after fixes.

## Stage Summary
- **Single client component** (`'use client'`) at `src/components/orioster/views/patient-entry-wizard.tsx` (~2500 lines) — all 10 step components + helpers defined inside the same file as per spec.
- **All 10 steps implemented** with per-step validation, autosave (POST/PATCH), and forward navigation gate.
- **Privacy firewall enforced**: Step 8 is strictly local; Step 9 AI call is gated by `/api/orio-ai` server-side check returning `blocked: true` if `patient_summary_v1` is missing, and the client handles this gracefully.
- **Offline-first**: Step 9 falls back to "Queued locally" if network fails or `online` flag is false.
- **Role-aware Step 10 checklist** dynamically renders different items for NURSE / DOCTOR / ADMIN / LAB_TECH.
- **Resume from draft**: in-progress patient is restored across navigation via `wizardPatientId` Zustand state.
- **Lint clean** for this file. (2 pre-existing errors in `patient-detail.tsx` from another agent — not my scope.)
- **Dev server compiles** successfully (HTTP 200, no errors in `dev.log`).
- **UI**: glassmorphism panels (`GlassPanel variant="strong"` for step content, `variant="subtle"` for info boxes), horizontal scroller on mobile + vertical rail on desktop, emerald theme for firewall, violet theme for AI step, framer-motion step transitions.

## Files Touched
- `src/components/orioster/views/patient-entry-wizard.tsx` — complete rewrite (replaced stub)

## What the Next Agent Should Know
- The wizard expects the user to be logged in (via `useAppStore().user`). If you build login or staff seeding, ensure at least one DOCTOR staff exists (Step 7 fetches from `/api/staff?role=DOCTOR`).
- The wizard assumes `wizardPatientId` is cleared on submit. If you build a "resume draft" inbox, you can read patients with `status: 'DRAFT'` from `/api/patients?status=DRAFT` and call `setWizardPatientId(id)` then `setView('patient-entry')`.
- Step 8 calls `/api/summary` which calls `generatePatientSummaryV1()` from `src/lib/orio-ai.ts` — the privacy firewall logic lives there. The compression-ratio calculation is also there.
- Step 9 calls `/api/orio-ai` with `task: 'NOTIFY_DOCTOR'`. The server returns `{ result, output, tierUsed, modelUsed, disclaimer }` on success or `{ error, blocked: true }` (HTTP 403) if no `patient_summary_v1` exists yet.

# Task MOBILE-3 — Mobile Optimization Agent

## Task
Mobile-optimize 4 view files in the Orioster HMS app for mobile devices:
- `src/components/orioster/views/patient-entry-wizard.tsx` (~2500 lines, 10-step wizard)
- `src/components/orioster/views/orio-ai.tsx` (~990 lines, AI clinical decision support)
- `src/components/orioster/views/ai-hub.tsx` (~980 lines, AI document generation)
- `src/components/orioster/views/patient-detail.tsx` (~1050 lines, patient record with 6 tabs)

## Approach
Read each file end-to-end, then applied targeted MultiEdit batches per file. Used cascading Tailwind descendant selectors (`[&_input]:h-10 [&_[data-slot=select-trigger]]:h-10`) on the wizard's Field wrapper to enforce 44px touch targets across all inputs/selects/textareas with one change. For tables that don't fit mobile (prescription, lab parameters, invoice line items, vitals history), introduced a mobile card/list variant (`lg:hidden`) alongside the desktop table (`hidden lg:block`) — same data, two presentations. Wrapped DisclaimerChip usages with `[&_div]:text-[10px] lg:[&_div]:text-xs` to shrink disclaimer text on mobile without modifying the shared component.

## Key Decisions
- **Progress rail**: Refactored to vertical circles (h-7 w-7) with step numbers + 10px labels under each, in a `flex overflow-x-auto wope-scroll` horizontal scroller (replaced shadcn ScrollArea which was overkill and removed the now-unused import).
- **Step content padding**: Standardized on `p-3 lg:p-5` for the wizard GlassPanel; `p-3 lg:p-5/lg:p-6` for top-level panels elsewhere.
- **Form fields**: Single Field edit cascades h-10 to every input/select descendant; explicit `text-sm` to ensure readable input text.
- **Vitals step**: Added normal-range hints (e.g. "36.5–37.5" for temperature) via the existing `hint` Field prop. Changed grid from `sm:grid-cols-2 lg:grid-cols-3` to plain `sm:grid-cols-2` per spec.
- **Medications/Allergies**: Each entry card `p-2.5 sm:p-3`, grid `grid-cols-1 sm:grid-cols-[...]` so columns stack on mobile. Remove button `h-8 w-8` icon-only with flex-shrink-0.
- **Step 10 review**: Checklist items now `min-h-[40px] p-2.5 lg:p-3`, label `text-xs lg:text-sm`. Submit button `h-11 w-full sm:w-auto`.
- **Navigation**: Back button uses `fx-btn-border-trace fx-btn-border-trace-sm btn-press ripple h-9`. ContinueButton is `h-10 w-full sm:w-auto`. StepFooter stacks vertically on mobile (`flex-col gap-2 sm:flex-row`).
- **AI Hub dialog**: Changed from `w-[95vw] max-w-3xl` to `w-[calc(100vw-1.5rem)] max-w-md lg:max-w-3xl` for true mobile sizing.
- **Doc cards**: 2×2 grid on mobile (`grid-cols-2 gap-2`), 4-col on desktop (`lg:grid-cols-4`). Icon `h-8 w-8` mobile, `lg:h-11 lg:w-11`.
- **Patient detail tabs**: Shortened "AI Results" → "AI" to fit in 6-col grid on mobile. Min-width 560px ensures horizontal scroll on small screens.
- **Vitals tab**: Mobile shows each record as a card with 2-col mini grid (Temp/BP/HR/SpO₂/Weight), desktop keeps the wide table.
- **AI result cards**: Each p-3 lg:p-5. Rich expanded content uses text-[11px] on mobile, lg:text-sm on desktop. Prescription sub-table inside expanded view also has mobile-card / desktop-table split.
- **Lab reports + Invoices**: Mobile list cards with key info, desktop tables retained. All numeric values use `tabular-nums` for alignment.

## Verification
- `bun run lint` → exit 0, 0 errors ✓
- `tail -10 /home/z/my-project/dev.log` → only "✓ Compiled in Nms" entries, no compile errors ✓
- Visually inspected all 4 files post-edit; duplicate `lg:p-X lg:p-Y` classes cleaned up via sed

## Files Changed
- `src/components/orioster/views/patient-entry-wizard.tsx`
- `src/components/orioster/views/orio-ai.tsx`
- `src/components/orioster/views/ai-hub.tsx`
- `src/components/orioster/views/patient-detail.tsx`

(All work logged in `/home/z/my-project/worklog.md` under Task ID: MOBILE-3.)

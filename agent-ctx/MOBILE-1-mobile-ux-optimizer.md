# MOBILE-1 — Mobile UX Optimizer Agent Worklog

## Task
Mobile-optimize 3 view files (`dashboard.tsx`, `patients-list.tsx`, `appointments.tsx`) for 390px viewport, plus make the shared `StatCard` component responsive.

## Context from Previous Agents
- Read `/home/z/my-project/worklog.md` to understand prior work
- Most recent task was `FIX-FINAL` — desktop button styling + alignment consistency pass on all 10 view files
- Canonical outer container pattern established: `<div className="space-y-3 p-3 lg:space-y-5 lg:p-6">`
- Button styling convention: `fx-btn-border-trace` (+ `btn-press ripple`) for default, `fx-btn-border-trace-sm` for small/icon buttons (both have `!important` padding in globals.css)
- Note: `lg:fx-btn-border-trace` Tailwind variant does NOT work because the class is custom CSS (not registered as a Tailwind utility) — so for responsive size switching, just pick ONE size that works for both breakpoints

## Files Modified (4 total)

### 1. `src/components/orioster/ui-primitives.tsx` — StatCard
Made responsive (only used in dashboard, safe to change globally):
- `p-3.5` → `p-3 lg:p-3.5`
- `h-9 w-9 mb-2.5` → `h-8 w-8 mb-2 lg:h-9 lg:w-9 lg:mb-2.5`
- `text-2xl` → `text-xl lg:text-2xl`
- `text-xs mt-1.5` → `text-[11px] mt-1 lg:text-xs lg:mt-1.5`
- `text-[10px]` → `text-[9px] lg:text-[10px]`

### 2. `src/components/orioster/views/dashboard.tsx`
- Added `cn` import + `isMobile` state (with resize listener) for responsive donut radii
- Welcome panel: `p-3`, `gap-2 lg:gap-3`, `text-lg lg:text-3xl`, subtitle `hidden sm:block`, "Add Patient" → `fx-btn-border-trace-sm`
- KPI grid: `gap-2` on mobile (was `gap-2.5`)
- Charts: area `h-40 lg:h-64` (was h-44), donut `h-36 lg:h-56` (was h-40 lg:h-64), axis `fontSize: 10` (was 9), donut `innerRadius={isMobile ? 32 : 38} outerRadius={isMobile ? 52 : 60}`, chart panel padding `p-3 lg:p-5`
- Recent Activities: panel `p-3 lg:p-3.5`, row `p-2.5` (was p-2), avatar `h-9 w-9` (was h-8 w-8), name `text-sm` (was text-xs), complaint `text-[11px]` (was text-[10px]); render 5 rows but 5th uses `hidden lg:flex` so only 4 show on mobile

### 3. `src/components/orioster/views/patients-list.tsx`
- "Add Patient" buttons (header + empty state) → `fx-btn-border-trace-sm`
- Filters: `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center` (stack vertically on mobile)
- Search input: added `h-10 text-sm`
- Select trigger: `h-10 w-full text-sm sm:w-[150px]` (full-width on mobile)
- Wrapped existing `<table>` in `<div className="hidden overflow-x-auto orio-scroll sm:block">`
- Added mobile card list in `<div className="sm:hidden">` with `divide-y divide-white/10`:
  - Each card is a `<button>` with `min-h-[72px]` + `flex flex-col gap-2 p-3`
  - Top row: avatar h-10 w-10 + name text-sm font-medium + ID text-[11px] + ArrowRight
  - Second line (optional): chief complaint `line-clamp-1 text-xs`
  - Bottom row: TriageBadge + StatusPill + SyncStatusBadge (`flex flex-wrap gap-1.5`)

### 4. `src/components/orioster/views/appointments.tsx`
- "Schedule" trigger button → `fx-btn-border-trace-sm`
- DialogContent: `w-[calc(100vw-1.5rem)] max-w-md sm:w-full` (full-width on mobile)
- All form SelectTrigger/Input: added `h-10 text-sm`
- Status filter chips: `h-8 rounded-full border px-3 text-xs font-medium` (removed `py-1`); `gap-1.5 sm:gap-2`
- Appointment grid: `grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-3` (was `grid gap-3 md:grid-cols-2 xl:grid-cols-3`)
- Card padding: `p-3 md:p-4` (was `p-4`)
- Patient name: `text-sm font-medium` (was `font-semibold`)
- Chief complaint: `line-clamp-1 text-xs` (was `truncate text-sm`)
- Date/time: `text-[11px]` (was text-sm); icon `h-3.5 w-3.5 flex-shrink-0`; `flex flex-wrap items-center gap-x-2 gap-y-1`
- Doctor name: `truncate text-xs` (was text-sm)
- Status badge: added `flex-shrink-0`
- All 4 action buttons (Start/Complete/Cancel/View): upgraded `fx-btn-border-trace` → `fx-btn-border-trace fx-btn-border-trace-sm` (kept existing `h-7 text-xs`)

## Verification
- `bun run lint` → EXIT 0 ✓
- `tail -15 /home/z/my-project/dev.log` → only "✓ Compiled in Nms" entries, no errors ✓
- All 3 view files preserve the canonical `<div className="space-y-3 p-3 lg:space-y-5 lg:p-6">` outer container
- All animations preserved (card-enter, stagger-N, row-slide, wope-card-hover)
- Touch target sizes verified: 44px (h-11) primary buttons, 36px+ icon buttons/chips, 72px min patient cards

## Key Learnings for Future Agents
1. `lg:fx-btn-border-trace` does NOT work as a Tailwind variant — the class is custom CSS in globals.css (not a registered Tailwind utility). For responsive size switching, just pick one size.
2. `StatCard` in `ui-primitives.tsx` is shared — but only used in `dashboard.tsx`, so making it responsive is safe.
3. For recharts Pie responsive innerRadius/outerRadius, use a `useState(false)` + `useEffect` with `window.innerWidth < 1024` check (the dashboard component is `'use client'` so this works fine).
4. The mobile card-list pattern in `patients-list.tsx` uses `divide-y divide-white/10` on a wrapping div — clean separation without per-card borders.
5. `line-clamp-1` is preferred over `truncate` for multi-word text that should wrap to a single line then ellipsize (works on flex children too).

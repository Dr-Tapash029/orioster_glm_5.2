# 🩺 Orioster — AI-Powered HMS

> **Offline-first, AI-assisted hospital management system** engineered for low-resource healthcare environments. Local SQLite is the primary runtime authority; AI is advisory only and never blocks clinical workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Design Philosophy](#design-philosophy)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Project Structure](#project-structure)
- [The 10-Step Patient Entry Wizard](#the-10-step-patient-entry-wizard)
- [Orio AI — Clinical Decision Support](#orio-ai--clinical-decision-support)
- [Privacy & Security](#privacy--security)
- [Screenshots](#screenshots)
- [API Reference](#api-reference)
- [License](#license)

---

## Overview

**Orioster** is a production-ready hospital management system that operates as a **local-first clinical operating system** with asynchronous AI augmentation. It is purpose-built for settings where network connectivity is intermittent or unavailable — remote medical camps, community clinics, and district hospitals.

The application adapts the original ORIOSTER specification (Flutter + PowerSync + Supabase + OpenRouter) to a modern web stack (Next.js + Prisma + SQLite + z-ai-web-dev-sdk), preserving all core principles: offline-first operation, AI sandboxed behind a privacy firewall, and human-controlled clinical authority.

### Target Users

| Role | Code | Primary Function |
|---|---|---|
| **Doctor** | `DOC` | Clinical decisions, diagnosis confirmation, AI review, prescriptions |
| **Nurse** | `NUR` | Patient intake, vitals recording, entry wizard execution |
| **Administrator** | `ADM` | Scheduling, invoicing, staff management, AI Hub access |
| **Lab Technician** | `LAB` | Lab report parameter entry, AI analysis trigger |

---

## Key Features

### Core Clinical Workflows
- ✅ **10-Step Patient Entry Wizard** — structured intake with autosave, no-skip validation, and role-based final sign-off
- ✅ **Vitals Recording** with local triage logic (GREEN/YELLOW/RED) — no AI required
- ✅ **Chief Complaint Capture** — structured dropdown + capped free-text
- ✅ **Past History Tagging** — structured tags for token compression
- ✅ **Ongoing Medications** with duplicate-drug detection
- ✅ **Hypersensitivity/Allergy Recording** with severity tagging
- ✅ **Appointment Scheduling** with doctor assignment and time slots
- ✅ **Role-Based Dashboards** for Doctor, Nurse, Admin, and Lab Tech

### AI-Assisted Modules (Orio AI)
- ✅ **Differential Diagnosis** — 3 most-probable diagnoses with confidence meter
- ✅ **Treatment Plan Generation** — post doctor-confirmed diagnosis
- ✅ **Prescription Generation** — doctor-confirmed, customizable, export-ready
- ✅ **Lab Report Analysis** — parametric entry + AI clinical feedback
- ✅ **Invoice Generation** — AI-filled, fixed template, itemized
- ✅ **AI Hub** — central command for invoice, labs, prescriptions, medical certificates

### Infrastructure
- ✅ **Offline-First** — local SQLite is the runtime authority
- ✅ **Privacy Firewall** — AI receives only de-identified `patient_summary_v1`
- ✅ **4-Tier AI Failover** — automatic retry across model tiers (≤15s timeout)
- ✅ **Mandatory Disclaimers** on every AI output
- ✅ **Dark Navy + Cyan Glassmorphism** UI design system
- ✅ **Responsive** — mobile and desktop

---

## Design Philosophy

> **Offline-first · Cache-first · Human-controlled · AI is assistive, never authoritative.**

1. **Local SQLite is the primary runtime authority** — network is never required for core clinical workflows
2. **AI never blocks the UI** — all AI calls are asynchronous and non-blocking
3. **AI is advisory only** — the doctor always has the final say on every clinical output
4. **Raw PHI never leaves the device** — AI receives only a de-identified, compressed (≥70%) summary
5. **AI is hard-disabled until Step 8** — the privacy firewall must be in place before any AI call
6. **Every AI output carries a disclaimer** — "This output is not a diagnosis and must be reviewed by a human professional."

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com/) (New York) |
| **Database** | Prisma ORM + SQLite (local-first) |
| **AI SDK** | `z-ai-web-dev-sdk` (backend only) |
| **State** | Zustand (client) |
| **Server State** | TanStack Query |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |
| **Forms** | React Hook Form + Zod |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ 
- [Bun](https://bun.sh/) (recommended package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/Dr-Tapash029/orioster_glm_5.2.git
cd orioster_glm_5.2

# Install dependencies
bun install

# Set up the database
bun run db:push

# (Optional) Seed demo data
bun run prisma/seed.ts

# Start the development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./db/custom.db"
```

> The AI SDK (`z-ai-web-dev-sdk`) is pre-configured and requires no additional API keys in this environment.

### Available Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start the dev server (port 3000) |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to SQLite |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:migrate` | Create a database migration |

---

## Demo Accounts

The app ships with seeded demo staff. On the login screen, click any card to sign in — no password required.

| Role | Name | Email |
|---|---|---|
| Doctor | Dr. Amara Chen | `doctor@orioster.health` |
| Doctor | Dr. Sofia Rahman | `doctor2@orioster.health` |
| Nurse | Nurse Rafael Cruz | `nurse@orioster.health` |
| Admin | Admin Priya Sharma | `admin@orioster.health` |
| Lab Tech | Lab Tech Marcus Webb | `lab@orioster.health` |

---

## Project Structure

```
orioster/
├── prisma/
│   ├── schema.prisma          # Database schema (8 models)
│   └── seed.ts                 # Demo data seeding
│
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (Inter font, dark theme)
│   │   ├── page.tsx            # SPA view router
│   │   ├── globals.css         # Design system (5-layer bg, glassmorphism)
│   │   └── api/                # 11 API route handlers
│   │       ├── auth/
│   │       ├── patients/
│   │       ├── orio-ai/        # AI gateway (privacy firewall enforced)
│   │       ├── summary/        # Step 8 local summary generator
│   │       ├── dashboard/
│   │       ├── staff/
│   │       ├── vitals/
│   │       ├── appointments/
│   │       ├── lab-reports/
│   │       ├── invoices/
│   │       └── ai-results/
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui component library
│   │   └── orioster/
│   │       ├── app-shell.tsx          # Top nav bar + layout
│   │       ├── login-screen.tsx       # Login with role selection
│   │       ├── ui-primitives.tsx      # Glass panels, badges, KPI cards
│   │       ├── theme-provider.tsx
│   │       └── views/
│   │           ├── dashboard.tsx              # Role-based dashboard
│   │           ├── patients-list.tsx          # Patient registry
│   │           ├── patient-detail.tsx         # 6-tab patient record
│   │           ├── patient-entry-wizard.tsx   # 10-step intake flow
│   │           ├── orio-ai.tsx                # Clinical decision support
│   │           ├── ai-hub.tsx                 # Document generation
│   │           ├── appointments.tsx
│   │           ├── lab-reports.tsx
│   │           └── invoices.tsx
│   │
│   └── lib/
│       ├── db.ts               # Prisma client singleton
│       ├── store.ts            # Zustand store (auth + navigation)
│       ├── types.ts            # Domain types & constants
│       └── orio-ai.ts          # AI service (4-tier failover + privacy guard)
│
├── Caddyfile                   # Gateway config
└── package.json
```

---

## The 10-Step Patient Entry Wizard

The patient entry workflow is the critical module of Orioster. Steps **cannot be skipped** — each must be completed before advancing.

| Step | Title | AI Access | Description |
|---|---|---|---|
| 1 | General Information | ❌ No | Demographics, consent, local ID generation |
| 2 | Chief Complaint | ❌ No | Structured dropdown + capped free-text |
| 3 | Past History | ❌ No | Multi-select tags (diabetes, hypertension, etc.) |
| 4 | Ongoing Medications | ❌ No | Drug entries with duplicate detection |
| 5 | Vitals | ❌ No | T/BP/HR/SpO₂ with local triage computation |
| 6 | Hypersensitivity | ❌ No | Allergies with severity tagging |
| 7 | Assign Doctor | ❌ No | Doctor selection + appointment scheduling |
| 8 | **Local Summary** | ❌ No | **Privacy Firewall** — generates `patient_summary_v1` locally |
| 9 | Notify Doctor | ✅ Yes | AI-assisted summary delivery (uses `patient_summary_v1` only) |
| 10 | Review & Submit | ❌ No | Role-based checklist validation + final submit |

### Step 8 — The Privacy Firewall

Step 8 is the most critical step. It generates `patient_summary_v1` — a **de-identified, compressed (≥70%) summary** of the patient's clinical data. This summary is the **only** data that AI is allowed to receive.

- **No AI** — pure local computation
- **No network** — fully offline
- **No raw PHI** — names, phones, IDs, addresses are stripped
- AI calls are hard-disabled at the API level until this step is complete

---

## Orio AI — Clinical Decision Support

Orio AI is a **clinical decision support tool** — never a replacement for clinical judgment.

### AI Tasks

| Task | Input | Output |
|---|---|---|
| **Differential Diagnosis** | `patient_summary_v1` | 3 ranked diagnoses with probability + reasoning |
| **Treatment Plan** | Summary + confirmed diagnosis | Treatment steps, advice, complications, interactions |
| **Prescription Generation** | Summary + treatment plan | Formatted drug table (drug, dosage, frequency, duration) |
| **Lab Report Analysis** | Lab parameters | Normal/abnormal analysis + advisory feedback |
| **Invoice Generation** | Service list | Itemized invoice with line items |
| **Medical Certificate** | `patient_summary_v1` | Draft certificate content for doctor review |
| **Doctor Notification** | `patient_summary_v1` | Enhanced readable summary with urgency prioritization |

### AI Output Schema (Strict JSON)

Every AI output follows this schema and includes the mandatory disclaimer:

```json
{
  "summary": "...",
  "risk_level": "low | moderate | high",
  "confidence": 0.0,
  "limitations": ["..."],
  "recommendation_type": "advisory"
}
```

> **Disclaimer:** *This output is not a diagnosis and must be reviewed by a human professional.*

### 4-Tier Failover

Each AI task implements automatic failover across up to 3 retry tiers (adapted from the original 4-tier OpenRouter model matrix). If one tier fails or times out (≤15s), the next is attempted automatically. No silent failures — all exhaustion states return a clear `CRITICAL_FAILURE`.

---

## Privacy & Security

### Hard Rules (Non-Negotiable)

1. **No raw PHI leaves the device** — ever, under any circumstance
2. **AI receives only `patient_summary_v1`** — de-identified and compressed ≥70%
3. **AI calls are hard-disabled until Step 8** — enforced server-side at the API layer
4. **Every AI output is tagged** with risk level, confidence, limitations, and disclaimer
5. **AI logs are PHI-safe** — no raw clinical data in any log sink

### PHI Guard

The `orio-ai.ts` service includes a `containsRawPhi()` function that scans AI input for:
- Phone number patterns
- Email addresses
- Card-like number sequences
- Raw PHI keywords ("patient name", "phone", "address", "national id")

If any PHI is detected, the AI call is **blocked** with a `PHI_VIOLATION` error before any network request is made.

---

## Screenshots

### Login Screen
Dark navy background with moving cyan light rays, glassmorphic login card, ORIO AI orb decoration, and role-based staff selection.

### Dashboard
- Top navigation bar with logo (breathing cyan glow), global search, and action icons
- 4 KPI gradient cards (Patients Served, Active Cases, Beneficiaries, AI Alerts) with breathing glow animations
- Humanitarian Trends area chart + Triage Distribution donut chart
- Recent Activities patient table

### Patient Entry Wizard
10-step vertical stepper with cyan progress indicators, glassmorphic step panels, and role-based final checklist.

### Orio AI Module
Patient selector with privacy firewall status, 3-tab AI task panel (Diagnosis / Treatment / Prescription), confidence meters, risk badges, and mandatory disclaimers.

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth` | GET, POST | List staff / Login |
| `/api/patients` | GET, POST | List patients / Create patient |
| `/api/patients/[id]` | GET, PATCH | Get patient detail / Update patient |
| `/api/staff` | GET | List staff (filterable by role) |
| `/api/vitals` | POST | Record vitals (auto-computes triage) |
| `/api/appointments` | GET, POST, PATCH | List / Create / Update appointments |
| `/api/summary` | POST | Generate `patient_summary_v1` (Step 8, local) |
| `/api/orio-ai` | POST | Run AI task (privacy firewall enforced) |
| `/api/lab-reports` | GET, POST, PATCH | List / Create / Update lab reports |
| `/api/invoices` | GET, POST | List / Create invoices |
| `/api/ai-results` | GET | List AI results |
| `/api/dashboard` | GET | Dashboard aggregate stats |

---

## Database Schema

The Prisma schema defines 8 models:

- **Staff** — users with roles (DOCTOR, NURSE, ADMIN, LAB_TECH)
- **Patient** — patient records with sync status tracking
- **Vitals** — clinical measurements with computed triage level
- **Appointment** — doctor-patient scheduling
- **PatientSummary** — encrypted `patient_summary_v1` storage
- **AiResult** — advisory AI outputs with full audit trail
- **Invoice** — itemized billing records
- **LabReport** — lab investigations with parameter analysis

---

## Contributing

This project follows a structured development workflow. Contributions are welcome via pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript throughout with strict typing
- Prefer shadcn/ui components over custom implementations
- Maintain the offline-first principle — never require network for core workflows
- All AI outputs must include the mandatory disclaimer
- Run `bun run lint` before committing

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Dr. Tapash

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

- Original ORIOSTER specification and design language
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Next.js](https://nextjs.org/) team for the framework
- The open-source community behind Tailwind CSS, Prisma, and Recharts

---

<div align="center">

**Orioster** · AI-Powered HMS · Offline-first clinical operating system

Built with ❤️ for low-resource healthcare environments

</div>

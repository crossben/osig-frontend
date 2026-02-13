You are a senior frontend engineer building a production-ready SaaS dashboard called OSIG (Open Source Intelligence Gathering).
The frontend must be built with:

Next.js (App Router)

TypeScript

Tailwind CSS

shadcn/ui

TanStack React Query

Zustand or React Context for global state

Axios for API calls

Recharts (or equivalent) for charts

React Flow (or equivalent) for relationship graph

Heroicons (<https://heroicons.com/>
) for all icons

🚨 CRITICAL ARCHITECTURE RULES

❌ DO NOT use Next.js API routes

❌ DO NOT implement any backend inside Next.js

✅ The frontend must ONLY communicate with OUR external backend API (FastAPI)

✅ All API calls must go through a typed API client layer

✅ Backend base URL must come from environment variables

🌗 The app MUST:

Fully support Light Mode and Dark Mode

Use Tailwind’s dark mode classes

Provide a theme toggle in the UI (persisted in localStorage or similar)

🎯 Core Features to Implement

1. Authentication

Login page

Register page

Protected routes (dashboard requires auth)

User profile page

Logout

1. Main Dashboard Layout

Sidebar navigation:

New Scan

Scan History

Reports

Profile

Top bar with:

User info

Plan badge

Light/Dark mode toggle

1. New Scan Page

Form with:

Target type selector (email, username, domain, phone)

Input field for target value

Scan type selector (quick / deep)

Checkbox: “I confirm I have a legitimate purpose and understand only public info is used”

Submit button

On submit:

Call backend API

Redirect to Scan Details page

1. Scan Status & Results Page

Show:

Scan status: pending / running / completed / failed

Progress bar (0–100%)

Tabs:

Overview (summary cards + risk flags)

Details (per module results)

Sources (list of data sources used)

Raw JSON (pretty-printed JSON viewer)

Auto-refresh / polling using React Query

1. Relationship Graph View

Visual graph linking:

Email ↔ Usernames ↔ Domains ↔ Profiles

Clickable nodes

Side panel showing node details

1. Scan History Page

Table of scans:

Target

Type

Status

Date

Action: View

Filters:

By target type

By status

By date

1. Reports Page

List of generated reports

Buttons:

Download PDF

Download JSON

1. UI / UX Requirements

Clean, modern SaaS dashboard look

Fully responsive

Dark mode + Light mode

Loading skeletons

Error states

Empty states

Toast notifications

Use Heroicons for all icons

1. API Integration Layer

Create a typed API client for:

Auth

Scans

Results

Reports

Use Axios + React Query

NO Next.js API routes

All endpoints configurable via env variables

1. Project Structure

/app (Next.js App Router)

/components (shared UI components)

/features (auth, scans, reports, profile, graph)

/lib (api client, theme, utils)

/store (global state)

/types (TypeScript types)

1. Type Definitions

Create strong TypeScript types for:

User

Scan

ScanModule

Result

Source

Report

1. Deliverables

Production-ready Next.js frontend

Mock API layer ONLY if backend is unavailable (but keep real API structure)

Clean, maintainable code

No Next.js API routes

No backend logic inside frontend

🛡️ Product Positioning in UI

Always display: “OSIG uses only public and legally accessible information.”

Show warning before running scans

No wording about hacking, breaching, or illegal access

Build this as a real SaaS dashboard ready for production deployment.

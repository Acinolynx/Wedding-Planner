# Wedding Planner — Project Context for Gemini

> This file is automatically read by Gemini CLI on every session.
> Full PRD is in `PRD.md` at the project root. Always refer to it.

---

## What This Project Is

A **personal wedding planner web app** built with Next.js 14.  
All data syncs to **Google Sheets** as the source of truth.  
Users can also export data to **Excel (.xlsx)**.

---

## Tech Stack (Always Use These)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 — App Router |
| Styling | Tailwind CSS + shadcn/ui |
| Sheets sync | Google Sheets API v4 (`googleapis`) |
| Excel export | SheetJS (`xlsx`) |
| Auth | NextAuth.js + Google OAuth |
| Hosting | Vercel |
| Language | TypeScript |

**Never suggest alternatives** to the stack above unless explicitly asked.

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard overview
│   │   ├── guests/page.tsx       # Guest list
│   │   ├── budget/page.tsx       # Budget tracker
│   │   ├── checklist/page.tsx    # Checklist & timeline
│   │   └── vendors/page.tsx      # Vendor manager
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth
│       └── sheets/               # Google Sheets API routes
│           ├── guests/route.ts
│           ├── budget/route.ts
│           ├── vendors/route.ts
│           └── checklist/route.ts
├── components/
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   └── app/                      # Custom app components
├── lib/
│   ├── sheets.ts                 # Google Sheets client & helpers
│   ├── export.ts                 # Excel export logic (SheetJS)
│   └── utils.ts                  # General utilities
└── types/
    └── index.ts                  # TypeScript types for all data models
```

---

## Core Data Models

Always use these TypeScript types (defined in `src/types/index.ts`):

```typescript
type RSVPStatus = 'confirmed' | 'pending' | 'declined'
type PaymentStatus = 'lunas' | 'dp' | 'belum'
type TaskStatus = 'todo' | 'in-progress' | 'done'
type Priority = 'low' | 'medium' | 'high'

interface Guest {
  id: string
  nama: string
  telepon?: string
  email?: string
  undangan_dikirim: boolean
  rsvp_status: RSVPStatus
  jumlah_hadir: number
  pilihan_makan?: string
  nomor_meja?: number
  catatan?: string
}

interface BudgetItem {
  id: string
  kategori: string
  item: string
  estimasi: number        // in IDR
  realisasi: number       // in IDR
  status_bayar: PaymentStatus
  vendor?: string
  tanggal_bayar?: string  // ISO date
  catatan?: string
}

interface Vendor {
  id: string
  nama: string
  kategori: string
  kontak?: string
  telepon?: string
  harga: number           // in IDR
  dp_dibayar: number      // in IDR
  lunas: boolean
  tanggal_kontrak?: string
  catatan?: string
}

interface ChecklistItem {
  id: string
  task: string
  kategori: string
  due_date?: string       // ISO date
  assignee?: string
  status: TaskStatus
  prioritas: Priority
  catatan?: string
}

interface WeddingConfig {
  tanggal_pernikahan: string  // ISO date
  nama_pengantin_1: string
  nama_pengantin_2: string
  venue?: string
  total_budget: number        // in IDR
  target_tamu: number
}
```

---

## Google Sheets Convention

- One spreadsheet, 5 tabs: `Tamu`, `Budget`, `Vendor`, `Checklist`, `Config`
- Row 1 of each tab = header row (column names exactly matching type keys)
- All API logic lives in `src/lib/sheets.ts`
- All monetary values are stored as plain numbers (IDR, no formatting)
- Dates stored as ISO strings (`YYYY-MM-DD`)

### Sheets API Pattern
All sheet operations follow this pattern in `src/lib/sheets.ts`:

```typescript
import { google } from 'googleapis'

const sheets = google.sheets({ version: 'v4', auth: getAuth() })
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

// Read: sheets.spreadsheets.values.get(...)
// Write: sheets.spreadsheets.values.append(...)
// Update: sheets.spreadsheets.values.update(...)
// Delete: sheets.spreadsheets.batchUpdate(...) with deleteDimension
```

---

## API Routes Convention

All Sheets API calls go through Next.js API routes at `src/app/api/sheets/`.

| Method | Route | Action |
|--------|-------|--------|
| GET | `/api/sheets/guests` | Fetch all guests |
| POST | `/api/sheets/guests` | Add guest |
| PUT | `/api/sheets/guests` | Update guest |
| DELETE | `/api/sheets/guests` | Delete guest |

Same pattern applies to `/budget`, `/vendors`, `/checklist`.

---

## UI / Design Guidelines

- Use **shadcn/ui** components — never raw HTML for common UI elements
- All monetary values display with **IDR** prefix and thousand separators: `Rp 5.000.000`
- All dates display in **Indonesian format**: `Senin, 12 Januari 2026`
- Status badges use these colors:
  - `confirmed` / `lunas` / `done` → green
  - `pending` / `dp` / `in-progress` → amber
  - `declined` / `belum` / `todo` → red/gray
- Tables have: search input, filter dropdown, add button (top right)
- All forms use shadcn `Sheet` (side drawer) component — not modals

---

## Environment Variables Required

```bash
# .env.local
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_SPREADSHEET_ID=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

---

## What NOT To Do

- Do not use Pages Router — always App Router
- Do not use `fetch` directly to Sheets API from client components — always go through API routes
- Do not hardcode spreadsheet IDs or credentials
- Do not use CSS frameworks other than Tailwind
- Do not suggest database solutions (no Prisma, no Supabase) — Google Sheets IS the database
- Do not add multi-user or multi-wedding features — this is single-user only

---

## Current Phase

> **Phase 2 — Setup**  
> See `PRD.md` Section 7 (Roadmap) for full phase breakdown.

When I ask you to implement a feature, check `PRD.md` for the full spec before writing code.

# PRD — Wedding Planner Web App

**Version:** 2.0  
**Status:** Feature Complete  
**Scale:** Personal / Family  
**Last Updated:** 2026-04-05  

---

## Current Status (Updated: 2026-04-05)

### ✅ Completed
- **Phase 1** — Setup (Next.js, Tailwind, shadcn/ui, Google Sheets, NextAuth)
- **Phase 2** — Core Features (Dashboard, Guests, Budget, Checklist)
- **Phase 3** — Secondary Features (Vendor Manager, Excel Export, Email Reminders, Settings/Config)
- **Phase 4** — Digital RSVP Form, Seating Arrangement, Moodboard / Notes, UI/UX Polish
- **v2 Features** — Image Upload, Mobile Cards, RSVP QR Codes, Dashboard Charts, Backup/Restore, Timeline View, Toast Notifications

### 🔄 Remaining
- All v1 and v2 features complete
- v3 (multi-tenant SaaS) under consideration

### Notes
- Cron timezone: 09:00 WIB (02:00 UTC)
- Export Excel: wired up on all 4 pages, exports filtered data
- RSVP: public page at `/rsvp`, QR code + share link button in guests table
- Moodboard: Google Drive file upload + URL paste fallback
- Backup: JSON export/import for all 8 sheets
- Timeline: wedding day schedule with vertical timeline UI

---

## 1. Overview

A personal web application to manage all wedding-related data in one place — guest list, budget, vendors, and checklist — with real-time sync to Google Sheets and Excel export capability.

**Problem:** Wedding info is scattered across notes, spreadsheets, and chat messages — hard to track and share with family.  
**Solution:** A single dashboard that acts as the source of truth, synced to Google Sheets so anyone with sheet access can view it.

---

## 2. Goals

| Goal | Description |
|------|-------------|
| Centralized data | All wedding info in one place |
| Google Sheets sync | Real-time push/pull with Google Sheets API v4 |
| Excel export | One-click download of all data as `.xlsx` |
| Simple UX | Clean, minimal UI — no unnecessary complexity |

---

## 3. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 14** (App Router) | Full-stack, API routes included |
| Styling | **Tailwind CSS + shadcn/ui** | Clean, minimal design system |
| Spreadsheet sync | **Google Sheets API v4** | Via `googleapis` npm package |
| Excel export | **SheetJS (xlsx)** | Client-side export |
| Auth | **NextAuth.js + Google OAuth** | Single user, Google login |
| Hosting | **Vercel** | Free tier, deploy via GitHub |
| Editor | **Zed** with Gemini CLI | AI-assisted development |

---

## 4. Features

### 4.1 Must Have (Phase 2)

#### Dashboard Overview
- Countdown to wedding day
- Budget summary (total vs spent vs remaining)
- Guest RSVP summary (confirmed / pending / declined)
- Checklist progress bar
- Quick stats cards

#### Guest List Manager
- Add / edit / delete guests
- Fields: name, phone, email, invitation sent, RSVP status, attendance count, meal preference, table number, notes
- Filter by RSVP status
- Sync to Google Sheets tab: `Tamu`

#### Budget Tracker
- Categories: venue, catering, decoration, attire, photography, entertainment, invitations, misc
- Fields per item: category, item name, estimated cost, actual cost, payment status, vendor, payment date, notes
- Summary: total estimated vs total actual
- Sync to Google Sheets tab: `Budget`

#### Checklist & Timeline
- Fields: task name, category, due date, assignee, status (todo / in progress / done), priority, notes
- Sorted by due date relative to wedding day
- Sync to Google Sheets tab: `Checklist`

### 4.2 Should Have (Phase 3)

#### Vendor Manager
- Fields: vendor name, category, contact person, phone, price, DP paid, fully paid, contract date, notes
- Categories: venue, catering, photographer, videographer, decoration, MC, band/music, makeup, etc.
- Sync to Google Sheets tab: `Vendor`

#### Export to Excel (.xlsx)
- Download all sheets (Tamu, Budget, Vendor, Checklist) in one `.xlsx` file
- Each module exports to its own sheet tab

#### Email Reminders
- Auto-send email when a checklist task's due date is approaching (e.g., 7 days before)
- Via Resend or Nodemailer

### 4.3 Nice to Have (Phase 4)

#### Seating Arrangement
- Visual drag-and-drop table layout
- Assign guests to tables

#### Moodboard / Notes
- Upload reference images
- Free-text notes per category

#### Digital RSVP Form
- Public URL form for guests to confirm attendance
- Auto-sync responses to Google Sheets

---

## 5. Google Sheets Structure

One Google Spreadsheet with 8 tabs:

### Tab: `Tamu` (Guest List)
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID (auto) |
| nama | string | Guest name |
| telepon | string | Phone number |
| email | string | Email |
| undangan_dikirim | boolean | Invitation sent? |
| rsvp_status | enum | confirmed / pending / declined |
| jumlah_hadir | number | Number of attendees |
| pilihan_makan | string | Meal preference |
| nomor_meja | number | Table number |
| catatan | string | Notes |

### Tab: `Budget`
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| kategori | string | Category |
| item | string | Item name |
| estimasi | number | Estimated cost (IDR) |
| realisasi | number | Actual cost (IDR) |
| status_bayar | enum | lunas / dp / belum |
| vendor | string | Vendor name |
| tanggal_bayar | date | Payment date |
| catatan | string | Notes |

### Tab: `Vendor`
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| nama | string | Vendor name |
| kategori | string | Category |
| kontak | string | Contact person |
| telepon | string | Phone |
| harga | number | Price (IDR) |
| dp_dibayar | number | DP paid |
| lunas | boolean | Fully paid? |
| tanggal_kontrak | date | Contract date |
| catatan | string | Notes |

### Tab: `Checklist`
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| task | string | Task description |
| kategori | string | Category |
| due_date | date | Due date |
| assignee | string | Assigned to |
| status | enum | todo / in-progress / done |
| prioritas | enum | low / medium / high |
| catatan | string | Notes |

### Tab: `Config`
| Column | Type | Description |
|--------|------|-------------|
| tanggal_pernikahan | date | Wedding date |
| nama_pengantin_1 | string | Name 1 |
| nama_pengantin_2 | string | Name 2 |
| venue | string | Venue name |
| total_budget | number | Total budget (IDR) |
| target_tamu | number | Target guest count |

---

## 6. Data Flow

```
Web App (Next.js)
    ↕ (read/write via API routes)
Google Sheets API v4
    ↕
Google Spreadsheet (source of truth)
    ↓ (on-demand)
Excel Export (.xlsx via SheetJS)
```

- All write operations go through Next.js API routes (`/api/sheets/...`)
- The Google Spreadsheet is the single source of truth
- Reads are cached in React state; writes immediately push to Sheets

---

## 7. Roadmap

### Phase 1 — Setup (~2 days)
- Init Next.js 14 project with Tailwind + shadcn/ui
- Setup Google Cloud Console → enable Sheets API → get service account credentials
- Setup NextAuth with Google OAuth
- First deploy to Vercel
- Connect to Google Sheets (test read/write)

### Phase 2 — Core Features (~1–2 weeks)
- Dashboard Overview page
- Guest List Manager (CRUD + Sheets sync)
- Budget Tracker (CRUD + Sheets sync)
- Checklist & Timeline (CRUD + Sheets sync)

### Phase 3 — Secondary Features (~1 week)
- Vendor Manager
- Excel export
- Email reminders

### Phase 4 — Polish & Nice-to-Have (flexible)
- Seating arrangement
- Moodboard
- Digital RSVP form
- UI/UX refinement & mobile responsiveness

---

## 8. Non-Goals (Out of Scope for v1)

- Multi-user / multi-wedding support
- Payment gateway integration
- Mobile native app (iOS/Android)
- Public marketplace for vendors
- AI-generated recommendations

---

## 9. Constraints

- Single user (personal use only — no complex auth needed)
- Budget: free / minimal cost (Vercel free tier, Google Sheets API free quota)
- Must work on mobile browser (responsive design)
- All monetary values in IDR (Indonesian Rupiah)

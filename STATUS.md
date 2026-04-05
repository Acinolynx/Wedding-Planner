# Project Status — Wedding Planner

Last updated: 2026-04-05 (v2 Complete)

---

## Phase 1 — Setup ✅
- [x] Next.js 14 + Tailwind + shadcn/ui
- [x] Google Sheets API integration
- [x] NextAuth + Google OAuth
- [x] Middleware route protection
- [x] Vercel deployment

## Phase 2 — Core Features ✅
- [x] Dashboard Overview (countdown, stats, RSVP breakdown, progress bar)
- [x] Guest List Manager (CRUD + Sheets sync)
- [x] Budget Tracker (CRUD + Sheets sync)
- [x] Checklist & Timeline (CRUD + Sheets sync, sorted by wedding day)

## Phase 3 — Secondary Features ✅
- [x] Vendor Manager (CRUD + Sheets sync)
- [x] Excel Export (4 pages, filtered data)
- [x] Email Reminders (Vercel Cron, Resend, 7-day window, 09:00 WIB)
- [x] Wedding Config / Settings page

## Phase 4 — Polish & Nice-to-Have ✅
- [x] Digital RSVP Form (public /rsvp page, share links)
- [x] Seating Arrangement (drag-and-drop table layout)
- [x] Moodboard / Notes (image URL paste + notes per category)
- [x] UI/UX Polish (dark mode toggle, mobile responsiveness, login branding)

---

## v2 Features ✅
- [x] **Image upload** — Google Drive file upload for moodboard (drag & drop + URL fallback)
- [x] **Mobile card views** — responsive cards on mobile for guests, budget, checklist, vendors
- [x] **Guest RSVP share links** — QR code dialog + copy link + native share API per guest
- [x] **Dashboard charts** — donut chart (RSVP breakdown) + bar chart (budget per category)
- [x] **Backup/restore** — export all 8 sheets as JSON, restore from file with per-sheet status
- [x] **Timeline view** — visual wedding day schedule with vertical timeline UI (CRUD + Sheets sync)

### v2 Polish
- [x] Consolidated `formatRupiah` to `@/lib/utils` (removed 3 duplicates)
- [x] Centralized `parseBudgetRow`/`parseVendorRow` in `lib/sheets.ts`
- [x] Toast notifications (sonner) replaced all 15 `alert()` calls
- [x] Success toasts for all CRUD operations across all pages
- [x] Updated `.gitignore` with IDE, OS, and temp file patterns

---

## Bug Fixes Applied (Post-v1)
- [x] RSVP layout: removed nested `<html>/<body>` tags
- [x] ThemeProvider: safe defaults during SSG instead of throwing
- [x] Middleware: excluded `api/rsvp` and `api/reminders` from auth
- [x] Seating page: fixed drag-and-drop race condition (API calls moved to `handleDragEnd`)
- [x] Seating page: fixed `setGuests(undefined)` crash on guest update
- [x] Seating page: `Promise.allSettled` for batch guest updates on table delete
- [x] Sheet component: fixed overlay z-index blocking panel interactions
- [x] Sheet component: extended panel to full top edge (`-top-2`)
- [x] Button component: replaced `@base-ui/react` with standard shadcn/ui
- [x] `getSheetData`: returns `[]` for any error (missing sheets no longer crash)
- [x] `getConfig`: returns `null` instead of throwing when Config sheet missing
- [x] Dashboard: `force-dynamic` so data refreshes on every request
- [x] Extracted duplicated `parseGuestRow`, `parseChecklistRow` to `src/lib/sheets.ts`
- [x] Extracted `getIndonesianDate`, `formatRupiah` to `src/lib/utils.ts`
- [x] `getIndonesianDate`: handles invalid dates (no more `NaN` output)
- [x] Init functions: handle "sheet already exists" error gracefully
- [x] Removed unused `@base-ui/react` dependency

---

## Key Files
- Config/Settings: `src/app/(dashboard)/settings/page.tsx`
- RSVP: `src/app/rsvp/page.tsx`
- Seating: `src/app/(dashboard)/seating/page.tsx`
- Moodboard: `src/app/(dashboard)/moodboard/page.tsx`
- Timeline: `src/app/(dashboard)/timeline/page.tsx`
- Backup: `src/app/(dashboard)/backup/page.tsx`
- Email Reminders: `src/app/api/reminders/route.ts`
- Sheets helpers: `src/lib/sheets.ts`
- Drive upload: `src/lib/drive.ts`
- Types: `src/types/index.ts`
- Theme: `src/components/theme-provider.tsx`

## Env Variables Needed (for deployment)
- `GOOGLE_DRIVE_FOLDER_ID` — Google Drive folder for moodboard image uploads (v2)
- `RESEND_API_KEY` — from resend.com (free tier: 3,000 emails/month)
- `REMINDER_SECRET` — random string for cron auth
- All existing vars in `.env.example`

---

## What's Next (v3 — Multi-tenant SaaS)
- [ ] PostgreSQL database (Supabase/Neon free tier)
- [ ] Per-user account system with registration + login
- [ ] Per-user spreadsheet creation on signup
- [ ] Data isolation — every API route resolves user's spreadsheet
- [ ] Per-user Google Drive folders for image uploads
- [ ] Multi-user email reminders (iterate over all users)
- [ ] Rate limiting + quota management

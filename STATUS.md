# Project Status — Wedding Planner

Last updated: 2026-04-04 (Phase 4 Complete)

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

## Phase 4 — Polish & Nice-to-Have
- [x] Digital RSVP Form (public /rsvp page, share links)
- [x] Seating Arrangement (drag-and-drop table layout)
- [x] Moodboard / Notes (image URL paste + notes per category)
- [x] UI/UX Polish (dark mode toggle, mobile responsiveness, login branding)

---

## Key Files
- Config/Settings: `src/app/(dashboard)/settings/page.tsx`
- RSVP: `src/app/rsvp/page.tsx`
- Seating: `src/app/(dashboard)/seating/page.tsx`
- Email Reminders: `src/app/api/reminders/route.ts`
- Sheets helpers: `src/lib/sheets.ts`
- Types: `src/types/index.ts`

## Env Variables Needed (for deployment)
- `RESEND_API_KEY` — from resend.com (free tier: 3,000 emails/month)
- `REMINDER_SECRET` — random string for cron auth
- All existing vars in `.env.example`

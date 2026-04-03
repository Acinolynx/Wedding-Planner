# AGENTS.md — Wedding Planner

> Read this file before every session. Also read `GEMINI.md` and `PRD.md` for full context.

---

## Project Overview

Personal wedding planner web app. Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui. Google Sheets is the database. Single-user only.

---

## Commands

```bash
# Setup (run once)
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
npx shadcn@latest init

# Dev
npm run dev              # Start dev server on localhost:3000

# Build
npm run build            # Production build
npm run start            # Start production server

# Lint
npm run lint             # Next.js lint (includes type checking)

# No test framework configured yet — add Vitest/Jest when needed
# When tests exist, run a single test with:
# npm test -- -t "test name"     (Jest)
# npx vitest run -t "test name"  (Vitest)
```

---

## Code Style

### Imports
- Use `@/*` import alias for `src/*` paths
- Group imports: React/Next.js → third-party → internal (`@/`)
- Use named exports by default; default exports only for page components

### Formatting
- 2-space indentation, single quotes, semicolons required
- Use Prettier defaults if config is added
- Max line length: 100 characters

### TypeScript
- Strict mode enabled. No `any` — use `unknown` if type is truly unknown
- Define all data types in `src/types/index.ts` — reuse them everywhere
- Use explicit return types on API route handlers
- Enums as union types: `type RSVPStatus = 'confirmed' | 'pending' | 'declined'`

### Naming Conventions
- Components: PascalCase (`GuestTable.tsx`, `BudgetForm.tsx`)
- API routes: kebab-case directories (`src/app/api/sheets/guests/route.ts`)
- Variables/functions: camelCase
- Files: kebab-case for non-components, PascalCase for components
- Indonesian names for data fields: `nama`, `telepon`, `status_bayar`, etc.

### Error Handling
- API routes: return `{ error: string }` with appropriate HTTP status codes
- Wrap Google Sheets API calls in try/catch
- Never expose credentials or spreadsheet IDs in error messages
- Use `Response.json()` for all API route responses

### Component Rules
- All forms use shadcn `Sheet` (side drawer), never modals
- Tables must have: search input, filter dropdown, add button (top right)
- Status badge colors: green (confirmed/done/lunas), amber (pending/dp/in-progress), red/gray (declined/belum/todo)
- Monetary values: `Rp 5.000.000` format (IDR with thousand separators)
- Dates: Indonesian format — `Senin, 12 Januari 2026`
- Always use App Router — never Pages Router

---

## Architecture

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (dashboard)/        # Auth-protected dashboard routes
│   └── api/sheets/         # Google Sheets API routes (CRUD)
├── components/
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   └── app/                # Custom app components
├── lib/
│   ├── sheets.ts           # Google Sheets client & helpers
│   ├── export.ts           # Excel export (SheetJS)
│   └── utils.ts            # General utilities
└── types/
    └── index.ts            # All TypeScript types
```

---

## Hard Rules

1. **Never suggest alternatives** to the defined tech stack unless explicitly asked
2. **Never use `fetch` directly** to Sheets API from client components — always through API routes
3. **Never hardcode** spreadsheet IDs or credentials — use `process.env`
4. **Only use Tailwind** for CSS — no other CSS frameworks
5. **Google Sheets IS the database** — do not add Prisma, Supabase, PostgreSQL, etc.
6. **Single-user only** — no multi-user or multi-wedding features
7. **Always read `PRD.md`** before implementing any feature
8. **Never use Pages Router** — always App Router
9. **Never add documentation files** unless explicitly requested
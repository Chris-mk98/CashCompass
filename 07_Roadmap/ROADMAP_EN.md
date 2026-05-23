# Implementation Roadmap
# CashCompass — Personal Finance Management App

**Version:** 1.0  
**Date:** 2026-05-23  
**Author:** Chris Kim  
**Status:** Draft

---

## Timeline Overview

```
Phase 1  Planning Documents ················· ✅ Complete
Phase 2  Tech Stack + DB Design ············· ✅ Complete
Phase 3  Development — Core Features ········ Sprint 1–4 (4 weeks)
Phase 4  Development — Advanced Features ···· Sprint 5–7 (3 weeks)
Phase 5  Testing + Polish ··················· Sprint 8 (1–2 weeks)
Phase 6  v1 Launch ·························· Deploy
─────────────────────────────────────────────────────────
                                         Total ~8–10 weeks
```

**Sprint Length:** 1 week  
**Sprint Structure:** Task list → Files to create → Verification criteria

---

## Phase 3: Core Feature Development

---

### Sprint 1 — Project Setup + Authentication (Week 1)

> Goal: Create Next.js project, connect Supabase, complete signup/login/logout
> Related: US-020, US-021, US-022

#### Task List

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 1-1 | Create Next.js project | `pnpm create next-app` (App Router, TypeScript, Tailwind, ESLint) | Must |
| 1-2 | Init shadcn/ui | `pnpm dlx shadcn@latest init` + install base components (Button, Card, Input, Form, Toast, Dialog, Select, Tabs, Label) | Must |
| 1-3 | Create Supabase project | Create project in Supabase dashboard, set env vars | Must |
| 1-4 | Create DB schema | Run all table creation SQL + RLS policies + triggers in Supabase SQL Editor | Must |
| 1-5 | Setup Prisma | prisma init, write schema.prisma, prisma db pull, prisma generate | Must |
| 1-6 | Supabase Auth client | `@supabase/ssr` setup — server/browser clients, middleware | Must |
| 1-7 | Auth layout | `(auth)` layout — centered card layout | Must |
| 1-8 | Sign up page | Email, password, currency select, signup Server Action | Must |
| 1-9 | Login page | Email, password, login Server Action | Must |
| 1-10 | Password reset | Request page + set new password page | Must |
| 1-11 | Auth middleware | Redirect unauthenticated to `/login`, authenticated to `/dashboard` | Must |
| 1-12 | Main layout skeleton | `(main)` layout — navigation bar (desktop + mobile), logout button | Must |
| 1-13 | Empty dashboard page | `/dashboard` page skeleton (layout only, no data) | Must |
| 1-14 | Setup next-intl | Create ko/en message files, configure middleware | Must |

#### Files to Create

```
cashcompass/
├── .env.local
├── prisma/schema.prisma
├── messages/ko.json, en.json
├── middleware.ts
├── app/
│   ├── layout.tsx, globals.css
│   ├── (auth)/layout.tsx, login/page.tsx, signup/page.tsx, reset-password/page.tsx, confirm/page.tsx
│   └── (main)/layout.tsx, dashboard/page.tsx
├── actions/auth.ts
├── lib/supabase/server.ts, client.ts, middleware.ts
├── lib/prisma.ts, validations/auth.ts
└── components/ui/, nav-bar.tsx, mobile-nav.tsx
```

#### Verification Criteria

- [ ] `pnpm dev` starts local dev server
- [ ] Sign up → confirmation email → login → dashboard redirect
- [ ] Logout → redirect to `/login`
- [ ] Unauthenticated `/dashboard` access → redirect to `/login`
- [ ] Password reset email → set new password → login succeeds
- [ ] On signup: profiles + 8 default categories auto-created in DB
- [ ] Korean/English switching works
- [ ] Mobile view: navigation displays as tab bar

---

### Sprint 2 — Transaction CRUD + Categories (Week 2)

> Goal: Transaction add/edit/delete, split transactions, category management
> Related: US-001, US-002, US-003, US-005, US-026, US-027

#### Task List

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 2-1 | Zod schemas — transactions | createTransactionSchema, updateTransactionSchema | Must |
| 2-2 | Transaction Server Actions | createTransaction, updateTransaction, deleteTransaction | Must |
| 2-3 | Split allocation utility | createAllocations() — evenly distribute amount over N months | Must |
| 2-4 | Split amount edit | updateSplitAmount (all months / future only) | Must |
| 2-5 | Add transaction page | Form: type, amount, category, recognition month, payment method, note, split settings | Must |
| 2-6 | Split entry UI | "Spread across multiple months" checkbox → expanded section + preview | Must |
| 2-7 | Transaction list page | Monthly grouping, split display, pending transaction display | Must |
| 2-8 | Transaction detail view | Dialog/sheet: full details + split breakdown + edit/delete buttons | Must |
| 2-9 | Delete confirmation | Confirmation dialog: "Are you sure?" | Must |
| 2-10 | Split amount edit UI | Dialog: new amount input + "All months / Future only" selection | Must |
| 2-11 | Category management page | List, add, rename, delete, visibility toggle | Must |
| 2-12 | Category Server Actions | createCategory, renameCategory, deleteCategory, toggleVisibility | Must |
| 2-13 | Category delete → "Other" | Move transactions to "Other" + confirmation dialog | Must |
| 2-14 | Transaction list fetcher | getTransactions (pagination, default sorting) | Must |

#### Verification Criteria

- [ ] Add expense/income → appears in list → detail view shows all fields
- [ ] Split transaction (₩120,000, 12 months) → preview shows ₩10,000/month → saves correctly
- [ ] Split detail shows 12-month breakdown
- [ ] Split edit "all months" → full recalculation verified
- [ ] Split edit "future only" → past kept, future recalculated
- [ ] Edit transaction → changes reflected in list
- [ ] Delete transaction → confirmation → removed from list
- [ ] Add category → appears in transaction form dropdown
- [ ] Rename category → reflected on existing transactions
- [ ] Delete category → transactions moved to "Other" + count shown
- [ ] Delete default category attempt → error message
- [ ] Income transactions can also be split (US-026)

---

### Sprint 3 — Payment Methods + Payment Date Calculation (Week 3)

> Goal: Credit card/bank account registration, automatic payment date calculation
> Related: US-006, US-007, US-008

#### Task List

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 3-1 | Payment date calc utility | calculatePaymentDate() — billing period detection + payment date | Must |
| 3-2 | Payment date calc tests | Unit tests for various billing period/payment date combinations | Must |
| 3-3 | Payment method Server Actions | createPaymentMethod, updatePaymentMethod, deletePaymentMethod | Must |
| 3-4 | Payment methods page | Card/account list, registration forms, edit/delete | Must |
| 3-5 | Link payment method to transaction form | Dropdown → select → auto-calculate payment date → display | Must |
| 3-6 | Recalculate on card edit | When card billing cycle changes → batch update payment_date for tagged transactions | Must |
| 3-7 | Current month usage display | Calculate current billing period usage amount on payment methods list | Should |
| 3-8 | Payment date ℹ tooltip | ℹ icon next to auto-calculated payment date → show card info | Should |

#### Verification Criteria

- [ ] Register credit card (billing 1st–last, payment 25th next month) succeeds
- [ ] Register credit card (billing 16th–15th, payment 10th next month) succeeds
- [ ] Register bank account succeeds
- [ ] Transaction form: select card → auto-calculated payment date displayed
  - Jan 20 + card(1st–last, next month 25th) → Payment: Feb 25 ✓
  - Jan 20 + card(16th–15th, next month 10th) → Payment: Mar 10 ✓
- [ ] Transaction form: select bank account → payment date = transaction date ✓
- [ ] Edit card billing cycle → existing transactions' payment dates recalculated + count shown
- [ ] Delete card → transactions' payment_method_id becomes NULL (transactions preserved)

**Payment Date Calculation Test Cases:**

```
Test 1: Billing 1st–last, payment 25th of next month
  2026-01-05 → 2026-02-25 ✓
  2026-01-31 → 2026-02-25 ✓
  2026-02-28 → 2026-03-25 ✓  (Feb last day)
  2026-12-25 → 2027-01-25 ✓  (year boundary)

Test 2: Billing 16th–15th, payment 10th of next month
  2026-01-20 → 2026-03-10 ✓  (1/16–2/15 period → ends Feb → +1 = Mar)
  2026-01-10 → 2026-02-10 ✓  (12/16–1/15 period → ends Jan → +1 = Feb)
  2026-02-15 → 2026-03-10 ✓  (last day of 1/16–2/15 period)
  2026-02-16 → 2026-04-10 ✓  (2/16–3/15 period → ends Mar → +1 = Apr)

Test 3: Billing 1st–last, payment 27th same month
  2026-01-05 → 2026-01-27 ✓  (payment_month_offset = 0)
```

---

### Sprint 4 — Dashboard Dual View + Pending Transactions (Week 4)

> Goal: Complete accrual/cash dual-view dashboard, pending transaction confirmation system
> Related: US-009, US-010, US-011, US-015, US-028

#### Task List

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 4-1 | Dashboard summary fetcher | getDashboardSummary — accrual/cash totals, categories, budget alerts, pending | Must |
| 4-2 | Desktop dashboard layout | Accrual view + Cash view side by side | Must |
| 4-3 | Mobile dashboard layout | Tab toggle (Accrual / Cash tab switch) | Must |
| 4-4 | Month navigation | [< ] May 2026 [📅] [ >] — prev/next + month picker | Must |
| 4-5 | Category budget progress bars | Budget usage display on dashboard (colors: blue/yellow/red) | Must |
| 4-6 | Budget alert banner | 80% reached (yellow), exceeded (red) alert list | Must |
| 4-7 | Pending transaction system | Detect past-due pending transactions → alert banner + confirmation dialog | Must |
| 4-8 | Pending confirmation dialog | "Confirm / Edit / Delete" → confirmPendingTransaction action | Must |
| 4-9 | Multi-currency handling | When multiple currencies coexist, show separate totals per currency | Must |
| 4-10 | Action buttons | "New Transaction" + "Smart Import" buttons at bottom of dashboard | Must |
| 4-11 | Transaction list filtering/search | Date, category, payment method, amount range, text search | Should |
| 4-12 | View toggle (transaction list) | Accrual basis / Cash basis sorting switch | Should |

#### Verification Criteria

- [ ] Dashboard loads with current month data
- [ ] Desktop: Accrual + Cash views displayed side by side
- [ ] Mobile: Tab toggle switches between Accrual/Cash views
- [ ] With split transaction (₩120,000, 12 months):
  - Accrual view: ₩10,000 shown for the month
  - Cash view: ₩120,000 shown in payment month
- [ ] [< ] [ >] buttons navigate prev/next month → data updates
- [ ] [📅] click → month picker → jump to selected month
- [ ] Budget at 80% → yellow warning displayed
- [ ] Budget exceeded → red warning displayed
- [ ] Future-dated transaction → ⏳ icon in transaction list
- [ ] Past-due pending transaction → "Needs confirmation" alert on dashboard
- [ ] Confirm dialog "Confirm" → transitions to actual
- [ ] Confirm dialog "Delete" → transaction deleted
- [ ] Transaction list filters: category, date range, amount range, search text combination works

---

## Phase 4: Advanced Feature Development

---

### Sprint 5 — Budget Management + Cash Flow Projection (Week 5)

> Goal: Budget settings page, 12-month cash flow projection chart
> Related: US-014, US-015, US-012

#### Task List

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 5-1 | Budget Server Actions | setBudget (UPSERT), deleteBudget | Must |
| 5-2 | Budget usage fetcher | getBudgetsWithUsage — per-category limit, spent, usage% | Must |
| 5-3 | Budget management page | Per-category progress bars + inline set/edit/delete UI | Must |
| 5-4 | Cash flow projection data | getCashFlowProjection — 12-month income/expenses/cumulative balance | Must |
| 5-5 | Install + setup Recharts | recharts package, ResponsiveContainer wrapper | Must |
| 5-6 | Cash flow line chart | LineChart — 12-month projected balance, negative in red, actual/projected distinction | Must |
| 5-7 | Monthly summary table | Income, expenses, net balance, actual/projected status | Must |
| 5-8 | Cash flow view toggle | Cash basis / Accrual basis switch | Must |
| 5-9 | What-if button (disabled) | "What-if Scenario Mode (v1.1)" — displayed but disabled | Nice |

#### Verification Criteria

- [ ] Set budget per category → progress bar reflects usage
- [ ] Edit budget → progress bar updates immediately
- [ ] Delete budget → progress bar removed for that category
- [ ] Unbudgeted categories → only "Set Budget" button shown, no alerts
- [ ] Progress bar colors: 0–79% blue, 80–99% yellow, 100%+ red
- [ ] Cash flow chart: 12-month line chart renders
- [ ] Negative balance months → red highlight
- [ ] Actual/projected distinction: past months solid line, future months dashed
- [ ] Add/delete pending transaction → chart updates immediately
- [ ] Monthly summary table: income, expenses, cumulative balance accuracy verified

---

### Sprint 6 — Charts + Data Export + Receipts (Week 6)

> Goal: Pie chart, trend bar chart, CSV/PDF export, receipt attachment
> Related: US-016, US-017, US-018, US-019, US-004

#### Task List

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 6-1 | Category spending data | getSpendingByCategory — monthly pie chart data | Should |
| 6-2 | Pie chart | PieChart — category spending percentages + amount/% tooltip | Should |
| 6-3 | Monthly trend data | getMonthlyTrend — last 6 months income/expenses | Should |
| 6-4 | Bar chart | BarChart — income vs expenses side by side + hover amounts | Should |
| 6-5 | Charts page | Pie + bar + cash flow (link) integrated page, view toggle | Should |
| 6-6 | CSV export API Route | GET /api/export/csv — date/category filter + download | Should |
| 6-7 | PDF export API Route | GET /api/export/pdf — jsPDF + autotable + monthly summary | Should |
| 6-8 | Export page | Date/category selection → download buttons | Should |
| 6-9 | Receipt upload | Supabase Storage upload, file select UI in transaction form | Should |
| 6-10 | Receipt view/delete | Display receipt image in transaction detail + replace/delete | Should |
| 6-11 | jsPDF Korean font | Configure font so Korean text renders correctly in PDF | Should |

#### Verification Criteria

- [ ] Pie chart: current month's category spending ratios displayed, click shows amount/%
- [ ] Bar chart: last 6 months income/expenses shown, hover shows exact amount
- [ ] Chart view toggle: accrual ↔ cash switch updates all charts
- [ ] CSV download: filters applied → file downloads → opens correctly in Excel
- [ ] CSV columns: Date, Type, Amount, Currency, Category, Recognition Month, Payment Method, Payment Date, Note
- [ ] PDF download: month selected → file downloads → both accrual/cash totals included
- [ ] PDF Korean: Korean text renders without corruption
- [ ] Receipt upload: JPG/PNG/HEIC, under 5MB upload succeeds
- [ ] Transaction detail shows receipt image
- [ ] Receipt replace: old file deleted + new file uploaded
- [ ] Transaction saves normally without receipt

---

### Sprint 7 — AI Smart Import (Week 7)

> Goal: Image upload → AI analysis → review → bulk save
> Related: US-024, US-025

#### Task List

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 7-1 | Claude API client | Anthropic SDK setup, Vision prompt writing | Should |
| 7-2 | Image analysis API Route | POST /api/import/analyze — receive image → Claude call → JSON response | Should |
| 7-3 | AI prompt optimization | Iterative testing of bank/card app screenshot extraction prompts | Should |
| 7-4 | Category auto-matching | Merchant name keywords → category mapping (e.g., "Starbucks" → Food) | Should |
| 7-5 | Image upload UI | Drag & drop + file select, preview, loading indicator | Should |
| 7-6 | Review screen | AI extraction results list, checkboxes, all fields editable, "Needs review" highlight | Should |
| 7-7 | Bulk save Action | bulkCreateTransactions — save selected items at once | Should |
| 7-8 | Bulk payment method apply | Payment method select at top of review → applies to all items | Should |
| 7-9 | Error handling | Image recognition failure, API errors, empty results | Should |
| 7-10 | Privacy protection | Confirm image is discarded after analysis, not stored on server | Should |

#### Verification Criteria

- [ ] Bank app screenshot upload → AI extracts transaction items
- [ ] Each extracted item: date, description, amount, suggested category displayed
- [ ] "Needs review" items: visually highlighted + cannot save without required fields
- [ ] Review screen: all fields editable (date, description, amount, category, recognition month)
- [ ] Checkboxes to select/deselect items → only selected items saved
- [ ] Bulk payment method → applied to all items
- [ ] "Import" button → bulk save → reflected in transaction list + dashboard updated
- [ ] Image recognition failure → "No transactions detected" message
- [ ] Uploaded images not stored on server (privacy protection)
- [ ] Only JPG, PNG accepted, >10MB rejected with error

---

## Phase 5: Testing + Polish

---

### Sprint 8 — Responsive + i18n + Final Testing (Week 8)

> Goal: Verify all pages responsive, complete translations, full integration testing, deploy prep

#### Task List

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 8-1 | Responsive check — mobile | Verify all pages on mobile view + fix (< 768px) | Must |
| 8-2 | Responsive check — tablet | Verify all pages on tablet view + fix (768–1023px) | Must |
| 8-3 | Complete translations | Fill all keys in messages/ko.json and en.json | Must |
| 8-4 | Account settings page | Change email, password, currency UI + Actions | Must |
| 8-5 | Currency change warning | "Existing transactions won't be changed" confirmation dialog | Must |
| 8-6 | Multi-currency display | When multiple currencies coexist, show separate totals | Must |
| 8-7 | Integration test — core flow | Signup → register card → add transaction (split) → dashboard check → set budget → verify alert | Must |
| 8-8 | Integration test — dual view | Verify split transaction accrual/cash view value differences are accurate | Must |
| 8-9 | Integration test — pending | Add future transaction → simulate date passing → confirm dialog → confirm/delete | Must |
| 8-10 | Performance check | All pages load within 2 seconds (non-functional requirement) | Must |
| 8-11 | Error pages | 404 Not Found, 500 Server Error custom pages | Should |
| 8-12 | Loading states | Per-page loading.tsx + Suspense fallback | Should |
| 8-13 | SEO + metadata | Per-page title, description | Should |
| 8-14 | Favicon + app icons | Browser tab icon, mobile home screen icon | Should |

#### Verification Criteria

- [ ] **Responsive:** All pages display correctly at mobile (375px), tablet (768px), desktop (1280px)
- [ ] **Dual view:** Desktop side-by-side, mobile/tablet tab toggle
- [ ] **Korean/English:** All UI text displays in both languages (no missing translation keys)
- [ ] **Integration flow:** Signup → card register → split transaction → dashboard (accrual ≠ cash) → budget alert
- [ ] **Performance:** All pages first load < 2 seconds
- [ ] **Errors:** Invalid URL → 404 page displayed
- [ ] **Account:** Email/password/currency changes → success message + works correctly

---

## Phase 6: Deployment

---

### Deployment Checklist

| # | Item | Description | Done |
|---|------|-------------|------|
| D-1 | Connect Vercel project | GitHub repo → Vercel project connection | [ ] |
| D-2 | Set environment variables | Input all env vars in Vercel dashboard | [ ] |
| D-3 | Supabase production setup | Verify production URL/keys, confirm RLS policies active | [ ] |
| D-4 | Custom domain (optional) | Purchase domain → connect to Vercel → auto SSL | [ ] |
| D-5 | Production build test | `pnpm build` → builds without errors | [ ] |
| D-6 | Production environment test | Full flow test on deployed URL | [ ] |
| D-7 | Supabase inactivity pause prep | Free plan pauses after 7 days inactive → plan regular access or upgrade | [ ] |

---

## Post-v1 Roadmap (Out of Scope)

> Features to add after v1 launch. For reference only.

| Feature | User Story | Priority |
|---------|-----------|----------|
| What-if Scenario Mode | US-013 | v1.1 |
| Notifications/Reminders | — | v1.2 |
| Recurring transaction auto-creation | — | v1.2 |
| Dark mode | — | v1.2 |
| PWA (Progressive Web App) | — | v1.3 |
| Bank account auto-linking | — | v2.0 |
| Investment asset tracking | — | v2.0 |

---

## User Story Mapping by Sprint

| Sprint | User Stories | Type |
|--------|-------------|------|
| Sprint 1 | US-020, US-021, US-022 | Must Have |
| Sprint 2 | US-001, US-002, US-003, US-005, US-026, US-027 | Must Have |
| Sprint 3 | US-006, US-007, US-008 | Must Have |
| Sprint 4 | US-009, US-010, US-011, US-015, US-028 | Must Have + Should Have |
| Sprint 5 | US-014, US-015, US-012 | Must Have |
| Sprint 6 | US-016, US-017, US-018, US-019, US-004 | Should Have |
| Sprint 7 | US-024, US-025 | Should Have |
| Sprint 8 | US-023, Integration testing, Deploy prep | Should Have + Polish |

**Must Have (17 total):** All completed in Sprint 1–5  
**Should Have (10 total):** Completed in Sprint 4–8  
**Nice to Have (1, US-013):** Deferred to v1.1

---

## Dependency Graph

```
Sprint 1: Project Setup + Auth
    │
    ├──→ Sprint 2: Transaction CRUD + Categories
    │       │
    │       ├──→ Sprint 3: Payment Methods + Payment Date Calc
    │       │       │
    │       │       └──→ Sprint 4: Dashboard Dual View
    │       │               │
    │       │               ├──→ Sprint 5: Budget + Cash Flow Projection
    │       │               │
    │       │               ├──→ Sprint 6: Charts + Export + Receipts
    │       │               │
    │       │               └──→ Sprint 7: AI Smart Import
    │       │
    │       └──────────────────→ Sprint 8: Responsive + i18n + Testing
    │
    └── (Sprints 5, 6, 7 are independent of each other — can be parallelized)
```

> Sprints 5, 6, 7 can proceed in any order after Sprint 4 completion.
> Sprint 8 should begin only after all features are complete.

---

*This document will be updated as development progresses. Completed items will be checked (✅).*

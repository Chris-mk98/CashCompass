# Product Requirements Document (PRD)
# CashCompass — Personal Finance Manager

**Version:** 1.0  
**Date:** 2026-05-23  
**Author:** Chris Kim  
**Status:** Draft

---

## 1. Overview

### 1.1 What is this product?
CashCompass is a web application that helps individuals track their income, expenses, and budgets in one place. Users can see where their money is going and plan ahead, and analyze their cash flow under the Accrual Basis of Accounting.

Most importantly, users can compare the **Accrual View** and the **Cash View** side by side — this dual-view perspective is the core differentiator of CashCompass versus other budget apps.

### 1.2 Problem we are solving
Many people lose track of spending because they manage finances across bank apps, spreadsheets, and receipts. These tools rarely give meaningful insight — they only show history and cannot project future cash flow.

For example, when you pay an annual membership with a credit card, cash does not leave your account at that moment — it leaves later on the card's billing date. The full amount is booked at once, but for financial analysis you need to see it spread across months.

CashCompass solves this by letting you enter the full amount once and automatically spreading it across months. The accrual view shows the correct monthly amount, while the cash view shows when money actually moves.

### 1.3 Who is this for?
- Individuals who want to manage complex cash flow
- People who find professional accounting software too heavy but still want systematic management
- Anyone who wants a simple dashboard to see income vs. expenses

> Target users are general public with no accounting background. The app presents accrual concepts in plain language (e.g., "Which month does this belong to?" instead of "Recognition date").

---

## 2. Goals

| Goal | Description |
|------|-------------|
| Primary | Users can record income and expenses easily |
| Primary | Users can set a monthly budget and track progress |
| Primary | Users can tag each transaction with a payment method (card or account) |
| Primary | Users can register credit cards with statement period and billing date so the system can calculate when cash actually moves |
| Primary | Users can project future cash flow by entering planned transactions |
| Nice to Have (v1.1) | Users can run what-if scenarios (e.g., "what if I cut dining by 30%?") |
| Secondary | Users can import multiple transactions at once by uploading a bank/card app screenshot |
| Secondary | Users can see charts showing spending trends |
| Secondary | Users can see charts showing cash flow |
| Out of scope | Bank account sync (not in v1) |
| Out of scope | Investment tracking (not in v1) |

---

## 3. Key Features

### Feature 1: Transaction Entry
- User can add a transaction with: amount, category, date, note, and payment method
- Two date fields per transaction:
  - **Recognition month** — which month this expense belongs to (accrual view)
  - **Payment date** — when cash actually leaves the account (cash view)
- For lump-sum expenses (e.g., $120 annual fee): user enters the full amount, number of months, and manually picks the start month; system splits the amount equally across those months in the accrual view
- Income can also be split across months in the same way (e.g., annual bonus spread monthly)
- When editing the total amount of a split transaction, the app prompts: "Apply to all months or future months only?" — user decides each time
- User can attach one receipt photo per transaction (JPG/PNG/HEIC, max 5 MB; stored on the server, encrypted at rest)
- User can edit or delete any transaction
- User can filter and search transaction history by date range, category, amount, and payment method
- **Categories:**
  - Default categories: Food, Transport, Housing, Utilities, Entertainment, Healthcare, Salary, Other
  - User can create, rename, or delete custom categories

### Feature 2: Payment Method Management
- User can add payment methods: credit cards and bank accounts
- For each credit card, user can define:
  - Card name (e.g., "Kakao Bank Visa")
  - Statement period start day (e.g., 1st of each month)
  - Statement period end day (e.g., last day of each month)
  - Billing date (e.g., 25th of the following month)
- The system compares each transaction's date against the card's statement period to determine which billing cycle it belongs to, then auto-calculates the cash payment date
- Dashboard shows which payment method cash will leave from, and when

> **Example:** Card with statement period 1st–last day and billing date 25th of next month.
> A transaction on January 20th falls within the January statement period → cash payment date = February 25th.

### Feature 3: Dashboard — Dual View
- Default view shows **Accrual View** and **Cash View** side by side for the current month
- Accrual View: shows expenses in the month they are recognized (when cost is incurred)
- Cash View: shows expenses in the month cash actually leaves the account
- Each view shows: total income, total expenses, net balance
- User can navigate to any past or future month

<!-- COMMENT: Desktop shows both views side by side. On mobile, the two views are shown as toggle tabs
     (user taps "Accrual" or "Cash" to switch). This must be reflected in the wireframe design. -->

### Feature 4: Cash Flow Projection
- User can enter planned future transactions (e.g., rent next month, upcoming vacation)
- A transaction is classified as **"planned"** if its date is in the future, and **"actual"** once the date has passed — distinction is automatic, based on date alone
- When a planned transaction's date passes without modification, the system prompts the user on the next dashboard view: *"Did this transaction actually happen?"* — user can confirm (mark as actual), edit details, or delete
- Dashboard shows projected monthly balance for up to 12 months ahead
- Projection chart shows a month-by-month cash flow line graph
- **What-if scenario mode** (v1.1): user can adjust a category (e.g., reduce dining by 30%) and see how the projection changes
- Scenarios are temporary — they do not save as real transactions

<!-- COMMENT: What-if scenarios require a clear UI pattern so users don't confuse scenario data with real data.
     This is a medium-complexity feature. If the timeline is tight, consider shipping projection first (v1)
     and what-if scenarios in v1.1. -->

### Feature 5: Budget Management
- User can set a monthly spending limit per category
- Progress bar shows percentage used for each category
- Yellow warning when spending reaches 80% of budget
- Red indicator when budget is exceeded
- Budget settings carry over to the next month unless changed

### Feature 6: Charts and Analysis
- Spending by category: pie chart for the selected month
- Monthly trend: bar chart showing income vs. expenses over the past 6 months
- Cash flow projection: line graph for the next 12 months (linked to Feature 4)
- All charts work in both Accrual View and Cash View

### Feature 7: Data Export
- User can export their transaction history as CSV (for spreadsheet use)
- User can export a monthly summary report as PDF (formatted, printable)
- Both exports can be filtered by month and category before downloading

### Feature 8: User Account
- User can sign up and log in with email and password
- During signup, user sets their default currency (e.g., USD, KRW, EUR) — all transactions use this currency
- Each user's data is private — no other user can see it
- User can reset password via email link
- User can update their email, password, or default currency in account settings
- **Currency change behavior:** changing the default currency only affects future transactions. Past transactions keep their original currency — they are NOT converted retroactively. When transactions in multiple currencies coexist, the dashboard and reports display separate per-currency subtotals (e.g., "KRW total: ₩1,000,000 | USD total: $500")

### Feature 9: AI Smart Import from Screenshot
- User can upload a screenshot from a bank or credit card app
- AI analyzes the image and extracts multiple transaction items automatically:
  - Transaction date
  - Merchant name or description
  - Amount
  - Suggested category (AI best guess — user can change)
- System presents all extracted items in a review screen before saving
- On the review screen, user can:
  - Edit any field per item (date, amount, category, recognition month, payment method)
  - Delete items they do not want to import
  - Select/deselect individual items
- User confirms and saves selected items all at once
- Primary supported image type: bank and credit card app screenshots (v1)
- If AI cannot read an item clearly, that item is flagged for manual review

> **Privacy note:** Screenshot images may contain sensitive financial data. The image is processed and discarded immediately after extraction — it is not stored permanently.

---

## 4. User Flow

```
Sign Up / Log In
      ↓
Dashboard (Accrual View + Cash View side by side, current month)
      ↓
Add Transaction
  → Enter amount, category, recognition month, payment date, payment method, note
  → If lump-sum: enter total amount + number of months → system splits automatically
  → Save
      ↓
Set Up Payment Methods
  → Add credit card → enter billing date
  → System updates cash flow dates for existing transactions
      ↓
Set Budget
  → Choose category → enter monthly limit
  → See warning when 80% is reached
      ↓
View Projection
  → Add planned future transactions
  → Toggle what-if scenario → adjust category → see updated projection
      ↓
View Charts
  → Switch between Accrual View and Cash View
  → Select month range for trend analysis
```

---

## 5. Non-Functional Requirements

| Item | Requirement |
|------|-------------|
| Performance | Pages load in under 2 seconds |
| Security | Passwords are encrypted, each user's data is isolated |
| Platform | Works on desktop browser (Chrome, Firefox, Safari, Edge) |
| Mobile | Responsive design — usable on smartphone browser (dual view shown as toggle tabs on mobile) |
| Language | English and Korean for v1 |
| Data | User data is not deleted unless the user requests it |

---

## 6. Success Metrics

- User can add a transaction (including split setup) in under 60 seconds
- Accrual view and cash view show different, correct values for a split expense
- Budget warning appears correctly when 80% of a category limit is reached
- Projection chart updates immediately when a future transaction is added
- What-if scenario does not alter saved transaction data

---

## 7. Open Questions

All questions resolved as of 2026-05-23:

| Question | Decision |
|----------|----------|
| When does a mid-year lump-sum split start? | User manually picks the start month |
| Mobile dual view layout? | Toggle tab — switch between Accrual and Cash |
| Notification / reminder system? | Not in v1 — defer to later version |
| Data export? | Yes — CSV and PDF both supported in v1 |
| Edit split amount — update all or future only? | Prompt the user each time to choose |
| Receipt photo upload? | Yes — one photo per transaction in v1 |
| Multi-currency? | No — user sets one currency at signup |
| Multi-user / family sharing? | No — single user only in v1 |

---

## 8. Timeline

| Phase | Content | Target |
|-------|---------|--------|
| Phase 1 | Planning docs complete (PRD, User Stories, Wireframes) | Week 1–2 |
| Phase 2 | Tech stack decision + Database design | Week 3 |
| Phase 3 | Development — core (transaction entry, dashboard dual view) | Week 4–7 |
| Phase 4 | Development — advanced (projection, charts, AI smart import) | Week 8–10 |
| Phase 4.5 | Development — what-if scenarios (deferred to v1.1) | Optional / v1.1 |
| Phase 5 | Testing | Week 11–12 |
| Phase 6 | Launch v1 | Week 13 |

---

*This document will be updated as decisions are made.*

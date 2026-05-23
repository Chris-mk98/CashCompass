# User Stories
# CashCompass — Personal Finance Manager

**Version:** 1.0  
**Date:** 2026-05-23  
**Author:** Chris Kim  
**Status:** Draft

---

## What is a User Story?

A User Story describes a feature from the user's point of view.

**Format:**
> As a **[who]**, I want to **[do what]**, so that **[why / benefit]**.

Each story also has **Acceptance Criteria** — the specific conditions that must be true for the story to be considered done.

**Priority levels:**
- `Must Have` — required for launch (v1)
- `Should Have` — important but not blocking launch
- `Nice to Have` — good to include if time allows

---

## Feature 1: Transaction Entry

---

**US-001**
**Title:** Add a basic transaction
**Story:** As a user, I want to add an income or expense transaction, so that I can keep a record of my finances.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can enter: amount, category, recognition month, payment method, and note
- [ ] I can choose the transaction type: Income or Expense
- [ ] If payment method is a **credit card**: the cash payment date is **auto-calculated** from the transaction date and the card's statement period — I do not need to enter it manually
- [ ] If payment method is a **bank account**: the cash payment date is automatically set to the transaction date
- [ ] After saving, the transaction appears in my transaction history
- [ ] The dashboard totals update immediately after saving

---

**US-002**
**Title:** Add a lump-sum expense split across months
**Story:** As a user, I want to enter a one-time large expense and split it across multiple months, so that the accrual view shows the correct amount per month instead of all at once.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can enter a total amount, number of months, and manually choose the start month
- [ ] The system divides the amount equally and creates one entry per month in the accrual view
- [ ] The cash view still shows the full amount on the actual payment date
- [ ] I can see all split months listed when I view the transaction detail

---

**US-003**
**Title:** Edit the amount of a split transaction
**Story:** As a user, I want to change the total amount of a split transaction, so that I can correct mistakes or update a changed price.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] When I edit a split transaction's amount, the app asks: "Apply to all months or future months only?"
- [ ] If I choose "all months," every month in the split is recalculated equally
- [ ] If I choose "future months only," past months remain unchanged and only remaining months are recalculated
- [ ] The updated totals are reflected immediately in the dashboard

---

**US-004**
**Title:** Attach a receipt photo
**Story:** As a user, I want to attach a photo of my receipt to a transaction, so that I have proof of the purchase stored with the record.
**Priority:** Should Have

**Acceptance Criteria:**
- [ ] I can upload one photo per transaction (from my device)
- [ ] Supported formats: JPG, PNG, HEIC. Maximum file size: 5 MB
- [ ] Photos are stored on the server, encrypted at rest
- [ ] The photo is visible when I open the transaction detail
- [ ] I can replace or delete the attached photo
- [ ] If no photo is attached, the transaction still saves normally
- [ ] When upload fails (wrong format, too large, network error), I see a clear error message and the transaction still saves without a photo

---

**US-005**
**Title:** Edit or delete a transaction
**Story:** As a user, I want to edit or delete any transaction, so that I can fix errors or remove duplicate entries.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can tap/click any transaction to open its detail view
- [ ] I can edit any field and save the changes
- [ ] I can delete the transaction with a confirmation prompt ("Are you sure?")
- [ ] After deletion, the transaction disappears from history and dashboard totals update

---

**US-026**
**Title:** Split income across months
**Story:** As a user, I want to split a one-time income (e.g., an annual bonus) across multiple months, so that the accrual view shows the correct monthly amount instead of all in one month.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] When adding an Income transaction, I can choose to split it across months
- [ ] I can enter a total amount, number of months, and manually choose the start month (same flow as US-002)
- [ ] The system divides the amount equally and creates one entry per month in the accrual view
- [ ] The cash view still shows the full amount on the actual receipt date
- [ ] I can see all split months listed when I view the transaction detail
- [ ] Editing the split amount follows the same "all months / future months only" prompt as US-003

---

**US-027**
**Title:** Manage custom categories
**Story:** As a user, I want to create, rename, and delete my own categories, so that I can organize transactions in ways that match my own spending patterns.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can add a new custom category from the category settings page
- [ ] I can rename any category (default or custom) — existing transactions update automatically
- [ ] I can delete a custom category — transactions using it are reassigned to "Other"
- [ ] Default categories cannot be deleted but can be hidden from the picker
- [ ] Custom categories appear in the transaction entry dropdown alongside default categories

---

**US-028**
**Title:** Filter and search transaction history
**Story:** As a user, I want to filter or search my transaction history, so that I can quickly find specific transactions without scrolling through the whole list.
**Priority:** Should Have

**Acceptance Criteria:**
- [ ] I can filter by date range, category, payment method, transaction type (income/expense), and amount range
- [ ] I can search transactions by keyword in the note/description
- [ ] Multiple filters can be combined (e.g., "Food category" + "last 3 months")
- [ ] The filtered list updates immediately as I change filters
- [ ] Active filters are visible at the top of the list, and I can clear them with one click

---

## Feature 2: Payment Method Management

---

**US-006**
**Title:** Add a credit card with statement period and billing date
**Story:** As a user, I want to register my credit card with its statement period (start day and end day) and billing date, so that the app can automatically determine which billing cycle each transaction belongs to and calculate the exact cash payment date.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can register a credit card with three pieces of information:
  - Card name (e.g., "Kakao Bank Visa")
  - Statement period start day (e.g., 1st of each month)
  - Statement period end day (e.g., last day of each month) and billing date (e.g., 25th of the following month)
- [ ] The system compares each transaction's date against the card's statement period to automatically assign it to the correct billing cycle
- [ ] The system then calculates the cash payment date (billing date) based on that billing cycle
- [ ] I can add multiple credit cards
- [ ] I can edit or delete any registered card including all its settings

> **Example:** Card set to statement period 1st–last day / billing date 25th of next month.
> A transaction on January 20th → falls in January statement period → cash payment date = February 25th (auto-calculated)

---

**US-007**
**Title:** Add a bank account as a payment method
**Story:** As a user, I want to register my bank account as a payment method, so that I can tag transactions paid directly from my account.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can add a bank account with a name (e.g., "Kakao Bank Checking")
- [ ] For bank account transactions, the payment date equals the transaction date (no billing cycle delay)
- [ ] I can add multiple bank accounts

---

**US-008**
**Title:** Tag a transaction with a payment method
**Story:** As a user, I want to tag each transaction with which card or account I used, so that I can track spending per payment method.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] The transaction entry form shows a dropdown of my registered payment methods
- [ ] I can select one payment method per transaction
- [ ] The selected payment method is visible in the transaction history list
- [ ] I can filter transaction history by payment method

---

## Feature 3: Dashboard — Dual View

---

**US-009**
**Title:** View current month in dual view
**Story:** As a user, I want to see my accrual view and cash view side by side on the dashboard, so that I can compare what I owe this month versus what cash is actually leaving my account.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] The dashboard opens to the current month by default
- [ ] On desktop: accrual view and cash view are shown side by side
- [ ] On mobile: accrual and cash views are shown as toggle tabs
- [ ] Each view shows: total income, total expenses, and net balance
- [ ] Values in accrual view and cash view are different for split transactions (proving both are correct)

---

**US-010**
**Title:** Navigate to other months
**Story:** As a user, I want to navigate to past and future months on the dashboard, so that I can review history or plan ahead.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can go to the previous month or next month using arrow buttons
- [ ] The dashboard updates to show that month's data
- [ ] Future months show projected data (from planned transactions) clearly labeled as "projected"
- [ ] I can jump directly to a specific month using a month picker

---

## Feature 4: Cash Flow Projection

---

**US-011**
**Title:** Add a planned future transaction
**Story:** As a user, I want to enter a transaction that I know will happen in the future, so that my projection chart reflects real upcoming costs.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can add a future transaction the same way as a regular transaction (no separate "planned" flag — the system classifies by date alone)
- [ ] Any transaction dated after today is automatically treated as "planned"; once the date passes, it becomes "actual"
- [ ] Planned transactions are visually marked (different color or label) in the transaction history
- [ ] The projection chart updates immediately after I add a planned transaction
- [ ] Planned transactions do not count in past months' actuals
- [ ] When a planned transaction's date has passed without being modified, the next time I open the dashboard, the system prompts: *"Did this transaction actually happen?"* — I can confirm (mark as actual), edit (change date or amount), or delete
- [ ] Until I resolve the prompt, the transaction is flagged in the history list so I don't forget

---

**US-012**
**Title:** View 12-month cash flow projection chart
**Story:** As a user, I want to see a line graph showing my projected balance for the next 12 months, so that I can spot upcoming cash shortfalls before they happen.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] The chart shows projected monthly balance for the next 12 months
- [ ] The chart can be viewed in both Accrual View and Cash View
- [ ] The chart updates when I add or edit planned transactions
- [ ] Months where balance goes negative are highlighted in red

---

**US-013**
**Title:** Use what-if scenario mode
**Story:** As a user, I want to adjust a spending category temporarily and see how it affects my projection, so that I can make better financial decisions without changing my real data.
**Priority:** Nice to Have

**Acceptance Criteria:**
- [ ] I can enter "what-if mode" from the projection screen
- [ ] In what-if mode, I can increase or decrease a category by a percentage or fixed amount
- [ ] The projection chart updates in real time as I adjust
- [ ] What-if mode is visually distinct from normal mode (e.g., banner, color change)
- [ ] Exiting what-if mode restores all original data — nothing is saved

---

## Feature 5: Budget Management

---

**US-014**
**Title:** Set a monthly budget per category
**Story:** As a user, I want to set a spending limit for each category, so that I know when I am spending too much in any area.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can set a monthly limit (in my default currency) for each category
- [ ] Budget limits carry over to the next month automatically unless I change them
- [ ] I can remove a budget limit for a category
- [ ] Categories without a budget limit show no warning

---

**US-015**
**Title:** See budget progress and get warnings
**Story:** As a user, I want to see how much of my budget I have used and get a warning when I am close to the limit, so that I can adjust my spending in time.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] Each category shows a progress bar with the percentage used
- [ ] The progress bar turns yellow when spending reaches 80% of the budget
- [ ] The progress bar turns red when spending exceeds 100% of the budget
- [ ] The warning is visible on both the dashboard and the budget settings page

---

## Feature 6: Charts and Analysis

---

**US-016**
**Title:** View spending by category as a pie chart
**Story:** As a user, I want to see a pie chart of my spending by category for any month, so that I can quickly understand where my money is going.
**Priority:** Should Have

**Acceptance Criteria:**
- [ ] The pie chart shows each category's share of total expenses for the selected month
- [ ] I can tap/click a slice to see the exact amount and percentage
- [ ] The chart works in both Accrual View and Cash View
- [ ] I can select any past or future month

---

**US-017**
**Title:** View monthly income vs. expense trend
**Story:** As a user, I want to see a bar chart comparing my income and expenses over the past 6 months, so that I can spot patterns in my spending over time.
**Priority:** Should Have

**Acceptance Criteria:**
- [ ] The bar chart shows income and expense bars side by side for each of the last 6 months
- [ ] I can switch between Accrual View and Cash View
- [ ] Hovering or tapping a bar shows the exact amount

---

## Feature 7: Data Export

---

**US-018**
**Title:** Export transaction history as CSV
**Story:** As a user, I want to export my transactions to a CSV file, so that I can open them in a spreadsheet for further analysis.
**Priority:** Should Have

**Acceptance Criteria:**
- [ ] I can choose a date range and category filter before exporting
- [ ] The exported CSV includes: date, recognition month, category, amount, payment method, note
- [ ] The file downloads to my device immediately

---

**US-019**
**Title:** Export monthly summary as PDF
**Story:** As a user, I want to export a formatted monthly report as a PDF, so that I can save or print a clean summary of my finances.
**Priority:** Should Have

**Acceptance Criteria:**
- [ ] I can choose which month to export
- [ ] The PDF includes: total income, total expenses, net balance, spending by category
- [ ] The PDF shows both Accrual View and Cash View totals
- [ ] The file downloads to my device immediately

---

## Feature 8: User Account

---

**US-020**
**Title:** Sign up with email and set default currency
**Story:** As a new user, I want to create an account with my email and set my currency, so that I can start tracking my finances in my local currency.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can sign up with email and a password (minimum 8 characters)
- [ ] During signup, I choose my default currency from a dropdown list
- [ ] All transactions use this currency by default
- [ ] I receive a confirmation email after signup

---

**US-021**
**Title:** Log in and log out
**Story:** As a returning user, I want to log in to see my data and log out when I am done, so that my financial data stays private.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] I can log in with my email and password
- [ ] After login, I am taken directly to the dashboard
- [ ] I can log out from any page using a menu option
- [ ] After logout, I cannot access any data without logging in again

---

**US-022**
**Title:** Reset forgotten password
**Story:** As a user who forgot my password, I want to reset it via email, so that I can regain access to my account.
**Priority:** Must Have

**Acceptance Criteria:**
- [ ] On the login page, I can click "Forgot password?"
- [ ] I enter my email and receive a reset link within 2 minutes
- [ ] The reset link expires after 1 hour
- [ ] After resetting, I can log in with the new password immediately

---

**US-023**
**Title:** Update account settings
**Story:** As a user, I want to update my email, password, or default currency in settings, so that I can keep my account information current.
**Priority:** Should Have

**Acceptance Criteria:**
- [ ] I can change my email (requires password confirmation)
- [ ] I can change my password (requires current password)
- [ ] I can change my default currency — applies to future transactions only. Past transactions keep their original currency and are NOT converted retroactively
- [ ] When transactions in multiple currencies coexist, the dashboard and reports show separate per-currency subtotals (e.g., "KRW total: ₩1,000,000  |  USD total: $500") — no mixed/converted total is shown
- [ ] Before confirming a currency change, I see a warning explaining that past transactions will remain in the old currency
- [ ] A success message appears after each change

---

## Feature 9: AI Smart Import from Screenshot

---

**US-024**
**Title:** Upload a screenshot to extract multiple transactions
**Story:** As a user, I want to upload a bank or credit card app screenshot, so that the AI automatically reads all the transactions in it without me having to enter each one manually.
**Priority:** Should Have

**Acceptance Criteria:**
- [ ] I can access the Smart Import feature from the main navigation or the transaction entry page
- [ ] I can upload one screenshot image at a time (JPG or PNG)
- [ ] After uploading, a loading indicator is shown while the AI processes the image
- [ ] The AI extracts the following fields from each detected transaction: date, merchant/description, amount, and a suggested category
- [ ] If the AI cannot clearly read a field, that item is flagged as "Needs review" rather than being silently skipped
- [ ] If the image contains no recognizable transactions, the app shows a clear error message

---

**US-025**
**Title:** Review, edit, and save AI-extracted transactions
**Story:** As a user, I want to review all AI-extracted items before saving, so that I can correct any mistakes and make sure only accurate transactions are added to my records.
**Priority:** Should Have

**Acceptance Criteria:**
- [ ] After AI extraction, a review screen shows all detected transactions in a list
- [ ] Each item displays: date, merchant/description, amount, suggested category, recognition month, and payment method
- [ ] I can edit any field on any item before saving
- [ ] I can delete individual items I do not want to import
- [ ] I can select or deselect items using a checkbox — only checked items will be saved
- [ ] Items flagged "Needs review" are visually highlighted and must be confirmed or deleted before I can save
- [ ] I can save all selected items at once with a single "Import" button
- [ ] After saving, all imported transactions appear in my transaction history and the dashboard updates immediately

---

## Summary

| ID | Title | Feature | Priority |
|----|-------|---------|----------|
| US-001 | Add a basic transaction | Transaction Entry | Must Have |
| US-002 | Add a lump-sum split transaction | Transaction Entry | Must Have |
| US-003 | Edit split transaction amount | Transaction Entry | Must Have |
| US-004 | Attach a receipt photo | Transaction Entry | Should Have |
| US-005 | Edit or delete a transaction | Transaction Entry | Must Have |
| US-026 | Split income across months | Transaction Entry | Must Have |
| US-027 | Manage custom categories | Transaction Entry | Must Have |
| US-028 | Filter and search transaction history | Transaction Entry | Should Have |
| US-006 | Add a credit card with statement period and billing date | Payment Methods | Must Have |
| US-007 | Add a bank account | Payment Methods | Must Have |
| US-008 | Tag transaction with payment method | Payment Methods | Must Have |
| US-009 | View dual view dashboard | Dashboard | Must Have |
| US-010 | Navigate to other months | Dashboard | Must Have |
| US-011 | Add a planned future transaction | Projection | Must Have |
| US-012 | View 12-month projection chart | Projection | Must Have |
| US-013 | Use what-if scenario mode | Projection | Nice to Have |
| US-014 | Set monthly budget per category | Budget | Must Have |
| US-015 | See budget progress and warnings | Budget | Must Have |
| US-016 | View spending pie chart | Charts | Should Have |
| US-017 | View monthly trend bar chart | Charts | Should Have |
| US-018 | Export transactions as CSV | Export | Should Have |
| US-019 | Export monthly summary as PDF | Export | Should Have |
| US-020 | Sign up with email and currency | User Account | Must Have |
| US-021 | Log in and log out | User Account | Must Have |
| US-022 | Reset forgotten password | User Account | Must Have |
| US-023 | Update account settings | User Account | Should Have |
| US-024 | Upload screenshot for AI extraction | AI Smart Import | Should Have |
| US-025 | Review and save AI-extracted transactions | AI Smart Import | Should Have |

**Total: 28 stories**
- Must Have: 17
- Should Have: 10
- Nice to Have: 1

# Wireframes
# CashCompass — Personal Finance Management App

**Version:** 1.0  
**Date:** 2026-05-23  
**Author:** Chris Kim  
**Status:** Draft

---

## Table of Contents

1. [Global Navigation](#1-global-navigation)
2. [Authentication Screens](#2-authentication-screens)
3. [Dashboard — Dual View](#3-dashboard--dual-view)
4. [Transaction Entry](#4-transaction-entry)
5. [Transaction List](#5-transaction-list)
6. [Payment Method Management](#6-payment-method-management)
7. [Budget Management](#7-budget-management)
8. [Cash Flow Projection](#8-cash-flow-projection)
9. [Charts and Analysis](#9-charts-and-analysis)
10. [Data Export](#10-data-export)
11. [AI Smart Import](#11-ai-smart-import)
12. [Account Settings](#12-account-settings)
13. [Category Management](#13-category-management)
14. [Mobile Layouts](#14-mobile-layouts)

---

## Wireframe Legend

```
[ Button ]          Clickable button
[v Dropdown ]       Dropdown select
[_________]         Text input field
(o) / ( )           Radio button (selected / unselected)
[x] / [ ]           Checkbox (checked / unchecked)
[< ] [ >]           Previous/next navigation
─── ───             Divider line
///                 Omitted content
+--...--+           Container/card area
```

---

## 1. Global Navigation

> Common navigation bar displayed at the top of every page after login.
> Related user story: US-021

### 1-1. Desktop Navigation Bar

```
+------------------------------------------------------------------------+
| CASHCOMPASS   Dashboard  Transactions  Budget  Charts  Export [👤 Settings ▾] |
+------------------------------------------------------------------------+
```

- Logo click → Navigate to dashboard
- Current page menu item is highlighted
- [👤 Settings ▾] click opens dropdown:

```
                                            +-----------------+
                                            | Payment Methods |
                                            | Categories      |
                                            | Account Settings|
                                            |-----------------|
                                            | Log Out         |
                                            +-----------------+
```

### 1-2. Mobile Navigation

```
+--------------------------------------------+
| ☰  CASHCOMPASS                    [👤]     |
+--------------------------------------------+

+--------------------------------------------+
| Dashboard | Trans. | Budget | Charts | More |
+--------------------------------------------+
```

- Top: Hamburger menu (☰) and profile icon
- Bottom: Tab bar (5 main menu items)
- "More" tab: Export, Payment Methods, Categories, Account Settings, Log Out

---

## 2. Authentication Screens

> Related user stories: US-020, US-021, US-022

### 2-1. Sign Up

```
+----------------------------------------------+
|                                              |
|              CASHCOMPASS                     |
|        Track your money at a glance          |
|                                              |
|  +----------------------------------------+  |
|  |            Sign Up                      |  |
|  |                                        |  |
|  |  Email                                 |  |
|  |  [____________________________]        |  |
|  |                                        |  |
|  |  Password (min. 8 characters)          |  |
|  |  [____________________________]        |  |
|  |                                        |  |
|  |  Confirm Password                      |  |
|  |  [____________________________]        |  |
|  |                                        |  |
|  |  Default Currency                      |  |
|  |  [v KRW - South Korean Won   ▾]       |  |
|  |                                        |  |
|  |  [         Sign Up          ]          |  |
|  |                                        |  |
|  |  Already have an account? Log in       |  |
|  +----------------------------------------+  |
|                                              |
+----------------------------------------------+
```

**Behavior:**
- Email format validation, minimum 8-character password check
- On success → Confirmation email sent → Navigate to login page
- Currency dropdown: KRW, USD, EUR, JPY, GBP, etc.

### 2-2. Log In

```
+----------------------------------------------+
|                                              |
|              CASHCOMPASS                     |
|                                              |
|  +----------------------------------------+  |
|  |            Log In                       |  |
|  |                                        |  |
|  |  Email                                 |  |
|  |  [____________________________]        |  |
|  |                                        |  |
|  |  Password                              |  |
|  |  [____________________________]        |  |
|  |                                        |  |
|  |  [          Log In          ]          |  |
|  |                                        |  |
|  |  Forgot your password?                 |  |
|  |  Don't have an account? Sign up        |  |
|  +----------------------------------------+  |
|                                              |
+----------------------------------------------+
```

**Behavior:**
- On success → Navigate to dashboard
- On failure → "Invalid email or password" message

### 2-3. Password Reset Request

```
+----------------------------------------------+
|                                              |
|              CASHCOMPASS                     |
|                                              |
|  +----------------------------------------+  |
|  |       Reset Password                    |  |
|  |                                        |  |
|  |  Enter your registered email.           |  |
|  |  We'll send you a reset link.           |  |
|  |                                        |  |
|  |  Email                                 |  |
|  |  [____________________________]        |  |
|  |                                        |  |
|  |  [     Send Reset Link      ]          |  |
|  |                                        |  |
|  |  ← Back to Login                       |  |
|  +----------------------------------------+  |
|                                              |
+----------------------------------------------+
```

### 2-4. Set New Password (after email link click)

```
+----------------------------------------------+
|                                              |
|              CASHCOMPASS                     |
|                                              |
|  +----------------------------------------+  |
|  |       Set New Password                  |  |
|  |                                        |  |
|  |  New Password (min. 8 characters)      |  |
|  |  [____________________________]        |  |
|  |                                        |  |
|  |  Confirm New Password                  |  |
|  |  [____________________________]        |  |
|  |                                        |  |
|  |  [      Change Password     ]          |  |
|  +----------------------------------------+  |
|                                              |
+----------------------------------------------+
```

---

## 3. Dashboard — Dual View

> Related user stories: US-009, US-010, US-011, US-015
> Desktop shows accrual/cash views side by side; mobile uses tab toggle

### 3-1. Desktop Dashboard

```
+------------------------------------------------------------------------+
| CASHCOMPASS   Dashboard  Transactions  Budget  Charts  Export [👤 Settings ▾] |
+------------------------------------------------------------------------+
|                                                                        |
|                  [< ] May 2026 [📅] [ >]                               |
|                                                                        |
|  +--- Pending Transaction Alert (US-011) ----------------------------+ |
|  | ⚠ 2 pending transactions need your confirmation.  [ Review ]      | |
|  +-------------------------------------------------------------------+ |
|                                                                        |
|  +--- Accrual View -------------------+ +--- Cash View ---------------+|
|  |                                    | |                             ||
|  |  Total Income    ₩3,500,000        | |  Total Income  ₩3,500,000   ||
|  |  Total Expenses  ₩2,180,000        | |  Total Expenses ₩2,850,000  ||
|  |  ─────────────────────             | |  ─────────────────────      ||
|  |  Net Balance     ₩1,320,000        | |  Net Balance     ₩650,000   ||
|  |                                    | |                             ||
|  |  Spending by Category ─────        | |  Spending by Category ───── ||
|  |  Food       ₩450,000 ████░ 75%    | |  Food       ₩450,000        ||
|  |  Transport  ₩180,000 ██░░░ 40%    | |  Transport  ₩180,000        ||
|  |  Housing    ₩800,000 ████░ 80%    | |  Housing  ₩1,500,000        ||
|  |  Utilities  ₩150,000 ██░░░ 38%    | |  Utilities  ₩150,000        ||
|  |  Leisure    ₩200,000 ███░░ 60%    | |  Leisure    ₩200,000        ||
|  |  ///                               | |  ///                        ||
|  |                                    | |                             ||
|  +------------------------------------+ +-----------------------------+|
|                                                                        |
|  +--- Budget Alerts (US-015) ----------------------------------------+ |
|  | 🟡 Housing budget at 80% (₩800,000 / ₩1,000,000)                 | |
|  | 🔴 Food budget exceeded! (₩450,000 / ₩400,000)                   | |
|  +-------------------------------------------------------------------+ |
|                                                                        |
|  [ + New Transaction ]    [ 📷 Smart Import ]                          |
|                                                                        |
+------------------------------------------------------------------------+
```

**Behavior:**
- [< ] [ >] : Navigate to previous/next month
- [📅] : Month picker popup → jump to specific month
- Pending transaction alert: shown only when past-due pending transactions exist
- Category progress bars: budget usage ratio (only for categories with budgets set)
- Progress bar colors: 0–79% blue, 80–99% yellow, 100%+ red
- Accrual/cash views show different amounts for split transactions

### 3-2. Pending Transaction Confirmation Dialog

> Asks the user to confirm past-due pending transactions.
> Related user story: US-011

```
+----------------------------------------------+
|     Confirm Pending Transaction               |
|----------------------------------------------|
|                                              |
|  This transaction's date has passed.         |
|  Did it actually occur?                      |
|                                              |
|  2026-05-15  Food  ₩35,000                   |
|  Note: Team lunch                            |
|                                              |
|  [  Confirm (mark as actual)  ]              |
|  [  Edit (change date/amount)  ]             |
|  [  Delete  ]                                |
|                                              |
|        1 / 2              [ Next > ]          |
+----------------------------------------------+
```

---

## 4. Transaction Entry

> Related user stories: US-001, US-002, US-003, US-004, US-026

### 4-1. Basic Transaction Form

```
+----------------------------------------------+
|  New Transaction                       [ ✕ ] |
|----------------------------------------------|
|                                              |
|  Transaction Type                            |
|  (o) Expense    ( ) Income                   |
|                                              |
|  Amount                                      |
|  [v ₩ ] [________________]                  |
|                                              |
|  Category                                    |
|  [v Select category        ▾]               |
|                                              |
|  Which month does this belong to?            |
|  [v May 2026               ▾]               |
|                                              |
|  Payment Method                              |
|  [v Kakaobank Visa          ▾]              |
|                                              |
|  Payment Date (auto-calculated)              |
|  June 25, 2026  ℹ                           |
|                                              |
|  Note (optional)                             |
|  [____________________________]              |
|                                              |
|  Receipt photo (optional)                    |
|  [ 📎 Choose File ]  JPG, PNG, HEIC / Max 5MB|
|                                              |
|  [ ] Spread across multiple months           |
|                                              |
|  [        Save        ]    [ Cancel ]        |
+----------------------------------------------+
```

**Behavior:**
- Credit card payment method → Payment date auto-calculated (based on card billing cycle)
- Bank account payment method → Payment date = transaction date
- ℹ icon hover: "Kakaobank Visa — Billing period: 1st–last day, Payment: 25th of next month"
- "Spread across multiple months" checkbox → Expands split section (4-2)

### 4-2. Split Entry Section (when expanded)

> Appears when "Spread across multiple months" checkbox is selected.

```
|  ┌─ Split Settings ────────────────────────┐ |
|  │                                         │ |
|  │  Total Amount                            │ |
|  │  ₩120,000                               │ |
|  │                                         │ |
|  │  How many months to split?              │ |
|  │  [v 12 months             ▾]            │ |
|  │                                         │ |
|  │  Starting Month                         │ |
|  │  [v January 2026           ▾]           │ |
|  │                                         │ |
|  │  ── Split Preview ────────────          │ |
|  │  Jan 2026   ₩10,000                     │ |
|  │  Feb 2026   ₩10,000                     │ |
|  │  Mar 2026   ₩10,000                     │ |
|  │  ///                                    │ |
|  │  Dec 2026   ₩10,000                     │ |
|  │  ──────────────────────                 │ |
|  │  Total: ₩120,000 (12 months)            │ |
|  │                                         │ |
|  └─────────────────────────────────────────┘ |
```

### 4-3. Split Amount Edit Dialog

> Related user story: US-003

```
+----------------------------------------------+
|      Edit Split Amount                        |
|----------------------------------------------|
|                                              |
|  Modify the total amount for this split      |
|  transaction.                                |
|                                              |
|  Current total: ₩120,000                     |
|  New total:     [v ₩ ] [________________]    |
|                                              |
|  How should the change be applied?           |
|  (o) Apply to all months (recalculate all)   |
|  ( ) Apply to future months only (keep past) |
|                                              |
|  [     Apply     ]    [ Cancel ]             |
+----------------------------------------------+
```

### 4-4. Transaction Detail View

```
+----------------------------------------------+
|  Transaction Detail                    [ ✕ ] |
|----------------------------------------------|
|                                              |
|  Expense  ₩120,000                           |
|  ──────────────────────                      |
|                                              |
|  Category         Leisure/Culture            |
|  Recognition      Jan–Dec 2026 (12-mo split) |
|  Payment Method   Kakaobank Visa             |
|  Payment Date     January 25, 2026           |
|  Note             Netflix annual subscription|
|                                              |
|  ── Split Breakdown ──────────────           |
|  Jan 2026    ₩10,000                         |
|  Feb 2026    ₩10,000                         |
|  Mar 2026    ₩10,000                         |
|  ///                                         |
|  Dec 2026    ₩10,000                         |
|                                              |
|  ── Receipt ───────────────────              |
|  [ 📷 receipt_001.jpg ]                       |
|                                              |
|  [ Edit ]    [ Delete ]                      |
+----------------------------------------------+
```

### 4-5. Delete Confirmation

```
+----------------------------------------------+
|      Delete Transaction                       |
|----------------------------------------------|
|                                              |
|  Are you sure you want to delete this?       |
|                                              |
|  Expense  ₩120,000  Leisure/Culture          |
|  Netflix annual subscription                 |
|                                              |
|  This action cannot be undone.               |
|                                              |
|  [     Delete     ]    [ Cancel ]            |
+----------------------------------------------+
```

---

## 5. Transaction List

> Related user stories: US-005, US-028

### 5-1. Transaction List Page

```
+------------------------------------------------------------------------+
| CASHCOMPASS   Dashboard  Transactions  Budget  Charts  Export [👤 Settings ▾] |
+------------------------------------------------------------------------+
|                                                                        |
|  Transactions                                [ + New Transaction ]     |
|                                                                        |
|  +--- Filter / Search -----------------------------------------------+|
|  | 🔍 [________________________]   Search (notes, description)       ||
|  |                                                                   ||
|  | Period: [v Last month ▾]  Category: [v All ▾]  Type: [v All ▾]    ||
|  | Payment: [v All ▾]   Amount: [v Min] ~ [v Max]                    ||
|  |                                                                   ||
|  | Active filters: [Category: Food ✕] [Last 3 months ✕]  [ Clear all]||
|  +-------------------------------------------------------------------+|
|                                                                        |
|  View: (o) Accrual basis  ( ) Cash basis                               |
|                                                                        |
|  +--- May 2026 ------------------------------------------------------+|
|  |                                                                   ||
|  | Date      Category  Description       Payment       Amount        ||
|  | ─────────────────────────────────────────────────────────          ||
|  | 05-22    Food      Lunch box          Kakaobank Visa  -₩12,000    ||
|  | 05-20    Transport Subway recharge    Checking Acct  -₩50,000     ||
|  | 05-18    Leisure   Netflix (1/12)     Kakaobank Visa  -₩10,000    ||
|  |          ↳ Split transaction (of ₩120,000)                        ||
|  | 05-15    Food      Team lunch         Kakaobank Visa  -₩35,000    ||
|  |          ⏳ Pending                                                ||
|  | 05-01    Salary    May salary         Checking Acct  +₩3,500,000  ||
|  |                                                                   ||
|  +-------------------------------------------------------------------+|
|                                                                        |
|  +--- April 2026 ----------------------------------------------------+|
|  | ///                                                               ||
|  +-------------------------------------------------------------------+|
|                                                                        |
|  [      ← Previous       ]            [       Next →       ]          |
|                                                                        |
+------------------------------------------------------------------------+
```

**Behavior:**
- Row click → Opens transaction detail view (4-4)
- Split transactions: "(1/12)" label + split info below
- Pending transactions: ⏳ icon for visual distinction
- View toggle: Accrual = sorted by recognition month, Cash = sorted by payment date
- Filters update list immediately

---

## 6. Payment Method Management

> Related user stories: US-006, US-007, US-008

### 6-1. Payment Methods List

```
+----------------------------------------------+
|  Payment Methods                              |
|----------------------------------------------|
|                                              |
|  ── Credit Cards ────────────────            |
|                                              |
|  +--- Kakaobank Visa ──────────────────+     |
|  |  Billing period: 1st – last day      |     |
|  |  Payment date:   25th of next month  |     |
|  |  This month's usage: ₩680,000        |     |
|  |  Next payment due: 2026-06-25        |     |
|  |                [ Edit ]  [ Delete ]  |     |
|  +--------------------------------------+     |
|                                              |
|  +--- Samsung Card ────────────────────+     |
|  |  Billing period: 16th – 15th (next)  |     |
|  |  Payment date:   10th of next month  |     |
|  |  This month's usage: ₩230,000        |     |
|  |  Next payment due: 2026-06-10        |     |
|  |                [ Edit ]  [ Delete ]  |     |
|  +--------------------------------------+     |
|                                              |
|  [ + Add Credit Card ]                       |
|                                              |
|  ── Bank Accounts ───────────────            |
|                                              |
|  +--- Kakaobank Checking ──────────────+     |
|  |  (Bank account: payment = same day)  |     |
|  |                [ Edit ]  [ Delete ]  |     |
|  +--------------------------------------+     |
|                                              |
|  [ + Add Bank Account ]                      |
|                                              |
+----------------------------------------------+
```

### 6-2. Credit Card Registration/Edit Form

```
+----------------------------------------------+
|  Add Credit Card                       [ ✕ ] |
|----------------------------------------------|
|                                              |
|  Card Name                                   |
|  [____________________________]              |
|  e.g., Kakaobank Visa, Samsung Card          |
|                                              |
|  Billing Period Start                        |
|  [v 1  ▾] of each month                     |
|                                              |
|  Billing Period End                          |
|  [v Last day ▾] of each month               |
|                                              |
|  Payment Date                                |
|  [v Next month ▾]  [v 25 ▾]                 |
|                                              |
|  ── Example ────────────────────             |
|  Transaction on Jan 20 →                     |
|  Falls in Jan billing period →               |
|  Cash outflow date: Feb 25                   |
|                                              |
|  [        Save        ]    [ Cancel ]        |
+----------------------------------------------+
```

### 6-3. Bank Account Registration Form

```
+----------------------------------------------+
|  Add Bank Account                      [ ✕ ] |
|----------------------------------------------|
|                                              |
|  Account Name                                |
|  [____________________________]              |
|  e.g., Kakaobank Checking, Shinhan Salary    |
|                                              |
|  ℹ Bank account transactions are             |
|    automatically processed with               |
|    payment date = transaction date.           |
|                                              |
|  [        Save        ]    [ Cancel ]        |
+----------------------------------------------+
```

---

## 7. Budget Management

> Related user stories: US-014, US-015

### 7-1. Budget Settings Page

```
+------------------------------------------------------------------------+
| CASHCOMPASS   Dashboard  Transactions  Budget  Charts  Export [👤 Settings ▾] |
+------------------------------------------------------------------------+
|                                                                        |
|  Budget Management                  [< ] May 2026 [ >]                 |
|                                                                        |
|  ℹ Budget settings carry over to the next month until changed.         |
|                                                                        |
|  Category       Budget Limit      Spent         Usage                  |
|  ────────────────────────────────────────────────────                   |
|                                                                        |
|  Food           ₩400,000         ₩450,000                              |
|  🔴 ████████████████████░░ 113% — Over budget!                         |
|                                              [ Edit ]  [ Remove ]      |
|                                                                        |
|  Transport      ₩450,000         ₩180,000                              |
|  🔵 ████████░░░░░░░░░░░░░  40%                                         |
|                                              [ Edit ]  [ Remove ]      |
|                                                                        |
|  Housing        ₩1,000,000       ₩800,000                              |
|  🟡 ████████████████░░░░░  80% — Warning                               |
|                                              [ Edit ]  [ Remove ]      |
|                                                                        |
|  Utilities      ₩400,000         ₩150,000                              |
|  🔵 ████████░░░░░░░░░░░░░  38%                                         |
|                                              [ Edit ]  [ Remove ]      |
|                                                                        |
|  Leisure        ₩350,000         ₩200,000                              |
|  🔵 ████████████░░░░░░░░░  57%                                         |
|                                              [ Edit ]  [ Remove ]      |
|                                                                        |
|  Medical        (No budget set)                                        |
|                                              [ Set Budget ]            |
|                                                                        |
|  Salary         (No budget set)                                        |
|                                              [ Set Budget ]            |
|                                                                        |
|  Other          (No budget set)                                        |
|                                              [ Set Budget ]            |
|                                                                        |
+------------------------------------------------------------------------+
```

**Behavior:**
- Progress bar colors: 0–79% blue (🔵), 80–99% yellow (🟡), 100%+ red (🔴)
- [Edit] → Inline budget limit input
- [Remove] → Remove budget limit (no alerts shown)
- [Set Budget] → Set new budget limit
- Progress bars only shown for categories with budgets set

### 7-2. Budget Limit Inline Edit

```
|  Food           [v ₩ ] [_________]    [ Save ] [ Cancel ]              |
```

---

## 8. Cash Flow Projection

> Related user stories: US-012, US-013

### 8-1. Cash Flow Projection Chart

```
+------------------------------------------------------------------------+
| CASHCOMPASS   Dashboard  Transactions  Budget  Charts  Export [👤 Settings ▾] |
+------------------------------------------------------------------------+
|                                                                        |
|  Cash Flow Projection                                                  |
|                                                                        |
|  View: (o) Cash basis    ( ) Accrual basis                             |
|                                                                        |
|  +--- Projected Balance — Next 12 Months ────────────────────────+     |
|  |                                                               |     |
|  |  ₩5M ┤                                                       |     |
|  |      │        ╭──╮                                           |     |
|  |  ₩4M ┤   ╭──╮│  │                                           |     |
|  |      │╭─╮│  ││  │╭──╮                                       |     |
|  |  ₩3M ┤│ ││  ││  ││  │                                       |     |
|  |      ││ ╰│  ╰│  ╰│  │╭──╮                                   |     |
|  |  ₩2M ┤│  │   │   │  ││  │╭──╮                               |     |
|  |      ││  │   │   │  ╰│  ╰│  │╭──╮                           |     |
|  |  ₩1M ┤│  │   │   │   │   │  ││  │╭──╮╭──╮                   |     |
|  |      ││  │   │   │   │   │  ╰│  ╰│  ╰│  │                   |     |
|  |   ₩0 ┤──────────────────────────────────│──                  |     |
|  |      │                                  │                    |     |
|  | -₩1M ┤                                  ╰──╮                |     |
|  |      │                               🔴    │                |     |
|  |      └──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┘                |     |
|  |        May Jun Jul Aug Sep Oct Nov Dec Jan Feb Mar Apr       |     |
|  |        2026                                2027              |     |
|  |                                                               |     |
|  |  ── Actual    --- Projected              🔴 Negative alert    |     |
|  +---------------------------------------------------------------+     |
|                                                                        |
|  +--- Monthly Summary ───────────────────────────────────────+         |
|  |                                                           |         |
|  |  Month    Income        Expenses      Net Balance  Status |         |
|  |  ─────────────────────────────────────────────────        |         |
|  |  May    ₩3,500,000   ₩2,850,000   ₩4,650,000    Actual   |         |
|  |  Jun    ₩3,500,000   ₩3,100,000   ₩5,050,000    Proj.    |         |
|  |  Jul    ₩3,500,000   ₩2,900,000   ₩5,650,000    Proj.    |         |
|  |  ///                                                      |         |
|  |  Apr    ₩3,500,000   ₩4,800,000  -₩1,200,000    Proj. 🔴 |         |
|  |                                                           |         |
|  +-----------------------------------------------------------+         |
|                                                                        |
|  [ 🔮 What-if Scenario Mode (v1.1) ]                                   |
|                                                                        |
+------------------------------------------------------------------------+
```

### 8-2. What-if Scenario Mode (v1.1)

> This feature is planned for v1.1. Wireframe is for reference only.

```
+------------------------------------------------------------------------+
|  ⚡ What-if Scenario Mode — Changes will NOT be saved       [ Exit ]   |
+------------------------------------------------------------------------+
|                                                                        |
|  Category Adjustments ─────────────────────────                        |
|                                                                        |
|  Food        Current ₩450,000  →  [v -30%  ▾]  →  ₩315,000           |
|  Transport   Current ₩180,000  →  [v No change ▾]  →  ₩180,000       |
|  Housing     Current ₩800,000  →  [v No change ▾]  →  ₩800,000       |
|  Leisure     Current ₩200,000  →  [v -50%  ▾]  →  ₩100,000           |
|                                                                        |
|  +--- Adjusted Projection Chart ─────────────────────────────+         |
|  |                                                           |         |
|  |  ── Original    === Scenario                              |         |
|  |                                                           |         |
|  |  (Chart: both original and scenario lines shown together) |         |
|  |                                                           |         |
|  +-----------------------------------------------------------+         |
|                                                                        |
|  Monthly savings: ₩135,000/month                                       |
|  12-month cumulative savings: ₩1,620,000                               |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## 9. Charts and Analysis

> Related user stories: US-016, US-017

### 9-1. Charts Page

```
+------------------------------------------------------------------------+
| CASHCOMPASS   Dashboard  Transactions  Budget  Charts  Export [👤 Settings ▾] |
+------------------------------------------------------------------------+
|                                                                        |
|  Charts & Analysis                                                     |
|                                                                        |
|  View: (o) Accrual basis    ( ) Cash basis                             |
|                                                                        |
|  +--- Spending by Category (Pie Chart) ──────────────────────+         |
|  |                                                           |         |
|  |  [< ] May 2026 [ >]                                      |         |
|  |                                                           |         |
|  |          ╭────────╮                                       |         |
|  |        ╭─┤ Food   │                                       |         |
|  |      ╭─┤ │ 21%    │     Food       ₩450,000  (21%)        |         |
|  |      │Tr│ ╰────────╯     Transport  ₩180,000   (8%)        |         |
|  |      │8%│                Housing    ₩800,000  (37%)        |         |
|  |      ╰──┤ ╭────────╮     Utilities  ₩150,000   (7%)        |         |
|  |         │ │Housing │     Leisure    ₩200,000   (9%)        |         |
|  |         │ │ 37%    │     Medical    ₩100,000   (5%)        |         |
|  |         ╰─┤        │     Other      ₩300,000  (14%)        |         |
|  |           ╰────────╯                                       |         |
|  |                         Total: ₩2,180,000                  |         |
|  +------------------------------------------------------------+         |
|                                                                        |
|  +--- Monthly Income/Expense Trend (Bar Chart) ──────────────+         |
|  |                                                           |         |
|  |  ₩4M ┤                                                   |         |
|  |      │  ██                            ██                  |         |
|  |  ₩3M ┤  ██ ▓▓    ██       ██    ██    ██                 |         |
|  |      │  ██ ▓▓    ██ ▓▓    ██ ▓▓ ██ ▓▓ ██ ▓▓              |         |
|  |  ₩2M ┤  ██ ▓▓    ██ ▓▓    ██ ▓▓ ██ ▓▓ ██ ▓▓              |         |
|  |      │  ██ ▓▓    ██ ▓▓    ██ ▓▓ ██ ▓▓ ██ ▓▓              |         |
|  |  ₩1M ┤  ██ ▓▓    ██ ▓▓    ██ ▓▓ ██ ▓▓ ██ ▓▓              |         |
|  |      │  ██ ▓▓    ██ ▓▓    ██ ▓▓ ██ ▓▓ ██ ▓▓              |         |
|  |   ₩0 ┤──────────────────────────────────────              |         |
|  |        Dec   Jan   Feb   Mar   Apr   May                  |         |
|  |                                                           |         |
|  |  ██ Income    ▓▓ Expenses                                 |         |
|  +-----------------------------------------------------------+         |
|                                                                        |
|  +--- Cash Flow Projection (Line Chart) ─────────────────────+         |
|  |                                                           |         |
|  |  (Same as Feature 8 — Cash Flow Projection Chart)         |         |
|  |  [ View Details → ]                                       |         |
|  |                                                           |         |
|  +-----------------------------------------------------------+         |
|                                                                        |
+------------------------------------------------------------------------+
```

**Behavior:**
- View toggle: All charts switch between accrual/cash basis
- Pie chart segment click/tap → Exact amount and percentage tooltip
- Bar chart hover/tap → Exact amount tooltip
- Cash flow [View Details →] → Navigate to Feature 8 page

---

## 10. Data Export

> Related user stories: US-018, US-019

### 10-1. Export Page

```
+------------------------------------------------------------------------+
| CASHCOMPASS   Dashboard  Transactions  Budget  Charts  Export [👤 Settings ▾] |
+------------------------------------------------------------------------+
|                                                                        |
|  Data Export                                                           |
|                                                                        |
|  +--- Transaction CSV Export ────────────────────────────────+         |
|  |                                                           |         |
|  |  Date Range                                               |         |
|  |  [v January 2026  ▾]  ~  [v May 2026  ▾]                 |         |
|  |                                                           |         |
|  |  Category (optional)                                      |         |
|  |  [v All categories       ▾]                               |         |
|  |                                                           |         |
|  |  Included fields:                                         |         |
|  |  Date, Recognition month, Category, Amount,               |         |
|  |  Payment method, Note                                     |         |
|  |                                                           |         |
|  |  [    📥 Download CSV    ]                                |         |
|  +-----------------------------------------------------------+         |
|                                                                        |
|  +--- Monthly Summary PDF Export ────────────────────────────+         |
|  |                                                           |         |
|  |  Month                                                    |         |
|  |  [v May 2026              ▾]                              |         |
|  |                                                           |         |
|  |  PDF includes:                                            |         |
|  |  • Total income / Total expenses / Net balance            |         |
|  |  • Spending breakdown by category                         |         |
|  |  • Both accrual view and cash view totals                 |         |
|  |                                                           |         |
|  |  [    📥 Download PDF    ]                                |         |
|  +-----------------------------------------------------------+         |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## 11. AI Smart Import

> Related user stories: US-024, US-025

### 11-1. Image Upload

```
+----------------------------------------------+
|  AI Smart Import                       [ ✕ ] |
|----------------------------------------------|
|                                              |
|  Upload a screenshot from your bank or       |
|  credit card app.                            |
|                                              |
|  AI will automatically extract transaction   |
|  details.                                    |
|                                              |
|  +--------------------------------------+    |
|  |                                      |    |
|  |                                      |    |
|  |     📷 Drag & drop an image here     |    |
|  |        or click to select            |    |
|  |                                      |    |
|  |        JPG, PNG / Max 10MB           |    |
|  |                                      |    |
|  +--------------------------------------+    |
|                                              |
|  ℹ Privacy: Uploaded images are deleted      |
|    immediately after processing.             |
|                                              |
+----------------------------------------------+
```

### 11-2. AI Processing

```
+----------------------------------------------+
|  AI Smart Import                       [ ✕ ] |
|----------------------------------------------|
|                                              |
|  +--------------------------------------+    |
|  |  [ Uploaded image preview ]           |    |
|  +--------------------------------------+    |
|                                              |
|  ⏳ AI is analyzing your transactions...     |
|  ████████████░░░░░░░░                        |
|                                              |
+----------------------------------------------+
```

### 11-3. Review Screen

```
+------------------------------------------------------------------------+
|  AI Smart Import — Review                                       [ ✕ ] |
|------------------------------------------------------------------------|
|                                                                        |
|  AI detected 5 transactions. Please review before saving.              |
|                                                                        |
|  Payment Method (apply to all)                                         |
|  [v Kakaobank Visa           ▾]                                        |
|                                                                        |
|  +--- Detected Transactions ─────────────────────────────────────+     |
|  |                                                               |     |
|  |  [x] ① 2026-05-20  Starbucks Gangnam       ₩5,500             |     |
|  |       Category: [v Food ▾]  Month: [v May 2026 ▾]            |     |
|  |                                                               |     |
|  |  [x] ② 2026-05-19  Kakao Taxi              ₩12,300            |     |
|  |       Category: [v Transport ▾]  Month: [v May 2026 ▾]       |     |
|  |                                                               |     |
|  |  [x] ③ 2026-05-18  Coupang                 ₩35,000            |     |
|  |       Category: [v Other ▾]  Month: [v May 2026 ▾]           |     |
|  |                                                               |     |
|  |  [x] ④ 2026-05-17  GS25 Convenience        ₩3,200             |     |
|  |       Category: [v Food ▾]  Month: [v May 2026 ▾]            |     |
|  |                                                               |     |
|  |  ⚠ Needs Review                                               |     |
|  |  [x] ⑤ 2026-05-15  [________]             ₩[______]           |     |
|  |       AI could not clearly read this item.                    |     |
|  |       Please enter the details manually.                      |     |
|  |       Category: [v Select ▾]  Month: [v May 2026 ▾]          |     |
|  |                                       [ Remove this item ]    |     |
|  |                                                               |     |
|  +---------------------------------------------------------------+     |
|                                                                        |
|  Selected: 5 / 5 items                                                 |
|                                                                        |
|  [      Import (save 5 items)      ]         [ Cancel ]               |
|                                                                        |
+------------------------------------------------------------------------+
```

**Behavior:**
- Checkboxes: Select/deselect individual items; only selected items are saved
- All fields are editable (date, description, amount, category, recognition month)
- "⚠ Needs Review" items: Cannot import if required fields are empty
- Payment method bulk apply: Selection at top applies to all items
- [Import] → Bulk save selected items → Reflected in transaction list + dashboard updated

---

## 12. Account Settings

> Related user story: US-023

### 12-1. Account Settings Page

```
+----------------------------------------------+
|  Account Settings                             |
|----------------------------------------------|
|                                              |
|  ── Change Email ──────────────────          |
|                                              |
|  Current email: chris@example.com            |
|                                              |
|  New Email                                   |
|  [____________________________]              |
|                                              |
|  Current Password (for verification)         |
|  [____________________________]              |
|                                              |
|  [    Change Email    ]                      |
|                                              |
|  ── Change Password ────────────────         |
|                                              |
|  Current Password                            |
|  [____________________________]              |
|                                              |
|  New Password (min. 8 characters)            |
|  [____________________________]              |
|                                              |
|  Confirm New Password                        |
|  [____________________________]              |
|                                              |
|  [   Change Password   ]                    |
|                                              |
|  ── Change Default Currency ─────────        |
|                                              |
|  Current currency: KRW (₩)                  |
|                                              |
|  New Currency                                |
|  [v USD - US Dollar        ▾]               |
|                                              |
|  ⚠ Changing your currency will not convert   |
|    existing transactions. Only future         |
|    transactions will use the new currency.    |
|    If multiple currencies coexist,            |
|    the dashboard will show separate totals    |
|    per currency.                              |
|                                              |
|  [    Change Currency    ]                   |
|                                              |
+----------------------------------------------+
```

---

## 13. Category Management

> Related user story: US-027

### 13-1. Category Management Page

```
+----------------------------------------------+
|  Category Management                          |
|----------------------------------------------|
|                                              |
|  ── Default Categories ──────────────        |
|                                              |
|  Food           [ Rename ]  [👁 Hidden]       |
|  Transport      [ Rename ]  [👁 Visible]      |
|  Housing        [ Rename ]  [👁 Visible]      |
|  Utilities      [ Rename ]  [👁 Visible]      |
|  Leisure        [ Rename ]  [👁 Visible]      |
|  Medical        [ Rename ]  [👁 Visible]      |
|  Salary         [ Rename ]  [👁 Visible]      |
|  Other          [ Rename ]  [👁 Visible]      |
|                                              |
|  ℹ Default categories cannot be deleted      |
|    but can be hidden from the list.          |
|                                              |
|  ── Custom Categories ───────────────        |
|                                              |
|  Pets           [ Rename ]  [ Delete ]        |
|  Self-dev       [ Rename ]  [ Delete ]        |
|                                              |
|  ℹ Transactions in deleted categories        |
|    will be moved to "Other" automatically.   |
|                                              |
|  [ + Add New Category ]                      |
|                                              |
+----------------------------------------------+
```

### 13-2. Category Rename

```
|  Food  →  [________]  [ Save ] [ Cancel ]     |
```

### 13-3. Category Delete Confirmation

```
+----------------------------------------------+
|      Delete Category                          |
|----------------------------------------------|
|                                              |
|  Delete the "Pets" category?                 |
|                                              |
|  3 transactions in this category will be     |
|  moved to "Other" automatically.             |
|                                              |
|  [     Delete     ]    [ Cancel ]            |
+----------------------------------------------+
```

---

## 14. Mobile Layouts

> PRD Non-Functional Requirement: Responsive design for smartphone browsers
> Dashboard dual view uses tab toggle on mobile

### 14-1. Mobile Dashboard

```
+------------------------------------+
| ☰  CASHCOMPASS             [👤]   |
+------------------------------------+
|                                    |
|    [< ] May 2026 [📅] [ >]        |
|                                    |
|  +--- Pending Alert ───────────+   |
|  | ⚠ 2 need review  [ Review ]|   |
|  +-----------------------------+   |
|                                    |
|  [ Accrual View ]  [ Cash View ]   |
|   ─────────────  (active tab)      |
|                                    |
|  Total Income    ₩3,500,000        |
|  Total Expenses  ₩2,180,000        |
|  ───────────────────               |
|  Net Balance     ₩1,320,000        |
|                                    |
|  Spending by Category ──────       |
|  Food     ₩450,000  ████░ 75%     |
|  Transport ₩180,000 ██░░░ 40%     |
|  Housing  ₩800,000  ████░ 80%     |
|  ///                               |
|                                    |
|  +--- Budget Alerts ──────────+    |
|  | 🟡 Housing at 80%          |    |
|  | 🔴 Food over budget!       |    |
|  +----------------------------+    |
|                                    |
|  [ + New Trans. ]  [ 📷 Import ]   |
|                                    |
+------------------------------------+
| Dashboard | Trans | Budget | Charts | ⋯ |
+------------------------------------+
```

### 14-2. Mobile Transaction Entry

```
+------------------------------------+
| ←  New Transaction                 |
+------------------------------------+
|                                    |
|  Transaction Type                  |
|  (o) Expense    ( ) Income         |
|                                    |
|  Amount                            |
|  [v ₩ ] [________________]        |
|                                    |
|  Category                          |
|  [v Select category      ▾]       |
|                                    |
|  Which month does this belong to?  |
|  [v May 2026             ▾]       |
|                                    |
|  Payment Method                    |
|  [v Kakaobank Visa        ▾]      |
|                                    |
|  Payment Date (auto-calculated)    |
|  June 25, 2026  ℹ                 |
|                                    |
|  Note (optional)                   |
|  [____________________________]    |
|                                    |
|  Receipt (optional)                |
|  [ 📎 Choose File ]               |
|                                    |
|  [ ] Spread across multiple months |
|                                    |
|  [        Save        ]           |
|                                    |
+------------------------------------+
```

### 14-3. Mobile Transaction List

```
+------------------------------------+
| ←  Transactions        [ + Add ]   |
+------------------------------------+
|                                    |
| 🔍 [__________________]           |
| Filters: [Period▾] [Cat.▾] [More▾] |
|                                    |
| ── May 2026 ─────────────         |
|                                    |
| 05-22  Food                        |
| Lunch box             -₩12,000    |
| Kakaobank Visa                     |
| ────────────────────               |
| 05-20  Transport                   |
| Subway recharge       -₩50,000    |
| Checking Acct                      |
| ────────────────────               |
| 05-18  Leisure         ⏳ Pending  |
| Netflix (1/12)        -₩10,000    |
| Kakaobank Visa                     |
| ────────────────────               |
| ///                                |
|                                    |
+------------------------------------+
| Dashboard | Trans | Budget | Charts | ⋯ |
+------------------------------------+
```

---

## Screen Navigation Summary

```
Login / Sign Up
      │
      ▼
Dashboard (Home)
      │
      ├──→ Transaction List
      │        ├──→ Transaction Detail ──→ Edit / Delete
      │        └──→ Add Transaction (with split)
      │
      ├──→ Budget Management ──→ Set/Edit Budget
      │
      ├──→ Charts & Analysis
      │        └──→ Cash Flow Projection (Detail)
      │                └──→ What-if Scenario Mode (v1.1)
      │
      ├──→ Data Export ──→ CSV / PDF Download
      │
      ├──→ AI Smart Import ──→ Review ──→ Bulk Save
      │
      └──→ Settings Menu
               ├──→ Payment Method Management ──→ Add Card/Account
               ├──→ Category Management
               └──→ Account Settings
```

---

## User Story ↔ Screen Mapping

| User Story | Related Screen |
|------------|----------------|
| US-001 Basic transaction entry | 4-1 Transaction form |
| US-002 Lump-sum split entry | 4-2 Split entry section |
| US-003 Split amount edit | 4-3 Split amount edit dialog |
| US-004 Receipt photo attachment | 4-1 Transaction form (photo area) |
| US-005 Transaction edit/delete | 4-4 Detail view, 4-5 Delete confirm |
| US-006 Credit card registration | 6-2 Credit card form |
| US-007 Bank account registration | 6-3 Bank account form |
| US-008 Payment method tagging | 4-1 Transaction form (payment dropdown) |
| US-009 Dual view dashboard | 3-1 Desktop, 14-1 Mobile |
| US-010 Month navigation | 3-1 Month navigation |
| US-011 Future pending transactions | 3-2 Pending transaction dialog |
| US-012 12-month projection chart | 8-1 Cash flow projection chart |
| US-013 What-if scenario | 8-2 What-if scenario mode |
| US-014 Category budget setting | 7-1 Budget settings page |
| US-015 Budget progress & alerts | 3-1 Dashboard alerts, 7-1 Progress bars |
| US-016 Pie chart | 9-1 Spending by category chart |
| US-017 Trend bar chart | 9-1 Monthly trend chart |
| US-018 CSV export | 10-1 CSV section |
| US-019 PDF export | 10-1 PDF section |
| US-020 Sign up | 2-1 Sign up |
| US-021 Login/logout | 2-2 Login, 1-1 Nav dropdown |
| US-022 Password reset | 2-3, 2-4 Password reset |
| US-023 Account settings | 12-1 Account settings |
| US-024 AI smart import | 11-1 Upload, 11-2 Processing |
| US-025 AI review & save | 11-3 Review screen |
| US-026 Income split entry | 4-2 Split entry section (same for income) |
| US-027 Category management | 13-1 Category management |
| US-028 Filtering & search | 5-1 Filter/search area |

---

*This document will be continuously updated as development progresses.*

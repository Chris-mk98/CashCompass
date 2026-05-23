# API Design
# CashCompass — Personal Finance Management App

**Version:** 1.0  
**Date:** 2026-05-23  
**Author:** Chris Kim  
**Status:** Draft

---

## 1. Overview

CashCompass uses Next.js 15 App Router, employing **three data access patterns** instead of a traditional REST API:

| Pattern | Use Case | Examples |
|---------|----------|---------|
| **Server Actions** | Data mutations (Create/Update/Delete) | Add transaction, set budget, delete category |
| **Data Fetching (Server Components)** | Data reads | Dashboard totals, transaction list, budget usage |
| **API Routes** | Tasks requiring HTTP endpoints (file downloads, image uploads) | CSV/PDF export, AI image analysis |

---

## 2. Common Conventions

### 2-1. Authentication

All Server Actions and Data Fetching functions verify the Supabase session on invocation.

```typescript
// lib/auth.ts
async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Unauthorized')
  return user
}
```

### 2-2. Response Format

Server Actions return a unified `ActionResult` type:

```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

### 2-3. Input Validation

All user inputs are validated with Zod schemas. The same schema is shared between frontend (React Hook Form) and server (Server Action).

### 2-4. Error Codes

| Code | HTTP (API Route) | Description |
|------|-----------------|-------------|
| `UNAUTHORIZED` | 401 | Login required |
| `FORBIDDEN` | 403 | Attempted access to another user's data |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `CONFLICT` | 409 | Duplicate data |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 3. Auth

> Supabase Auth wrapped in Server Actions.
> Related: US-020, US-021, US-022

### 3-1. Sign Up

```
Action: signup(formData)
File:   actions/auth.ts

Input:
  email:           string    (email format)
  password:        string    (min 8 chars)
  defaultCurrency: string    ("KRW" | "USD" | "EUR" | ...)
  language:        string    ("ko" | "en")

Logic:
  1. Validate input with Zod
  2. Call supabase.auth.signUp()
     - Include defaultCurrency, language in raw_user_meta_data
  3. DB trigger auto-creates profiles + default categories
  4. Confirmation email sent (Supabase handles automatically)

Output (success):
  { success: true, data: { message: "Confirmation email sent" } }

Output (failure):
  { success: false, error: "Email already registered" }
```

### 3-2. Log In

```
Action: login(formData)
File:   actions/auth.ts

Input:
  email:    string
  password: string

Logic:
  1. Call supabase.auth.signInWithPassword()
  2. Set session cookie

Output (success):
  { success: true, data: null }
  → Client redirects to /dashboard

Output (failure):
  { success: false, error: "Invalid email or password" }
```

### 3-3. Log Out

```
Action: logout()
File:   actions/auth.ts

Logic:
  1. Call supabase.auth.signOut()
  2. Clear session cookie

Output:
  → Redirect to /login
```

### 3-4. Request Password Reset

```
Action: requestPasswordReset(formData)
File:   actions/auth.ts

Input:
  email: string

Logic:
  1. Call supabase.auth.resetPasswordForEmail()
  2. Reset link email sent (expires after 1 hour)

Output:
  { success: true, data: { message: "Reset link sent to your email" } }

Note: Returns same success message even for unregistered emails (security)
```

### 3-5. Set New Password

```
Action: updatePassword(formData)
File:   actions/auth.ts

Input:
  password: string (min 8 chars)

Logic:
  1. Call supabase.auth.updateUser({ password })

Output (success):
  { success: true, data: null }
  → Redirect to /login
```

---

## 4. Transactions

> Related: US-001, US-002, US-003, US-004, US-005, US-011, US-026

### 4-1. Create Transaction

```
Action: createTransaction(formData)
File:   actions/transactions.ts

Input:
  type:             "income" | "expense"
  amount:           number   (positive)
  currency:         string   (3 chars)
  categoryId:       string   (UUID)
  paymentMethodId:  string?  (UUID, optional)
  transactionDate:  string   (YYYY-MM-DD)
  recognitionMonth: string   (YYYY-MM-DD, 1st of month)
  note:             string?  (max 500 chars)
  isSplit:          boolean
  splitCount:       number?  (2–60, required when isSplit=true)
  splitStartMonth:  string?  (YYYY-MM-DD, required when isSplit=true)

Logic:
  1. Verify authentication
  2. Validate with Zod schema
  3. If payment method is credit card → auto-calculate paymentDate
     If bank account or none → paymentDate = transactionDate
  4. Set confirmedAt:
     transactionDate <= today → confirmedAt = now()
     transactionDate > today  → confirmedAt = null
  5. INSERT transactions record
  6. Create transaction_allocations:
     - isSplit=false → 1 record (recognitionMonth, amount)
     - isSplit=true  → splitCount records (each month, amount/splitCount)
  7. revalidatePath('/dashboard'), revalidatePath('/transactions')

Output (success):
  { success: true, data: { id: "txn_xxx" } }
```

### 4-2. Update Transaction

```
Action: updateTransaction(id, formData)
File:   actions/transactions.ts

Input:
  id: string (UUID)
  + Same fields as createTransaction

Logic:
  1. Verify auth + ownership
  2. Delete existing allocations, create new ones
  3. UPDATE transactions record
  4. If receipt changed, delete old + upload new
  5. revalidatePath

Output (success):
  { success: true, data: { id: "txn_xxx" } }
```

### 4-3. Delete Transaction

```
Action: deleteTransaction(id)
File:   actions/transactions.ts

Input:
  id: string (UUID)

Logic:
  1. Verify auth + ownership
  2. Delete receipt from Storage if exists
  3. DELETE transaction (CASCADE deletes allocations)
  4. revalidatePath

Output (success):
  { success: true, data: null }
```

### 4-4. Update Split Amount

```
Action: updateSplitAmount(id, formData)
File:   actions/transactions.ts

Input:
  id:        string  (UUID)
  newAmount: number  (new total amount)
  applyTo:   "all" | "future"

Logic:
  applyTo = "all":
    1. transactions.amount = newAmount
    2. Delete all allocations, recreate with newAmount / splitCount

  applyTo = "future":
    1. transactions.amount = newAmount
    2. Keep past allocations (recognition_month < this month's 1st)
    3. Calculate past total
    4. Remaining = newAmount - past total
    5. Delete future allocations, recreate with remaining / remaining months

Output (success):
  { success: true, data: null }
```

### 4-5. Confirm Pending Transaction

```
Action: confirmPendingTransaction(id, action)
File:   actions/transactions.ts

Input:
  id:     string (UUID)
  action: "confirm" | "delete"
  updatedData?: { transactionDate?, amount?, ... }

Logic:
  action = "confirm":
    1. Set confirmedAt = now()
    2. If updatedData provided, also update transaction fields
  action = "delete":
    1. Delete transaction

Output (success):
  { success: true, data: null }
```

### 4-6. Upload Receipt

```
Action: uploadReceipt(transactionId, file)
File:   actions/transactions.ts

Input:
  transactionId: string (UUID)
  file:          File   (JPG/PNG/HEIC, max 5MB)

Logic:
  1. Validate file type and size
  2. Delete existing receipt if any
  3. Upload to Supabase Storage: receipts/{userId}/{transactionId}.{ext}
  4. Update transactions.receipt_path

Output (success):
  { success: true, data: { path: "receipts/xxx/txn_xxx.jpg" } }
```

### 4-7. Delete Receipt

```
Action: deleteReceipt(transactionId)
File:   actions/transactions.ts

Input:
  transactionId: string (UUID)

Logic:
  1. Delete file from Storage
  2. Set transactions.receipt_path = null

Output (success):
  { success: true, data: null }
```

---

## 5. Categories

> Related: US-027

### 5-1. Get Categories

```
Fetcher: getCategories()
File:    queries/categories.ts

Returns:
  Category[] — { id, name, isDefault, isHidden, sortOrder }
```

### 5-2. Create Category

```
Action: createCategory(formData)
File:   actions/categories.ts

Input:
  name: string (1–50 chars)

Logic:
  1. Check for duplicate name
  2. INSERT with is_default=false, is_hidden=false, sort_order=last+1

Output (success):
  { success: true, data: { id: "cat_xxx" } }
```

### 5-3. Rename Category

```
Action: renameCategory(id, formData)
File:   actions/categories.ts

Input:
  id:   string (UUID)
  name: string (1–50 chars)

Logic:
  1. Verify ownership
  2. Check for duplicate name
  3. UPDATE name
  (Existing transactions auto-reflect via FK)

Output (success):
  { success: true, data: null }
```

### 5-4. Delete Category

```
Action: deleteCategory(id)
File:   actions/categories.ts

Input:
  id: string (UUID)

Logic:
  1. If is_default=true → error ("Cannot delete default category")
  2. Move transactions to "Other": UPDATE transactions SET category_id = {other_id}
  3. Delete associated budget if exists
  4. DELETE category

Output (success):
  { success: true, data: { movedCount: 3 } }
```

### 5-5. Toggle Category Visibility

```
Action: toggleCategoryVisibility(id)
File:   actions/categories.ts

Input:
  id: string (UUID)

Logic:
  1. Only default categories can be hidden
  2. Toggle is_hidden

Output (success):
  { success: true, data: { isHidden: true } }
```

---

## 6. Payment Methods

> Related: US-006, US-007

### 6-1. Get Payment Methods

```
Fetcher: getPaymentMethods()
File:    queries/payment-methods.ts

Returns:
  PaymentMethod[] — {
    id, type, name,
    billingStartDay?, billingEndDay?, paymentDay?, paymentMonthOffset?,
    currentMonthUsage, nextPaymentDate
  }
```

### 6-2. Create Credit Card

```
Action: createPaymentMethod(formData)
File:   actions/payment-methods.ts

Input:
  type:               "credit_card"
  name:               string (1–100 chars)
  billingStartDay:    number (1–28)
  billingEndDay:      number (0=last day, 1–28)
  paymentDay:         number (1–28)
  paymentMonthOffset: number (0–3, default 1)

Output (success):
  { success: true, data: { id: "pm_xxx" } }
```

### 6-3. Create Bank Account

```
Action: createPaymentMethod(formData)
File:   actions/payment-methods.ts

Input:
  type: "bank_account"
  name: string (1–100 chars)

Output (success):
  { success: true, data: { id: "pm_xxx" } }
```

### 6-4. Update Payment Method

```
Action: updatePaymentMethod(id, formData)
File:   actions/payment-methods.ts

Logic:
  1. UPDATE
  2. If credit card billing cycle changed:
     Recalculate payment_date for all transactions tagged with this card

Output (success):
  { success: true, data: { updatedTransactions: 15 } }
```

### 6-5. Delete Payment Method

```
Action: deletePaymentMethod(id)
File:   actions/payment-methods.ts

Logic:
  1. DELETE (ON DELETE SET NULL → existing transactions' payment_method_id becomes NULL)

Output (success):
  { success: true, data: null }
```

---

## 7. Budgets

> Related: US-014, US-015

### 7-1. Get Budgets with Usage

```
Fetcher: getBudgetsWithUsage(month)
File:    queries/budgets.ts

Input:
  month: string (YYYY-MM-DD, 1st of month)

Returns:
  BudgetWithUsage[] — {
    id, categoryId, categoryName, monthlyLimit, currency,
    spent, usagePct, status ("normal" | "warning" | "exceeded")
  }
```

### 7-2. Set/Update Budget

```
Action: setBudget(formData)
File:   actions/budgets.ts

Input:
  categoryId:   string (UUID)
  monthlyLimit: number (positive)

Logic:
  1. UPSERT (user_id + category_id UNIQUE constraint)
  2. currency = user's current default_currency

Output (success):
  { success: true, data: { id: "budget_xxx" } }
```

### 7-3. Delete Budget

```
Action: deleteBudget(categoryId)
File:   actions/budgets.ts

Input:
  categoryId: string (UUID)

Output (success):
  { success: true, data: null }
```

---

## 8. Dashboard & Analytics

> Related: US-009, US-010, US-012, US-016, US-017

### 8-1. Dashboard Summary

```
Fetcher: getDashboardSummary(month)
File:    queries/dashboard.ts

Input:
  month: string (YYYY-MM-DD, 1st of month)

Returns:
  {
    accrualView: { totalIncome, totalExpense, netBalance, byCategory[] }
    cashView:    { totalIncome, totalExpense, netBalance, byCategory[] }
    budgetAlerts: { categoryName, status, spent, limit }[]
    pendingTransactions: { id, date, category, amount, note }[]
    currencies: string[]
  }
```

### 8-2. Transaction List (filtered/paginated)

```
Fetcher: getTransactions(params)
File:    queries/transactions.ts

Input:
  viewType, startDate?, endDate?, categoryId?, paymentMethodId?,
  type?, amountMin?, amountMax?, search?, page, pageSize

Returns:
  { items: TransactionListItem[], total, page, pageSize, totalPages }
```

### 8-3. 12-Month Cash Flow Projection

```
Fetcher: getCashFlowProjection(viewType)
File:    queries/projection.ts

Input:
  viewType: "accrual" | "cash"

Returns:
  { months: { month, income, expenses, netBalance, isActual }[], hasNegativeBalance }
```

### 8-4. Spending by Category (Pie Chart)

```
Fetcher: getSpendingByCategory(month, viewType)
File:    queries/charts.ts

Returns:
  { categories: { categoryName, amount, percentage }[], total }
```

### 8-5. Monthly Income/Expense Trend (Bar Chart)

```
Fetcher: getMonthlyTrend(months, viewType)
File:    queries/charts.ts

Returns:
  { month, income, expense }[]
```

---

## 9. Data Export

> Related: US-018, US-019

### 9-1. CSV Export

```
Route: GET /api/export/csv
File:  app/api/export/csv/route.ts

Query Params: startMonth, endMonth, categoryId?

Response:
  Content-Type: text/csv
  Content-Disposition: attachment; filename="cashcompass_2026-01_2026-05.csv"

CSV Columns:
  Date, Type, Amount, Currency, Category, Recognition Month,
  Payment Method, Payment Date, Note
```

### 9-2. PDF Export

```
Route: GET /api/export/pdf
File:  app/api/export/pdf/route.ts

Query Params: month

Response:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="cashcompass_2026-05_summary.pdf"

PDF Contents:
  - Header: CashCompass Monthly Summary — {Month}
  - Accrual View: Total income, expenses, net balance
  - Cash View: Total income, expenses, net balance
  - Spending by category table
```

---

## 10. AI Smart Import

> Related: US-024, US-025

### 10-1. Analyze Image

```
Route: POST /api/import/analyze
File:  app/api/import/analyze/route.ts

Request:
  Content-Type: multipart/form-data
  Body: { image: File (JPG/PNG, max 10MB) }

Logic:
  1. Verify auth
  2. Validate file type and size
  3. Base64-encode image
  4. Call Claude API (Haiku 4.5 Vision)
  5. Parse and normalize AI response
  6. Match suggested categories by keyword
  7. Discard original image (not stored)

Response (success):
  {
    items: {
      date, description, amount, suggestedCategory,
      needsReview, confidence
    }[]
    totalDetected: number
  }

Response (failure):
  { error: "No transactions detected in the image" }
```

### 10-2. Bulk Create Transactions

```
Action: bulkCreateTransactions(formData)
File:   actions/transactions.ts

Input:
  transactions: {
    type, amount, categoryId, paymentMethodId,
    transactionDate, recognitionMonth, note
  }[]

Logic:
  1. Validate each item with Zod
  2. Calculate paymentDate for credit cards
  3. Batch INSERT within a transaction (transactions + allocations)
  4. revalidatePath

Output (success):
  { success: true, data: { createdCount: 5 } }
```

---

## 11. Profile / Account Settings

> Related: US-023

### 11-1. Get Profile

```
Fetcher: getProfile()
File:    queries/profile.ts

Returns:
  { id, email, defaultCurrency, language, createdAt }
```

### 11-2. Change Email

```
Action: changeEmail(formData)
File:   actions/profile.ts

Input: newEmail, currentPassword

Logic:
  1. Verify current password
  2. Call supabase.auth.updateUser({ email: newEmail })
  3. Confirmation email sent to new address

Output (success):
  { success: true, data: { message: "Confirmation email sent to new address" } }
```

### 11-3. Change Password

```
Action: changePassword(formData)
File:   actions/profile.ts

Input: currentPassword, newPassword (min 8 chars)

Logic:
  1. Verify current password
  2. Call supabase.auth.updateUser({ password: newPassword })

Output (success):
  { success: true, data: null }
```

### 11-4. Change Default Currency

```
Action: changeCurrency(formData)
File:   actions/profile.ts

Input: currency (3 chars, ISO 4217)

Logic:
  1. Update profiles.default_currency
  2. Existing transactions unchanged (no retroactive conversion)

Output (success):
  { success: true, data: null }
```

---

## 12. Utility Functions

### 12-1. Credit Card Payment Date Calculation

```
Function: calculatePaymentDate(transactionDate, paymentMethod)
File:     lib/payment-date.ts

Returns: Date (payment date)
```

### 12-2. Split Allocation Generation

```
Function: createAllocations(totalAmount, splitCount, startMonth)
File:     lib/split.ts

Returns: { recognitionMonth: Date, amount: number, sortOrder: number }[]
```

---

## 13. File Structure Summary

```
app/
├── actions/
│   ├── auth.ts              ← 3. Auth
│   ├── transactions.ts      ← 4. Transactions + 10-2. Bulk create
│   ├── categories.ts        ← 5. Categories
│   ├── payment-methods.ts   ← 6. Payment Methods
│   ├── budgets.ts           ← 7. Budgets
│   └── profile.ts           ← 11. Profile
│
├── api/
│   ├── export/
│   │   ├── csv/route.ts     ← 9-1. CSV Export
│   │   └── pdf/route.ts     ← 9-2. PDF Export
│   └── import/
│       └── analyze/route.ts ← 10-1. AI Image Analysis
│
queries/
│   ├── dashboard.ts         ← 8-1. Dashboard summary
│   ├── transactions.ts      ← 8-2. Transaction list
│   ├── projection.ts        ← 8-3. Cash flow projection
│   ├── charts.ts            ← 8-4, 8-5. Chart data
│   ├── categories.ts        ← 5-1. Category list
│   ├── payment-methods.ts   ← 6-1. Payment methods list
│   ├── budgets.ts           ← 7-1. Budget usage
│   └── profile.ts           ← 11-1. Profile
│
lib/
│   ├── supabase/
│   │   ├── server.ts        ← Supabase server client
│   │   └── client.ts        ← Supabase browser client
│   ├── prisma.ts            ← Prisma client singleton
│   ├── auth.ts              ← Auth helper
│   ├── payment-date.ts      ← 12-1. Payment date calculation
│   ├── split.ts             ← 12-2. Split allocation
│   └── validations/
│       ├── transaction.ts
│       ├── category.ts
│       ├── payment-method.ts
│       ├── budget.ts
│       └── auth.ts
```

---

## 14. User Story ↔ API Mapping

| User Story | API / Action |
|------------|-------------|
| US-001 Basic transaction | 4-1 createTransaction |
| US-002 Lump-sum split | 4-1 createTransaction (isSplit=true) |
| US-003 Split amount edit | 4-4 updateSplitAmount |
| US-004 Receipt attachment | 4-6 uploadReceipt, 4-7 deleteReceipt |
| US-005 Edit/delete transaction | 4-2 updateTransaction, 4-3 deleteTransaction |
| US-006 Credit card registration | 6-2 createPaymentMethod (credit_card) |
| US-007 Bank account registration | 6-3 createPaymentMethod (bank_account) |
| US-008 Payment method tagging | 4-1 createTransaction (paymentMethodId) |
| US-009 Dual view dashboard | 8-1 getDashboardSummary |
| US-010 Month navigation | 8-1 getDashboardSummary (month param) |
| US-011 Future pending transactions | 4-1 createTransaction + 4-5 confirmPendingTransaction |
| US-012 12-month projection chart | 8-3 getCashFlowProjection |
| US-013 What-if scenario | (v1.1 — client-side calculation, no API needed) |
| US-014 Budget setting | 7-2 setBudget |
| US-015 Budget alerts | 7-1 getBudgetsWithUsage, 8-1 getDashboardSummary |
| US-016 Pie chart | 8-4 getSpendingByCategory |
| US-017 Bar chart | 8-5 getMonthlyTrend |
| US-018 CSV export | 9-1 GET /api/export/csv |
| US-019 PDF export | 9-2 GET /api/export/pdf |
| US-020 Sign up | 3-1 signup |
| US-021 Login/logout | 3-2 login, 3-3 logout |
| US-022 Password reset | 3-4 requestPasswordReset, 3-5 updatePassword |
| US-023 Account settings | 11-2 changeEmail, 11-3 changePassword, 11-4 changeCurrency |
| US-024 AI smart import | 10-1 POST /api/import/analyze |
| US-025 AI review & save | 10-2 bulkCreateTransactions |
| US-026 Income split | 4-1 createTransaction (type=income, isSplit=true) |
| US-027 Category management | 5-2–5-5 Category CRUD |
| US-028 Filtering & search | 8-2 getTransactions |

---

*This document will be updated as development progresses.*

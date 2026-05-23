# Database Design
# CashCompass — Personal Finance Management App

**Version:** 1.0  
**Date:** 2026-05-23  
**Author:** Chris Kim  
**Status:** Draft  
**Database:** PostgreSQL (Supabase)  
**ORM:** Prisma

---

## 1. Overview

The CashCompass database is designed to support the **dual-view system** (Accrual + Cash).
Core design principles:

- **One transaction, two perspectives:** Every transaction has a `payment_date` (cash view) and one or more `transaction_allocations` (accrual view)
- **User data isolation:** Supabase RLS (Row Level Security) enforces per-user data separation at the database level
- **Automatic credit card payment date calculation:** Card billing period and payment date info is stored to auto-calculate cash outflow dates

---

## 2. ER Diagram

```
┌─────────────────┐
│    profiles      │
│─────────────────│
│ id (PK, =auth)  │
│ default_currency │
│ language         │
└────────┬────────┘
         │
         │ 1:N
         ├──────────────────────────────────────────────────┐
         │                    │                              │
         ▼                    ▼                              ▼
┌─────────────────┐  ┌─────────────────┐          ┌─────────────────┐
│ payment_methods │  │   categories    │          │    budgets       │
│─────────────────│  │─────────────────│          │─────────────────│
│ id (PK)         │  │ id (PK)         │          │ id (PK)         │
│ user_id (FK)    │  │ user_id (FK)    │          │ user_id (FK)    │
│ type            │  │ name            │          │ category_id (FK)│
│ name            │  │ is_default      │          │ monthly_limit   │
│ billing_start   │  │ is_hidden       │          │ currency        │
│ billing_end     │  │ sort_order      │          └─────────────────┘
│ payment_day     │  └────────┬────────┘
│ payment_offset  │           │
└────────┬────────┘           │
         │                    │
         │ 1:N                │ 1:N
         │                    │
         ▼                    ▼
    ┌──────────────────────────────┐
    │        transactions          │
    │──────────────────────────────│
    │ id (PK)                      │
    │ user_id (FK)                 │
    │ type (income/expense)        │
    │ amount                       │
    │ currency                     │
    │ category_id (FK)             │
    │ payment_method_id (FK)       │
    │ transaction_date             │◄── Date transaction occurred
    │ payment_date                 │◄── Cash outflow date (Cash View)
    │ note                         │
    │ receipt_path                  │
    │ is_split                     │
    │ split_count                  │
    │ confirmed_at                 │◄── Pending → Actual confirmation
    └──────────────┬───────────────┘
                   │
                   │ 1:N
                   ▼
    ┌──────────────────────────────┐
    │  transaction_allocations     │
    │──────────────────────────────│
    │ id (PK)                      │
    │ transaction_id (FK)          │
    │ recognition_month            │◄── Recognition month (Accrual View)
    │ amount                       │◄── Allocated amount for that month
    │ sort_order                   │
    └──────────────────────────────┘
```

---

## 3. Table Definitions

### 3-1. profiles (User Profile)

> 1:1 link to Supabase Auth's `auth.users`. Auto-created on signup.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, = auth.users.id | User ID |
| `default_currency` | VARCHAR(3) | NOT NULL, DEFAULT 'KRW' | Default currency (ISO 4217) |
| `language` | VARCHAR(5) | NOT NULL, DEFAULT 'ko' | Preferred language |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Created at |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Updated at |

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
  language VARCHAR(5) NOT NULL DEFAULT 'ko',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own profile"
  ON profiles FOR ALL USING (auth.uid() = id);
```

---

### 3-2. payment_methods (Payment Methods)

> Manages credit cards and bank accounts in a single table.
> Credit card-specific fields are only used when `type = 'credit_card'`.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Payment method ID |
| `user_id` | UUID | FK → profiles, NOT NULL | Owner |
| `type` | VARCHAR(20) | NOT NULL | `'credit_card'` or `'bank_account'` |
| `name` | VARCHAR(100) | NOT NULL | Card/account name |
| `billing_start_day` | SMALLINT | NULL | Billing period start day (1–28, card only) |
| `billing_end_day` | SMALLINT | NULL | Billing period end day (0=last day, 1–28, card only) |
| `payment_day` | SMALLINT | NULL | Payment day (1–28, card only) |
| `payment_month_offset` | SMALLINT | NULL, DEFAULT 1 | Payment month offset from billing period end month (card only) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Created at |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Updated at |

**Credit Card Payment Date Calculation Logic:**

```
Example 1: Billing period 1st–last day, payment 25th of next month
  billing_start_day = 1
  billing_end_day   = 0  (0 = last day of month)
  payment_day       = 25
  payment_month_offset = 1

  Transaction on Jan 20 →
    Billing period: Jan 1 – Jan 31 →
    End month: January →
    Payment month: Jan + 1 = February →
    Payment date: Feb 25

Example 2: Billing period 16th–15th, payment 10th of next month
  billing_start_day = 16
  billing_end_day   = 15
  payment_day       = 10
  payment_month_offset = 1

  Transaction on Jan 20 →
    Billing period: Jan 16 – Feb 15 →
    End month: February →
    Payment month: Feb + 1 = March →
    Payment date: Mar 10
```

> **Note:** When `billing_start_day > billing_end_day`, the billing period spans two months.
> `billing_end_day = 0` represents the last day of the month (28/29/30/31).

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit_card', 'bank_account')),
  name VARCHAR(100) NOT NULL,
  billing_start_day SMALLINT CHECK (billing_start_day BETWEEN 1 AND 28),
  billing_end_day SMALLINT CHECK (billing_end_day BETWEEN 0 AND 28),
  payment_day SMALLINT CHECK (payment_day BETWEEN 1 AND 28),
  payment_month_offset SMALLINT DEFAULT 1 CHECK (payment_month_offset BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT credit_card_fields CHECK (
    type = 'bank_account' OR (
      billing_start_day IS NOT NULL AND
      billing_end_day IS NOT NULL AND
      payment_day IS NOT NULL
    )
  )
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own payment methods"
  ON payment_methods FOR ALL USING (auth.uid() = user_id);
```

---

### 3-3. categories (Categories)

> Manages default and custom categories in a single table.
> Default categories are copied per user on signup.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Category ID |
| `user_id` | UUID | FK → profiles, NOT NULL | Owner |
| `name` | VARCHAR(50) | NOT NULL | Category name |
| `is_default` | BOOLEAN | NOT NULL, DEFAULT false | Default category (cannot delete) |
| `is_hidden` | BOOLEAN | NOT NULL, DEFAULT false | Hidden from selection list |
| `sort_order` | SMALLINT | NOT NULL, DEFAULT 0 | Sort order |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Created at |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Updated at |

**Default Categories (seed data):**

| sort_order | Korean Name | English Name | key |
|-----------|-------------|-------------|-----|
| 1 | 식비 | Food | food |
| 2 | 교통 | Transport | transport |
| 3 | 주거 | Housing | housing |
| 4 | 공과금 | Utilities | utilities |
| 5 | 여가/문화 | Leisure | leisure |
| 6 | 의료/건강 | Medical | medical |
| 7 | 급여 | Salary | salary |
| 8 | 기타 | Other | other |

> On signup, categories are copied with Korean or English names based on user's `language` setting.
> When a custom category is deleted, its transactions' `category_id` is changed to the "Other" category.

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own categories"
  ON categories FOR ALL USING (auth.uid() = user_id);
```

---

### 3-4. transactions (Transactions)

> Stores core information for every transaction.
> Cash view uses this table's `payment_date` and `amount`.
> Accrual view uses the `transaction_allocations` table.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Transaction ID |
| `user_id` | UUID | FK → profiles, NOT NULL | Owner |
| `type` | VARCHAR(10) | NOT NULL | `'income'` or `'expense'` |
| `amount` | DECIMAL(15,2) | NOT NULL, > 0 | Total amount (positive) |
| `currency` | VARCHAR(3) | NOT NULL | Currency code (ISO 4217) |
| `category_id` | UUID | FK → categories, NOT NULL | Category |
| `payment_method_id` | UUID | FK → payment_methods, NULL | Payment method (NULL if none) |
| `transaction_date` | DATE | NOT NULL | Date the transaction occurred |
| `payment_date` | DATE | NOT NULL | Cash inflow/outflow date (Cash View basis) |
| `note` | TEXT | NULL | Note |
| `receipt_path` | VARCHAR(500) | NULL | Receipt photo storage path |
| `is_split` | BOOLEAN | NOT NULL, DEFAULT false | Whether this is a split transaction |
| `split_count` | SMALLINT | NULL | Number of months for split |
| `confirmed_at` | TIMESTAMPTZ | NULL | When a pending transaction was confirmed (NULL = unconfirmed) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Created at |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Updated at |

**Transaction Status Logic (no separate status column):**

```
Status determination:
  IF transaction_date > today             → "Pending"
  IF transaction_date <= today
    AND confirmed_at IS NULL              → "Needs Confirmation"
  IF transaction_date <= today
    AND confirmed_at IS NOT NULL          → "Actual"

Note: When entering a transaction with transaction_date <= today,
      confirmed_at is automatically set to now().
      Only future-dated transactions have confirmed_at = NULL.
```

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  note TEXT,
  receipt_path VARCHAR(500),
  is_split BOOLEAN NOT NULL DEFAULT false,
  split_count SMALLINT CHECK (split_count > 0),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);
```

---

### 3-5. transaction_allocations (Transaction Allocations — Accrual View)

> Stores monthly allocation of transaction amounts.
> Used to query income/expenses for a specific month in the accrual view.
> Every transaction has at least 1 allocation (including non-split transactions).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Allocation ID |
| `transaction_id` | UUID | FK → transactions, NOT NULL | Transaction reference |
| `recognition_month` | DATE | NOT NULL | Recognition month (1st of month, e.g., 2026-01-01) |
| `amount` | DECIMAL(15,2) | NOT NULL, > 0 | Allocated amount for this month |
| `sort_order` | SMALLINT | NOT NULL, DEFAULT 1 | Split order |

```sql
CREATE TABLE transaction_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  recognition_month DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  sort_order SMALLINT NOT NULL DEFAULT 1
);

-- RLS: User ID checked via join with transactions table
ALTER TABLE transaction_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own allocations"
  ON transaction_allocations FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_allocations.transaction_id
      AND t.user_id = auth.uid()
    )
  );
```

**Example: Non-split vs Split Transaction**

```
── Non-split: May 20 Food expense ₩35,000 ──

transactions:
  id: txn_001
  amount: 35,000
  transaction_date: 2026-05-20
  payment_date: 2026-06-25  (Kakaobank Visa payment date)
  is_split: false

transaction_allocations:
  transaction_id: txn_001
  recognition_month: 2026-05-01  (recognized in May)
  amount: 35,000
  sort_order: 1

── Split: Netflix annual subscription ₩120,000 (12-month split) ──

transactions:
  id: txn_002
  amount: 120,000
  transaction_date: 2026-01-05
  payment_date: 2026-02-25  (Kakaobank Visa payment date)
  is_split: true
  split_count: 12

transaction_allocations:
  { transaction_id: txn_002, recognition_month: 2026-01-01, amount: 10,000, sort_order: 1 }
  { transaction_id: txn_002, recognition_month: 2026-02-01, amount: 10,000, sort_order: 2 }
  { transaction_id: txn_002, recognition_month: 2026-03-01, amount: 10,000, sort_order: 3 }
  ...
  { transaction_id: txn_002, recognition_month: 2026-12-01, amount: 10,000, sort_order: 12 }
```

---

### 3-6. budgets (Budgets)

> Stores monthly budget limits per category.
> Budget settings carry over each month until changed.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Budget ID |
| `user_id` | UUID | FK → profiles, NOT NULL | Owner |
| `category_id` | UUID | FK → categories, NOT NULL | Category |
| `monthly_limit` | DECIMAL(15,2) | NOT NULL, > 0 | Monthly limit amount |
| `currency` | VARCHAR(3) | NOT NULL | Currency code |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Created at |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Updated at |

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  monthly_limit DECIMAL(15,2) NOT NULL CHECK (monthly_limit > 0),
  currency VARCHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, category_id)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own budgets"
  ON budgets FOR ALL USING (auth.uid() = user_id);
```

---

## 4. Index Strategy

```sql
-- transactions: Optimize dashboard and list queries
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, transaction_date DESC);

CREATE INDEX idx_transactions_user_payment_date
  ON transactions(user_id, payment_date DESC);

CREATE INDEX idx_transactions_user_category
  ON transactions(user_id, category_id);

CREATE INDEX idx_transactions_payment_method
  ON transactions(payment_method_id);

-- transaction_allocations: Optimize accrual view monthly queries
CREATE INDEX idx_allocations_month
  ON transaction_allocations(recognition_month);

CREATE INDEX idx_allocations_transaction
  ON transaction_allocations(transaction_id);

-- Composite index: Accrual view query for a specific month
CREATE INDEX idx_allocations_txn_month
  ON transaction_allocations(transaction_id, recognition_month);

-- categories: User's category list
CREATE INDEX idx_categories_user
  ON categories(user_id, sort_order);

-- payment_methods: User's payment methods list
CREATE INDEX idx_payment_methods_user
  ON payment_methods(user_id);

-- budgets: User's budgets
CREATE INDEX idx_budgets_user
  ON budgets(user_id);
```

---

## 5. Key Query Patterns

### 5-1. Dashboard — Cash View (specific month)

```sql
-- Cash view totals for May 2026
SELECT
  type,
  SUM(amount) AS total
FROM transactions
WHERE user_id = :user_id
  AND payment_date >= '2026-05-01'
  AND payment_date < '2026-06-01'
GROUP BY type;
```

### 5-2. Dashboard — Accrual View (specific month)

```sql
-- Accrual view totals for May 2026
SELECT
  t.type,
  SUM(a.amount) AS total
FROM transaction_allocations a
JOIN transactions t ON t.id = a.transaction_id
WHERE t.user_id = :user_id
  AND a.recognition_month = '2026-05-01'
GROUP BY t.type;
```

### 5-3. Budget Usage Query (accrual basis)

```sql
-- Budget usage by category for May 2026
SELECT
  b.category_id,
  c.name AS category_name,
  b.monthly_limit,
  COALESCE(SUM(a.amount), 0) AS spent,
  ROUND(COALESCE(SUM(a.amount), 0) / b.monthly_limit * 100, 1) AS usage_pct
FROM budgets b
JOIN categories c ON c.id = b.category_id
LEFT JOIN transaction_allocations a ON a.recognition_month = '2026-05-01'
  AND a.transaction_id IN (
    SELECT id FROM transactions
    WHERE user_id = :user_id
      AND category_id = b.category_id
      AND type = 'expense'
  )
WHERE b.user_id = :user_id
GROUP BY b.category_id, c.name, b.monthly_limit;
```

### 5-4. Pending Transactions Needing Confirmation

```sql
-- Past-due pending transactions that haven't been confirmed
SELECT *
FROM transactions
WHERE user_id = :user_id
  AND transaction_date < CURRENT_DATE
  AND confirmed_at IS NULL
ORDER BY transaction_date ASC;
```

### 5-5. 12-Month Cash Flow Projection

```sql
-- Monthly income/expense totals for next 12 months (cash view)
SELECT
  DATE_TRUNC('month', payment_date) AS month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
FROM transactions
WHERE user_id = :user_id
  AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND payment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month;
```

---

## 6. Data Flow Examples

### 6-1. Transaction Creation Flow

```
User Input:
  Type: Expense
  Amount: ₩120,000
  Category: Leisure/Culture
  Payment Method: Kakaobank Visa
  Transaction Date: 2026-01-05
  Split: 12 months, starting January 2026

System Processing:
  1. Payment method is credit card → Auto-calculate payment date
     Kakaobank Visa: Billing 1st–last day, payment 25th of next month
     Jan 5 → January billing period → Payment date = Feb 25

  2. Create transactions record
     amount: 120,000
     transaction_date: 2026-01-05
     payment_date: 2026-02-25  (auto-calculated)
     is_split: true
     split_count: 12
     confirmed_at: 2026-01-05T00:00:00Z  (past date → auto-confirmed)

  3. Create 12 transaction_allocations records
     ₩10,000 each for Jan 2026 – Dec 2026

Result:
  Cash View (February): ₩120,000 expense shown
  Accrual View (Jan–Dec): ₩10,000 expense shown each month
```

### 6-2. Split Amount Edit Flow

```
User Request:
  "Change total from ₩120,000 → ₩180,000"
  Selection: "Apply to future months only" (current month: March, keep Jan–Feb)

System Processing:
  1. Update transactions.amount: 180,000

  2. Keep Jan–Feb allocations: ₩10,000 each (total ₩20,000)
  3. Remaining amount: ₩180,000 - ₩20,000 = ₩160,000
  4. Remaining months: 10 (Mar–Dec)
  5. Update Mar–Dec allocations: ₩16,000 each

Result:
  Jan–Feb: ₩10,000/month (unchanged)
  Mar–Dec: ₩16,000/month (recalculated)
  Total: ₩20,000 + ₩160,000 = ₩180,000
```

---

## 7. Supabase Triggers and Functions

### 7-1. Create Default Categories on Signup

```sql
-- Create profile + copy default categories on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_lang TEXT;
  cat_names TEXT[];
BEGIN
  -- Create profile
  INSERT INTO profiles (id, default_currency, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'default_currency', 'KRW'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'ko')
  );

  -- Default category names based on language
  user_lang := COALESCE(NEW.raw_user_meta_data->>'language', 'ko');

  IF user_lang = 'ko' THEN
    cat_names := ARRAY['식비','교통','주거','공과금','여가/문화','의료/건강','급여','기타'];
  ELSE
    cat_names := ARRAY['Food','Transport','Housing','Utilities','Leisure','Medical','Salary','Other'];
  END IF;

  -- Create default categories
  FOR i IN 1..array_length(cat_names, 1) LOOP
    INSERT INTO categories (user_id, name, is_default, sort_order)
    VALUES (NEW.id, cat_names[i], true, i);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 7-2. Auto-update updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 8. Supabase Storage Structure

```
receipts/                          ← Bucket name
└── {user_id}/                     ← Per-user folder
    ├── {transaction_id}.jpg
    ├── {transaction_id}.png
    └── {transaction_id}.heic
```

```sql
-- Storage policy: Users can only access their own receipts
CREATE POLICY "Users can access own receipts"
  ON storage.objects FOR ALL USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 9. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Profile {
  id              String   @id @db.Uuid
  defaultCurrency String   @default("KRW") @map("default_currency") @db.VarChar(3)
  language        String   @default("ko") @map("language") @db.VarChar(5)
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  paymentMethods PaymentMethod[]
  categories     Category[]
  transactions   Transaction[]
  budgets        Budget[]

  @@map("profiles")
}

enum PaymentMethodType {
  credit_card
  bank_account
}

model PaymentMethod {
  id                 String            @id @default(uuid()) @db.Uuid
  userId             String            @map("user_id") @db.Uuid
  type               PaymentMethodType
  name               String            @db.VarChar(100)
  billingStartDay    Int?              @map("billing_start_day") @db.SmallInt
  billingEndDay      Int?              @map("billing_end_day") @db.SmallInt
  paymentDay         Int?              @map("payment_day") @db.SmallInt
  paymentMonthOffset Int?              @default(1) @map("payment_month_offset") @db.SmallInt
  createdAt          DateTime          @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt          DateTime          @updatedAt @map("updated_at") @db.Timestamptz()

  profile      Profile       @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("payment_methods")
}

model Category {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  name      String   @db.VarChar(50)
  isDefault Boolean  @default(false) @map("is_default")
  isHidden  Boolean  @default(false) @map("is_hidden")
  sortOrder Int      @default(0) @map("sort_order") @db.SmallInt
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  profile      Profile       @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  budgets      Budget[]

  @@map("categories")
}

model Transaction {
  id              String    @id @default(uuid()) @db.Uuid
  userId          String    @map("user_id") @db.Uuid
  type            String    @db.VarChar(10)
  amount          Decimal   @db.Decimal(15, 2)
  currency        String    @db.VarChar(3)
  categoryId      String    @map("category_id") @db.Uuid
  paymentMethodId String?   @map("payment_method_id") @db.Uuid
  transactionDate DateTime  @map("transaction_date") @db.Date
  paymentDate     DateTime  @map("payment_date") @db.Date
  note            String?
  receiptPath     String?   @map("receipt_path") @db.VarChar(500)
  isSplit         Boolean   @default(false) @map("is_split")
  splitCount      Int?      @map("split_count") @db.SmallInt
  confirmedAt     DateTime? @map("confirmed_at") @db.Timestamptz()
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz()

  profile       Profile                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  category      Category                @relation(fields: [categoryId], references: [id])
  paymentMethod PaymentMethod?          @relation(fields: [paymentMethodId], references: [id], onDelete: SetNull)
  allocations   TransactionAllocation[]

  @@index([userId, transactionDate(sort: Desc)])
  @@index([userId, paymentDate(sort: Desc)])
  @@index([userId, categoryId])
  @@index([paymentMethodId])
  @@map("transactions")
}

model TransactionAllocation {
  id               String   @id @default(uuid()) @db.Uuid
  transactionId    String   @map("transaction_id") @db.Uuid
  recognitionMonth DateTime @map("recognition_month") @db.Date
  amount           Decimal  @db.Decimal(15, 2)
  sortOrder        Int      @default(1) @map("sort_order") @db.SmallInt

  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  @@index([recognitionMonth])
  @@index([transactionId, recognitionMonth])
  @@map("transaction_allocations")
}

model Budget {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  categoryId   String   @map("category_id") @db.Uuid
  monthlyLimit Decimal  @map("monthly_limit") @db.Decimal(15, 2)
  currency     String   @db.VarChar(3)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  profile  Profile  @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([userId, categoryId])
  @@index([userId])
  @@map("budgets")
}
```

---

## 10. Storage Capacity Estimate

> Supabase free plan: 500MB database, 1GB storage

| Item | Size per Record (est.) | Monthly Records | 1-Year Cumulative |
|------|----------------------|----------------|-------------------|
| transactions | ~200 bytes | ~100 | ~1,200 (~240KB) |
| transaction_allocations | ~80 bytes | ~120 | ~1,440 (~115KB) |
| categories | ~100 bytes | Initial 8 + custom | ~15 (~1.5KB) |
| payment_methods | ~150 bytes | Initial 2–5 | ~5 (~750B) |
| budgets | ~100 bytes | ~8 | ~8 (~800B) |
| Receipt photos | ~500KB each | ~30 | ~360 (~180MB) |

**Estimated 1-year usage:**
- Database: ~500KB (0.1% of 500MB limit)
- Storage: ~180MB (18% of 1GB limit)

> For personal use, the free plan can last several years without reaching limits.

---

*This document will be updated as the database design evolves.*

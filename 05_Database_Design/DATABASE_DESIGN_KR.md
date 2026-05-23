# 데이터베이스 설계 (Database Design)
# CashCompass — 개인 재무 관리 앱

**버전:** 1.0  
**작성일:** 2026-05-23  
**작성자:** Chris Kim  
**상태:** 초안 (Draft)  
**데이터베이스:** PostgreSQL (Supabase)  
**ORM:** Prisma

---

## 1. 개요

CashCompass의 데이터베이스는 **이중 뷰 시스템**(발생주의 + 현금)을 지원하도록 설계되었습니다.
핵심 설계 원칙은 다음과 같습니다:

- **하나의 거래, 두 가지 관점:** 모든 거래는 `payment_date`(현금 뷰)와 하나 이상의 `transaction_allocations`(발생주의 뷰)를 가집니다
- **사용자 데이터 격리:** Supabase RLS(Row Level Security)로 데이터베이스 레벨에서 사용자별 데이터 분리
- **신용카드 결제일 자동 계산:** 카드의 사용기간과 결제일 정보를 저장하여 거래의 현금 유출일을 자동으로 계산

---

## 2. ER 다이어그램

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
    │ transaction_date             │◄── 거래 발생일
    │ payment_date                 │◄── 현금 유출일 (현금 뷰)
    │ note                         │
    │ receipt_path                  │
    │ is_split                     │
    │ split_count                  │
    │ confirmed_at                 │◄── 예정→실적 확인 시점
    └──────────────┬───────────────┘
                   │
                   │ 1:N
                   ▼
    ┌──────────────────────────────┐
    │  transaction_allocations     │
    │──────────────────────────────│
    │ id (PK)                      │
    │ transaction_id (FK)          │
    │ recognition_month            │◄── 귀속 월 (발생주의 뷰)
    │ amount                       │◄── 해당 월 배분 금액
    │ sort_order                   │
    └──────────────────────────────┘
```

---

## 3. 테이블 정의

### 3-1. profiles (사용자 프로필)

> Supabase Auth의 `auth.users`와 1:1 연결. 회원가입 시 자동 생성됩니다.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, = auth.users.id | 사용자 고유 ID |
| `default_currency` | VARCHAR(3) | NOT NULL, DEFAULT 'KRW' | 기본 통화 (ISO 4217) |
| `language` | VARCHAR(5) | NOT NULL, DEFAULT 'ko' | 선호 언어 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성일 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정일 |

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

### 3-2. payment_methods (결제 수단)

> 신용카드와 은행 계좌를 통합 관리합니다.
> 신용카드 전용 필드는 `type = 'credit_card'`일 때만 사용됩니다.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | 결제 수단 ID |
| `user_id` | UUID | FK → profiles, NOT NULL | 소유자 |
| `type` | VARCHAR(20) | NOT NULL | `'credit_card'` 또는 `'bank_account'` |
| `name` | VARCHAR(100) | NOT NULL | 카드/계좌 이름 |
| `billing_start_day` | SMALLINT | NULL | 사용기간 시작일 (1~28, 카드 전용) |
| `billing_end_day` | SMALLINT | NULL | 사용기간 마감일 (0=말일, 1~28, 카드 전용) |
| `payment_day` | SMALLINT | NULL | 결제일 (1~28, 카드 전용) |
| `payment_month_offset` | SMALLINT | NULL, DEFAULT 1 | 결제 월 오프셋 (카드 전용). 마감 월 기준 몇 개월 후에 결제되는지 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성일 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정일 |

**신용카드 결제일 계산 로직:**

```
예시 1: 사용기간 1일~말일, 결제일 다음 달 25일
  billing_start_day = 1
  billing_end_day   = 0  (0 = 말일)
  payment_day       = 25
  payment_month_offset = 1

  1월 20일 거래 →
    사용기간: 1월 1일 ~ 1월 31일에 해당 →
    마감 월: 1월 →
    결제 월: 1월 + 1 = 2월 →
    결제일: 2월 25일

예시 2: 사용기간 16일~15일, 결제일 다음 달 10일
  billing_start_day = 16
  billing_end_day   = 15
  payment_day       = 10
  payment_month_offset = 1

  1월 20일 거래 →
    사용기간: 1월 16일 ~ 2월 15일에 해당 →
    마감 월: 2월 →
    결제 월: 2월 + 1 = 3월 →
    결제일: 3월 10일

  2월 10일 거래 →
    사용기간: 1월 16일 ~ 2월 15일에 해당 →
    마감 월: 2월 →
    결제일: 3월 10일
```

> **참고:** `billing_start_day > billing_end_day`이면 사용기간이 두 달에 걸침을 의미합니다.
> `billing_end_day = 0`은 해당 월의 마지막 날(28/29/30/31)을 의미합니다.

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

### 3-3. categories (카테고리)

> 기본 카테고리와 사용자 정의 카테고리를 통합 관리합니다.
> 회원가입 시 기본 카테고리가 사용자별로 복사됩니다.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | 카테고리 ID |
| `user_id` | UUID | FK → profiles, NOT NULL | 소유자 |
| `name` | VARCHAR(50) | NOT NULL | 카테고리 이름 |
| `is_default` | BOOLEAN | NOT NULL, DEFAULT false | 기본 카테고리 여부 (삭제 불가) |
| `is_hidden` | BOOLEAN | NOT NULL, DEFAULT false | 선택 목록에서 숨김 여부 |
| `sort_order` | SMALLINT | NOT NULL, DEFAULT 0 | 정렬 순서 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성일 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정일 |

**기본 카테고리 (시드 데이터):**

| sort_order | 한국어 이름 | 영어 이름 | key |
|-----------|-----------|----------|-----|
| 1 | 식비 | Food | food |
| 2 | 교통 | Transport | transport |
| 3 | 주거 | Housing | housing |
| 4 | 공과금 | Utilities | utilities |
| 5 | 여가/문화 | Leisure | leisure |
| 6 | 의료/건강 | Medical | medical |
| 7 | 급여 | Salary | salary |
| 8 | 기타 | Other | other |

> 회원가입 시 사용자의 `language` 설정에 따라 한국어 또는 영어 이름으로 복사됩니다.
> 사용자 정의 카테고리 삭제 시, 해당 거래의 `category_id`는 "기타" 카테고리로 변경됩니다.

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

### 3-4. transactions (거래)

> 모든 거래의 핵심 정보를 저장합니다.
> 현금 뷰에서는 이 테이블의 `payment_date`와 `amount`를 사용합니다.
> 발생주의 뷰에서는 `transaction_allocations` 테이블의 데이터를 사용합니다.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | 거래 ID |
| `user_id` | UUID | FK → profiles, NOT NULL | 소유자 |
| `type` | VARCHAR(10) | NOT NULL | `'income'` 또는 `'expense'` |
| `amount` | DECIMAL(15,2) | NOT NULL, > 0 | 총 금액 (양수) |
| `currency` | VARCHAR(3) | NOT NULL | 통화 코드 (ISO 4217) |
| `category_id` | UUID | FK → categories, NOT NULL | 카테고리 |
| `payment_method_id` | UUID | FK → payment_methods, NULL | 결제 수단 (없으면 NULL) |
| `transaction_date` | DATE | NOT NULL | 거래 발생일 |
| `payment_date` | DATE | NOT NULL | 현금 유출/유입일 (현금 뷰 기준) |
| `note` | TEXT | NULL | 메모 |
| `receipt_path` | VARCHAR(500) | NULL | 영수증 사진 저장 경로 |
| `is_split` | BOOLEAN | NOT NULL, DEFAULT false | 분할 거래 여부 |
| `split_count` | SMALLINT | NULL | 분할 개월 수 |
| `confirmed_at` | TIMESTAMPTZ | NULL | 예정 거래 확인 시점 (NULL = 미확인) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성일 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정일 |

**거래 상태 판별 로직 (별도 status 컬럼 없음):**

```
거래 상태 판별:
  IF transaction_date > today            → "예정" (Pending)
  IF transaction_date <= today
    AND confirmed_at IS NULL             → "확인 필요" (Needs Confirmation)
  IF transaction_date <= today
    AND confirmed_at IS NOT NULL         → "실적" (Actual)

※ 거래 입력 시 transaction_date <= today이면 confirmed_at = now()로 자동 설정
※ 미래 날짜로 입력한 거래만 confirmed_at = NULL
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

### 3-5. transaction_allocations (거래 배분 — 발생주의 뷰)

> 거래 금액의 월별 배분을 저장합니다.
> 발생주의 뷰에서 특정 월의 수입/지출을 조회할 때 이 테이블을 사용합니다.
> 모든 거래는 최소 1개의 allocation을 가집니다 (비분할 거래도 포함).

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | 배분 ID |
| `transaction_id` | UUID | FK → transactions, NOT NULL | 거래 참조 |
| `recognition_month` | DATE | NOT NULL | 귀속 월 (해당 월 1일, 예: 2026-01-01) |
| `amount` | DECIMAL(15,2) | NOT NULL, > 0 | 해당 월 배분 금액 |
| `sort_order` | SMALLINT | NOT NULL, DEFAULT 1 | 분할 순서 |

```sql
CREATE TABLE transaction_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  recognition_month DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  sort_order SMALLINT NOT NULL DEFAULT 1
);

-- RLS: transactions 테이블 조인을 통해 user_id 확인
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

**예시: 비분할 거래 vs 분할 거래**

```
── 비분할 거래: 5월 20일 식비 ₩35,000 ──

transactions:
  id: txn_001
  amount: 35,000
  transaction_date: 2026-05-20
  payment_date: 2026-06-25  (카카오 비자 결제일)
  is_split: false

transaction_allocations:
  transaction_id: txn_001
  recognition_month: 2026-05-01  (5월 귀속)
  amount: 35,000
  sort_order: 1

── 분할 거래: 넷플릭스 연간 구독 ₩120,000 (12개월 분할) ──

transactions:
  id: txn_002
  amount: 120,000
  transaction_date: 2026-01-05
  payment_date: 2026-02-25  (카카오 비자 결제일)
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

### 3-6. budgets (예산)

> 카테고리별 월 예산 한도를 저장합니다.
> 예산은 변경 전까지 매월 자동으로 유지됩니다.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | 예산 ID |
| `user_id` | UUID | FK → profiles, NOT NULL | 소유자 |
| `category_id` | UUID | FK → categories, NOT NULL | 카테고리 |
| `monthly_limit` | DECIMAL(15,2) | NOT NULL, > 0 | 월 한도 금액 |
| `currency` | VARCHAR(3) | NOT NULL | 통화 코드 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성일 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정일 |

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

## 4. 인덱스 전략

```sql
-- transactions: 대시보드 및 목록 조회 최적화
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, transaction_date DESC);

CREATE INDEX idx_transactions_user_payment_date
  ON transactions(user_id, payment_date DESC);

CREATE INDEX idx_transactions_user_category
  ON transactions(user_id, category_id);

CREATE INDEX idx_transactions_payment_method
  ON transactions(payment_method_id);

-- transaction_allocations: 발생주의 뷰 월별 조회 최적화
CREATE INDEX idx_allocations_month
  ON transaction_allocations(recognition_month);

CREATE INDEX idx_allocations_transaction
  ON transaction_allocations(transaction_id);

-- 복합 인덱스: 특정 월의 발생주의 뷰 조회
CREATE INDEX idx_allocations_txn_month
  ON transaction_allocations(transaction_id, recognition_month);

-- categories: 사용자별 카테고리 목록
CREATE INDEX idx_categories_user
  ON categories(user_id, sort_order);

-- payment_methods: 사용자별 결제 수단 목록
CREATE INDEX idx_payment_methods_user
  ON payment_methods(user_id);

-- budgets: 사용자별 예산 조회
CREATE INDEX idx_budgets_user
  ON budgets(user_id);
```

---

## 5. 핵심 쿼리 패턴

### 5-1. 대시보드 — 현금 뷰 (특정 월)

```sql
-- 2026년 5월의 현금 뷰 합계
SELECT
  type,
  SUM(amount) AS total
FROM transactions
WHERE user_id = :user_id
  AND payment_date >= '2026-05-01'
  AND payment_date < '2026-06-01'
GROUP BY type;
```

### 5-2. 대시보드 — 발생주의 뷰 (특정 월)

```sql
-- 2026년 5월의 발생주의 뷰 합계
SELECT
  t.type,
  SUM(a.amount) AS total
FROM transaction_allocations a
JOIN transactions t ON t.id = a.transaction_id
WHERE t.user_id = :user_id
  AND a.recognition_month = '2026-05-01'
GROUP BY t.type;
```

### 5-3. 예산 사용률 조회 (발생주의 기준)

```sql
-- 2026년 5월 카테고리별 예산 사용률
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

### 5-4. 확인이 필요한 예정 거래 조회

```sql
-- 날짜가 지났는데 확인되지 않은 예정 거래
SELECT *
FROM transactions
WHERE user_id = :user_id
  AND transaction_date < CURRENT_DATE
  AND confirmed_at IS NULL
ORDER BY transaction_date ASC;
```

### 5-5. 12개월 현금 흐름 예측

```sql
-- 향후 12개월 월별 수입/지출 합계 (현금 뷰)
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

## 6. 데이터 흐름 예시

### 6-1. 거래 생성 흐름

```
사용자 입력:
  유형: 지출
  금액: ₩120,000
  카테고리: 여가/문화
  결제 수단: 카카오뱅크 비자
  거래일: 2026-01-05
  분할: 12개월, 시작 월 2026년 1월

시스템 처리:
  1. 결제 수단이 신용카드 → 결제일 자동 계산
     카카오 비자: 사용기간 1일~말일, 결제일 다음 달 25일
     1월 5일 → 1월 사용기간 → 결제일 = 2월 25일

  2. transactions 레코드 생성
     amount: 120,000
     transaction_date: 2026-01-05
     payment_date: 2026-02-25  (자동 계산됨)
     is_split: true
     split_count: 12
     confirmed_at: 2026-01-05T00:00:00Z  (과거 날짜이므로 자동 확인)

  3. transaction_allocations 12건 생성
     각 ₩10,000씩 2026-01 ~ 2026-12

결과:
  현금 뷰 (2월): ₩120,000 지출 표시
  발생주의 뷰 (1~12월): 각 ₩10,000씩 지출 표시
```

### 6-2. 분할 금액 수정 흐름

```
사용자 요청:
  "총 금액을 ₩120,000 → ₩180,000으로 변경"
  선택: "이후 달에만 적용" (현재 3월, 1~2월은 유지)

시스템 처리:
  1. transactions.amount 업데이트: 180,000

  2. 1~2월 allocations 유지: 각 ₩10,000 (총 ₩20,000)
  3. 남은 금액: ₩180,000 - ₩20,000 = ₩160,000
  4. 남은 개월: 10개월 (3~12월)
  5. 3~12월 allocations 업데이트: 각 ₩16,000

결과:
  1~2월: ₩10,000/월 (변경 없음)
  3~12월: ₩16,000/월 (재계산)
  합계: ₩20,000 + ₩160,000 = ₩180,000
```

---

## 7. Supabase 트리거 및 함수

### 7-1. 회원가입 시 기본 카테고리 생성

```sql
-- 새 사용자 가입 시 profiles 생성 + 기본 카테고리 복사
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_lang TEXT;
  cat_names TEXT[];
BEGIN
  -- profiles 생성
  INSERT INTO profiles (id, default_currency, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'default_currency', 'KRW'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'ko')
  );

  -- 언어에 따른 기본 카테고리 이름
  user_lang := COALESCE(NEW.raw_user_meta_data->>'language', 'ko');

  IF user_lang = 'ko' THEN
    cat_names := ARRAY['식비','교통','주거','공과금','여가/문화','의료/건강','급여','기타'];
  ELSE
    cat_names := ARRAY['Food','Transport','Housing','Utilities','Leisure','Medical','Salary','Other'];
  END IF;

  -- 기본 카테고리 생성
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

### 7-2. updated_at 자동 갱신

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 적용
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

## 8. Supabase Storage 구조

```
receipts/                          ← 버킷 이름
└── {user_id}/                     ← 사용자별 폴더
    ├── {transaction_id}.jpg
    ├── {transaction_id}.png
    └── {transaction_id}.heic
```

```sql
-- Storage 정책: 본인의 파일만 접근 가능
CREATE POLICY "Users can access own receipts"
  ON storage.objects FOR ALL USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 9. Prisma 스키마

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

## 10. 저장 용량 추정

> Supabase 무료 플랜: 500MB 데이터베이스, 1GB 스토리지

| 항목 | 레코드당 크기 (추정) | 월간 예상 레코드 | 1년 누적 |
|------|---------------------|-----------------|---------|
| transactions | ~200 bytes | ~100건 | ~1,200건 (~240KB) |
| transaction_allocations | ~80 bytes | ~120건 | ~1,440건 (~115KB) |
| categories | ~100 bytes | 초기 8개 + α | ~15개 (~1.5KB) |
| payment_methods | ~150 bytes | 초기 2~5개 | ~5개 (~750B) |
| budgets | ~100 bytes | ~8개 | ~8개 (~800B) |
| 영수증 사진 | ~500KB/장 | ~30장 | ~360장 (~180MB) |

**1년 사용 시 추정:**
- 데이터베이스: ~500KB (500MB 한도의 0.1%)
- 스토리지: ~180MB (1GB 한도의 18%)

> 개인 사용 기준으로 무료 플랜 한도 내에서 수년간 사용 가능합니다.

---

*이 문서는 데이터베이스 설계가 변경될 때마다 업데이트됩니다.*

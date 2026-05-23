# API 설계 (API Design)
# CashCompass — 개인 재무 관리 앱

**버전:** 1.0  
**작성일:** 2026-05-23  
**작성자:** Chris Kim  
**상태:** 초안 (Draft)

---

## 1. 개요

CashCompass는 Next.js 15 App Router를 사용하므로, 전통적인 REST API 대신 **세 가지 데이터 접근 패턴**을 사용합니다:

| 패턴 | 용도 | 예시 |
|------|------|------|
| **Server Actions** | 데이터 변경 (Create/Update/Delete) | 거래 추가, 예산 설정, 카테고리 삭제 |
| **Data Fetching (Server Components)** | 데이터 조회 (Read) | 대시보드 합계, 거래 목록, 예산 사용률 |
| **API Routes** | 파일 다운로드, 이미지 업로드 등 HTTP 엔드포인트가 필요한 작업 | CSV/PDF 내보내기, AI 이미지 분석 |

---

## 2. 공통 규칙

### 2-1. 인증

모든 Server Action과 Data Fetching 함수는 호출 시 Supabase 세션을 확인합니다.

```typescript
// lib/auth.ts
import { createClient } from '@/lib/supabase/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Unauthorized')
  return user
}
```

### 2-2. 응답 형식

Server Actions는 통일된 `ActionResult` 타입을 반환합니다:

```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

### 2-3. 입력 검증

모든 사용자 입력은 Zod 스키마로 검증됩니다. 프론트엔드(React Hook Form)와 서버(Server Action) 양쪽에서 동일한 스키마를 사용합니다.

```typescript
// lib/validations/transaction.ts
import { z } from 'zod'

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  currency: z.string().length(3),
  categoryId: z.string().uuid(),
  paymentMethodId: z.string().uuid().optional(),
  transactionDate: z.string().date(),
  recognitionMonth: z.string().date(),
  note: z.string().max(500).optional(),
  isSplit: z.boolean().default(false),
  splitCount: z.number().int().min(2).max(60).optional(),
  splitStartMonth: z.string().date().optional(),
})
```

### 2-4. 에러 코드

| 코드 | HTTP (API Route) | 설명 |
|------|-----------------|------|
| `UNAUTHORIZED` | 401 | 로그인 필요 |
| `FORBIDDEN` | 403 | 다른 사용자의 데이터에 접근 시도 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `VALIDATION_ERROR` | 400 | 입력 검증 실패 |
| `CONFLICT` | 409 | 중복 데이터 (예: 동일 카테고리에 예산 중복 설정) |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

---

## 3. 인증 (Auth)

> Supabase Auth를 래핑한 Server Actions.
> 관련 유저 스토리: US-020, US-021, US-022

### 3-1. 회원가입

```
Action: signup(formData)
파일:   actions/auth.ts

입력:
  email:           string    (이메일 형식)
  password:        string    (최소 8자)
  defaultCurrency: string    ("KRW" | "USD" | "EUR" | ...)
  language:        string    ("ko" | "en")

처리:
  1. Zod 스키마로 입력 검증
  2. supabase.auth.signUp() 호출
     - raw_user_meta_data에 defaultCurrency, language 포함
  3. DB 트리거가 profiles + 기본 카테고리 자동 생성 (DB 트리거, 섹션 7 참조)
  4. 확인 이메일 발송 (Supabase 자동 처리)

출력 (성공):
  { success: true, data: { message: "확인 이메일이 발송되었습니다" } }

출력 (실패):
  { success: false, error: "이미 등록된 이메일입니다" }
```

### 3-2. 로그인

```
Action: login(formData)
파일:   actions/auth.ts

입력:
  email:    string
  password: string

처리:
  1. supabase.auth.signInWithPassword() 호출
  2. 세션 쿠키 설정

출력 (성공):
  { success: true, data: null }
  → 클라이언트에서 /dashboard로 redirect

출력 (실패):
  { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다" }
```

### 3-3. 로그아웃

```
Action: logout()
파일:   actions/auth.ts

처리:
  1. supabase.auth.signOut() 호출
  2. 세션 쿠키 제거

출력:
  → /login으로 redirect
```

### 3-4. 비밀번호 재설정 요청

```
Action: requestPasswordReset(formData)
파일:   actions/auth.ts

입력:
  email: string

처리:
  1. supabase.auth.resetPasswordForEmail() 호출
  2. 재설정 링크 이메일 발송 (1시간 후 만료)

출력:
  { success: true, data: { message: "재설정 링크가 이메일로 발송되었습니다" } }

※ 등록되지 않은 이메일이어도 동일한 성공 메시지 반환 (보안: 이메일 존재 여부 노출 방지)
```

### 3-5. 새 비밀번호 설정

```
Action: updatePassword(formData)
파일:   actions/auth.ts

입력:
  password: string (최소 8자)

처리:
  1. supabase.auth.updateUser({ password }) 호출

출력 (성공):
  { success: true, data: null }
  → /login으로 redirect
```

---

## 4. 거래 (Transactions)

> 관련 유저 스토리: US-001, US-002, US-003, US-004, US-005, US-011, US-026

### 4-1. 거래 추가

```
Action: createTransaction(formData)
파일:   actions/transactions.ts

입력:
  type:             "income" | "expense"
  amount:           number   (양수)
  currency:         string   (3자)
  categoryId:       string   (UUID)
  paymentMethodId:  string?  (UUID, 선택)
  transactionDate:  string   (YYYY-MM-DD)
  recognitionMonth: string   (YYYY-MM-DD, 귀속 월 1일)
  note:             string?  (최대 500자)
  isSplit:          boolean
  splitCount:       number?  (2~60, isSplit=true일 때 필수)
  splitStartMonth:  string?  (YYYY-MM-DD, isSplit=true일 때 필수)

처리:
  1. 인증 확인
  2. Zod 스키마 검증
  3. 결제 수단이 신용카드인 경우 → paymentDate 자동 계산
     결제 수단이 은행 계좌 또는 미선택 → paymentDate = transactionDate
  4. confirmedAt 설정:
     transactionDate <= 오늘 → confirmedAt = now()
     transactionDate > 오늘  → confirmedAt = null
  5. transactions 레코드 INSERT
  6. transaction_allocations 생성:
     - isSplit=false → 1건 (recognitionMonth, amount)
     - isSplit=true  → splitCount건 (각 월, amount/splitCount)
  7. revalidatePath('/dashboard'), revalidatePath('/transactions')

출력 (성공):
  { success: true, data: { id: "txn_xxx" } }
```

### 4-2. 거래 수정

```
Action: updateTransaction(id, formData)
파일:   actions/transactions.ts

입력:
  id: string (UUID, path param)
  + createTransaction과 동일한 필드

처리:
  1. 인증 확인 + 본인 거래인지 확인
  2. 기존 allocations 전부 삭제 후 새로 생성
  3. transactions 레코드 UPDATE
  4. 영수증이 변경된 경우, 기존 파일 삭제 + 새 파일 업로드
  5. revalidatePath

출력 (성공):
  { success: true, data: { id: "txn_xxx" } }
```

### 4-3. 거래 삭제

```
Action: deleteTransaction(id)
파일:   actions/transactions.ts

입력:
  id: string (UUID)

처리:
  1. 인증 확인 + 본인 거래인지 확인
  2. 영수증 사진이 있으면 Storage에서 삭제
  3. transactions 레코드 DELETE (CASCADE로 allocations 자동 삭제)
  4. revalidatePath

출력 (성공):
  { success: true, data: null }
```

### 4-4. 분할 금액 수정

```
Action: updateSplitAmount(id, formData)
파일:   actions/transactions.ts

입력:
  id:        string  (UUID)
  newAmount: number  (새 총 금액)
  applyTo:   "all" | "future"

처리:
  applyTo = "all":
    1. transactions.amount = newAmount
    2. 모든 allocations 삭제 후 newAmount / splitCount로 균등 재생성

  applyTo = "future":
    1. transactions.amount = newAmount
    2. 과거 달 allocations 유지 (recognition_month < 이번 달 1일)
    3. 과거 합계 계산
    4. 남은 금액 = newAmount - 과거 합계
    5. 미래 달 allocations 삭제 후 남은 금액 / 남은 개월 수로 재생성

출력 (성공):
  { success: true, data: null }
```

### 4-5. 예정 거래 확인

```
Action: confirmPendingTransaction(id, action)
파일:   actions/transactions.ts

입력:
  id:     string (UUID)
  action: "confirm" | "delete"
  updatedData?: { transactionDate?, amount?, ... }  (action="confirm"이고 수정이 필요한 경우)

처리:
  action = "confirm":
    1. confirmedAt = now()
    2. updatedData가 있으면 거래 정보도 함께 업데이트
  action = "delete":
    1. 거래 삭제

출력 (성공):
  { success: true, data: null }
```

### 4-6. 영수증 업로드

```
Action: uploadReceipt(transactionId, file)
파일:   actions/transactions.ts

입력:
  transactionId: string (UUID)
  file:          File   (JPG/PNG/HEIC, 최대 5MB)

처리:
  1. 파일 형식 및 크기 검증
  2. 기존 영수증이 있으면 Storage에서 삭제
  3. Supabase Storage에 업로드: receipts/{userId}/{transactionId}.{ext}
  4. transactions.receipt_path 업데이트

출력 (성공):
  { success: true, data: { path: "receipts/xxx/txn_xxx.jpg" } }
```

### 4-7. 영수증 삭제

```
Action: deleteReceipt(transactionId)
파일:   actions/transactions.ts

입력:
  transactionId: string (UUID)

처리:
  1. Storage에서 파일 삭제
  2. transactions.receipt_path = null

출력 (성공):
  { success: true, data: null }
```

---

## 5. 카테고리 (Categories)

> 관련 유저 스토리: US-027

### 5-1. 카테고리 목록 조회

```
Fetcher: getCategories()
파일:    queries/categories.ts

처리:
  1. 인증된 사용자의 카테고리 전체 조회
  2. sort_order ASC 정렬

반환:
  Category[] — { id, name, isDefault, isHidden, sortOrder }
```

### 5-2. 카테고리 추가

```
Action: createCategory(formData)
파일:   actions/categories.ts

입력:
  name: string (1~50자)

처리:
  1. 같은 이름의 카테고리가 있는지 확인
  2. is_default=false, is_hidden=false, sort_order=마지막+1
  3. INSERT

출력 (성공):
  { success: true, data: { id: "cat_xxx" } }
```

### 5-3. 카테고리 이름 변경

```
Action: renameCategory(id, formData)
파일:   actions/categories.ts

입력:
  id:   string (UUID)
  name: string (1~50자)

처리:
  1. 본인 카테고리 확인
  2. 같은 이름 중복 확인
  3. UPDATE name
  ※ 기존 거래에 자동 반영 (FK로 연결되어 있으므로)

출력 (성공):
  { success: true, data: null }
```

### 5-4. 카테고리 삭제

```
Action: deleteCategory(id)
파일:   actions/categories.ts

입력:
  id: string (UUID)

처리:
  1. is_default=true이면 → 에러 ("기본 카테고리는 삭제할 수 없습니다")
  2. 해당 카테고리의 거래를 "기타" 카테고리로 이동:
     UPDATE transactions SET category_id = {기타_id} WHERE category_id = {id}
  3. 예산이 있으면 삭제
  4. 카테고리 DELETE

출력 (성공):
  { success: true, data: { movedCount: 3 } }
```

### 5-5. 카테고리 숨김 토글

```
Action: toggleCategoryVisibility(id)
파일:   actions/categories.ts

입력:
  id: string (UUID)

처리:
  1. is_default=true인 카테고리만 숨김 가능
  2. is_hidden 토글

출력 (성공):
  { success: true, data: { isHidden: true } }
```

---

## 6. 결제 수단 (Payment Methods)

> 관련 유저 스토리: US-006, US-007

### 6-1. 결제 수단 목록 조회

```
Fetcher: getPaymentMethods()
파일:    queries/payment-methods.ts

반환:
  PaymentMethod[] — {
    id, type, name,
    billingStartDay?, billingEndDay?, paymentDay?, paymentMonthOffset?,
    currentMonthUsage  (이번 달 사용액 계산 포함)
    nextPaymentDate    (다음 결제 예정일 계산 포함)
  }
```

### 6-2. 신용카드 등록

```
Action: createPaymentMethod(formData)
파일:   actions/payment-methods.ts

입력:
  type:               "credit_card"
  name:               string (1~100자)
  billingStartDay:    number (1~28)
  billingEndDay:      number (0=말일, 1~28)
  paymentDay:         number (1~28)
  paymentMonthOffset: number (0~3, 기본값 1)

처리:
  1. Zod 스키마 검증
  2. INSERT

출력 (성공):
  { success: true, data: { id: "pm_xxx" } }
```

### 6-3. 은행 계좌 등록

```
Action: createPaymentMethod(formData)
파일:   actions/payment-methods.ts

입력:
  type: "bank_account"
  name: string (1~100자)

처리:
  1. billing 관련 필드는 NULL로 저장
  2. INSERT

출력 (성공):
  { success: true, data: { id: "pm_xxx" } }
```

### 6-4. 결제 수단 수정

```
Action: updatePaymentMethod(id, formData)
파일:   actions/payment-methods.ts

입력:
  id: string (UUID)
  + 등록과 동일한 필드

처리:
  1. UPDATE
  2. 신용카드의 결제 주기가 변경된 경우:
     해당 카드로 태그된 기존 거래들의 payment_date를 재계산
     → 영향받는 거래 수를 반환

출력 (성공):
  { success: true, data: { updatedTransactions: 15 } }
```

### 6-5. 결제 수단 삭제

```
Action: deletePaymentMethod(id)
파일:   actions/payment-methods.ts

입력:
  id: string (UUID)

처리:
  1. DELETE (ON DELETE SET NULL → 기존 거래의 payment_method_id가 NULL로 변경)

출력 (성공):
  { success: true, data: null }
```

---

## 7. 예산 (Budgets)

> 관련 유저 스토리: US-014, US-015

### 7-1. 예산 목록 조회 (사용률 포함)

```
Fetcher: getBudgetsWithUsage(month)
파일:    queries/budgets.ts

입력:
  month: string (YYYY-MM-DD, 월 1일)

반환:
  BudgetWithUsage[] — {
    id, categoryId, categoryName, monthlyLimit, currency,
    spent,      (해당 월 발생주의 기준 사용액)
    usagePct,   (사용률 %)
    status      ("normal" | "warning" | "exceeded")
  }

로직:
  budgets JOIN categories
  LEFT JOIN (transaction_allocations + transactions)
  WHERE recognition_month = {month} AND type = 'expense'
  
  status 판정:
    usagePct < 80  → "normal"
    usagePct < 100 → "warning"
    usagePct >= 100 → "exceeded"
```

### 7-2. 예산 설정/수정

```
Action: setBudget(formData)
파일:   actions/budgets.ts

입력:
  categoryId:   string (UUID)
  monthlyLimit: number (양수)

처리:
  1. UPSERT (user_id + category_id UNIQUE 제약)
  2. currency = 사용자의 현재 default_currency

출력 (성공):
  { success: true, data: { id: "budget_xxx" } }
```

### 7-3. 예산 삭제

```
Action: deleteBudget(categoryId)
파일:   actions/budgets.ts

입력:
  categoryId: string (UUID)

처리:
  1. DELETE WHERE user_id AND category_id

출력 (성공):
  { success: true, data: null }
```

---

## 8. 대시보드 / 분석 데이터 (Dashboard & Analytics)

> 관련 유저 스토리: US-009, US-010, US-012, US-016, US-017

### 8-1. 대시보드 요약 데이터

```
Fetcher: getDashboardSummary(month)
파일:    queries/dashboard.ts

입력:
  month: string (YYYY-MM-DD, 월 1일)

반환:
  {
    accrualView: {
      totalIncome:  number
      totalExpense: number
      netBalance:   number
      byCategory:   { categoryId, categoryName, amount, budgetLimit?, usagePct? }[]
    }
    cashView: {
      totalIncome:  number
      totalExpense: number
      netBalance:   number
      byCategory:   { categoryId, categoryName, amount }[]
    }
    budgetAlerts: {
      categoryName: string
      status:       "warning" | "exceeded"
      spent:        number
      limit:        number
    }[]
    pendingTransactions: {
      id:     string
      date:   string
      category: string
      amount: number
      note:   string
    }[]
    currencies: string[]  (해당 월에 사용된 통화 목록)
  }

로직:
  accrualView: transaction_allocations WHERE recognition_month = {month}
  cashView:    transactions WHERE payment_date BETWEEN {month_start} AND {month_end}
  budgetAlerts: 예산 설정된 카테고리 중 usage >= 80%
  pendingTransactions: transaction_date < today AND confirmed_at IS NULL
  currencies: 다중 통화 존재 시 통화별로 분리 합산
```

### 8-2. 거래 내역 목록 (필터링/검색)

```
Fetcher: getTransactions(params)
파일:    queries/transactions.ts

입력:
  viewType:        "accrual" | "cash"
  startDate?:      string (YYYY-MM-DD)
  endDate?:        string (YYYY-MM-DD)
  categoryId?:     string (UUID)
  paymentMethodId?: string (UUID)
  type?:           "income" | "expense"
  amountMin?:      number
  amountMax?:      number
  search?:         string (메모/내용 검색)
  page:            number (기본값 1)
  pageSize:        number (기본값 20)

반환:
  {
    items: TransactionListItem[]
    total: number
    page:  number
    pageSize: number
    totalPages: number
  }

TransactionListItem:
  {
    id, type, amount, currency, categoryName,
    transactionDate, paymentDate,
    recognitionMonth,   (발생주의 기준 표시용)
    paymentMethodName?,
    note?,
    isSplit, splitInfo?, (splitCount, splitOrder 등)
    isPending,          (transaction_date > today)
    needsConfirmation   (transaction_date <= today && confirmed_at IS NULL)
  }

로직:
  viewType = "accrual":
    JOIN transaction_allocations
    WHERE recognition_month BETWEEN startDate AND endDate
    정렬: recognition_month DESC, transaction_date DESC

  viewType = "cash":
    WHERE payment_date BETWEEN startDate AND endDate
    정렬: payment_date DESC
```

### 8-3. 12개월 현금 흐름 예측 데이터

```
Fetcher: getCashFlowProjection(viewType)
파일:    queries/projection.ts

입력:
  viewType: "accrual" | "cash"

반환:
  {
    months: {
      month:    string   (YYYY-MM)
      income:   number
      expenses: number
      netBalance: number  (누적 잔액)
      isActual: boolean   (이번 달 이전 = true)
    }[]
    hasNegativeBalance: boolean
  }

로직:
  viewType = "cash":
    transactions WHERE payment_date 범위
  viewType = "accrual":
    transaction_allocations WHERE recognition_month 범위
  
  누적 잔액 계산:
    첫 번째 달의 netBalance = 해당 월 (income - expenses)
    이후 달 = 이전 달 누적 + 해당 월 (income - expenses)
```

### 8-4. 카테고리별 지출 (파이 차트)

```
Fetcher: getSpendingByCategory(month, viewType)
파일:    queries/charts.ts

입력:
  month:    string (YYYY-MM-DD)
  viewType: "accrual" | "cash"

반환:
  {
    categories: { categoryName, amount, percentage }[]
    total: number
  }
```

### 8-5. 월별 수입/지출 트렌드 (막대 그래프)

```
Fetcher: getMonthlyTrend(months, viewType)
파일:    queries/charts.ts

입력:
  months:   number (최근 N개월, 기본값 6)
  viewType: "accrual" | "cash"

반환:
  {
    month:   string
    income:  number
    expense: number
  }[]
```

---

## 9. 데이터 내보내기 (Export)

> 관련 유저 스토리: US-018, US-019
> HTTP 다운로드가 필요하므로 API Route 사용

### 9-1. CSV 내보내기

```
Route: GET /api/export/csv
파일:  app/api/export/csv/route.ts

Query Parameters:
  startMonth: string (YYYY-MM)
  endMonth:   string (YYYY-MM)
  categoryId?: string (UUID, 선택)

처리:
  1. 인증 확인
  2. 거래 목록 조회 (필터 적용)
  3. Papa Parse로 CSV 생성
  4. Content-Disposition: attachment 헤더로 파일 다운로드

응답:
  Content-Type: text/csv
  Content-Disposition: attachment; filename="cashcompass_2026-01_2026-05.csv"

CSV 컬럼:
  날짜, 유형, 금액, 통화, 카테고리, 귀속 월, 결제 수단, 결제일, 메모
```

### 9-2. PDF 내보내기

```
Route: GET /api/export/pdf
파일:  app/api/export/pdf/route.ts

Query Parameters:
  month: string (YYYY-MM)

처리:
  1. 인증 확인
  2. 해당 월의 요약 데이터 조회 (발생주의 + 현금 뷰)
  3. jsPDF + jspdf-autotable로 PDF 생성
  4. 파일 다운로드

응답:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="cashcompass_2026-05_summary.pdf"

PDF 내용:
  - 헤더: CashCompass 월간 요약 — {년월}
  - 발생주의 뷰: 총 수입, 총 지출, 순 잔액
  - 현금 뷰: 총 수입, 총 지출, 순 잔액
  - 카테고리별 지출 테이블
```

---

## 10. AI 스마트 가져오기 (AI Smart Import)

> 관련 유저 스토리: US-024, US-025
> 이미지 업로드 + AI 분석이 필요하므로 API Route 사용

### 10-1. 이미지 분석

```
Route: POST /api/import/analyze
파일:  app/api/import/analyze/route.ts

Request:
  Content-Type: multipart/form-data
  Body: { image: File (JPG/PNG, 최대 10MB) }

처리:
  1. 인증 확인
  2. 파일 형식 및 크기 검증
  3. 이미지를 base64 인코딩
  4. Claude API (Haiku 4.5 Vision) 호출:
     프롬프트: "이 은행/카드사 앱 스크린샷에서 거래 내역을 추출하세요.
               각 거래의 날짜, 가맹점명/내용, 금액을 JSON 배열로 반환하세요.
               명확히 읽을 수 없는 항목은 needsReview: true로 표시하세요."
  5. AI 응답 파싱 및 정규화
  6. 각 항목에 추천 카테고리 매칭 (키워드 기반)
  7. 원본 이미지 폐기 (메모리에서 제거, 저장하지 않음)

응답 (성공):
  {
    items: {
      date:          string | null
      description:   string | null
      amount:        number | null
      suggestedCategory: string | null   (카테고리 ID 또는 이름)
      needsReview:   boolean
      confidence:    number (0~1)
    }[]
    totalDetected: number
  }

응답 (실패):
  { error: "이미지에서 거래 내역을 인식할 수 없습니다" }
```

### 10-2. 일괄 저장

```
Action: bulkCreateTransactions(formData)
파일:   actions/transactions.ts

입력:
  transactions: {
    type:             "expense"
    amount:           number
    categoryId:       string
    paymentMethodId:  string
    transactionDate:  string
    recognitionMonth: string
    note:             string
  }[]

처리:
  1. 각 항목 Zod 검증
  2. 결제 수단이 신용카드면 paymentDate 계산
  3. 트랜잭션 내에서 일괄 INSERT (transactions + allocations)
  4. revalidatePath

출력 (성공):
  { success: true, data: { createdCount: 5 } }
```

---

## 11. 프로필 / 계정 설정 (Profile)

> 관련 유저 스토리: US-023

### 11-1. 프로필 조회

```
Fetcher: getProfile()
파일:    queries/profile.ts

반환:
  {
    id, email, defaultCurrency, language, createdAt
  }
```

### 11-2. 이메일 변경

```
Action: changeEmail(formData)
파일:   actions/profile.ts

입력:
  newEmail:        string
  currentPassword: string (확인용)

처리:
  1. 현재 비밀번호 확인 (supabase.auth.signInWithPassword)
  2. supabase.auth.updateUser({ email: newEmail })
  3. 새 이메일로 확인 메일 발송

출력 (성공):
  { success: true, data: { message: "새 이메일로 확인 메일이 발송되었습니다" } }
```

### 11-3. 비밀번호 변경

```
Action: changePassword(formData)
파일:   actions/profile.ts

입력:
  currentPassword: string
  newPassword:     string (최소 8자)

처리:
  1. 현재 비밀번호 확인
  2. supabase.auth.updateUser({ password: newPassword })

출력 (성공):
  { success: true, data: null }
```

### 11-4. 기본 통화 변경

```
Action: changeCurrency(formData)
파일:   actions/profile.ts

입력:
  currency: string (3자, ISO 4217)

처리:
  1. profiles.default_currency 업데이트
  2. 기존 거래는 변경하지 않음 (소급 변환 없음)
  ※ 이후 생성되는 거래에만 새 통화 적용

출력 (성공):
  { success: true, data: null }
```

---

## 12. 유틸리티 함수

### 12-1. 신용카드 결제일 계산

```
함수: calculatePaymentDate(transactionDate, paymentMethod)
파일: lib/payment-date.ts

입력:
  transactionDate: Date
  paymentMethod: {
    billingStartDay: number
    billingEndDay:   number  (0 = 말일)
    paymentDay:      number
    paymentMonthOffset: number
  }

처리:
  1. billingEndDay가 0이면 해당 월 마지막 일로 변환
  2. 거래일이 어느 사용기간에 속하는지 판정:
     - start <= end (같은 달): start일 ~ end일
     - start > end (두 달 걸침): 이전 달 start일 ~ 이번 달 end일 또는 이번 달 start일 ~ 다음 달 end일
  3. 사용기간 마감 월 결정
  4. 마감 월 + paymentMonthOffset = 결제 월
  5. 결제 월의 paymentDay = 결제일

반환:
  Date (결제일)
```

### 12-2. 분할 배분 생성

```
함수: createAllocations(totalAmount, splitCount, startMonth)
파일: lib/split.ts

입력:
  totalAmount: number
  splitCount:  number
  startMonth:  Date (월 1일)

처리:
  1. perMonth = Math.floor(totalAmount / splitCount)
  2. remainder = totalAmount - (perMonth * splitCount)
  3. 마지막 달에 remainder 추가 (반올림 오차 보정)

반환:
  { recognitionMonth: Date, amount: number, sortOrder: number }[]
```

---

## 13. 파일 구조 요약

```
app/
├── actions/
│   ├── auth.ts              ← 3. 인증
│   ├── transactions.ts      ← 4. 거래 + 10-2. 일괄 저장
│   ├── categories.ts        ← 5. 카테고리
│   ├── payment-methods.ts   ← 6. 결제 수단
│   ├── budgets.ts           ← 7. 예산
│   └── profile.ts           ← 11. 프로필
│
├── api/
│   ├── export/
│   │   ├── csv/route.ts     ← 9-1. CSV 내보내기
│   │   └── pdf/route.ts     ← 9-2. PDF 내보내기
│   └── import/
│       └── analyze/route.ts ← 10-1. AI 이미지 분석
│
queries/
│   ├── dashboard.ts         ← 8-1. 대시보드 요약
│   ├── transactions.ts      ← 8-2. 거래 목록
│   ├── projection.ts        ← 8-3. 현금 흐름 예측
│   ├── charts.ts            ← 8-4, 8-5. 차트 데이터
│   ├── categories.ts        ← 5-1. 카테고리 목록
│   ├── payment-methods.ts   ← 6-1. 결제 수단 목록
│   ├── budgets.ts           ← 7-1. 예산 사용률
│   └── profile.ts           ← 11-1. 프로필 조회
│
lib/
│   ├── supabase/
│   │   ├── server.ts        ← Supabase 서버 클라이언트
│   │   └── client.ts        ← Supabase 브라우저 클라이언트
│   ├── prisma.ts            ← Prisma 클라이언트 싱글톤
│   ├── auth.ts              ← 인증 헬퍼
│   ├── payment-date.ts      ← 12-1. 결제일 계산
│   ├── split.ts             ← 12-2. 분할 배분
│   └── validations/
│       ├── transaction.ts   ← 거래 Zod 스키마
│       ├── category.ts
│       ├── payment-method.ts
│       ├── budget.ts
│       └── auth.ts
```

---

## 14. 유저 스토리 ↔ API 매핑

| 유저 스토리 | API / Action |
|------------|-------------|
| US-001 기본 거래 추가 | 4-1 createTransaction |
| US-002 일시불 분할 입력 | 4-1 createTransaction (isSplit=true) |
| US-003 분할 금액 수정 | 4-4 updateSplitAmount |
| US-004 영수증 사진 첨부 | 4-6 uploadReceipt, 4-7 deleteReceipt |
| US-005 거래 수정/삭제 | 4-2 updateTransaction, 4-3 deleteTransaction |
| US-006 신용카드 등록 | 6-2 createPaymentMethod (credit_card) |
| US-007 은행 계좌 등록 | 6-3 createPaymentMethod (bank_account) |
| US-008 결제 수단 태그 | 4-1 createTransaction (paymentMethodId) |
| US-009 이중 뷰 대시보드 | 8-1 getDashboardSummary |
| US-010 다른 월로 이동 | 8-1 getDashboardSummary (month 파라미터) |
| US-011 미래 예정 거래 | 4-1 createTransaction + 4-5 confirmPendingTransaction |
| US-012 12개월 예측 차트 | 8-3 getCashFlowProjection |
| US-013 가상 시나리오 | (v1.1 — 클라이언트 사이드 계산, API 불필요) |
| US-014 예산 설정 | 7-2 setBudget |
| US-015 예산 경고 | 7-1 getBudgetsWithUsage, 8-1 getDashboardSummary |
| US-016 파이 차트 | 8-4 getSpendingByCategory |
| US-017 막대 그래프 | 8-5 getMonthlyTrend |
| US-018 CSV 내보내기 | 9-1 GET /api/export/csv |
| US-019 PDF 내보내기 | 9-2 GET /api/export/pdf |
| US-020 회원가입 | 3-1 signup |
| US-021 로그인/로그아웃 | 3-2 login, 3-3 logout |
| US-022 비밀번호 재설정 | 3-4 requestPasswordReset, 3-5 updatePassword |
| US-023 계정 설정 | 11-2 changeEmail, 11-3 changePassword, 11-4 changeCurrency |
| US-024 AI 스마트 가져오기 | 10-1 POST /api/import/analyze |
| US-025 AI 검토/저장 | 10-2 bulkCreateTransactions |
| US-026 수입 분할 입력 | 4-1 createTransaction (type=income, isSplit=true) |
| US-027 카테고리 관리 | 5-2~5-5 카테고리 CRUD |
| US-028 필터링/검색 | 8-2 getTransactions |

---

*이 문서는 개발 진행에 따라 업데이트됩니다.*

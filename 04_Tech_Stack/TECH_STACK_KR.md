# 기술 스택 (Tech Stack)
# CashCompass — 개인 재무 관리 앱

**버전:** 1.0  
**작성일:** 2026-05-23  
**작성자:** Chris Kim  
**상태:** 초안 (Draft)

---

## 1. 기술 스택 요약

```
┌─────────────────────────────────────────────────────────────┐
│                       배포 (Deployment)                      │
│                  Vercel (무료) + Supabase (무료)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── 프론트엔드 ──────────┐  ┌─── 백엔드 ───────────────┐  │
│  │                         │  │                           │  │
│  │  Next.js 15 (App Router)│  │  Next.js Server Actions   │  │
│  │  TypeScript             │  │  Next.js API Routes       │  │
│  │  Tailwind CSS v4        │  │  Prisma ORM               │  │
│  │  shadcn/ui              │  │  Supabase Auth            │  │
│  │  Recharts               │  │  Supabase Storage         │  │
│  │  next-intl              │  │  Claude API (Vision)      │  │
│  │  React Hook Form + Zod  │  │                           │  │
│  │  jsPDF + Papa Parse     │  │                           │  │
│  │                         │  │                           │  │
│  └─────────────────────────┘  └───────────────────────────┘  │
│                                                             │
│  ┌─── 데이터베이스 ────────────────────────────────────────┐  │
│  │  PostgreSQL (Supabase 호스팅)                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 프론트엔드 (Frontend)

### 2-1. Next.js 15 (App Router) + TypeScript

| 항목 | 내용 |
|------|------|
| **선택 이유** | React 기반 풀스택 프레임워크. 프론트엔드와 백엔드(API Routes, Server Actions)를 한 프로젝트에서 관리 가능 |
| **핵심 이점** | Vercel에 최적화된 무료 배포, 서버 사이드 렌더링(SSR), 파일 기반 라우팅, TypeScript 기본 지원 |
| **버전** | Next.js 15.x, React 19.x, TypeScript 5.x |

**App Router 라우트 구조 (예상):**

```
app/
├── (auth)/                    ← 인증 레이아웃 그룹
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── reset-password/page.tsx
├── (main)/                    ← 로그인 후 메인 레이아웃
│   ├── dashboard/page.tsx
│   ├── transactions/
│   │   ├── page.tsx           ← 거래 내역 목록
│   │   └── new/page.tsx       ← 새 거래 추가
│   ├── budget/page.tsx
│   ├── charts/page.tsx
│   ├── projection/page.tsx    ← 현금 흐름 예측
│   ├── export/page.tsx
│   ├── import/page.tsx        ← AI 스마트 가져오기
│   └── settings/
│       ├── account/page.tsx
│       ├── payment-methods/page.tsx
│       └── categories/page.tsx
├── api/                       ← API Routes
│   ├── transactions/
│   ├── budgets/
│   ├── payment-methods/
│   ├── categories/
│   ├── export/
│   └── import/
├── layout.tsx
└── globals.css
```

### 2-2. Tailwind CSS v4 + shadcn/ui

| 항목 | 내용 |
|------|------|
| **Tailwind CSS** | 유틸리티 기반 CSS 프레임워크. 별도 CSS 파일 없이 빠르게 반응형 UI 구현 |
| **shadcn/ui** | Radix UI + Tailwind 기반 복사-붙여넣기 컴포넌트 모음. 패키지 의존성 없이 프로젝트에 직접 포함되어 커스터마이징이 자유로움 |
| **사용 컴포넌트** | Button, Card, Dialog, Dropdown, Form, Input, Select, Tabs, Table, Toast, Progress, Sheet (모바일 메뉴) 등 |

**반응형 브레이크포인트:**

| 브레이크포인트 | 크기 | 대시보드 이중 뷰 |
|---------------|------|-----------------|
| 모바일 | < 768px | 탭 토글 (발생주의 / 현금) |
| 태블릿 | 768px ~ 1023px | 탭 토글 |
| 데스크톱 | ≥ 1024px | 나란히 표시 (side by side) |

### 2-3. Recharts

| 항목 | 내용 |
|------|------|
| **선택 이유** | React 전용 차트 라이브러리. D3.js 기반이지만 선언적 React 컴포넌트로 사용 가능 |
| **대안** | Chart.js (react-chartjs-2) — 범용적이지만 React 통합이 Recharts보다 덜 자연스러움 |
| **사용 차트** | PieChart (카테고리별 지출), BarChart (월별 트렌드), LineChart (현금 흐름 예측), ResponsiveContainer (반응형) |

### 2-4. next-intl

| 항목 | 내용 |
|------|------|
| **선택 이유** | Next.js App Router 전용 국제화 라이브러리. 서버/클라이언트 컴포넌트 모두 지원 |
| **지원 언어** | v1: 한국어 (ko), 영어 (en) |
| **번역 파일** | `messages/ko.json`, `messages/en.json` |

### 2-5. React Hook Form + Zod

| 항목 | 내용 |
|------|------|
| **React Hook Form** | 고성능 폼 라이브러리. 불필요한 리렌더링 최소화 |
| **Zod** | TypeScript-first 스키마 검증. 프론트엔드와 백엔드에서 동일한 검증 스키마 공유 가능 |
| **적용 대상** | 거래 입력 폼, 회원가입/로그인 폼, 결제 수단 등록 폼, 예산 설정 폼 등 모든 사용자 입력 |

### 2-6. jsPDF + Papa Parse

| 항목 | 내용 |
|------|------|
| **jsPDF** | 클라이언트 사이드 PDF 생성. 서버 부담 없이 브라우저에서 직접 PDF 파일 생성 |
| **Papa Parse** | CSV 파싱/생성 라이브러리. 거래 내역 CSV 내보내기에 사용 |
| **장점** | 서버리스 환경(Vercel)에서 Puppeteer 같은 무거운 도구 없이 내보내기 가능 |

---

## 3. 백엔드 (Backend)

### 3-1. Next.js Server Actions + API Routes

| 항목 | 내용 |
|------|------|
| **Server Actions** | 폼 제출, 데이터 변경(Create/Update/Delete) 등 서버 사이드 로직. 별도 API 엔드포인트 없이 서버 함수를 직접 호출 |
| **API Routes** | CSV/PDF 다운로드, AI 이미지 분석, 웹훅 등 Server Actions로 처리하기 어려운 작업 |
| **선택 이유** | 프론트엔드와 백엔드를 분리하지 않고 한 프로젝트에서 관리. 배포도 Vercel 하나로 통합 |

### 3-2. Prisma ORM

| 항목 | 내용 |
|------|------|
| **선택 이유** | TypeScript 전용 ORM. 스키마 정의 → 타입 자동 생성 → 타입 안전한 쿼리 작성 |
| **대안** | Drizzle ORM (더 가벼움) — 서버리스에 유리하지만 생태계가 Prisma보다 작음 |
| **연결** | Supabase PostgreSQL + Connection Pooler (PgBouncer) 사용으로 서버리스 환경의 연결 문제 해결 |

**Prisma 스키마 예시:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Transaction {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  type            TransactionType
  amount          Decimal  @db.Decimal(15, 2)
  currency        String   @db.VarChar(3)
  categoryId      String   @map("category_id")
  paymentMethodId String?  @map("payment_method_id")
  transactionDate DateTime @map("transaction_date") @db.Date
  paymentDate     DateTime @map("payment_date") @db.Date
  note            String?
  receiptPath     String?  @map("receipt_path")
  isSplit         Boolean  @default(false) @map("is_split")
  splitCount      Int?     @map("split_count")
  confirmedAt     DateTime? @map("confirmed_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  category      Category      @relation(fields: [categoryId], references: [id])
  paymentMethod PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  allocations   TransactionAllocation[]

  @@map("transactions")
}
```

### 3-3. Supabase Auth

| 항목 | 내용 |
|------|------|
| **선택 이유** | 이메일/비밀번호 인증, 비밀번호 재설정, 세션 관리를 내장 기능으로 제공. 직접 구현 불필요 |
| **패키지** | `@supabase/ssr` — Next.js App Router와 통합된 인증 |
| **기능** | 회원가입, 로그인, 로그아웃, 비밀번호 재설정 이메일 발송, JWT 기반 세션 관리 |
| **RLS** | Row Level Security — 데이터베이스 레벨에서 사용자별 데이터 격리 보장 |

### 3-4. Supabase Storage

| 항목 | 내용 |
|------|------|
| **용도** | 영수증 사진 저장 (거래당 1장, JPG/PNG/HEIC, 최대 5MB) |
| **버킷** | `receipts` — 사용자별 폴더 구조: `{user_id}/{transaction_id}.{ext}` |
| **보안** | 스토리지 정책으로 본인의 파일만 접근 가능 |
| **무료 한도** | 1GB 저장 공간, 2GB 전송량/월 |

---

## 4. AI 기능 (AI Smart Import)

### 4-1. Anthropic Claude API (Vision)

| 항목 | 내용 |
|------|------|
| **선택 이유** | 이미지에서 텍스트와 구조를 인식하는 Vision 기능 제공. 은행/카드 앱 스크린샷에서 거래 내역 추출에 적합 |
| **모델** | Claude Haiku 4.5 (빠르고 저렴, 이미지 분석에 충분) |
| **호출 방식** | Next.js API Route에서 서버 사이드 호출 (API 키 노출 방지) |
| **비용** | 이미지당 약 $0.001~0.005 (매우 저렴, 무료는 아님) |
| **개인정보** | 이미지를 API에 전송 후 응답만 저장, 원본 이미지는 즉시 폐기 |

**처리 흐름:**

```
사용자 이미지 업로드
      ↓
Next.js API Route 수신
      ↓
Claude API에 이미지 + 프롬프트 전송
  "이 은행 앱 스크린샷에서 거래 내역을 추출하세요.
   각 거래의 날짜, 내용, 금액을 JSON으로 반환하세요."
      ↓
JSON 응답 파싱
      ↓
검토 화면에 결과 표시 (사용자가 확인/수정)
      ↓
원본 이미지 폐기
```

---

## 5. 배포 (Deployment)

### 5-1. Vercel (무료 Hobby 플랜)

| 항목 | 무료 한도 |
|------|----------|
| **대역폭** | 100GB/월 |
| **서버리스 함수** | 실행 시간 10초, 100GB-시간/월 |
| **빌드** | 100시간/월 |
| **프로젝트** | 무제한 |
| **SSL** | 무료 자동 발급 |
| **커스텀 도메인** | 지원 |
| **제한** | 상업적 사용 불가 (개인 프로젝트용) |

**배포 방식:**
```
GitHub 저장소 ──push──→ Vercel 자동 빌드 및 배포
                        ├── 메인 브랜치 → 프로덕션
                        └── PR/브랜치 → 프리뷰 환경
```

### 5-2. Supabase (무료 플랜)

| 항목 | 무료 한도 |
|------|----------|
| **데이터베이스** | 500MB |
| **스토리지** | 1GB |
| **Auth** | 월 50,000 MAU |
| **Edge Functions** | 500,000 호출/월 |
| **대역폭** | 5GB/월 |
| **프로젝트** | 2개 |
| **제한** | 7일 비활성 시 일시 정지 (무료 플랜) |

### 5-3. 월 비용 추정

| 항목 | 비용 |
|------|------|
| Vercel | ₩0 (무료) |
| Supabase | ₩0 (무료) |
| Claude API (AI 가져오기) | ~₩100~500/회 (사용량에 따라) |
| 커스텀 도메인 (선택) | ~₩15,000/년 |
| **총 월 비용** | **₩0 + AI 사용량** |

> AI 스마트 가져오기를 월 30회 사용한다고 가정하면 월 약 ₩3,000~15,000 수준입니다.

---

## 6. 개발 도구 (Development Tools)

| 도구 | 용도 |
|------|------|
| **pnpm** | 패키지 매니저 (npm/yarn 대비 빠르고 디스크 효율적) |
| **ESLint** | 코드 린팅 (Next.js 기본 설정 + TypeScript 규칙) |
| **Prettier** | 코드 포맷팅 |
| **Git + GitHub** | 버전 관리 + 코드 호스팅 |
| **Prisma Studio** | 데이터베이스 GUI (개발 중 데이터 확인용) |

---

## 7. 의존성 패키지 요약

### 핵심 패키지 (dependencies)

```
next                    15.x      프레임워크
react / react-dom       19.x      UI 라이브러리
typescript              5.x       타입 시스템
@supabase/ssr           최신      Supabase 인증 (Next.js용)
@supabase/supabase-js   2.x       Supabase 클라이언트
@prisma/client          6.x       ORM 클라이언트
@anthropic-ai/sdk       최신      Claude API
tailwindcss             4.x       CSS 프레임워크
recharts                2.x       차트
next-intl               최신      국제화 (i18n)
react-hook-form         7.x       폼 관리
zod                     3.x       스키마 검증
@hookform/resolvers     최신      Zod + React Hook Form 연결
jspdf                   2.x       PDF 생성
jspdf-autotable         최신      PDF 테이블 생성
papaparse               5.x       CSV 생성
date-fns                4.x       날짜 유틸리티
```

### 개발 패키지 (devDependencies)

```
prisma                  6.x       ORM CLI + 스키마 관리
eslint                  9.x       린팅
prettier                3.x       포맷팅
@types/react            최신      React 타입 정의
```

---

## 8. 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Prisma)
DATABASE_URL=postgresql://...?pgbouncer=true    # Connection Pooler
DIRECT_URL=postgresql://...                      # Direct (마이그레이션용)

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=https://cashcompass.vercel.app
```

> `NEXT_PUBLIC_` 접두사가 붙은 변수만 브라우저에 노출됩니다.
> `SUPABASE_SERVICE_ROLE_KEY`와 `ANTHROPIC_API_KEY`는 서버에서만 사용됩니다.

---

## 9. 아키텍처 다이어그램

```
┌─────────────┐     ┌──────────────────────────────────────┐
│             │     │          Vercel (무료)                │
│   브라우저   │────→│                                      │
│  (React)    │←────│  Next.js 15                          │
│             │     │  ├── 프론트엔드 (SSR + CSR)           │
└─────────────┘     │  ├── Server Actions (데이터 변경)     │
                    │  └── API Routes (내보내기, AI)        │
                    │         │           │                 │
                    └─────────┼───────────┼─────────────────┘
                              │           │
                    ┌─────────▼───────────▼─────────────────┐
                    │        Supabase (무료)                 │
                    │                                       │
                    │  ┌─────────────┐ ┌─────────────────┐  │
                    │  │ PostgreSQL  │ │   Auth           │  │
                    │  │ (500MB)     │ │   (이메일/PW)    │  │
                    │  └─────────────┘ └─────────────────┘  │
                    │                                       │
                    │  ┌─────────────┐ ┌─────────────────┐  │
                    │  │  Storage    │ │  Connection      │  │
                    │  │  (영수증)   │ │  Pooler          │  │
                    │  └─────────────┘ └─────────────────┘  │
                    │                                       │
                    └───────────────────────────────────────┘
                    
                    ┌───────────────────────────────────────┐
                    │      Anthropic API (종량제)            │
                    │      Claude Haiku 4.5 (Vision)        │
                    │      이미지 → 거래 내역 JSON           │
                    └───────────────────────────────────────┘
```

---

## 10. 기술 결정 근거 요약

| 결정 | 근거 |
|------|------|
| Next.js (풀스택) | 프론트엔드+백엔드 단일 프로젝트 → Vercel 무료 배포 한 번으로 끝 |
| Supabase | DB+Auth+Storage를 무료로 통합 제공. 직접 구축 대비 개발 시간 대폭 절약 |
| Prisma | TypeScript 타입 안전성. 스키마 변경 → 타입 자동 업데이트 → 런타임 에러 감소 |
| shadcn/ui | 패키지 의존성 없는 컴포넌트. 디자인 시스템을 자유롭게 커스터마이징 가능 |
| Recharts | React 네이티브 차트. 파이/막대/꺾은선 차트 모두 지원, 반응형 기본 제공 |
| Claude Haiku | 이미지 인식 정확도 높음 + 비용 최소화. 은행 앱 스크린샷 추출에 적합 |
| jsPDF | 서버리스에서 무거운 도구(Puppeteer) 없이 PDF 생성 가능 |

---

*이 문서는 기술 결정이 변경될 때마다 업데이트됩니다.*

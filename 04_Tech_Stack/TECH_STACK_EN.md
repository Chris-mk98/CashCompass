# Tech Stack
# CashCompass — Personal Finance Management App

**Version:** 1.0  
**Date:** 2026-05-23  
**Author:** Chris Kim  
**Status:** Draft

---

## 1. Tech Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Deployment                               │
│                Vercel (Free) + Supabase (Free)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── Frontend ────────────┐  ┌─── Backend ──────────────┐  │
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
│  ┌─── Database ────────────────────────────────────────────┐  │
│  │  PostgreSQL (hosted on Supabase)                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend

### 2-1. Next.js 15 (App Router) + TypeScript

| Item | Details |
|------|---------|
| **Why** | React-based full-stack framework. Manage frontend and backend (API Routes, Server Actions) in a single project |
| **Key Benefits** | Optimized for free Vercel deployment, server-side rendering (SSR), file-based routing, built-in TypeScript support |
| **Version** | Next.js 15.x, React 19.x, TypeScript 5.x |

**App Router Route Structure (planned):**

```
app/
├── (auth)/                    ← Auth layout group
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── reset-password/page.tsx
├── (main)/                    ← Post-login main layout
│   ├── dashboard/page.tsx
│   ├── transactions/
│   │   ├── page.tsx           ← Transaction list
│   │   └── new/page.tsx       ← New transaction
│   ├── budget/page.tsx
│   ├── charts/page.tsx
│   ├── projection/page.tsx    ← Cash flow projection
│   ├── export/page.tsx
│   ├── import/page.tsx        ← AI Smart Import
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

| Item | Details |
|------|---------|
| **Tailwind CSS** | Utility-first CSS framework. Build responsive UI quickly without separate CSS files |
| **shadcn/ui** | Copy-paste component collection built on Radix UI + Tailwind. No package dependency — components live directly in the project for full customization |
| **Components Used** | Button, Card, Dialog, Dropdown, Form, Input, Select, Tabs, Table, Toast, Progress, Sheet (mobile menu), etc. |

**Responsive Breakpoints:**

| Breakpoint | Size | Dashboard Dual View |
|-----------|------|---------------------|
| Mobile | < 768px | Tab toggle (Accrual / Cash) |
| Tablet | 768px – 1023px | Tab toggle |
| Desktop | ≥ 1024px | Side by side |

### 2-3. Recharts

| Item | Details |
|------|---------|
| **Why** | React-native charting library. Built on D3.js but provides declarative React components |
| **Alternative** | Chart.js (react-chartjs-2) — more general-purpose but less natural React integration |
| **Charts Used** | PieChart (spending by category), BarChart (monthly trend), LineChart (cash flow projection), ResponsiveContainer (responsive) |

### 2-4. next-intl

| Item | Details |
|------|---------|
| **Why** | Internationalization library built for Next.js App Router. Supports both Server and Client Components |
| **Languages** | v1: Korean (ko), English (en) |
| **Translation Files** | `messages/ko.json`, `messages/en.json` |

### 2-5. React Hook Form + Zod

| Item | Details |
|------|---------|
| **React Hook Form** | High-performance form library. Minimizes unnecessary re-renders |
| **Zod** | TypeScript-first schema validation. Share identical validation schemas between frontend and backend |
| **Applied To** | Transaction entry form, signup/login forms, payment method form, budget form — all user inputs |

### 2-6. jsPDF + Papa Parse

| Item | Details |
|------|---------|
| **jsPDF** | Client-side PDF generation. Creates PDF files directly in the browser without server load |
| **Papa Parse** | CSV parsing/generation library. Used for transaction CSV export |
| **Advantage** | Enables export without heavy server-side tools (like Puppeteer) in the serverless Vercel environment |

---

## 3. Backend

### 3-1. Next.js Server Actions + API Routes

| Item | Details |
|------|---------|
| **Server Actions** | Server-side logic for form submissions and data mutations (Create/Update/Delete). Call server functions directly without separate API endpoints |
| **API Routes** | For tasks less suited to Server Actions: CSV/PDF downloads, AI image analysis, webhooks |
| **Why** | Single project for frontend and backend. Unified deployment to Vercel |

### 3-2. Prisma ORM

| Item | Details |
|------|---------|
| **Why** | TypeScript-native ORM. Schema definition → auto-generated types → type-safe queries |
| **Alternative** | Drizzle ORM (lighter weight) — better for serverless but smaller ecosystem than Prisma |
| **Connection** | Supabase PostgreSQL + Connection Pooler (PgBouncer) to solve serverless connection issues |

### 3-3. Supabase Auth

| Item | Details |
|------|---------|
| **Why** | Built-in email/password auth, password reset, session management. No custom implementation needed |
| **Package** | `@supabase/ssr` — integrated with Next.js App Router |
| **Features** | Sign up, login, logout, password reset email, JWT-based session management |
| **RLS** | Row Level Security — database-level per-user data isolation |

### 3-4. Supabase Storage

| Item | Details |
|------|---------|
| **Purpose** | Receipt photo storage (1 per transaction, JPG/PNG/HEIC, max 5MB) |
| **Bucket** | `receipts` — per-user folder structure: `{user_id}/{transaction_id}.{ext}` |
| **Security** | Storage policies ensure users can only access their own files |
| **Free Limit** | 1GB storage, 2GB transfer/month |

---

## 4. AI Feature (AI Smart Import)

### 4-1. Anthropic Claude API (Vision)

| Item | Details |
|------|---------|
| **Why** | Vision capability for recognizing text and structure in images. Well-suited for extracting transactions from bank/card app screenshots |
| **Model** | Claude Haiku 4.5 (fast, affordable, sufficient for image analysis) |
| **Call Method** | Server-side call from Next.js API Route (prevents API key exposure) |
| **Cost** | ~$0.001–0.005 per image (very affordable, not free) |
| **Privacy** | Image sent to API, only response is stored. Original image is immediately discarded |

**Processing Flow:**

```
User uploads image
      ↓
Next.js API Route receives image
      ↓
Sends image + prompt to Claude API
  "Extract transaction details from this bank app screenshot.
   Return each transaction's date, description, and amount as JSON."
      ↓
Parse JSON response
      ↓
Display results on review screen (user confirms/edits)
      ↓
Discard original image
```

---

## 5. Deployment

### 5-1. Vercel (Free Hobby Plan)

| Item | Free Limit |
|------|-----------|
| **Bandwidth** | 100GB/month |
| **Serverless Functions** | 10s execution time, 100GB-hours/month |
| **Builds** | 100 hours/month |
| **Projects** | Unlimited |
| **SSL** | Free auto-provisioning |
| **Custom Domain** | Supported |
| **Limitation** | Non-commercial use only (personal projects) |

**Deployment Method:**
```
GitHub repo ──push──→ Vercel auto-build & deploy
                      ├── Main branch → Production
                      └── PR/branch → Preview environment
```

### 5-2. Supabase (Free Plan)

| Item | Free Limit |
|------|-----------|
| **Database** | 500MB |
| **Storage** | 1GB |
| **Auth** | 50,000 MAU/month |
| **Edge Functions** | 500,000 invocations/month |
| **Bandwidth** | 5GB/month |
| **Projects** | 2 |
| **Limitation** | Paused after 7 days of inactivity (free plan) |

### 5-3. Monthly Cost Estimate

| Item | Cost |
|------|------|
| Vercel | $0 (Free) |
| Supabase | $0 (Free) |
| Claude API (AI Import) | ~$0.01–0.05/use (usage-based) |
| Custom domain (optional) | ~$10/year |
| **Total Monthly** | **$0 + AI usage** |

> Assuming ~30 Smart Import uses per month, the AI cost would be approximately $0.30–1.50/month.

---

## 6. Development Tools

| Tool | Purpose |
|------|---------|
| **pnpm** | Package manager (faster and more disk-efficient than npm/yarn) |
| **ESLint** | Code linting (Next.js defaults + TypeScript rules) |
| **Prettier** | Code formatting |
| **Git + GitHub** | Version control + code hosting |
| **Prisma Studio** | Database GUI (for inspecting data during development) |

---

## 7. Dependencies Summary

### Core Packages (dependencies)

```
next                    15.x      Framework
react / react-dom       19.x      UI library
typescript              5.x       Type system
@supabase/ssr           latest    Supabase Auth (Next.js)
@supabase/supabase-js   2.x       Supabase client
@prisma/client          6.x       ORM client
@anthropic-ai/sdk       latest    Claude API
tailwindcss             4.x       CSS framework
recharts                2.x       Charts
next-intl               latest    Internationalization (i18n)
react-hook-form         7.x       Form management
zod                     3.x       Schema validation
@hookform/resolvers     latest    Zod + React Hook Form bridge
jspdf                   2.x       PDF generation
jspdf-autotable         latest    PDF table generation
papaparse               5.x       CSV generation
date-fns                4.x       Date utilities
```

### Development Packages (devDependencies)

```
prisma                  6.x       ORM CLI + schema management
eslint                  9.x       Linting
prettier                3.x       Formatting
@types/react            latest    React type definitions
```

---

## 8. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Prisma)
DATABASE_URL=postgresql://...?pgbouncer=true    # Connection Pooler
DIRECT_URL=postgresql://...                      # Direct (for migrations)

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=https://cashcompass.vercel.app
```

> Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.
> `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-only.

---

## 9. Architecture Diagram

```
┌─────────────┐     ┌──────────────────────────────────────┐
│             │     │          Vercel (Free)                │
│   Browser   │────→│                                      │
│  (React)    │←────│  Next.js 15                          │
│             │     │  ├── Frontend (SSR + CSR)             │
└─────────────┘     │  ├── Server Actions (data mutations)  │
                    │  └── API Routes (export, AI)          │
                    │         │           │                 │
                    └─────────┼───────────┼─────────────────┘
                              │           │
                    ┌─────────▼───────────▼─────────────────┐
                    │        Supabase (Free)                 │
                    │                                       │
                    │  ┌─────────────┐ ┌─────────────────┐  │
                    │  │ PostgreSQL  │ │   Auth           │  │
                    │  │ (500MB)     │ │   (Email/PW)     │  │
                    │  └─────────────┘ └─────────────────┘  │
                    │                                       │
                    │  ┌─────────────┐ ┌─────────────────┐  │
                    │  │  Storage    │ │  Connection      │  │
                    │  │  (Receipts) │ │  Pooler          │  │
                    │  └─────────────┘ └─────────────────┘  │
                    │                                       │
                    └───────────────────────────────────────┘
                    
                    ┌───────────────────────────────────────┐
                    │      Anthropic API (Pay-per-use)      │
                    │      Claude Haiku 4.5 (Vision)        │
                    │      Image → Transaction JSON         │
                    └───────────────────────────────────────┘
```

---

## 10. Decision Rationale Summary

| Decision | Rationale |
|----------|-----------|
| Next.js (full-stack) | Single project for frontend + backend → One free Vercel deployment |
| Supabase | DB + Auth + Storage combined for free. Saves significant development time vs. building from scratch |
| Prisma | TypeScript type safety. Schema changes → auto-updated types → fewer runtime errors |
| shadcn/ui | No package dependency. Freely customizable design system |
| Recharts | React-native charts. Supports pie/bar/line charts with built-in responsiveness |
| Claude Haiku | High image recognition accuracy + minimal cost. Well-suited for bank app screenshot extraction |
| jsPDF | PDF generation without heavy tools (Puppeteer) in serverless environment |

---

*This document will be updated as technical decisions evolve.*

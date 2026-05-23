# Product Requirements Document (PRD)
# CashCompass — Personal Finance Manager

**Version:** 1.0  
**Date:** 2026-05-23  
**Author:** [Your Name]  
**Status:** Draft

---

## 1. Overview

### 1.1 What is this product?
CashCompass is a web application that helps individuals track their income, expenses, and budgets in one place. Users can see where their money is going and plan ahead.

### 1.2 Problem we are solving
Many people lose track of spending because they manage finances across bank apps, spreadsheets, and receipts. There is no single simple tool that shows the full picture.

### 1.3 Who is this for? (Target Users)
- Individuals aged 20–40 who want to manage personal finances
- People who do not use complex accounting software
- Anyone who wants a simple dashboard to see income vs. expenses

---

## 2. Goals

| Goal | Description |
|------|-------------|
| Primary | Users can record income and expenses easily |
| Primary | Users can set a monthly budget and track progress |
| Secondary | Users can see charts showing spending trends |
| Out of scope | Bank account sync (not in v1) |
| Out of scope | Investment tracking (not in v1) |

---

## 3. Key Features

### Feature 1: Add Income / Expense
- User can add a transaction with: amount, category, date, note
- Categories: Food, Transport, Housing, Entertainment, Salary, Other
- User can edit or delete a transaction

### Feature 2: Dashboard
- Show total income and total expenses for the current month
- Show remaining budget as a progress bar
- Show a simple chart: spending by category (pie chart)

### Feature 3: Budget Setting
- User can set a monthly budget limit per category
- App warns when spending reaches 80% of budget
- App shows red when budget is exceeded

### Feature 4: Transaction History
- User can view all past transactions
- User can filter by: month, category, type (income/expense)
- User can search by note keyword

### Feature 5: User Account
- User can sign up and log in with email + password
- Each user sees only their own data
- User can reset password via email

---

## 4. User Flow (How users move through the app)

```
Sign Up / Log In
      ↓
Dashboard (see this month's summary)
      ↓
Add Transaction → fill in amount, category, date, note → Save
      ↓
View History → filter / search transactions
      ↓
Set Budget → choose category → enter limit
      ↓
Get Warning when near/over budget
```

---

## 5. Non-Functional Requirements

| Item | Requirement |
|------|-------------|
| Performance | Pages load in under 2 seconds |
| Security | Passwords are encrypted, data is private per user |
| Platform | Works on desktop browser (Chrome, Firefox, Safari) |
| Mobile | Responsive design — usable on smartphone browser |
| Language | English (Korean support in v2) |

---

## 6. Success Metrics (How we know it works)

- User can add a transaction in under 30 seconds
- Dashboard shows correct totals with no errors
- Budget warning appears correctly when 80% is reached
- User can find any past transaction within 3 clicks

---

## 7. Open Questions (Things not yet decided)

- [ ] Should we allow photo upload of receipts?
- [ ] What currency formats should we support?
- [ ] Should there be a mobile app (iOS/Android) in v2?
- [ ] Do we need multi-user / family sharing?

---

## 8. Timeline

| Phase | Content | Target |
|-------|---------|--------|
| Phase 1 | Planning docs complete | Week 1–2 |
| Phase 2 | UI design (wireframes) | Week 3–4 |
| Phase 3 | Development | Week 5–10 |
| Phase 4 | Testing | Week 11–12 |
| Phase 5 | Launch | Week 13 |

---

*This document will be updated as decisions are made.*

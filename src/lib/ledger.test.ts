import { test } from "node:test";
import assert from "node:assert/strict";
import { balance, pnl, statements, type LedgerAccount, type LedgerEntry } from "./ledger";

const shinhanBank: LedgerAccount = { id: 1, name: "신한은행", type: "ASSET", isCash: true };
const kb: LedgerAccount = { id: 2, name: "KB 마이너스통장", type: "LIABILITY", isCash: true };
const corpRecv: LedgerAccount = { id: 3, name: "법인카드 미수금", type: "ASSET", isCash: false };
const shinhanPayable: LedgerAccount = { id: 4, name: "신한카드 미지급금", type: "LIABILITY", isCash: false };
const corpPayable: LedgerAccount = { id: 5, name: "법인카드 미지급금", type: "LIABILITY", isCash: false };
const salary: LedgerAccount = { id: 6, name: "급여", type: "INCOME", isCash: false };
const food: LedgerAccount = { id: 7, name: "식비", type: "EXPENSE", isCash: false };
const nhBank: LedgerAccount = { id: 8, name: "농협은행", type: "ASSET", isCash: true };
const accounts = [shinhanBank, kb, corpRecv, shinhanPayable, corpPayable, salary, food, nhBank];

let nextId = 1;
const entry = (date: string, kind: string, dr: LedgerAccount, cr: LedgerAccount, amount: number, extra: Partial<LedgerEntry> = {}): LedgerEntry => ({
  id: nextId++, date, kind, debitAccountId: dr.id, creditAccountId: cr.id, amount, cardId: null, statementDue: null, ...extra,
});

const shinhanCard = { id: 1, cycleStartDay: 12, paymentDay: 25, paymentMonthOffset: 0 };
const corpCard = { id: 3, cycleStartDay: 12, paymentDay: 1, paymentMonthOffset: 1 };

const entries: LedgerEntry[] = [
  entry("2026-09-25", "INCOME", shinhanBank, salary, 3_000_000),
  // 개인카드 사용: 사용일(9월)에 비용 인식, 출금은 10/25
  entry("2026-09-20", "CARD_USE", food, shinhanPayable, 30_000, { cardId: 1 }),
  entry("2026-10-05", "CARD_USE", food, shinhanPayable, 20_000, { cardId: 1 }),
  // 법인카드 사용: 손익 영향 없음
  entry("2026-09-15", "CARD_USE", corpRecv, corpPayable, 100_000, { cardId: 3 }),
  entry("2026-09-16", "CARD_USE", corpRecv, corpPayable, 40_000, { cardId: 3 }),
  // 한 건은 승인 입금, 한 건은 미승인 → 개인비용
  entry("2026-09-30", "CORP_REIMBURSE", nhBank, corpRecv, 100_000),
  entry("2026-09-16", "CORP_TO_PERSONAL", food, corpRecv, 40_000),
  // 신한카드 10/25 출금 처리
  entry("2026-10-25", "CARD_PAYMENT", shinhanPayable, shinhanBank, 50_000, { cardId: 1, statementDue: "2026-10-25" }),
  // KB 마이너스통장에서 50만 원 꺼내 신한으로
  entry("2026-10-01", "GENERAL", shinhanBank, kb, 500_000),
];

test("발생주의 손익은 사용일 기준이고 법인카드는 비용이 아니다", () => {
  const sep = pnl("2026-09", accounts, entries);
  assert.equal(sep.totalIncome, 3_000_000);
  assert.equal(sep.totalExpense, 70_000); // 신한카드 3만 + 미승인 법인카드 4만
  assert.equal(sep.net, 2_930_000);
  assert.equal(pnl("2026-10", accounts, entries).totalExpense, 20_000);
});

test("법인카드 미수금은 정산되면 0이 된다", () => {
  assert.equal(balance(corpRecv, entries), 0);
  assert.equal(balance(corpRecv, entries, "2026-09-15"), 100_000);
  assert.equal(balance(corpPayable, entries), 140_000); // 아직 11/1 출금 전
});

test("현금 계좌 잔액: 마이너스통장은 음수로 보인다", () => {
  assert.equal(balance(shinhanBank, entries), 3_000_000 - 50_000 + 500_000);
  assert.equal(balance(kb, entries), -500_000);
  assert.equal(balance(nhBank, entries), 100_000);
});

test("카드 이용기간별 청구와 결제 처리", () => {
  const [s] = statements(shinhanCard, entries);
  assert.equal(s.due, "2026-10-25");
  assert.equal(s.amount, 50_000);
  assert.equal(s.paid, 50_000);

  const [c] = statements(corpCard, entries);
  assert.equal(c.due, "2026-11-01");
  assert.equal(c.amount, 140_000); // 승인 여부와 관계없이 전액 출금
  assert.equal(c.paid, 0);
});

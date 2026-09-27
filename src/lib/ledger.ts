import { cycleFor, type CardCycleConfig, type Cycle } from "./billing";
import { monthOf } from "./dates";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export type LedgerAccount = { id: number; name: string; type: AccountType; isCash: boolean };

export type LedgerEntry = {
  id: number;
  date: string;
  kind: string;
  debitAccountId: number;
  creditAccountId: number;
  amount: number;
  cardId: number | null;
  statementDue: string | null;
};

const debitNormal = (type: AccountType) => type === "ASSET" || type === "EXPENSE";

// 계정의 정상잔액 (자산·비용은 차변-대변, 그 외는 대변-차변).
// 현금 계좌는 부채(마이너스통장)라도 "통장에 찍히는 잔액"(차변-대변)으로 본다.
export function balance(account: LedgerAccount, entries: LedgerEntry[], until?: string): number {
  let dr = 0;
  let cr = 0;
  for (const e of entries) {
    if (until && e.date > until) continue;
    if (e.debitAccountId === account.id) dr += e.amount;
    if (e.creditAccountId === account.id) cr += e.amount;
  }
  return debitNormal(account.type) || account.isCash ? dr - cr : cr - dr;
}

export type PnlLine = { account: LedgerAccount; amount: number };

// 발생주의 손익: 거래일(사용일)이 속한 달 기준
export function pnl(month: string, accounts: LedgerAccount[], entries: LedgerEntry[]) {
  const monthEntries = entries.filter((e) => monthOf(e.date) === month);
  const lines = (type: AccountType): PnlLine[] =>
    accounts
      .filter((a) => a.type === type)
      .map((account) => ({ account, amount: balance(account, monthEntries) }))
      .filter((l) => l.amount !== 0);
  const income = lines("INCOME");
  const expense = lines("EXPENSE");
  const sum = (ls: PnlLine[]) => ls.reduce((s, l) => s + l.amount, 0);
  return { income, expense, totalIncome: sum(income), totalExpense: sum(expense), net: sum(income) - sum(expense) };
}

export type Statement = Cycle & { amount: number; paid: number; entryIds: number[] };

// 카드 이용기간별 청구 금액과 결제(출금) 처리된 금액
export function statements(
  card: CardCycleConfig & { id: number },
  entries: LedgerEntry[],
): Statement[] {
  const byDue = new Map<string, Statement>();
  for (const e of entries) {
    if (e.cardId !== card.id || e.kind !== "CARD_USE") continue;
    const cycle = cycleFor(card, e.date);
    const s = byDue.get(cycle.due) ?? { ...cycle, amount: 0, paid: 0, entryIds: [] };
    s.amount += e.amount;
    s.entryIds.push(e.id);
    byDue.set(cycle.due, s);
  }
  for (const e of entries) {
    if (e.cardId !== card.id || e.kind !== "CARD_PAYMENT" || !e.statementDue) continue;
    const s = byDue.get(e.statementDue);
    if (s) s.paid += e.amount;
  }
  return [...byDue.values()].sort((a, b) => a.due.localeCompare(b.due));
}

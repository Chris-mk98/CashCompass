import { prisma } from "./db";
import { fromDate } from "./dates";
import type { LedgerAccount, LedgerEntry } from "./ledger";

export const CORP_RECEIVABLE = "법인카드 미수금";

export async function loadLedger() {
  const [accounts, cards, rows] = await Promise.all([
    prisma.account.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.card.findMany({ orderBy: { id: "asc" } }),
    prisma.entry.findMany({ orderBy: [{ date: "desc" }, { id: "desc" }] }),
  ]);
  const entries = rows.map((e) => ({
    ...e,
    date: fromDate(e.date),
    statementDue: e.statementDue ? fromDate(e.statementDue) : null,
  }));
  const accountName = (id: number) => accounts.find((a) => a.id === id)?.name ?? "?";
  return { accounts: accounts as LedgerAccount[], cards, entries, accountName };
}

export type Ledger = Awaited<ReturnType<typeof loadLedger>>;
export type Entry = Ledger["entries"][number] & LedgerEntry;

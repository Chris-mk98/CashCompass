import { loadLedger } from "@/lib/data";
import { pnl } from "@/lib/ledger";
import { monthOf, todayKST } from "@/lib/dates";
import { Empty, MonthNav, Row, Section, won } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PnlPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const month = m ?? monthOf(todayKST());
  const { accounts, entries } = await loadLedger();
  const p = pnl(month, accounts, entries);

  return (
    <>
      <MonthNav month={month} path="/pnl" />
      <p className="mb-3 text-xs text-zinc-500">발생주의: 카드 사용일 기준으로 비용을 잡습니다. 법인카드 사용은 개인비용으로 전환된 건만 포함됩니다.</p>
      <Section title="수익">
        {p.income.length === 0 && <Empty>없음</Empty>}
        {p.income.map((l) => <Row key={l.account.id} label={l.account.name} value={won(l.amount)} />)}
        <Row label="합계" value={won(p.totalIncome)} strong />
      </Section>
      <Section title="비용">
        {p.expense.length === 0 && <Empty>없음</Empty>}
        {p.expense
          .sort((a, b) => b.amount - a.amount)
          .map((l) => <Row key={l.account.id} label={l.account.name} value={won(l.amount)} sub={p.totalExpense ? `${Math.round((l.amount / p.totalExpense) * 100)}%` : undefined} />)}
        <Row label="합계" value={won(p.totalExpense)} strong />
      </Section>
      <Section title="순이익">
        <p className={`text-2xl font-bold tabular-nums ${p.net < 0 ? "text-red-600" : ""}`}>{won(p.net)}</p>
      </Section>
    </>
  );
}

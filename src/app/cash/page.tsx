import { loadLedger } from "@/lib/data";
import { balance, statements } from "@/lib/ledger";
import { addDays, monthOf, todayKST } from "@/lib/dates";
import { Empty, MonthNav, Row, Section, won } from "@/components/ui";
import { payStatement } from "../actions";

export const dynamic = "force-dynamic";

export default async function CashPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const month = m ?? monthOf(todayKST());
  const { accounts, cards, entries, accountName } = await loadLedger();
  const prevEnd = addDays(`${month}-01`, -1);
  const due = cards.flatMap((card) =>
    statements(card, entries)
      .filter((s) => monthOf(s.due) === month)
      .map((s) => ({ card, ...s })),
  );

  return (
    <>
      <MonthNav month={month} path="/cash" />
      <p className="mb-3 text-xs text-zinc-500">현금주의: 실제로 계좌에서 돈이 들어오고 나간 날짜 기준입니다.</p>

      <Section title="카드대금 출금">
        {due.length === 0 && <Empty>이번 달 출금 예정인 카드대금이 없습니다.</Empty>}
        {due.map((s) => {
          const remaining = s.amount - s.paid;
          return (
            <div key={`${s.card.id}-${s.due}`} className="border-b border-zinc-100 py-2 last:border-0">
              <Row
                label={`${s.due} ${s.card.name} (${accountName(s.card.bankAccountId)})`}
                sub={`이용기간 ${s.start} ~ ${s.end} · ${s.entryIds.length}건`}
                value={remaining > 0 ? won(s.amount) : <span className="text-green-700">출금 완료</span>}
              />
              {remaining > 0 && (
                <form action={payStatement} className="flex gap-2">
                  <input type="hidden" name="cardId" value={s.card.id} />
                  <input type="hidden" name="due" value={s.due} />
                  <input name="date" type="date" defaultValue={s.due} className="input py-1.5" />
                  <input name="amount" defaultValue={remaining} inputMode="numeric" className="input py-1.5" />
                  <button className="btn-sm shrink-0">출금 처리</button>
                </form>
              )}
            </div>
          );
        })}
      </Section>

      {accounts.filter((a) => a.isCash).map((a) => {
        const moves = entries
          .filter((e) => monthOf(e.date) === month && (e.debitAccountId === a.id || e.creditAccountId === a.id))
          .reverse();
        return (
          <Section key={a.id} title={a.name}>
            <Row label="월초 잔액" value={won(balance(a, entries, prevEnd))} />
            {moves.map((e) => {
              const inflow = e.debitAccountId === a.id;
              const other = accountName(inflow ? e.creditAccountId : e.debitAccountId);
              return (
                <Row
                  key={e.id}
                  label={e.memo ?? other}
                  sub={`${e.date} · ${other}`}
                  value={<span className={inflow ? "text-blue-700" : "text-red-600"}>{inflow ? "+" : "−"}{won(e.amount)}</span>}
                />
              );
            })}
            <Row label="월말 잔액" value={won(balance(a, entries, `${month}-31`))} strong />
          </Section>
        );
      })}
    </>
  );
}

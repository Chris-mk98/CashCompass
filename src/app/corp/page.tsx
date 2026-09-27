import { loadLedger } from "@/lib/data";
import { todayKST } from "@/lib/dates";
import { Empty, Row, Section, won } from "@/components/ui";
import { corpToPersonal, reimburseCorp } from "../actions";

export const dynamic = "force-dynamic";

export default async function CorpPage() {
  const { accounts, cards, entries, accountName } = await loadLedger();
  const corpCardIds = new Set(cards.filter((c) => c.kind === "CORPORATE").map((c) => c.id));
  const uses = entries.filter((e) => e.kind === "CARD_USE" && e.cardId !== null && corpCardIds.has(e.cardId));
  const settlement = new Map(entries.filter((e) => e.settlesEntryId).map((e) => [e.settlesEntryId, e]));
  const pending = uses.filter((e) => !settlement.has(e.id));
  const settled = uses.filter((e) => settlement.has(e.id)).slice(0, 30);
  const cashAccounts = accounts.filter((a) => a.isCash);
  const categories = accounts.filter((a) => a.type === "EXPENSE");
  const today = todayKST();

  return (
    <>
      <Section title="정산 대기 (법인카드 미수금)" right={<span className="font-semibold tabular-nums">{won(pending.reduce((s, e) => s + e.amount, 0))}</span>}>
        {pending.length === 0 && <Empty>정산 대기 중인 건이 없습니다.</Empty>}
        {pending.map((e) => (
          <div key={e.id} className="border-b border-zinc-100 py-2 last:border-0">
            <Row label={e.memo ?? "(메모 없음)"} sub={e.date} value={won(e.amount)} />
            <details className="text-sm">
              <summary className="cursor-pointer text-zinc-600">처리하기</summary>
              <form action={reimburseCorp} className="mt-2 flex gap-2">
                <input type="hidden" name="entryId" value={e.id} />
                <input name="date" type="date" defaultValue={today} className="input py-1.5" />
                <select name="bankAccountId" className="input py-1.5" defaultValue={cashAccounts.find((a) => a.name === "농협은행")?.id}>
                  {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button className="btn-sm shrink-0">승인 입금</button>
              </form>
              <form action={corpToPersonal} className="mt-2 flex gap-2">
                <input type="hidden" name="entryId" value={e.id} />
                <select name="categoryId" className="input py-1.5">
                  {categories.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button className="btn-sm shrink-0">개인비용 전환</button>
              </form>
            </details>
          </div>
        ))}
      </Section>
      <Section title="최근 정산 완료">
        {settled.length === 0 && <Empty>없음</Empty>}
        {settled.map((e) => {
          const s = settlement.get(e.id)!;
          return (
            <Row
              key={e.id}
              label={e.memo ?? "(메모 없음)"}
              sub={`${e.date} 사용 → ${s.kind === "CORP_REIMBURSE" ? `${s.date} ${accountName(s.debitAccountId)} 입금` : `개인비용(${accountName(s.debitAccountId)})`}`}
              value={won(e.amount)}
            />
          );
        })}
      </Section>
    </>
  );
}

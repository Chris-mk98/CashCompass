import { loadLedger } from "@/lib/data";
import { monthOf, todayKST } from "@/lib/dates";
import { Empty, MonthNav, Section, won } from "@/components/ui";
import { deleteEntry } from "../actions";

export const dynamic = "force-dynamic";

const kindLabel: Record<string, string> = {
  CARD_USE: "카드 사용",
  CORP_REIMBURSE: "법인 승인입금",
  CORP_TO_PERSONAL: "법인→개인비용",
  CARD_PAYMENT: "카드대금 출금",
  INCOME: "수입",
  GENERAL: "직접 분개",
};

export default async function EntriesPage({ searchParams }: { searchParams: Promise<{ m?: string; error?: string }> }) {
  const { m, error } = await searchParams;
  const month = m ?? monthOf(todayKST());
  const { entries, accountName } = await loadLedger();
  const list = entries.filter((e) => monthOf(e.date) === month);

  return (
    <>
      <MonthNav month={month} path="/entries" />
      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Section title="분개장">
        {list.length === 0 && <Empty>기록이 없습니다.</Empty>}
        {list.map((e) => (
          <div key={e.id} className="border-b border-zinc-100 py-2 text-sm last:border-0">
            <div className="flex justify-between">
              <span className="text-zinc-500">{e.date} · {kindLabel[e.kind]}</span>
              <span className="font-medium tabular-nums">{won(e.amount)}</span>
            </div>
            <div>(차) {accountName(e.debitAccountId)} / (대) {accountName(e.creditAccountId)}</div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">{e.memo}</span>
              <form action={deleteEntry}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="m" value={month} />
                <button className="text-xs text-red-600">삭제</button>
              </form>
            </div>
          </div>
        ))}
      </Section>
    </>
  );
}

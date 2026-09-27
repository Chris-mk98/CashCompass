import { loadLedger } from "@/lib/data";
import { Section } from "@/components/ui";
import { addAccount, updateCard } from "../actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { accounts, cards } = await loadLedger();
  const cashAccounts = accounts.filter((a) => a.isCash);

  return (
    <>
      {cards.map((c) => (
        <Section key={c.id} title={`${c.name} ${c.kind === "CORPORATE" ? "(법인)" : ""}`}>
          <form action={updateCard} className="space-y-2 text-sm">
            <input type="hidden" name="id" value={c.id} />
            <div className="flex items-center gap-2">
              이용기간: 매달
              <input name="cycleStartDay" defaultValue={c.cycleStartDay} inputMode="numeric" className="input w-16 py-1.5" />
              일 ~ 다음 달 {c.cycleStartDay - 1}일
            </div>
            <div className="flex items-center gap-2">
              출금: 종료월
              <select name="paymentMonthOffset" defaultValue={c.paymentMonthOffset} className="input w-24 py-1.5">
                <option value={0}>당월</option>
                <option value={1}>다음 달</option>
                <option value={2}>2달 뒤</option>
              </select>
              <input name="paymentDay" defaultValue={c.paymentDay} inputMode="numeric" className="input w-16 py-1.5" />일
            </div>
            <div className="flex items-center gap-2">
              출금 계좌
              <select name="bankAccountId" defaultValue={c.bankAccountId} className="input py-1.5">
                {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <button className="btn-sm">저장</button>
          </form>
        </Section>
      ))}
      <Section title="카테고리 추가">
        <form action={addAccount} className="flex gap-2">
          <select name="type" className="input w-24 py-1.5">
            <option value="EXPENSE">비용</option>
            <option value="INCOME">수익</option>
          </select>
          <input name="name" className="input py-1.5" placeholder="예: 구독료" />
          <button className="btn-sm shrink-0">추가</button>
        </form>
      </Section>
    </>
  );
}

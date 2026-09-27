import Link from "next/link";
import { loadLedger } from "@/lib/data";
import { todayKST } from "@/lib/dates";
import { CardUseForm } from "@/components/card-use-form";
import { Section } from "@/components/ui";
import { addGeneral, addIncome } from "../actions";

export const dynamic = "force-dynamic";

const tabs = [
  ["card", "카드 사용"],
  ["income", "수입"],
  ["general", "직접 분개"],
];

export default async function NewEntry({ searchParams }: { searchParams: Promise<{ type?: string; cardId?: string; ok?: string }> }) {
  const { type = "card", cardId, ok } = await searchParams;
  const { accounts, cards } = await loadLedger();
  const today = todayKST();
  const of = (t: string) => accounts.filter((a) => a.type === t);
  const cashAccounts = accounts.filter((a) => a.isCash);

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {tabs.map(([key, label]) => (
          <Link key={key} href={`/new?type=${key}`} className={`rounded-lg py-2 text-center text-sm ${type === key ? "bg-zinc-900 text-white" : "bg-white"}`}>
            {label}
          </Link>
        ))}
      </div>
      {ok && <p className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">저장했습니다.</p>}

      {type === "card" && (
        <Section title="카드 사용">
          <CardUseForm cards={cards} categories={of("EXPENSE")} today={today} defaultCardId={cardId ? Number(cardId) : undefined} />
        </Section>
      )}

      {type === "income" && (
        <Section title="수입 (급여 · 용돈 등)">
          <form action={addIncome} className="space-y-3">
            <div>
              <label className="label">날짜</label>
              <input name="date" type="date" className="input" defaultValue={today} required />
            </div>
            <div>
              <label className="label">금액</label>
              <input name="amount" inputMode="numeric" pattern="[0-9,]*" className="input" required />
            </div>
            <div>
              <label className="label">수익 항목</label>
              <select name="incomeAccountId" className="input">
                {of("INCOME").map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">입금 계좌</label>
              <select name="bankAccountId" className="input" defaultValue={cashAccounts.find((a) => a.name === "신한은행")?.id}>
                {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">메모</label>
              <input name="memo" className="input" />
            </div>
            <button className="btn w-full">저장</button>
          </form>
        </Section>
      )}

      {type === "general" && (
        <Section title="직접 분개">
          <ul className="mb-3 list-disc space-y-1 pl-5 text-xs text-zinc-500">
            <li>KB에서 꺼내 신한으로: 차변 신한은행 / 대변 KB 마이너스통장</li>
            <li>KB에 다시 넣기: 차변 KB 마이너스통장 / 대변 신한은행</li>
            <li>KB 이자 출금: 차변 이자비용 / 대변 KB 마이너스통장</li>
            <li>계좌이체로 지출: 차변 비용 항목 / 대변 해당 계좌</li>
            <li>시작 잔액: 차변 계좌 / 대변 기초순자산 (마이너스통장은 반대로)</li>
          </ul>
          <form action={addGeneral} className="space-y-3">
            <div>
              <label className="label">날짜</label>
              <input name="date" type="date" className="input" defaultValue={today} required />
            </div>
            <div>
              <label className="label">금액</label>
              <input name="amount" inputMode="numeric" pattern="[0-9,]*" className="input" required />
            </div>
            <AccountSelect name="debitAccountId" label="차변 (들어온 곳 · 비용)" accounts={accounts} />
            <AccountSelect name="creditAccountId" label="대변 (나간 곳 · 수익)" accounts={accounts} />
            <div>
              <label className="label">메모</label>
              <input name="memo" className="input" />
            </div>
            <button className="btn w-full">저장</button>
          </form>
        </Section>
      )}
    </>
  );
}

const typeLabel: Record<string, string> = { ASSET: "자산", LIABILITY: "부채", EQUITY: "자본", INCOME: "수익", EXPENSE: "비용" };

function AccountSelect({ name, label, accounts }: { name: string; label: string; accounts: { id: number; name: string; type: string }[] }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} className="input">
        {Object.entries(typeLabel).map(([type, group]) => (
          <optgroup key={type} label={group}>
            {accounts.filter((a) => a.type === type).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

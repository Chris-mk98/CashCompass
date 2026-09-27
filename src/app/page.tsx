import Link from "next/link";
import { loadLedger } from "@/lib/data";
import { balance, statements } from "@/lib/ledger";
import { Empty, Row, Section, won } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { accounts, cards, entries } = await loadLedger();
  const group = (types: string[], filter: (a: (typeof accounts)[number]) => boolean = () => true) =>
    accounts.filter((a) => types.includes(a.type) && filter(a)).map((a) => ({ a, bal: balance(a, entries) }));

  const cash = group(["ASSET", "LIABILITY"], (a) => a.isCash);
  const receivables = group(["ASSET"], (a) => !a.isCash);
  const payables = group(["LIABILITY"], (a) => !a.isCash);
  // 순자산 = 자산 - 부채 (현금 계좌는 통장 잔액 그대로 더함)
  const netWorth =
    [...cash, ...receivables].reduce((s, x) => s + x.bal, 0) - payables.reduce((s, x) => s + x.bal, 0);

  const upcoming = cards
    .flatMap((card) => statements(card, entries).map((s) => ({ card, ...s })))
    .filter((s) => s.paid < s.amount)
    .sort((a, b) => a.due.localeCompare(b.due));

  return (
    <>
      <Section title="순자산">
        <p className="text-2xl font-bold tabular-nums">{won(netWorth)}</p>
      </Section>
      <Section title="계좌 잔액 (현금주의)">
        {cash.map(({ a, bal }) => (
          <Row key={a.id} label={a.name} value={won(bal)} />
        ))}
      </Section>
      <Section title="받을 돈 · 갚을 돈">
        {receivables.map(({ a, bal }) => (
          <Row key={a.id} label={<Link href="/corp" className="underline">{a.name}</Link>} value={won(bal)} />
        ))}
        {payables.map(({ a, bal }) => (
          <Row key={a.id} label={a.name} value={won(bal)} />
        ))}
      </Section>
      <Section title="카드대금 출금 예정">
        {upcoming.length === 0 && <Empty>예정된 출금이 없습니다.</Empty>}
        {upcoming.map((s) => (
          <Row
            key={`${s.card.id}-${s.due}`}
            label={`${s.due} ${s.card.name}`}
            sub={`이용기간 ${s.start} ~ ${s.end}`}
            value={won(s.amount - s.paid)}
          />
        ))}
      </Section>
    </>
  );
}

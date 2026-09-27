"use client";

import { useState } from "react";
import { cycleFor } from "@/lib/billing";
import { addCardUse } from "@/app/actions";

type Card = { id: number; name: string; kind: string; cycleStartDay: number; paymentDay: number; paymentMonthOffset: number };

export function CardUseForm({ cards, categories, today, defaultCardId }: {
  cards: Card[];
  categories: { id: number; name: string }[];
  today: string;
  defaultCardId?: number;
}) {
  const [cardId, setCardId] = useState(defaultCardId ?? cards[0]?.id);
  const [date, setDate] = useState(today);
  const card = cards.find((c) => c.id === cardId);
  const cycle = card && date ? cycleFor(card, date) : null;
  const corporate = card?.kind === "CORPORATE";

  return (
    <form action={addCardUse} className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => (
          <label key={c.id} className={`rounded-lg border p-2 text-center text-sm ${c.id === cardId ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"}`}>
            <input type="radio" name="cardId" value={c.id} checked={c.id === cardId} onChange={() => setCardId(c.id)} className="sr-only" />
            {c.name}
          </label>
        ))}
      </div>
      <div>
        <label className="label">사용일</label>
        <input name="date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        {cycle && (
          <p className="mt-1 text-xs text-zinc-500">
            이용기간 {cycle.start} ~ {cycle.end} → <b>{cycle.due}</b> 출금
          </p>
        )}
      </div>
      <div>
        <label className="label">금액</label>
        <input name="amount" inputMode="numeric" pattern="[0-9,]*" className="input" required />
      </div>
      {corporate ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          법인카드 사용은 비용이 아니라 <b>법인카드 미수금</b>으로 기록됩니다. 승인 입금 또는 개인비용 전환은 “법인” 탭에서 처리하세요.
        </p>
      ) : (
        <div>
          <label className="label">카테고리 (발생주의 비용)</label>
          <select name="categoryId" className="input" required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="label">메모</label>
        <input name="memo" className="input" />
      </div>
      <button className="btn w-full">저장</button>
    </form>
  );
}

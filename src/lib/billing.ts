import { addDays, lastDayOfMonth, parse, ymd } from "./dates";

export type CardCycleConfig = {
  cycleStartDay: number; // 1~28
  paymentDay: number; // 1~31 (짧은 달은 말일로)
  paymentMonthOffset: number; // 이용기간 종료월 기준 몇 달 뒤에 출금되는지
};

export type Cycle = { start: string; end: string; due: string };

// 사용일이 속한 이용기간과 출금 예정일
export function cycleFor(card: CardCycleConfig, date: string): Cycle {
  const [y, m, d] = parse(date);
  const startMonth = d >= card.cycleStartDay ? m : m - 1;
  const start = ymd(y, startMonth, card.cycleStartDay);
  const end = addDays(ymd(y, startMonth + 1, card.cycleStartDay), -1);
  const [ey, em] = parse(end);
  const [dy, dm] = parse(ymd(ey, em + card.paymentMonthOffset, 1));
  const due = ymd(dy, dm, Math.min(card.paymentDay, lastDayOfMonth(dy, dm)));
  return { start, end, due };
}

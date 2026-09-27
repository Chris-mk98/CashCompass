import { test } from "node:test";
import assert from "node:assert/strict";
import { cycleFor } from "./billing";

const shinhan = { cycleStartDay: 12, paymentDay: 25, paymentMonthOffset: 0 };
const nh = { cycleStartDay: 18, paymentDay: 1, paymentMonthOffset: 1 };
const corp = { cycleStartDay: 12, paymentDay: 1, paymentMonthOffset: 1 };

test("신한카드: 9/12~10/11 사용분은 10/25 출금", () => {
  const expected = { start: "2026-09-12", end: "2026-10-11", due: "2026-10-25" };
  assert.deepEqual(cycleFor(shinhan, "2026-09-12"), expected);
  assert.deepEqual(cycleFor(shinhan, "2026-10-11"), expected);
  assert.equal(cycleFor(shinhan, "2026-10-12").due, "2026-11-25");
});

test("농협카드: 9/18~10/17 사용분은 11/1 출금", () => {
  const expected = { start: "2026-09-18", end: "2026-10-17", due: "2026-11-01" };
  assert.deepEqual(cycleFor(nh, "2026-09-18"), expected);
  assert.deepEqual(cycleFor(nh, "2026-10-17"), expected);
  assert.equal(cycleFor(nh, "2026-09-17").due, "2026-10-01");
});

test("법인카드: 전전월 12일~전월 11일 사용분은 1일 출금", () => {
  assert.deepEqual(cycleFor(corp, "2026-09-20"), {
    start: "2026-09-12",
    end: "2026-10-11",
    due: "2026-11-01",
  });
});

test("연도가 넘어가는 이용기간", () => {
  assert.deepEqual(cycleFor(shinhan, "2026-01-05"), {
    start: "2025-12-12",
    end: "2026-01-11",
    due: "2026-01-25",
  });
  assert.equal(cycleFor(nh, "2026-12-20").due, "2027-02-01");
});

test("출금일이 짧은 달의 말일보다 크면 말일로", () => {
  const card = { cycleStartDay: 1, paymentDay: 31, paymentMonthOffset: 1 };
  assert.deepEqual(cycleFor(card, "2026-01-15"), {
    start: "2026-01-01",
    end: "2026-01-31",
    due: "2026-02-28",
  });
});

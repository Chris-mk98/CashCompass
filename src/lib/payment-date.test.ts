import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { calculatePaymentDate } from "./payment-date";

describe("billing period 1st~end-of-month, payment next month 25th", () => {
  const card = {
    billingStartDay: 1,
    billingEndDay: 0,
    paymentDay: 25,
    paymentMonthOffset: 1,
  };

  test("2026-01-05 → 2026-02-25", () => {
    const result = calculatePaymentDate(new Date(2026, 0, 5), card);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 1);
    assert.equal(result.getDate(), 25);
  });

  test("2026-01-31 → 2026-02-25", () => {
    const result = calculatePaymentDate(new Date(2026, 0, 31), card);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 1);
    assert.equal(result.getDate(), 25);
  });

  test("2026-02-28 → 2026-03-25", () => {
    const result = calculatePaymentDate(new Date(2026, 1, 28), card);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 2);
    assert.equal(result.getDate(), 25);
  });

  test("2026-12-25 → 2027-01-25 (year crossover)", () => {
    const result = calculatePaymentDate(new Date(2026, 11, 25), card);
    assert.equal(result.getFullYear(), 2027);
    assert.equal(result.getMonth(), 0);
    assert.equal(result.getDate(), 25);
  });
});

describe("billing period 16th~15th, payment next month 10th", () => {
  const card = {
    billingStartDay: 16,
    billingEndDay: 15,
    paymentDay: 10,
    paymentMonthOffset: 1,
  };

  test("2026-01-20 → 2026-03-10", () => {
    const result = calculatePaymentDate(new Date(2026, 0, 20), card);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 2);
    assert.equal(result.getDate(), 10);
  });

  test("2026-01-10 → 2026-02-10", () => {
    const result = calculatePaymentDate(new Date(2026, 0, 10), card);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 1);
    assert.equal(result.getDate(), 10);
  });

  test("2026-02-15 → 2026-03-10", () => {
    const result = calculatePaymentDate(new Date(2026, 1, 15), card);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 2);
    assert.equal(result.getDate(), 10);
  });

  test("2026-02-16 → 2026-04-10", () => {
    const result = calculatePaymentDate(new Date(2026, 1, 16), card);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 3);
    assert.equal(result.getDate(), 10);
  });
});

describe("billing period 1st~end-of-month, payment same month 27th", () => {
  const card = {
    billingStartDay: 1,
    billingEndDay: 0,
    paymentDay: 27,
    paymentMonthOffset: 0,
  };

  test("2026-01-05 → 2026-01-27", () => {
    const result = calculatePaymentDate(new Date(2026, 0, 5), card);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 0);
    assert.equal(result.getDate(), 27);
  });
});

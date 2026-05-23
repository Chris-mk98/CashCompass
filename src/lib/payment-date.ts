import {
  getDaysInMonth,
  setDate,
  addMonths,
  startOfMonth,
  isBefore,
  isEqual,
} from "date-fns";

interface CreditCardInfo {
  billingStartDay: number;
  billingEndDay: number; // 0 = end of month
  paymentDay: number;
  paymentMonthOffset: number;
}

export function calculatePaymentDate(
  transactionDate: Date,
  card: CreditCardInfo
): Date {
  const { billingStartDay, billingEndDay, paymentDay, paymentMonthOffset } =
    card;

  const closingMonth = getBillingClosingMonth(
    transactionDate,
    billingStartDay,
    billingEndDay
  );

  const paymentMonth = addMonths(closingMonth, paymentMonthOffset);

  const maxDay = getDaysInMonth(paymentMonth);
  const actualPaymentDay = Math.min(paymentDay, maxDay);

  return setDate(paymentMonth, actualPaymentDay);
}

function getBillingClosingMonth(
  transactionDate: Date,
  startDay: number,
  endDay: number
): Date {
  const year = transactionDate.getFullYear();
  const month = transactionDate.getMonth();
  const day = transactionDate.getDate();

  if (endDay === 0 || startDay <= endDay) {
    // billing period within a single month (e.g., 1st~end, 1st~28th)
    const effectiveEnd =
      endDay === 0 ? getDaysInMonth(transactionDate) : endDay;

    if (day >= startDay && day <= effectiveEnd) {
      return startOfMonth(new Date(year, month, 1));
    }

    if (day < startDay) {
      return startOfMonth(new Date(year, month - 1, 1));
    }

    return startOfMonth(new Date(year, month + 1, 1));
  }

  // billing period spans two months (e.g., 16th~15th)
  // startDay > endDay means the period crosses a month boundary
  if (day >= startDay) {
    // in the first half of a billing period
    // closing month = next month
    return startOfMonth(new Date(year, month + 1, 1));
  }

  if (day <= endDay) {
    // in the second half of a billing period
    // closing month = current month
    return startOfMonth(new Date(year, month, 1));
  }

  // shouldn't reach here for valid billing periods
  return startOfMonth(new Date(year, month, 1));
}

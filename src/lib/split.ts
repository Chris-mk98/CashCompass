import { addMonths, startOfMonth } from "date-fns";
import { Decimal } from "@prisma/client/runtime/library";

export interface AllocationEntry {
  recognitionMonth: Date;
  amount: number;
  sortOrder: number;
}

export function createAllocations(
  totalAmount: number,
  splitCount: number,
  startMonth: Date
): AllocationEntry[] {
  const baseAmount = Math.floor((totalAmount * 100) / splitCount) / 100;
  const remainder =
    Math.round((totalAmount - baseAmount * splitCount) * 100) / 100;

  const allocations: AllocationEntry[] = [];
  const monthStart = startOfMonth(startMonth);

  for (let i = 0; i < splitCount; i++) {
    const amount = i === 0 ? baseAmount + remainder : baseAmount;
    allocations.push({
      recognitionMonth: addMonths(monthStart, i),
      amount,
      sortOrder: i + 1,
    });
  }

  return allocations;
}

export function recalculateAllocations(
  newTotal: number,
  existingAllocations: { recognitionMonth: Date; amount: number; sortOrder: number }[],
  fromSortOrder: number
): AllocationEntry[] {
  const kept = existingAllocations.filter((a) => a.sortOrder < fromSortOrder);
  const toUpdate = existingAllocations.filter(
    (a) => a.sortOrder >= fromSortOrder
  );

  const keptTotal = kept.reduce((sum, a) => sum + a.amount, 0);
  const remaining = Math.round((newTotal - keptTotal) * 100) / 100;
  const count = toUpdate.length;

  if (count === 0) return kept;

  const baseAmount = Math.floor((remaining * 100) / count) / 100;
  const remainder = Math.round((remaining - baseAmount * count) * 100) / 100;

  const updated = toUpdate.map((a, i) => ({
    ...a,
    amount: i === 0 ? baseAmount + remainder : baseAmount,
  }));

  return [...kept, ...updated];
}

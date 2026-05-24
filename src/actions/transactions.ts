"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "@/lib/validations/transaction";
import { createAllocations, recalculateAllocations } from "@/lib/split";
import { calculatePaymentDate } from "@/lib/payment-date";
import { startOfMonth } from "date-fns";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

async function resolvePaymentDate(
  transactionDate: Date,
  paymentMethodId: string | null | undefined,
  userId: string
): Promise<Date> {
  if (!paymentMethodId) return transactionDate;

  const pm = await prisma.paymentMethod.findFirst({
    where: { id: paymentMethodId, userId },
  });

  if (!pm || pm.type !== "credit_card" || !pm.billingStartDay || !pm.paymentDay) {
    return transactionDate;
  }

  return calculatePaymentDate(transactionDate, {
    billingStartDay: pm.billingStartDay,
    billingEndDay: pm.billingEndDay ?? 0,
    paymentDay: pm.paymentDay,
    paymentMonthOffset: pm.paymentMonthOffset ?? 1,
  });
}

export async function createTransaction(formData: FormData) {
  const userId = await getUserId();

  const raw = {
    type: formData.get("type"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    categoryId: formData.get("categoryId"),
    paymentMethodId: formData.get("paymentMethodId") || null,
    transactionDate: formData.get("transactionDate"),
    note: formData.get("note") || undefined,
    isSplit: formData.get("isSplit") === "true",
    splitCount: formData.get("splitCount") || null,
    splitStartMonth: formData.get("splitStartMonth") || null,
  };

  const parsed = createTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { isSplit, splitCount, splitStartMonth, ...txData } = parsed.data;

  const paymentDate = await resolvePaymentDate(
    txData.transactionDate,
    txData.paymentMethodId,
    userId
  );

  const isFuture = txData.transactionDate > new Date();

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: txData.type,
      amount: txData.amount,
      currency: txData.currency,
      categoryId: txData.categoryId,
      paymentMethodId: txData.paymentMethodId ?? null,
      transactionDate: txData.transactionDate,
      paymentDate,
      note: txData.note ?? null,
      isSplit: isSplit && !!splitCount,
      splitCount: isSplit ? splitCount : null,
      confirmedAt: isFuture ? null : new Date(),
    },
  });

  if (isSplit && splitCount && splitStartMonth) {
    const allocations = createAllocations(
      txData.amount,
      splitCount,
      splitStartMonth
    );
    await prisma.transactionAllocation.createMany({
      data: allocations.map((a) => ({
        transactionId: transaction.id,
        recognitionMonth: a.recognitionMonth,
        amount: a.amount,
        sortOrder: a.sortOrder,
      })),
    });
  } else {
    await prisma.transactionAllocation.create({
      data: {
        transactionId: transaction.id,
        recognitionMonth: startOfMonth(txData.transactionDate),
        amount: txData.amount,
        sortOrder: 1,
      },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { id: transaction.id };
}

export async function updateTransaction(formData: FormData) {
  const userId = await getUserId();

  const raw = {
    id: formData.get("id"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    categoryId: formData.get("categoryId"),
    paymentMethodId: formData.get("paymentMethodId") || null,
    transactionDate: formData.get("transactionDate"),
    note: formData.get("note") || undefined,
  };

  const parsed = updateTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await prisma.transaction.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!existing) return { error: "거래를 찾을 수 없습니다." };

  const paymentDate = await resolvePaymentDate(
    parsed.data.transactionDate,
    parsed.data.paymentMethodId,
    userId
  );

  await prisma.transaction.update({
    where: { id: parsed.data.id },
    data: {
      type: parsed.data.type,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      categoryId: parsed.data.categoryId,
      paymentMethodId: parsed.data.paymentMethodId ?? null,
      transactionDate: parsed.data.transactionDate,
      paymentDate,
      note: parsed.data.note ?? null,
    },
  });

  if (!existing.isSplit) {
    await prisma.transactionAllocation.updateMany({
      where: { transactionId: parsed.data.id },
      data: {
        recognitionMonth: startOfMonth(parsed.data.transactionDate),
        amount: parsed.data.amount,
      },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteTransaction(id: string) {
  const userId = await getUserId();

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!transaction) return { error: "거래를 찾을 수 없습니다." };

  await prisma.transaction.delete({ where: { id } });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return {};
}

export async function updateSplitAmount(
  transactionId: string,
  newTotal: number,
  mode: "all" | "future"
) {
  const userId = await getUserId();

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    include: { allocations: { orderBy: { sortOrder: "asc" } } },
  });
  if (!transaction) return { error: "거래를 찾을 수 없습니다." };
  if (!transaction.isSplit) return { error: "분할 거래가 아닙니다." };

  const fromSortOrder = mode === "all" ? 1 : (() => {
    const now = startOfMonth(new Date());
    const futureAlloc = transaction.allocations.find(
      (a) => a.recognitionMonth >= now
    );
    return futureAlloc?.sortOrder ?? transaction.allocations.length + 1;
  })();

  const existingAllocations = transaction.allocations.map((a) => ({
    recognitionMonth: a.recognitionMonth,
    amount: Number(a.amount),
    sortOrder: a.sortOrder,
  }));

  const updated = recalculateAllocations(newTotal, existingAllocations, fromSortOrder);

  await prisma.$transaction([
    prisma.transactionAllocation.deleteMany({
      where: { transactionId },
    }),
    prisma.transactionAllocation.createMany({
      data: updated.map((a) => ({
        transactionId,
        recognitionMonth: a.recognitionMonth,
        amount: a.amount,
        sortOrder: a.sortOrder,
      })),
    }),
    prisma.transaction.update({
      where: { id: transactionId },
      data: { amount: newTotal },
    }),
  ]);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return {};
}

export async function confirmPendingTransaction(id: string) {
  const userId = await getUserId();

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!transaction) return { error: "거래를 찾을 수 없습니다." };

  await prisma.transaction.update({
    where: { id },
    data: { confirmedAt: new Date() },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return {};
}

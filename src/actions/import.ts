"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { calculatePaymentDate } from "@/lib/payment-date";
import { createAllocations } from "@/lib/split";
import { revalidatePath } from "next/cache";
import type { ImportTransaction } from "@/lib/validations/import";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function bulkCreateTransactions(items: ImportTransaction[]) {
  if (items.length === 0) return { error: "No items to import" };

  const userId = await getUserId();

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId },
  });
  const pmMap = new Map(paymentMethods.map((pm) => [pm.id, pm]));

  let created = 0;

  for (const item of items) {
    const transactionDate = new Date(item.date);

    let paymentDate = transactionDate;
    if (item.paymentMethodId) {
      const pm = pmMap.get(item.paymentMethodId);
      if (
        pm &&
        pm.type === "credit_card" &&
        pm.billingStartDay &&
        pm.paymentDay
      ) {
        try {
          paymentDate = calculatePaymentDate(transactionDate, {
            billingStartDay: pm.billingStartDay,
            billingEndDay: pm.billingEndDay ?? 0,
            paymentDay: pm.paymentDay,
            paymentMonthOffset: pm.paymentMonthOffset ?? 1,
          });
        } catch {
          // fallback to transactionDate
        }
      }
    }

    const allocations = createAllocations(item.amount, 1, transactionDate);

    await prisma.transaction.create({
      data: {
        userId,
        type: item.type,
        amount: item.amount,
        currency: item.currency,
        categoryId: item.categoryId,
        paymentMethodId: item.paymentMethodId || null,
        transactionDate,
        paymentDate,
        note: item.description,
        isSplit: false,
        confirmedAt: new Date(),
        allocations: {
          create: allocations,
        },
      },
    });

    created++;
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true, count: created };
}

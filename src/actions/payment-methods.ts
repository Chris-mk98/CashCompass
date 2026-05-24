"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createPaymentMethodSchema } from "@/lib/validations/payment-method";
import { calculatePaymentDate } from "@/lib/payment-date";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function createPaymentMethod(formData: FormData) {
  const userId = await getUserId();

  const type = formData.get("type") as string;
  const raw: Record<string, unknown> = {
    type,
    name: formData.get("name"),
  };

  if (type === "credit_card") {
    raw.billingStartDay = formData.get("billingStartDay");
    raw.billingEndDay = formData.get("billingEndDay");
    raw.paymentDay = formData.get("paymentDay");
    raw.paymentMonthOffset = formData.get("paymentMonthOffset");
  }

  const parsed = createPaymentMethodSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const data = parsed.data;
  await prisma.paymentMethod.create({
    data: {
      userId,
      type: data.type,
      name: data.name,
      billingStartDay:
        data.type === "credit_card" ? data.billingStartDay : null,
      billingEndDay: data.type === "credit_card" ? data.billingEndDay : null,
      paymentDay: data.type === "credit_card" ? data.paymentDay : null,
      paymentMonthOffset:
        data.type === "credit_card" ? data.paymentMonthOffset : null,
    },
  });

  revalidatePath("/settings/payment-methods");
  return {};
}

export async function updatePaymentMethod(formData: FormData) {
  const userId = await getUserId();
  const id = formData.get("id") as string;

  const existing = await prisma.paymentMethod.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: "결제 수단을 찾을 수 없습니다." };

  const type = formData.get("type") as string;
  const raw: Record<string, unknown> = {
    id,
    type,
    name: formData.get("name"),
  };

  if (type === "credit_card") {
    raw.billingStartDay = formData.get("billingStartDay");
    raw.billingEndDay = formData.get("billingEndDay");
    raw.paymentDay = formData.get("paymentDay");
    raw.paymentMonthOffset = formData.get("paymentMonthOffset");
  }

  const parsed = createPaymentMethodSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const data = parsed.data;
  await prisma.paymentMethod.update({
    where: { id },
    data: {
      type: data.type,
      name: data.name,
      billingStartDay:
        data.type === "credit_card" ? data.billingStartDay : null,
      billingEndDay: data.type === "credit_card" ? data.billingEndDay : null,
      paymentDay: data.type === "credit_card" ? data.paymentDay : null,
      paymentMonthOffset:
        data.type === "credit_card" ? data.paymentMonthOffset : null,
    },
  });

  if (
    data.type === "credit_card" &&
    existing.type === "credit_card"
  ) {
    const billingChanged =
      existing.billingStartDay !== data.billingStartDay ||
      existing.billingEndDay !== data.billingEndDay ||
      existing.paymentDay !== data.paymentDay ||
      existing.paymentMonthOffset !== data.paymentMonthOffset;

    if (billingChanged) {
      const count = await recalculatePaymentDates(id, data);
      revalidatePath("/settings/payment-methods");
      revalidatePath("/transactions");
      revalidatePath("/dashboard");
      return { recalculatedCount: count };
    }
  }

  revalidatePath("/settings/payment-methods");
  return {};
}

async function recalculatePaymentDates(
  paymentMethodId: string,
  card: {
    billingStartDay: number;
    billingEndDay: number;
    paymentDay: number;
    paymentMonthOffset: number;
  }
): Promise<number> {
  const transactions = await prisma.transaction.findMany({
    where: { paymentMethodId },
    select: { id: true, transactionDate: true },
  });

  let count = 0;
  for (const tx of transactions) {
    const newPaymentDate = calculatePaymentDate(tx.transactionDate, card);
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { paymentDate: newPaymentDate },
    });
    count++;
  }

  return count;
}

export async function deletePaymentMethod(id: string) {
  const userId = await getUserId();

  const pm = await prisma.paymentMethod.findFirst({
    where: { id, userId },
  });
  if (!pm) return { error: "결제 수단을 찾을 수 없습니다." };

  await prisma.paymentMethod.delete({ where: { id } });

  revalidatePath("/settings/payment-methods");
  revalidatePath("/transactions");
  return {};
}

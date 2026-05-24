"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { setBudgetSchema, deleteBudgetSchema } from "@/lib/validations/budget";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function setBudget(formData: FormData) {
  const userId = await getUserId();

  const parsed = setBudgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    monthlyLimit: formData.get("monthlyLimit"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { categoryId, monthlyLimit, currency } = parsed.data;

  await prisma.budget.upsert({
    where: { userId_categoryId: { userId, categoryId } },
    update: { monthlyLimit, currency },
    create: { userId, categoryId, monthlyLimit, currency },
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudget(formData: FormData) {
  const userId = await getUserId();

  const parsed = deleteBudgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.budget.deleteMany({
    where: { userId, categoryId: parsed.data.categoryId },
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

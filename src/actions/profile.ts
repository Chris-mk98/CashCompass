"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { userId: user.id, supabase };
}

const updateCurrencySchema = z.object({
  currency: z.string().length(3),
});

export async function updateDefaultCurrency(formData: FormData) {
  const { userId } = await getUser();

  const parsed = updateCurrencySchema.safeParse({
    currency: formData.get("currency"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.profile.update({
    where: { id: userId },
    data: { defaultCurrency: parsed.data.currency },
  });

  revalidatePath("/settings/account");
  revalidatePath("/dashboard");
  return { success: true };
}

const updatePasswordSchema = z
  .object({
    newPassword: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function updatePassword(formData: FormData) {
  const { supabase } = await getUser();

  const parsed = updatePasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) return { error: error.message };
  return { success: true };
}

const updateLanguageSchema = z.object({
  language: z.enum(["ko", "en"]),
});

export async function updateLanguage(formData: FormData) {
  const { userId } = await getUser();

  const parsed = updateLanguageSchema.safeParse({
    language: formData.get("language"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.profile.update({
    where: { id: userId },
    data: { language: parsed.data.language },
  });

  revalidatePath("/settings/account");
  return { success: true };
}

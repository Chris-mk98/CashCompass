"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { userId: user.id, supabase };
}

export async function uploadReceipt(transactionId: string, formData: FormData) {
  const { userId, supabase } = await getUserId();

  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });
  if (!tx) return { error: "Transaction not found" };

  const file = formData.get("receipt") as File | null;
  if (!file) return { error: "No file provided" };

  if (file.size > MAX_FILE_SIZE) return { error: "File too large (max 5MB)" };
  if (!ALLOWED_TYPES.includes(file.type))
    return { error: "Invalid file type. JPG, PNG, HEIC only." };

  if (tx.receiptPath) {
    await supabase.storage.from("receipts").remove([tx.receiptPath]);
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${transactionId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { receiptPath: path },
  });

  revalidatePath("/transactions");
  return { success: true, path };
}

export async function deleteReceipt(transactionId: string) {
  const { userId, supabase } = await getUserId();

  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });
  if (!tx) return { error: "Transaction not found" };
  if (!tx.receiptPath) return { error: "No receipt to delete" };

  await supabase.storage.from("receipts").remove([tx.receiptPath]);

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { receiptPath: null },
  });

  revalidatePath("/transactions");
  return { success: true };
}

export async function getReceiptUrl(receiptPath: string) {
  const { supabase } = await getUserId();

  const { data } = await supabase.storage
    .from("receipts")
    .createSignedUrl(receiptPath, 3600);

  return data?.signedUrl ?? null;
}

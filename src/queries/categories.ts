import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getVisibleCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.category.findMany({
    where: { userId: user.id, isHidden: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

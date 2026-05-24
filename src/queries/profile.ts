import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.profile.findUnique({
    where: { id: user.id },
  });
}

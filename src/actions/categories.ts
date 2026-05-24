"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createCategorySchema,
  renameCategorySchema,
} from "@/lib/validations/category";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function createCategory(formData: FormData) {
  const userId = await getUserId();

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const maxSort = await prisma.category.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });

  await prisma.category.create({
    data: {
      userId,
      name: parsed.data.name,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/settings/categories");
  return {};
}

export async function renameCategory(formData: FormData) {
  const userId = await getUserId();

  const parsed = renameCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!category) return { error: "카테고리를 찾을 수 없습니다." };

  await prisma.category.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/settings/categories");
  return {};
}

export async function deleteCategory(id: string) {
  const userId = await getUserId();

  const category = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!category) return { error: "카테고리를 찾을 수 없습니다." };
  if (category.isDefault) return { error: "기본 카테고리는 삭제할 수 없습니다." };

  const etcCategory = await prisma.category.findFirst({
    where: { userId, name: "기타", isDefault: true },
  });
  if (!etcCategory) return { error: "'기타' 카테고리를 찾을 수 없습니다." };

  const movedCount = await prisma.transaction.count({
    where: { categoryId: id, userId },
  });

  await prisma.$transaction([
    prisma.transaction.updateMany({
      where: { categoryId: id, userId },
      data: { categoryId: etcCategory.id },
    }),
    prisma.category.delete({ where: { id } }),
  ]);

  revalidatePath("/settings/categories");
  return { movedCount };
}

export async function toggleCategoryVisibility(id: string) {
  const userId = await getUserId();

  const category = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!category) return { error: "카테고리를 찾을 수 없습니다." };

  await prisma.category.update({
    where: { id },
    data: { isHidden: !category.isHidden },
  });

  revalidatePath("/settings/categories");
  return {};
}

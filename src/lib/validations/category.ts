import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "카테고리 이름을 입력하세요").max(50),
});

export const renameCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "카테고리 이름을 입력하세요").max(50),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;

import { z } from "zod";

export const setBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  monthlyLimit: z.coerce.number().positive(),
  currency: z.string().length(3),
});

export const deleteBudgetSchema = z.object({
  categoryId: z.string().uuid(),
});

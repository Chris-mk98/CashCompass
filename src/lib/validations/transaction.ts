import { z } from "zod";

export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("금액은 0보다 커야 합니다"),
  currency: z.string().length(3),
  categoryId: z.string().uuid(),
  paymentMethodId: z.string().uuid().nullable().optional(),
  transactionDate: z.coerce.date(),
  note: z.string().max(500).optional(),
  isSplit: z.boolean().default(false),
  splitCount: z.coerce.number().int().min(2).max(60).nullable().optional(),
  splitStartMonth: z.coerce.date().nullable().optional(),
});

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("금액은 0보다 커야 합니다"),
  currency: z.string().length(3),
  categoryId: z.string().uuid(),
  paymentMethodId: z.string().uuid().nullable().optional(),
  transactionDate: z.coerce.date(),
  note: z.string().max(500).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

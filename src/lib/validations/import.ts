import { z } from "zod";

export const extractedTransactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.coerce.number().positive(),
  type: z.enum(["income", "expense"]),
  currency: z.string().length(3),
  confidence: z.enum(["high", "low"]),
});

export const importTransactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.coerce.number().positive(),
  type: z.enum(["income", "expense"]),
  currency: z.string().length(3),
  categoryId: z.string().uuid(),
  paymentMethodId: z.string().uuid().optional(),
});

export type ExtractedTransaction = z.infer<typeof extractedTransactionSchema>;
export type ImportTransaction = z.infer<typeof importTransactionSchema>;

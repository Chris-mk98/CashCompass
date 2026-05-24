import { z } from "zod";

export const createPaymentMethodSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("credit_card"),
    name: z.string().min(1, "이름을 입력하세요").max(100),
    billingStartDay: z.coerce.number().int().min(1).max(31),
    billingEndDay: z.coerce.number().int().min(0).max(31),
    paymentDay: z.coerce.number().int().min(1).max(31),
    paymentMonthOffset: z.coerce.number().int().min(0).max(2),
  }),
  z.object({
    type: z.literal("bank_account"),
    name: z.string().min(1, "이름을 입력하세요").max(100),
  }),
]);

export const updatePaymentMethodSchema = z.intersection(
  z.object({ id: z.string().uuid() }),
  createPaymentMethodSchema
);

export type CreatePaymentMethodInput = z.infer<
  typeof createPaymentMethodSchema
>;
export type UpdatePaymentMethodInput = z.infer<
  typeof updatePaymentMethodSchema
>;

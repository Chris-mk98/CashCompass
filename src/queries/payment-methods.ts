import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function getPaymentMethods() {
  const userId = await getUserId();

  return prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export interface PaymentMethodWithUsage {
  id: string;
  type: string;
  name: string;
  billingStartDay: number | null;
  billingEndDay: number | null;
  paymentDay: number | null;
  paymentMonthOffset: number | null;
  currentMonthUsage: number;
  currency: string;
}

export async function getPaymentMethodsWithUsage(): Promise<
  PaymentMethodWithUsage[]
> {
  const userId = await getUserId();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const methods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const usageRows = await prisma.$queryRaw<
    { payment_method_id: string; total: number; currency: string }[]
  >`
    SELECT payment_method_id, COALESCE(SUM(amount), 0)::float AS total, currency
    FROM transactions
    WHERE user_id = ${userId}::uuid
      AND payment_method_id IS NOT NULL
      AND type = 'expense'
      AND transaction_date >= ${monthStart}
      AND transaction_date < ${monthEnd}
    GROUP BY payment_method_id, currency
  `;

  const usageMap = new Map<string, { total: number; currency: string }>();
  for (const row of usageRows) {
    usageMap.set(row.payment_method_id, {
      total: row.total,
      currency: row.currency,
    });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { defaultCurrency: true },
  });

  return methods.map((m) => {
    const usage = usageMap.get(m.id);
    return {
      id: m.id,
      type: m.type,
      name: m.name,
      billingStartDay: m.billingStartDay,
      billingEndDay: m.billingEndDay,
      paymentDay: m.paymentDay,
      paymentMonthOffset: m.paymentMonthOffset,
      currentMonthUsage: usage?.total ?? 0,
      currency: usage?.currency ?? profile?.defaultCurrency ?? "KRW",
    };
  });
}

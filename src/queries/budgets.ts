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

export interface BudgetWithUsage {
  categoryId: string;
  categoryName: string;
  monthlyLimit: number;
  currency: string;
  spent: number;
  usagePercent: number;
}

export async function getBudgetsWithUsage(
  year: number,
  month: number
): Promise<BudgetWithUsage[]> {
  const userId = await getUserId();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: { select: { id: true, name: true } } },
  });

  if (budgets.length === 0) return [];

  const spendingRows = await prisma.$queryRaw<
    { categoryId: string; spent: number }[]
  >`
    SELECT
      t.category_id AS "categoryId",
      COALESCE(SUM(a.amount), 0)::float AS spent
    FROM transaction_allocations a
    JOIN transactions t ON t.id = a.transaction_id
    WHERE t.user_id = ${userId}::uuid
      AND t.type = 'expense'
      AND a.recognition_month >= ${monthStart}
      AND a.recognition_month < ${monthEnd}
      AND t.category_id = ANY(${budgets.map((b) => b.categoryId)}::uuid[])
    GROUP BY t.category_id
  `;

  const spendingMap = new Map(spendingRows.map((r) => [r.categoryId, r.spent]));

  return budgets.map((b) => {
    const limit = Number(b.monthlyLimit);
    const spent = spendingMap.get(b.categoryId) ?? 0;
    return {
      categoryId: b.categoryId,
      categoryName: b.category.name,
      monthlyLimit: limit,
      currency: b.currency,
      spent,
      usagePercent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
    };
  });
}

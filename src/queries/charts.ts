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

export interface CategorySpendingData {
  categoryId: string;
  categoryName: string;
  amount: number;
  currency: string;
}

export async function getSpendingByCategory(
  year: number,
  month: number,
  view: "accrual" | "cash" = "accrual"
): Promise<CategorySpendingData[]> {
  const userId = await getUserId();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  if (view === "cash") {
    return prisma.$queryRaw<CategorySpendingData[]>`
      SELECT
        c.id AS "categoryId",
        c.name AS "categoryName",
        COALESCE(SUM(t.amount), 0)::float AS amount,
        t.currency
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ${userId}::uuid
        AND t.type = 'expense'
        AND t.payment_date >= ${monthStart}
        AND t.payment_date < ${monthEnd}
      GROUP BY c.id, c.name, t.currency
      ORDER BY amount DESC
    `;
  }

  return prisma.$queryRaw<CategorySpendingData[]>`
    SELECT
      c.id AS "categoryId",
      c.name AS "categoryName",
      COALESCE(SUM(a.amount), 0)::float AS amount,
      t.currency
    FROM transaction_allocations a
    JOIN transactions t ON t.id = a.transaction_id
    JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = ${userId}::uuid
      AND t.type = 'expense'
      AND a.recognition_month >= ${monthStart}
      AND a.recognition_month < ${monthEnd}
    GROUP BY c.id, c.name, t.currency
    ORDER BY amount DESC
  `;
}

export interface MonthlyTrendData {
  month: string;
  income: number;
  expense: number;
}

export async function getMonthlyTrend(
  year: number,
  month: number,
  view: "accrual" | "cash" = "accrual"
): Promise<MonthlyTrendData[]> {
  const userId = await getUserId();
  const endDate = new Date(year, month, 1);
  const startDate = new Date(year, month - 6, 1);

  let rows: { month: string; type: string; total: number }[];

  if (view === "cash") {
    rows = await prisma.$queryRaw<typeof rows>`
      SELECT
        TO_CHAR(payment_date, 'YYYY-MM') AS month,
        type,
        COALESCE(SUM(amount), 0)::float AS total
      FROM transactions
      WHERE user_id = ${userId}::uuid
        AND payment_date >= ${startDate}
        AND payment_date < ${endDate}
      GROUP BY TO_CHAR(payment_date, 'YYYY-MM'), type
      ORDER BY month
    `;
  } else {
    rows = await prisma.$queryRaw<typeof rows>`
      SELECT
        TO_CHAR(a.recognition_month, 'YYYY-MM') AS month,
        t.type,
        COALESCE(SUM(a.amount), 0)::float AS total
      FROM transaction_allocations a
      JOIN transactions t ON t.id = a.transaction_id
      WHERE t.user_id = ${userId}::uuid
        AND a.recognition_month >= ${startDate}
        AND a.recognition_month < ${endDate}
      GROUP BY TO_CHAR(a.recognition_month, 'YYYY-MM'), t.type
      ORDER BY month
    `;
  }

  const map = new Map<string, { income: number; expense: number }>();
  for (let i = -5; i <= 0; i++) {
    const d = new Date(year, month - 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, { income: 0, expense: 0 });
  }

  for (const row of rows) {
    const entry = map.get(row.month);
    if (!entry) continue;
    if (row.type === "income") entry.income = row.total;
    else entry.expense = row.total;
  }

  return Array.from(map.entries()).map(([month, data]) => ({
    month,
    income: Math.round(data.income),
    expense: Math.round(data.expense),
  }));
}

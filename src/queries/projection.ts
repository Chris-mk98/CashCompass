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

export interface MonthlyProjection {
  month: string; // "2026-01"
  income: number;
  expense: number;
  net: number;
  cumulativeBalance: number;
  isActual: boolean;
}

export async function getCashFlowProjection(
  view: "accrual" | "cash" = "accrual"
): Promise<MonthlyProjection[]> {
  const userId = await getUserId();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based

  const startDate = new Date(currentYear, currentMonth - 5, 1); // 6 months back
  const endDate = new Date(currentYear, currentMonth + 7, 1); // 6 months forward

  let rows: { month: string; type: string; total: number }[];

  if (view === "cash") {
    rows = await prisma.$queryRaw<
      { month: string; type: string; total: number }[]
    >`
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
    rows = await prisma.$queryRaw<
      { month: string; type: string; total: number }[]
    >`
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

  const dataMap = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const entry = dataMap.get(row.month) ?? { income: 0, expense: 0 };
    if (row.type === "income") entry.income = row.total;
    else entry.expense = row.total;
    dataMap.set(row.month, entry);
  }

  const months: MonthlyProjection[] = [];
  let cumulative = 0;
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  for (let i = -5; i <= 6; i++) {
    const d = new Date(currentYear, currentMonth + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = dataMap.get(key) ?? { income: 0, expense: 0 };
    const net = entry.income - entry.expense;
    cumulative += net;

    months.push({
      month: key,
      income: Math.round(entry.income),
      expense: Math.round(entry.expense),
      net: Math.round(net),
      cumulativeBalance: Math.round(cumulative),
      isActual: key <= currentMonthStr,
    });
  }

  return months;
}

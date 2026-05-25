import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export interface ViewSummary {
  income: { currency: string; amount: number }[];
  expense: { currency: string; amount: number }[];
  balance: { currency: string; amount: number }[];
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  currency: string;
  spent: number;
  budgetLimit: number | null;
  usagePercent: number | null;
}

export interface PendingTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  categoryName: string;
  transactionDate: Date;
  note: string | null;
}

export interface DashboardData {
  accrual: ViewSummary;
  cash: ViewSummary;
  categorySpending: CategorySpending[];
  budgetAlerts: CategorySpending[];
  pendingTransactions: PendingTransaction[];
}

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

function aggregateByCurrency(
  items: { currency: string; type: string; total: number }[]
): ViewSummary {
  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();

  for (const item of items) {
    const map = item.type === "income" ? incomeMap : expenseMap;
    map.set(item.currency, (map.get(item.currency) ?? 0) + item.total);
  }

  const currencies = new Set([...incomeMap.keys(), ...expenseMap.keys()]);
  const income: ViewSummary["income"] = [];
  const expense: ViewSummary["expense"] = [];
  const balance: ViewSummary["balance"] = [];

  for (const cur of currencies) {
    const inc = incomeMap.get(cur) ?? 0;
    const exp = expenseMap.get(cur) ?? 0;
    income.push({ currency: cur, amount: inc });
    expense.push({ currency: cur, amount: exp });
    balance.push({ currency: cur, amount: inc - exp });
  }

  return { income, expense, balance };
}

export async function getDashboardSummary(
  year: number,
  month: number
): Promise<DashboardData> {
  const userId = await getUserId();
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  const [accrualData, cashData, categoryData, budgets, pending] =
    await Promise.all([
      getAccrualSummary(userId, monthStart, monthEnd),
      getCashSummary(userId, monthStart, monthEnd),
      getCategorySpending(userId, monthStart, monthEnd),
      prisma.budget.findMany({
        where: { userId },
        include: { category: { select: { name: true } } },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          confirmedAt: null,
          transactionDate: { lt: new Date() },
        },
        include: {
          category: { select: { name: true } },
        },
        orderBy: { transactionDate: "asc" },
        take: 20,
      }),
    ]);

  const budgetMap = new Map(
    budgets.map((b) => [b.categoryId, Number(b.monthlyLimit)])
  );

  const categorySpending: CategorySpending[] = categoryData.map((c) => {
    const limit = budgetMap.get(c.categoryId) ?? null;
    return {
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      currency: c.currency,
      spent: c.spent,
      budgetLimit: limit,
      usagePercent: limit ? Math.round((c.spent / limit) * 100) : null,
    };
  });

  const budgetAlerts = categorySpending.filter(
    (c) => c.usagePercent !== null && c.usagePercent >= 80
  );

  const pendingTransactions: PendingTransaction[] = pending.map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    currency: t.currency,
    categoryName: t.category.name,
    transactionDate: t.transactionDate,
    note: t.note,
  }));

  return {
    accrual: aggregateByCurrency(accrualData),
    cash: aggregateByCurrency(cashData),
    categorySpending,
    budgetAlerts,
    pendingTransactions,
  };
}

async function getAccrualSummary(
  userId: string,
  monthStart: Date,
  monthEnd: Date
) {
  const rows = await prisma.$queryRaw<
    { currency: string; type: string; total: number }[]
  >`
    SELECT t.currency, t.type, COALESCE(SUM(a.amount), 0)::float AS total
    FROM transaction_allocations a
    JOIN transactions t ON t.id = a.transaction_id
    WHERE t.user_id = ${userId}::uuid
      AND a.recognition_month >= ${monthStart}
      AND a.recognition_month < ${monthEnd}
    GROUP BY t.currency, t.type
  `;
  return rows;
}

async function getCashSummary(
  userId: string,
  monthStart: Date,
  monthEnd: Date
) {
  const rows = await prisma.$queryRaw<
    { currency: string; type: string; total: number }[]
  >`
    SELECT currency, type, COALESCE(SUM(amount), 0)::float AS total
    FROM transactions
    WHERE user_id = ${userId}::uuid
      AND payment_date >= ${monthStart}
      AND payment_date < ${monthEnd}
    GROUP BY currency, type
  `;
  return rows;
}

async function getCategorySpending(
  userId: string,
  monthStart: Date,
  monthEnd: Date
) {
  const rows = await prisma.$queryRaw<
    {
      categoryId: string;
      categoryName: string;
      currency: string;
      spent: number;
    }[]
  >`
    SELECT
      c.id AS "categoryId",
      c.name AS "categoryName",
      t.currency,
      COALESCE(SUM(a.amount), 0)::float AS spent
    FROM transaction_allocations a
    JOIN transactions t ON t.id = a.transaction_id
    JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = ${userId}::uuid
      AND t.type = 'expense'
      AND a.recognition_month >= ${monthStart}
      AND a.recognition_month < ${monthEnd}
    GROUP BY c.id, c.name, t.currency
    ORDER BY spent DESC
  `;
  return rows;
}

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

export async function getTransactions(params: {
  year: number;
  month: number;
  page?: number;
  pageSize?: number;
  categoryId?: string;
  paymentMethodId?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  view?: "accrual" | "cash";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const {
    year,
    month,
    page = 1,
    pageSize = 50,
    categoryId,
    paymentMethodId,
    amountMin,
    amountMax,
    search,
    view = "accrual",
  } = params;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const where: Prisma.TransactionWhereInput = {
    userId: user.id,
  };

  if (view === "cash") {
    where.paymentDate = { gte: startDate, lt: endDate };
  } else {
    where.transactionDate = { gte: startDate, lt: endDate };
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (paymentMethodId) {
    where.paymentMethodId = paymentMethodId;
  }

  if (amountMin !== undefined || amountMax !== undefined) {
    const amountFilter: Record<string, number> = {};
    if (amountMin !== undefined) amountFilter.gte = amountMin;
    if (amountMax !== undefined) amountFilter.lte = amountMax;
    where.amount = amountFilter;
  }

  if (search) {
    where.OR = [
      { note: { contains: search, mode: "insensitive" } },
      { category: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    view === "cash"
      ? { paymentDate: "desc" }
      : { transactionDate: "desc" };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true, type: true } },
        allocations: { orderBy: { sortOrder: "asc" } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, pageSize };
}

export async function getTransactionById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.transaction.findFirst({
    where: { id, userId: user.id },
    include: {
      category: { select: { id: true, name: true } },
      paymentMethod: { select: { id: true, name: true, type: true } },
      allocations: { orderBy: { sortOrder: "asc" } },
    },
  });
}

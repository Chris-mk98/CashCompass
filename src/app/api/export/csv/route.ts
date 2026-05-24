import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const startYear = Number(sp.get("startYear") || new Date().getFullYear());
  const startMonth = Number(sp.get("startMonth") || 1);
  const endYear = Number(sp.get("endYear") || new Date().getFullYear());
  const endMonth = Number(sp.get("endMonth") || 12);
  const categoryId = sp.get("category") || undefined;

  const startDate = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(endYear, endMonth, 1);

  const where: Record<string, unknown> = {
    userId: user.id,
    transactionDate: { gte: startDate, lt: endDate },
  };
  if (categoryId) where.categoryId = categoryId;

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: { select: { name: true } },
      paymentMethod: { select: { name: true } },
      allocations: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { transactionDate: "asc" },
  });

  const BOM = "﻿";
  const header =
    "날짜,유형,금액,통화,카테고리,귀속 월,결제 수단,결제일,메모";
  const rows = transactions.flatMap((tx) => {
    const base = [
      format(tx.transactionDate, "yyyy-MM-dd"),
      tx.type,
      Number(tx.amount),
      tx.currency,
      tx.category.name,
    ];
    const pm = tx.paymentMethod?.name ?? "";
    const pd = format(tx.paymentDate, "yyyy-MM-dd");
    const note = (tx.note ?? "").replace(/"/g, '""');

    if (tx.allocations.length > 0) {
      return tx.allocations.map((a) => [
        ...base,
        format(a.recognitionMonth, "yyyy-MM"),
        pm,
        pd,
        `"${note}"`,
      ].join(","));
    }

    return [[
      ...base,
      format(tx.transactionDate, "yyyy-MM"),
      pm,
      pd,
      `"${note}"`,
    ].join(",")];
  });

  const csv = BOM + header + "\n" + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cashcompass_${startYear}${String(startMonth).padStart(2, "0")}-${endYear}${String(endMonth).padStart(2, "0")}.csv"`,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const year = Number(sp.get("year") || new Date().getFullYear());
  const month = Number(sp.get("month") || new Date().getMonth() + 1);

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const [transactions, accrualSummary, cashSummary] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        transactionDate: { gte: monthStart, lt: monthEnd },
      },
      include: {
        category: { select: { name: true } },
        paymentMethod: { select: { name: true } },
      },
      orderBy: { transactionDate: "asc" },
    }),
    prisma.$queryRaw<{ type: string; currency: string; total: number }[]>`
      SELECT t.type, t.currency, COALESCE(SUM(a.amount), 0)::float AS total
      FROM transaction_allocations a
      JOIN transactions t ON t.id = a.transaction_id
      WHERE t.user_id = ${user.id}::uuid
        AND a.recognition_month >= ${monthStart}
        AND a.recognition_month < ${monthEnd}
      GROUP BY t.type, t.currency
    `,
    prisma.$queryRaw<{ type: string; currency: string; total: number }[]>`
      SELECT type, currency, COALESCE(SUM(amount), 0)::float AS total
      FROM transactions
      WHERE user_id = ${user.id}::uuid
        AND payment_date >= ${monthStart}
        AND payment_date < ${monthEnd}
      GROUP BY type, currency
    `,
  ]);

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(`CashCompass - ${year}-${String(month).padStart(2, "0")}`, 14, 20);

  let y = 35;

  doc.setFontSize(12);
  doc.text("Accrual Summary", 14, y);
  y += 7;
  for (const row of accrualSummary) {
    doc.setFontSize(10);
    doc.text(
      `${row.type}: ${Number(row.total).toLocaleString()} ${row.currency}`,
      20,
      y
    );
    y += 6;
  }

  y += 5;
  doc.setFontSize(12);
  doc.text("Cash Summary", 14, y);
  y += 7;
  for (const row of cashSummary) {
    doc.setFontSize(10);
    doc.text(
      `${row.type}: ${Number(row.total).toLocaleString()} ${row.currency}`,
      20,
      y
    );
    y += 6;
  }

  y += 10;

  const tableData = transactions.map((tx) => [
    format(tx.transactionDate, "yyyy-MM-dd"),
    tx.type,
    Number(tx.amount).toLocaleString(),
    tx.currency,
    tx.category.name,
    tx.paymentMethod?.name ?? "-",
    format(tx.paymentDate, "yyyy-MM-dd"),
    tx.note ?? "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Date",
        "Type",
        "Amount",
        "Currency",
        "Category",
        "Payment Method",
        "Payment Date",
        "Note",
      ],
    ],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cashcompass_${year}${String(month).padStart(2, "0")}.pdf"`,
    },
  });
}

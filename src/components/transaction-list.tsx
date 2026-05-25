"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionDetail } from "@/components/transaction-detail";
import { format } from "date-fns";
import { Clock, Split } from "lucide-react";

type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    category: { select: { id: true; name: true } };
    paymentMethod: { select: { id: true; name: true; type: true } };
    allocations: true;
  };
}>;

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  currency: string;
  view?: "accrual" | "cash";
  year?: number;
  month?: number;
}

export function TransactionList({
  transactions,
  currency,
  view = "accrual",
  year,
  month,
}: TransactionListProps) {
  const t = useTranslations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = transactions.find((tx) => tx.id === selectedId) ?? null;

  const getDisplayAmount = (tx: TransactionWithRelations): Prisma.Decimal => {
    if (view === "accrual" && tx.isSplit && year && month) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 1);
      const alloc = tx.allocations.find((a) => {
        const rm = new Date(a.recognitionMonth);
        return rm >= monthStart && rm < monthEnd;
      });
      if (alloc) return alloc.amount;
    }
    return tx.amount;
  };

  const formatAmount = (amount: Prisma.Decimal, type: string, cur: string) => {
    const value = Number(amount);
    const formatted = new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: cur === "KRW" ? 0 : 2,
    }).format(value);
    return type === "income" ? `+${formatted}` : `-${formatted}`;
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("transaction.noTransactions")}
        </CardContent>
      </Card>
    );
  }

  const grouped = transactions.reduce(
    (acc, tx) => {
      const dateKey = format(tx.transactionDate, "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(tx);
      return acc;
    },
    {} as Record<string, TransactionWithRelations[]>
  );

  return (
    <>
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              {format(new Date(date), "MM/dd (EEE)")}
            </p>
            <Card>
              <CardContent className="divide-y p-0">
                {txs.map((tx) => (
                  <button
                    key={tx.id}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
                    onClick={() => setSelectedId(tx.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {tx.note || tx.category.name}
                          </span>
                          {tx.isSplit && (
                            <Split className="h-3 w-3 text-muted-foreground" />
                          )}
                          {!tx.confirmedAt && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              {t("transaction.pending")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tx.category.name}
                          {tx.paymentMethod && ` · ${tx.paymentMethod.name}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold whitespace-nowrap ${
                        tx.type === "income"
                          ? "text-blue-600"
                          : "text-foreground"
                      }`}
                    >
                      {formatAmount(getDisplayAmount(tx), tx.type, tx.currency)}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <TransactionDetail
        transaction={selected}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

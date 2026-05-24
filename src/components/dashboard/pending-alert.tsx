"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingConfirmDialog } from "@/components/pending-confirm-dialog";
import type { PendingTransaction } from "@/queries/dashboard";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(amount);
}

export function PendingAlert({
  transactions,
}: {
  transactions: PendingTransaction[];
}) {
  const t = useTranslations("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (transactions.length === 0) return null;

  const selected = transactions.find((tx) => tx.id === selectedId) ?? null;

  return (
    <>
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
        <div className="mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium">
            {t("pendingCount", { count: transactions.length })}
          </span>
        </div>
        <div className="space-y-1">
          {transactions.map((tx) => (
            <Button
              key={tx.id}
              variant="ghost"
              className="h-auto w-full justify-between px-2 py-1.5 text-sm"
              onClick={() => setSelectedId(tx.id)}
            >
              <span className="truncate">
                {tx.note || tx.categoryName}
              </span>
              <span className="shrink-0 font-medium">
                {tx.type === "income" ? "+" : "-"}
                {formatCurrency(tx.amount, tx.currency)}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <PendingConfirmDialog
        transaction={selected}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import type { CategorySpending } from "@/queries/dashboard";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(amount);
}

export function BudgetAlerts({ alerts }: { alerts: CategorySpending[] }) {
  const t = useTranslations("dashboard");

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const isOver = (alert.usagePercent ?? 0) >= 100;
        return (
          <div
            key={`${alert.categoryId}-${alert.currency}`}
            className={`flex items-center gap-3 rounded-lg border p-3 ${
              isOver
                ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 shrink-0 ${
                isOver ? "text-red-600" : "text-yellow-600"
              }`}
            />
            <div className="flex-1 text-sm">
              <span className="font-medium">{alert.categoryName}</span>
              <span className="text-muted-foreground">
                {" "}
                — {formatCurrency(alert.spent, alert.currency)} /{" "}
                {formatCurrency(alert.budgetLimit!, alert.currency)} (
                {alert.usagePercent}%)
              </span>
            </div>
            <span
              className={`text-xs font-medium ${
                isOver ? "text-red-600" : "text-yellow-600"
              }`}
            >
              {isOver ? t("budgetOver") : t("budgetWarning")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

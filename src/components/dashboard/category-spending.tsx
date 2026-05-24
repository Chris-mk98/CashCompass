"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CategorySpending as CategorySpendingType } from "@/queries/dashboard";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(amount);
}

function getProgressColor(percent: number | null): string {
  if (percent === null) return "";
  if (percent >= 100) return "[&>div]:bg-red-500";
  if (percent >= 80) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-blue-500";
}

export function CategorySpendingCard({
  items,
}: {
  items: CategorySpendingType[];
}) {
  const t = useTranslations("dashboard");

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("categorySpending")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={`${item.categoryId}-${item.currency}`} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{item.categoryName}</span>
              <span className="font-medium">
                {formatCurrency(item.spent, item.currency)}
                {item.budgetLimit !== null && (
                  <span className="text-muted-foreground">
                    {" "}
                    / {formatCurrency(item.budgetLimit, item.currency)}
                  </span>
                )}
              </span>
            </div>
            {item.usagePercent !== null && (
              <Progress
                value={Math.min(item.usagePercent, 100)}
                className={`h-2 ${getProgressColor(item.usagePercent)}`}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

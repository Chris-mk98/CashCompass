"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Category } from "@prisma/client";
import type { BudgetWithUsage } from "@/queries/budgets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetEditInline } from "@/components/budget/budget-edit-inline";
import { cn } from "@/lib/utils";

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency }).format(
    amount
  );
}

function progressColor(percent: number) {
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-yellow-500";
  return "bg-blue-500";
}

function statusLabel(percent: number, t: (key: string) => string) {
  if (percent >= 100) return t("budget.over");
  if (percent >= 80) return t("dashboard.budgetWarning");
  return null;
}

interface BudgetListProps {
  budgets: BudgetWithUsage[];
  categories: Category[];
  defaultCurrency: string;
}

export function BudgetList({
  budgets,
  categories,
  defaultCurrency,
}: BudgetListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );

  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b]));
  const unbudgeted = categories.filter(
    (c) => !c.isHidden && !budgetMap.has(c.id)
  );

  function handleDone() {
    setEditingCategoryId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("budget.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgets.map((b) => {
              if (editingCategoryId === b.categoryId) {
                return (
                  <BudgetEditInline
                    key={b.categoryId}
                    categoryId={b.categoryId}
                    categoryName={b.categoryName}
                    currentLimit={b.monthlyLimit}
                    currency={b.currency}
                    onDone={handleDone}
                  />
                );
              }

              const cappedPercent = Math.min(b.usagePercent, 100);
              const label = statusLabel(b.usagePercent, t);
              const remaining = b.monthlyLimit - b.spent;

              return (
                <div key={b.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.categoryName}</span>
                    <div className="flex items-center gap-2">
                      {label && (
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            b.usagePercent >= 100
                              ? "text-red-500"
                              : "text-yellow-600"
                          )}
                        >
                          {label}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {formatAmount(b.spent, b.currency)} /{" "}
                        {formatAmount(b.monthlyLimit, b.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        progressColor(b.usagePercent)
                      )}
                      style={{ width: `${cappedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {t("budget.usage")}: {b.usagePercent}%
                    </span>
                    <div className="flex items-center gap-2">
                      <span>
                        {remaining >= 0
                          ? `${t("budget.remaining")}: ${formatAmount(remaining, b.currency)}`
                          : `${t("budget.over")}: ${formatAmount(Math.abs(remaining), b.currency)}`}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => setEditingCategoryId(b.categoryId)}
                      >
                        {t("common.edit")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {unbudgeted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("budget.unbudgeted")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unbudgeted.map((cat) => {
              if (editingCategoryId === cat.id) {
                return (
                  <BudgetEditInline
                    key={cat.id}
                    categoryId={cat.id}
                    categoryName={cat.name}
                    currency={defaultCurrency}
                    onDone={handleDone}
                  />
                );
              }
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm">{cat.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setEditingCategoryId(cat.id)}
                  >
                    {t("budget.set")}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

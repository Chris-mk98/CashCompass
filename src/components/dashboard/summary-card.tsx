"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ViewSummary } from "@/queries/dashboard";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(amount);
}

function AmountRow({
  label,
  items,
  colorClass,
}: {
  label: string;
  items: { currency: string; amount: number }[];
  colorClass?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">-</span>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <div key={item.currency} className="flex justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={`text-sm font-semibold ${colorClass ?? ""}`}>
            {formatCurrency(item.amount, item.currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SummaryCard({
  title,
  summary,
}: {
  title: string;
  summary: ViewSummary;
}) {
  const t = useTranslations("dashboard");

  const hasData =
    summary.income.length > 0 ||
    summary.expense.length > 0 ||
    summary.balance.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!hasData ? (
          <p className="text-sm text-muted-foreground">{t("noData")}</p>
        ) : (
          <>
            <AmountRow
              label={t("income")}
              items={summary.income}
              colorClass="text-blue-600"
            />
            <AmountRow label={t("expense")} items={summary.expense} />
            <div className="border-t pt-2">
              <AmountRow
                label={t("balance")}
                items={summary.balance}
                colorClass={
                  summary.balance.some((b) => b.amount < 0)
                    ? "text-red-600"
                    : "text-green-600"
                }
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

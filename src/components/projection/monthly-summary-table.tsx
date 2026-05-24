"use client";

import { useTranslations } from "next-intl";
import type { MonthlyProjection } from "@/queries/projection";
import { cn } from "@/lib/utils";

interface MonthlySummaryTableProps {
  data: MonthlyProjection[];
  currency: string;
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency }).format(
    amount
  );
}

export function MonthlySummaryTable({
  data,
  currency,
}: MonthlySummaryTableProps) {
  const t = useTranslations();

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium">{t("projection.month")}</th>
            <th className="px-3 py-2 font-medium text-right">
              {t("dashboard.income")}
            </th>
            <th className="px-3 py-2 font-medium text-right">
              {t("dashboard.expense")}
            </th>
            <th className="px-3 py-2 font-medium text-right">
              {t("projection.net")}
            </th>
            <th className="px-3 py-2 font-medium text-right">
              {t("projection.balance")}
            </th>
            <th className="px-3 py-2 font-medium text-center">
              {t("projection.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.month}
              className={cn(
                "border-b",
                !row.isActual && "bg-muted/20 text-muted-foreground"
              )}
            >
              <td className="px-3 py-2">{row.month}</td>
              <td className="px-3 py-2 text-right">
                {fmt(row.income, currency)}
              </td>
              <td className="px-3 py-2 text-right">
                {fmt(row.expense, currency)}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right",
                  row.net < 0 && "text-red-500"
                )}
              >
                {fmt(row.net, currency)}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-medium",
                  row.cumulativeBalance < 0 && "text-red-500"
                )}
              >
                {fmt(row.cumulativeBalance, currency)}
              </td>
              <td className="px-3 py-2 text-center text-xs">
                {row.isActual
                  ? t("projection.actual")
                  : t("projection.forecast")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type { Metadata } from "next";
import { useTranslations } from "next-intl";

export const metadata: Metadata = { title: "Dashboard" };
import Link from "next/link";
import { getDashboardSummary } from "@/queries/dashboard";
import { DualView } from "@/components/dashboard/dual-view";
import { CategorySpendingCard } from "@/components/dashboard/category-spending";
import { BudgetAlerts } from "@/components/dashboard/budget-alerts";
import { PendingAlert } from "@/components/dashboard/pending-alert";
import { MonthSelector } from "@/components/month-selector";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const data = await getDashboardSummary(year, month);
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
      </div>

      <MonthSelector year={year} month={month} basePath="/dashboard" />

      {data.pendingTransactions.length > 0 && (
        <PendingAlert transactions={data.pendingTransactions} />
      )}

      {data.budgetAlerts.length > 0 && (
        <BudgetAlerts alerts={data.budgetAlerts} />
      )}

      <DualView accrual={data.accrual} cash={data.cash} />

      {data.categorySpending.length > 0 && (
        <CategorySpendingCard items={data.categorySpending} />
      )}

      <div className="flex gap-3">
        <Link
          href="/transactions/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("dashboard.addTransaction")}
        </Link>
        <Link
          href="/import"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <Upload className="mr-2 h-4 w-4" />
          {t("dashboard.smartImport")}
        </Link>
      </div>
    </div>
  );
}

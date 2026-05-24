import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Charts" };
import { getSpendingByCategory, getMonthlyTrend } from "@/queries/charts";
import { getProfile } from "@/queries/profile";
import { SpendingPieChart } from "@/components/charts/spending-pie-chart";
import { TrendBarChart } from "@/components/charts/trend-bar-chart";
import { ChartViewToggle } from "@/components/charts/chart-view-toggle";
import { MonthSelector } from "@/components/month-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ChartsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; view?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;
  const view = (params.view === "cash" ? "cash" : "accrual") as
    | "accrual"
    | "cash";

  const [spending, trend, profile] = await Promise.all([
    getSpendingByCategory(year, month, view),
    getMonthlyTrend(year, month, view),
    getProfile(),
  ]);

  if (!profile) redirect("/login");

  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("charts.title")}</h1>
        <ChartViewToggle currentView={view} year={year} month={month} />
      </div>

      <MonthSelector year={year} month={month} basePath="/charts" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("charts.categorySpending")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingPieChart
            data={spending}
            currency={profile.defaultCurrency}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("charts.monthlyTrend")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendBarChart data={trend} currency={profile.defaultCurrency} />
        </CardContent>
      </Card>

      <Link
        href="/projection"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        <TrendingUp className="mr-2 h-4 w-4" />
        {t("charts.goToProjection")}
      </Link>
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getBudgetsWithUsage } from "@/queries/budgets";

export const metadata: Metadata = { title: "Budget" };
import { getCategories } from "@/queries/categories";
import { getProfile } from "@/queries/profile";
import { MonthSelector } from "@/components/month-selector";
import { BudgetList } from "@/components/budget/budget-list";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const [budgets, categories, profile] = await Promise.all([
    getBudgetsWithUsage(year, month),
    getCategories(),
    getProfile(),
  ]);

  if (!profile) redirect("/login");

  const t = await getTranslations();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("budget.title")}</h1>
      <MonthSelector year={year} month={month} basePath="/budget" />
      <BudgetList
        budgets={budgets}
        categories={categories}
        defaultCurrency={profile.defaultCurrency}
      />
    </div>
  );
}

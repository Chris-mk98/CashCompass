import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { getTransactions } from "@/queries/transactions";

export const metadata: Metadata = { title: "Transactions" };
import { getCategories } from "@/queries/categories";
import { getPaymentMethods } from "@/queries/payment-methods";
import { getProfile } from "@/queries/profile";
import { TransactionList } from "@/components/transaction-list";
import { TransactionFilters } from "@/components/transaction-filters";
import { MonthSelector } from "@/components/month-selector";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    q?: string;
    category?: string;
    pm?: string;
    min?: string;
    max?: string;
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;
  const view = (params.view === "cash" ? "cash" : "accrual") as
    | "accrual"
    | "cash";

  const amountMin = params.min ? Number(params.min) : undefined;
  const amountMax = params.max ? Number(params.max) : undefined;

  const [{ transactions }, categories, paymentMethods, profile] =
    await Promise.all([
      getTransactions({
        year,
        month,
        categoryId: params.category,
        paymentMethodId: params.pm,
        amountMin,
        amountMax,
        search: params.q,
        view,
      }),
      getCategories(),
      getPaymentMethods(),
      getProfile(),
    ]);

  if (!profile) redirect("/login");

  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("transaction.title")}</h1>
        <Link
          href="/transactions/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("transaction.add")}
        </Link>
      </div>

      <MonthSelector year={year} month={month} />

      <TransactionFilters
        categories={categories}
        paymentMethods={paymentMethods}
        year={year}
        month={month}
      />

      <TransactionList
        transactions={transactions}
        currency={profile.defaultCurrency}
      />
    </div>
  );
}

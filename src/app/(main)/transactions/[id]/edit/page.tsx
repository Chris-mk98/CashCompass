import { getTransactionById } from "@/queries/transactions";
import { getVisibleCategories } from "@/queries/categories";
import { getPaymentMethods } from "@/queries/payment-methods";
import { getProfile } from "@/queries/profile";
import { TransactionForm } from "@/components/transaction-form";
import { notFound, redirect } from "next/navigation";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [transaction, categories, paymentMethods, profile] = await Promise.all([
    getTransactionById(id),
    getVisibleCategories(),
    getPaymentMethods(),
    getProfile(),
  ]);

  if (!profile) redirect("/login");
  if (!transaction) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <TransactionForm
        categories={categories}
        paymentMethods={paymentMethods}
        defaultCurrency={profile.defaultCurrency}
        initialData={{
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount),
          currency: transaction.currency,
          categoryId: transaction.categoryId,
          paymentMethodId: transaction.paymentMethodId,
          transactionDate: transaction.transactionDate,
          note: transaction.note,
        }}
      />
    </div>
  );
}

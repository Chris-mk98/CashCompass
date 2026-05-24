import { getVisibleCategories } from "@/queries/categories";
import { getPaymentMethods } from "@/queries/payment-methods";
import { getProfile } from "@/queries/profile";
import { TransactionForm } from "@/components/transaction-form";
import { redirect } from "next/navigation";

export default async function NewTransactionPage() {
  const [categories, paymentMethods, profile] = await Promise.all([
    getVisibleCategories(),
    getPaymentMethods(),
    getProfile(),
  ]);

  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-lg">
      <TransactionForm
        categories={categories}
        paymentMethods={paymentMethods}
        defaultCurrency={profile.defaultCurrency}
      />
    </div>
  );
}

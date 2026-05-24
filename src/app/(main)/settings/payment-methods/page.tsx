import { getPaymentMethodsWithUsage } from "@/queries/payment-methods";
import { PaymentMethodList } from "@/components/payment-method-list";
import { PaymentMethodForm } from "@/components/payment-method-form";

export default async function PaymentMethodsPage() {
  const methods = await getPaymentMethodsWithUsage();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PaymentMethodForm />
      <PaymentMethodList methods={methods} />
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Smart Import" };
import { getCategories } from "@/queries/categories";
import { getPaymentMethods } from "@/queries/payment-methods";
import { getProfile } from "@/queries/profile";
import { ImportPageClient } from "@/components/import/import-page-client";

export default async function ImportPage() {
  const [categories, paymentMethods, profile] = await Promise.all([
    getCategories(),
    getPaymentMethods(),
    getProfile(),
  ]);

  if (!profile) redirect("/login");

  return (
    <ImportPageClient
      categories={categories}
      paymentMethods={paymentMethods}
      defaultCurrency={profile.defaultCurrency}
    />
  );
}

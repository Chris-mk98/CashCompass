import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { getCategories } from "@/queries/categories";

export const metadata: Metadata = { title: "Export" };
import { getProfile } from "@/queries/profile";
import { CsvExportForm } from "@/components/export/csv-export-form";
import { PdfExportForm } from "@/components/export/pdf-export-form";

export default async function ExportPage() {
  const [categories, profile] = await Promise.all([
    getCategories(),
    getProfile(),
  ]);

  if (!profile) redirect("/login");

  const t = useTranslations();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("export.title")}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <CsvExportForm categories={categories} />
        <PdfExportForm />
      </div>
    </div>
  );
}

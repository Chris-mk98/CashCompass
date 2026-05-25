import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCashFlowProjection } from "@/queries/projection";

export const metadata: Metadata = { title: "Cash Flow Projection" };
import { getProfile } from "@/queries/profile";
import { CashFlowChart } from "@/components/projection/cash-flow-chart";
import { MonthlySummaryTable } from "@/components/projection/monthly-summary-table";
import { ProjectionViewToggle } from "@/components/projection/projection-view-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectionPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view = (params.view === "cash" ? "cash" : "accrual") as
    | "accrual"
    | "cash";

  const [data, profile] = await Promise.all([
    getCashFlowProjection(view),
    getProfile(),
  ]);

  if (!profile) redirect("/login");

  const t = await getTranslations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("projection.title")}</h1>
        <ProjectionViewToggle currentView={view} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("projection.chart")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={data} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {t("projection.summary")}
            </CardTitle>
            <button
              disabled
              className="text-xs text-muted-foreground border rounded px-2 py-1 opacity-50 cursor-not-allowed"
            >
              {t("projection.whatIf")} (v1.1)
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <MonthlySummaryTable
            data={data}
            currency={profile.defaultCurrency}
          />
        </CardContent>
      </Card>
    </div>
  );
}

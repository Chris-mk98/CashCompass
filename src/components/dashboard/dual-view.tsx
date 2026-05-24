"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCard } from "@/components/dashboard/summary-card";
import type { ViewSummary } from "@/queries/dashboard";

export function DualView({
  accrual,
  cash,
}: {
  accrual: ViewSummary;
  cash: ViewSummary;
}) {
  const t = useTranslations("dashboard");

  return (
    <>
      {/* Desktop: side by side */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        <SummaryCard title={t("accrual")} summary={accrual} />
        <SummaryCard title={t("cash")} summary={cash} />
      </div>

      {/* Mobile/Tablet: tabs */}
      <div className="lg:hidden">
        <Tabs defaultValue="accrual">
          <TabsList className="w-full">
            <TabsTrigger value="accrual" className="flex-1">
              {t("accrual")}
            </TabsTrigger>
            <TabsTrigger value="cash" className="flex-1">
              {t("cash")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="accrual">
            <SummaryCard title={t("accrual")} summary={accrual} />
          </TabsContent>
          <TabsContent value="cash">
            <SummaryCard title={t("cash")} summary={cash} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

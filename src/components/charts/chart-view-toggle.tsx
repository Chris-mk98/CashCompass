"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ChartViewToggleProps {
  currentView: "accrual" | "cash";
  year: number;
  month: number;
}

export function ChartViewToggle({
  currentView,
  year,
  month,
}: ChartViewToggleProps) {
  const t = useTranslations();
  const router = useRouter();

  function handleToggle(view: "accrual" | "cash") {
    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));
    if (view !== "accrual") params.set("view", view);
    router.push(`/charts?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-lg border p-0.5">
      <Button
        size="sm"
        variant={currentView === "accrual" ? "default" : "ghost"}
        className="h-7 text-xs"
        onClick={() => handleToggle("accrual")}
      >
        {t("dashboard.accrual")}
      </Button>
      <Button
        size="sm"
        variant={currentView === "cash" ? "default" : "ghost"}
        className="h-7 text-xs"
        onClick={() => handleToggle("cash")}
      >
        {t("dashboard.cash")}
      </Button>
    </div>
  );
}

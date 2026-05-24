"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAllocations } from "@/lib/split";
import { format, startOfMonth } from "date-fns";

interface SplitSettingsProps {
  amount: number;
  splitCount: number;
  startMonth: string;
  currency: string;
  onSplitCountChange: (count: number) => void;
  onStartMonthChange: (month: string) => void;
}

export function SplitSettings({
  amount,
  splitCount,
  startMonth,
  currency,
  onSplitCountChange,
  onStartMonthChange,
}: SplitSettingsProps) {
  const t = useTranslations("transaction");

  const preview = useMemo(() => {
    if (!amount || splitCount < 2 || !startMonth) return [];
    const date = new Date(startMonth + "-01");
    return createAllocations(amount, splitCount, date);
  }, [amount, splitCount, startMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "KRW" ? 0 : 2,
    }).format(value);
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="splitCount">{t("splitMonths")}</Label>
          <Input
            id="splitCount"
            name="splitCount"
            type="number"
            min={2}
            max={60}
            value={splitCount}
            onChange={(e) => onSplitCountChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="splitStartMonth">{t("startMonth")}</Label>
          <Input
            id="splitStartMonth"
            name="splitStartMonth"
            type="month"
            value={startMonth}
            onChange={(e) => onStartMonthChange(e.target.value)}
          />
        </div>
      </div>

      {preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("splitPreview")}</p>
          <div className="max-h-48 overflow-y-auto rounded-md border">
            <table className="w-full text-sm">
              <tbody>
                {preview.map((alloc, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">
                      {format(alloc.recognitionMonth, "yyyy-MM")}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(alloc.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("totalAmount")}: {formatCurrency(amount)}
          </p>
        </div>
      )}
    </div>
  );
}

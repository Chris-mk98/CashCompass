"use client";

import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import type { CategorySpendingData } from "@/queries/charts";

const COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(35, 90%, 55%)",
  "hsl(350, 65%, 55%)",
  "hsl(270, 55%, 55%)",
  "hsl(190, 70%, 45%)",
  "hsl(45, 85%, 50%)",
  "hsl(310, 55%, 50%)",
];

interface SpendingPieChartProps {
  data: CategorySpendingData[];
  currency: string;
}

export function SpendingPieChart({ data, currency }: SpendingPieChartProps) {
  const t = useTranslations();
  const total = data.reduce((s, d) => s + d.amount, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        {t("common.noData")}
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.categoryName,
    value: Math.round(d.amount),
    percent: total > 0 ? Math.round((d.amount / total) * 100) : 0,
  }));

  const fmt = (v: number) =>
    new Intl.NumberFormat("ko-KR", { style: "currency", currency }).format(v);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} ${percent}%`}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [fmt(Number(value)), t("dashboard.expense")]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

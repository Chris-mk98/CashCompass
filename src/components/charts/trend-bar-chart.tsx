"use client";

import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MonthlyTrendData } from "@/queries/charts";

interface TrendBarChartProps {
  data: MonthlyTrendData[];
  currency: string;
}

export function TrendBarChart({ data, currency }: TrendBarChartProps) {
  const t = useTranslations();

  const fmt = (v: number) =>
    new Intl.NumberFormat("ko-KR", { style: "currency", currency }).format(v);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => fmt(Number(value))} />
          <Legend />
          <Bar
            dataKey="income"
            name={t("dashboard.income")}
            fill="hsl(220, 70%, 50%)"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name={t("dashboard.expense")}
            fill="hsl(350, 65%, 55%)"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

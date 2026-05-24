"use client";

import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { MonthlyProjection } from "@/queries/projection";

interface CashFlowChartProps {
  data: MonthlyProjection[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const t = useTranslations();

  const actualData = data.map((d) => ({
    ...d,
    actualBalance: d.isActual ? d.cumulativeBalance : undefined,
    forecastBalance: !d.isActual ? d.cumulativeBalance : undefined,
  }));

  const bridgeIndex = actualData.findLastIndex((d) => d.isActual);
  if (bridgeIndex >= 0 && bridgeIndex < actualData.length - 1) {
    actualData[bridgeIndex + 1].forecastBalance =
      actualData[bridgeIndex].actualBalance;
  }

  const hasNegative = data.some((d) => d.cumulativeBalance < 0);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={actualData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [
              Number(value).toLocaleString(),
              t("projection.balance"),
            ]}
            labelFormatter={(label) => String(label)}
          />
          {hasNegative && (
            <ReferenceLine y={0} stroke="hsl(0, 70%, 50%)" strokeDasharray="4 4" />
          )}
          <Line
            type="monotone"
            dataKey="actualBalance"
            stroke="hsl(220, 70%, 50%)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
            name={t("projection.actual")}
          />
          <Line
            type="monotone"
            dataKey="forecastBalance"
            stroke="hsl(220, 70%, 50%)"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 3, strokeDasharray: "" }}
            connectNulls={false}
            name={t("projection.forecast")}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  name: string;
  value: number;
}

interface ChartLayoutProps {
  title: string;
  data: ChartData[];
}

export default function ChartLayout({ title, data }: ChartLayoutProps) {
  const formatCurrencyShort = (value: number) => {
    if (!value) return "R$ 0";

    if (value >= 1_000_000) {
      const formatted = value / 1_000_000;
      return `R$ ${formatted.toFixed(1).replace(".0", "")}M`;
    }

    if (value >= 1_000) {
      const formatted = value / 1_000;
      return `R$ ${formatted.toFixed(1).replace(".0", "")}K`;
    }

    return `R$ ${Math.round(value)}`;
  };

  return (
    <div>
      <h4 className="defaultTitle">{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="var(--textBase)" />

          <YAxis
            stroke="var(--textBase)"
            tickFormatter={(value) => formatCurrencyShort(value)}
          />
          <Tooltip
            cursor={{ fill: "none" }}
            formatter={(value) =>
              typeof value === "number"
                ? [formatCurrencyShort(value), "Valor"]
                : ["R$ 0", "Valor"]
            }
            contentStyle={{
              backgroundColor: "var(--secondaryBg)",
              border: "1px solid var(--primaryColor)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "var(--primaryText)" }}
            itemStyle={{ color: "var(--primaryColor)" }}
          />
          <Bar
            dataKey="value"
            fill="var(--textBase)"
            activeBar={{ fill: "var(--primaryColor)" }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

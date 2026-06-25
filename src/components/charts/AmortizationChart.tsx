"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatSGD } from "@/components/ui";

export interface AmortizationPoint {
  year: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
}

/** Stacked cumulative principal vs interest paid over the loan tenure. */
export function AmortizationChart({ data }: { data: AmortizationPoint[] }) {
  const chartData = data.map((d) => ({
    year: `Y${d.year}`,
    principal: Math.round(d.cumulativePrincipal),
    interest: Math.round(d.cumulativeInterest),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="principalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="interestFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip formatter={(v: number) => formatSGD(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="principal"
            name="Cumulative principal"
            stackId="1"
            stroke="#10b981"
            fill="url(#principalFill)"
          />
          <Area
            type="monotone"
            dataKey="interest"
            name="Cumulative interest"
            stackId="1"
            stroke="#f43f5e"
            fill="url(#interestFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

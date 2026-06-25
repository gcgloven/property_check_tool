"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProjectionYear } from "@/lib/finance";
import { formatSGD } from "@/components/ui";

/** Property value vs equity over the projection horizon, with a cumulative cashflow line. */
export function ProjectionChart({ rows }: { rows: ProjectionYear[] }) {
  const data = rows.map((r) => ({
    year: `Y${r.year}`,
    value: Math.round(r.propertyValue),
    equity: Math.round(r.equity),
    cashflow: Math.round(r.cumulativeCashflow),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
            dataKey="value"
            name="Property value"
            stroke="#6366f1"
            fill="url(#valueFill)"
          />
          <Area
            type="monotone"
            dataKey="equity"
            name="Equity"
            stroke="#10b981"
            fill="url(#equityFill)"
          />
          <Line
            type="monotone"
            dataKey="cashflow"
            name="Cumulative cashflow"
            stroke="#f59e0b"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

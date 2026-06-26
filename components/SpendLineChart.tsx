"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatGBP } from "@/lib/format";
import type { Contract } from "@/lib/types";

interface Props {
  contracts: Contract[];
  title: string;
}

export default function SpendLineChart({ contracts, title }: Props) {
  const byQuarter = new Map<string, number>();

  for (const c of contracts) {
    const d = new Date(c.award_date);
    const q = Math.floor(d.getMonth() / 3) + 1;
    const key = `${d.getFullYear()} Q${q}`;
    byQuarter.set(key, (byQuarter.get(key) ?? 0) + c.value_gbp);
  }

  const data = Array.from(byQuarter.entries())
    .map(([period, spend]) => ({ period, spend }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return (
    <div className="rounded-xl border border-gov-border bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-gov-navy">{title}</h3>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `£${(v / 1e6).toFixed(0)}m`}
          />
          <Tooltip formatter={(value: number) => formatGBP(value)} />
          <Line
            type="monotone"
            dataKey="spend"
            stroke="#1e40af"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
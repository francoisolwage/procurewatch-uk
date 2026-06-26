"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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
  topN?: number;
}

export default function SupplierChart({
  contracts,
  title,
  topN = 10,
}: Props) {
  const bySupplier = new Map<string, number>();
  for (const c of contracts) {
    bySupplier.set(c.supplier, (bySupplier.get(c.supplier) ?? 0) + c.value_gbp);
  }

  const data = Array.from(bySupplier.entries())
    .map(([name, spend]) => ({ name, spend }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, topN)
    .reverse();

  return (
    <div className="rounded-xl border border-gov-border bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-gov-navy">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(280, topN * 34)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `£${(v / 1e6).toFixed(1)}m`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={200}
            tick={{ fontSize: 10 }}
          />
          <Tooltip formatter={(value: number) => formatGBP(value)} />
          <Bar dataKey="spend" fill="#0f766e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
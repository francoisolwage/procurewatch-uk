"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GOVERNMENT_ERAS } from "@/lib/constants";
import { getGovernmentEra } from "@/lib/filters";
import { formatGBP } from "@/lib/format";
import type { Contract } from "@/lib/types";

interface Props {
  contracts: Contract[];
  title?: string;
}

export default function SpendByYearChart({
  contracts,
  title = "Total Procurement Spend by Year",
}: Props) {
  const byYear = new Map<number, { year: number; spend: number; era: string }>();

  for (const c of contracts) {
    const year = new Date(c.award_date).getFullYear();
    const existing = byYear.get(year) ?? {
      year,
      spend: 0,
      era: getGovernmentEra(c.award_date),
    };
    existing.spend += c.value_gbp;
    byYear.set(year, existing);
  }

  const data = Array.from(byYear.values()).sort((a, b) => a.year - b.year);

  return (
    <div className="rounded-xl border border-gov-border bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-gov-navy">{title}</h3>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `£${(v / 1e6).toFixed(0)}m`}
          />
          <Tooltip
            formatter={(value: number) => [formatGBP(value), "Spend"]}
            labelFormatter={(label, payload) => {
              const era = payload?.[0]?.payload?.era;
              return `Year ${label}${era ? ` (${era} era)` : ""}`;
            }}
          />
          <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.year}
                fill={GOVERNMENT_ERAS[entry.era]?.color ?? "#64748B"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
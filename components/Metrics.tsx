import { formatGBP } from "@/lib/format";
import type { Contract } from "@/lib/types";

interface Props {
  contracts: Contract[];
}

export default function Metrics({ contracts }: Props) {
  const total = contracts.reduce((s, c) => s + c.value_gbp, 0);
  const avg = contracts.length ? total / contracts.length : 0;
  const flagged = contracts.filter((c) => c.red_flag_count > 0);
  const pctFlagged = contracts.length
    ? (flagged.length / contracts.length) * 100
    : 0;

  const items = [
    { label: "Total Spend", value: formatGBP(total) },
    { label: "Average Contract", value: formatGBP(avg) },
    { label: "% with Red Flags", value: `${pctFlagged.toFixed(1)}%` },
    { label: "Flagged Contracts", value: flagged.length.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="metric-card">
          <p className="text-xs font-medium uppercase tracking-wide text-gov-slate">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-gov-navy">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
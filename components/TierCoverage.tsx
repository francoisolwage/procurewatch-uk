import { GOVERNMENT_LEVEL_LABELS, countByGovernmentLevel } from "@/lib/government";
import type { Contract, GovernmentLevel } from "@/lib/types";

const LEVEL_ORDER: GovernmentLevel[] = [
  "central",
  "local",
  "scotland",
  "wales",
  "northern_ireland",
];

interface Props {
  contracts: Contract[];
}

export default function TierCoverage({ contracts }: Props) {
  const counts = countByGovernmentLevel(contracts);
  const total = contracts.length || 1;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {LEVEL_ORDER.map((level) => (
        <div key={level} className="metric-card">
          <p className="text-xs font-medium uppercase tracking-wide text-gov-slate">
            {GOVERNMENT_LEVEL_LABELS[level]}
          </p>
          <p className="mt-1 text-xl font-semibold text-gov-navy">
            {counts[level].toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">
            {((counts[level] / total) * 100).toFixed(1)}%
          </p>
        </div>
      ))}
    </div>
  );
}
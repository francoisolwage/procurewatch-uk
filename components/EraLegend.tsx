import { GOVERNMENT_ERAS } from "@/lib/constants";

export default function EraLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
      {Object.entries(GOVERNMENT_ERAS).map(([name, cfg]) => (
        <span key={name} className="inline-flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: cfg.color }}
          />
          {name}
        </span>
      ))}
    </div>
  );
}
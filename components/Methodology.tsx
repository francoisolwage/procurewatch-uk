import { DATA_SOURCES, GOVERNMENT_ERAS, RED_FLAG_DEFINITIONS } from "@/lib/constants";

export function RiskMethodology() {
  return (
    <details className="rounded-xl border border-gov-border bg-gov-surface p-4">
      <summary className="cursor-pointer font-semibold text-gov-navy">
        How we calculate risk — transparent methodology
      </summary>
      <div className="mt-3 space-y-3 text-sm text-slate-700">
        <p>
          Every contract receives a <strong>Risk Score (0–100)</strong> based on
          up to three explainable red flags. No black-box algorithms — each flag
          has a clear rule.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {Object.values(RED_FLAG_DEFINITIONS).map((cfg) => (
            <li key={cfg.label}>
              <strong>{cfg.label}</strong> (+{cfg.weight} points): {cfg.description}
            </li>
          ))}
        </ul>
        <p>
          Contracts in the top 5% by value receive a +10 severity bump (capped at
          100). <strong>Red Flags: N/3</strong> shows how many of the three flags
          are active. Flags are recalculated when you upload new data.
        </p>
      </div>
    </details>
  );
}

export function DataSources() {
  return (
    <details className="rounded-xl border border-gov-border bg-gov-surface p-4">
      <summary className="cursor-pointer font-semibold text-gov-navy">
        Data sources &amp; loading real OCDS bulk data
      </summary>
      <div className="mt-3 space-y-3 text-sm text-slate-700">
        <p>
          <strong>Current dataset:</strong> Sample data for demonstration
          (4,000+ realistic contracts, 2017–2026).
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Download bulk OCDS releases from{" "}
            <a
              href={DATA_SOURCES.ocds_bulk}
              className="text-gov-blue hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Contracting Data Standard — UK Contracts Finder
            </a>
          </li>
          <li>
            Or export from{" "}
            <a
              href={DATA_SOURCES.contracts_finder}
              className="text-gov-blue hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contracts Finder
            </a>{" "}
            search results (CSV/JSON)
          </li>
          <li>Use the sidebar <strong>Upload real data</strong> to load your file</li>
          <li>
            Required fields: OCID, Notice ID, Title, Buyer, Supplier, Award Date,
            Value, CPV, Description
          </li>
        </ol>
      </div>
    </details>
  );
}

export function EraKey() {
  return (
    <div className="space-y-2 text-sm">
      <h3 className="font-semibold text-gov-navy">Government Era Colour Key</h3>
      <ul className="space-y-1 text-slate-700">
        {Object.entries(GOVERNMENT_ERAS).map(([name, cfg]) => (
          <li key={name} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: cfg.color }}
            />
            <strong>{name}</strong> ({cfg.start} → {cfg.end})
          </li>
        ))}
      </ul>
    </div>
  );
}
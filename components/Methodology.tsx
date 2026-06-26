import {
  DATA_SOURCES,
  DATA_SOURCE_LABELS,
  GOVERNMENT_ERAS,
  RED_FLAG_DEFINITIONS,
} from "@/lib/constants";
import { GOVERNMENT_LEVEL_LABELS } from "@/lib/government";

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
    <details className="rounded-xl border border-gov-border bg-gov-surface p-4" open>
      <summary className="cursor-pointer font-semibold text-gov-navy">
        Data sources, correctness &amp; multi-portal coverage
      </summary>
      <div className="mt-3 space-y-4 text-sm text-slate-700">
        <p>
          ProcureWatch UK covers procurement across{" "}
          <strong>UK central government</strong>,{" "}
          <strong>local authorities (England)</strong>, and{" "}
          <strong>devolved administrations</strong> (Scotland, Wales, Northern Ireland).
          Each record is attributed to its official portal where applicable.
        </p>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="font-medium text-blue-900">Three data tiers</p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-blue-800">
            <li>
              <strong>Verified (live-fetched)</strong> — records pulled at build time
              from official OCDS/API endpoints (Contracts Finder, Public Contracts
              Scotland where available). Marked <code>is_sample: false</code> with real
              notice URLs in <code>contracts_finder_url</code>.
            </li>
            <li>
              <strong>Demonstration</strong> — synthetic records for volume
              exploration, marked <code>is_sample: true</code> with{" "}
              <code>DEMO-</code> notice IDs and descriptions stating they are not
              official notices.
            </li>
            <li>
              <strong>User upload</strong> — your CSV/JSON exports from any portal
              below; risk flags recalculated on load.
            </li>
          </ul>
          <p className="mt-2 text-blue-800">
            The banner at the top shows verified vs demonstration counts. Never treat
            demonstration records as authoritative — use verified or uploaded data for
            scrutiny.
          </p>
        </div>

        <h4 className="font-semibold text-gov-navy">Official procurement portals</h4>
        <ul className="space-y-2">
          {Object.entries(DATA_SOURCE_LABELS).map(([url, label]) => (
            <li key={url}>
              <a
                href={url}
                className="text-gov-blue hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <h4 className="font-semibold text-gov-navy">Government level classification</h4>
        <ul className="list-disc space-y-1 pl-5">
          {Object.entries(GOVERNMENT_LEVEL_LABELS).map(([key, label]) => (
            <li key={key}>
              <strong>{label}</strong> — derived from buyer name and mapped to the
              appropriate portal above.
            </li>
          ))}
        </ul>

        <h4 className="font-semibold text-gov-navy">Map locations</h4>
        <p>
          Map markers use <strong>buyer administrative headquarters or council seat</strong>{" "}
          coordinates. Procurement notices rarely include precise project-site
          geography; we do not claim site-level accuracy unless your uploaded data
          includes explicit coordinates.
        </p>

        <h4 className="font-semibold text-gov-navy">How to load real data</h4>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Export CSV or JSON/JSONL from any portal above (or OCDS bulk from{" "}
            <a href={DATA_SOURCES.ocds_bulk} className="text-gov-blue hover:underline" target="_blank" rel="noopener noreferrer">
              data.open-contracting.org
            </a>)
          </li>
          <li>Use sidebar <strong>Upload real data</strong></li>
          <li>
            Required: Title, Buyer, Supplier, Award Date, Value. Optional: government_level,
            location_lat, location_lng, location_locality for map placement.
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
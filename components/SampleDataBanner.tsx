import type { DataViewMode } from "@/lib/data-pipeline";

interface Props {
  dataMode: DataViewMode;
  liveCount: number;
  fixtureCount: number;
  demoCount: number;
  scopeCount: number;
}

export default function SampleDataBanner({
  dataMode,
  liveCount,
  fixtureCount,
  demoCount,
  scopeCount,
}: Props) {
  if (dataMode === "national") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        <strong>Full national dataset (default).</strong> Showing{" "}
        <span className="font-medium">{scopeCount.toLocaleString()}</span>{" "}
        authoritative records across all five government tiers —{" "}
        {liveCount.toLocaleString()} live OCDS pulls (
        <code className="text-xs">data_provenance: live_ocds</code>) plus{" "}
        {fixtureCount.toLocaleString()} portal fixture snapshots (
        <code className="text-xs">data_provenance: portal_fixture</code>) for
        devolved coverage when APIs are unreachable. Demonstration (
        {demoCount.toLocaleString()}) and upload modes remain separate.
      </div>
    );
  }

  if (dataMode === "live") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <strong>Live OCDS only.</strong> Showing{" "}
        <span className="font-medium">{scopeCount.toLocaleString()}</span> records
        pulled at build time from official portal APIs (
        <code className="text-xs">data_provenance: live_ocds</code>). Wales and
        Northern Ireland may have no live records when APIs are unreachable — switch
        to <em>Full national dataset</em> for complete tier coverage. Dataset also
        holds {fixtureCount.toLocaleString()} fixture +{" "}
        {demoCount.toLocaleString()} demonstration records.
      </div>
    );
  }

  if (dataMode === "fixtures") {
    return (
      <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900">
        <strong>Portal fixture snapshots.</strong> Showing{" "}
        <span className="font-medium">{scopeCount.toLocaleString()}</span> checked-in
        OCDS-shaped examples (
        <code className="text-xs">data_provenance: portal_fixture</code>,
        <code className="text-xs"> ocid-fixture-*</code>). These are{" "}
        <em>not</em> live portal pulls — they provide tier coverage when Sell2Wales /
        eTendersNI APIs fail. For scrutiny use{" "}
        <em>Full national dataset</em> ({(liveCount + fixtureCount).toLocaleString()}{" "}
        authoritative records) or upload your own exports.
      </div>
    );
  }

  if (dataMode === "demonstration") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Demonstration data view.</strong>{" "}
        <span className="font-medium">{scopeCount.toLocaleString()}</span> synthetic
        records (
        <code className="text-xs">data_provenance: demonstration</code>,
        <code className="text-xs"> DEMO-</code> notice IDs). Not authoritative. Also
        available: {(liveCount + fixtureCount).toLocaleString()} national dataset
        records ({liveCount.toLocaleString()} live + {fixtureCount.toLocaleString()}{" "}
        fixtures).
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      <strong>Uploaded data view.</strong> Risk flags recalculated from your file (
      <code className="text-xs">data_provenance: user_upload</code>). Bundled:{" "}
      {(liveCount + fixtureCount).toLocaleString()} national +{" "}
      {demoCount.toLocaleString()} demonstration records.
    </div>
  );
}
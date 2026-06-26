import type { DataViewMode } from "./Dashboard";

interface Props {
  dataMode: DataViewMode;
  verifiedCount: number;
  demoCount: number;
  scopeCount: number;
}

export default function SampleDataBanner({
  dataMode,
  verifiedCount,
  demoCount,
  scopeCount,
}: Props) {
  if (dataMode === "official") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        <strong>Official records view.</strong> Showing{" "}
        <span className="font-medium">{scopeCount.toLocaleString()}</span> verified
        procurement records (<code className="text-xs">is_sample: false</code>) from
        UK government portals. Switch to <em>Demonstration data</em> only to explore
        synthetic records — they are not official notices.
      </div>
    );
  }

  if (dataMode === "demonstration") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Demonstration data view.</strong>{" "}
        <span className="font-medium">{scopeCount.toLocaleString()}</span> synthetic
        records for volume exploration — labelled <code className="text-xs">is_sample: true</code>{" "}
        with <code className="text-xs">DEMO-</code> notice IDs. Not authoritative. The
        bundled dataset also contains{" "}
        <span className="font-medium text-green-800">
          {verifiedCount.toLocaleString()} verified
        </span>{" "}
        records — switch to <em>Official records</em> for scrutiny.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      <strong>Uploaded data view.</strong> Risk flags recalculated from your file.
      Bundled dataset: {verifiedCount.toLocaleString()} verified +{" "}
      {demoCount.toLocaleString()} demonstration records available when you switch back.
    </div>
  );
}